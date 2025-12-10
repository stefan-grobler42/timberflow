/**
 * Core cascade scheduling logic for the plannerV2 module.
 * BREAK-AWARE: Jobs skip over breaks and maintain 30-minute buffers.
 */

import type { ScheduledJob, ShiftConfig, OvertimeSettings } from './types';
import { BUFFER_MINUTES } from './constants';
import { getJobDuration } from './durationCalculator';
import { 
  getShiftConfig, 
  getNextWorkingDay, 
  calculateEndTime, 
  isInBreak,
  getNextValidStartTime,
  getAvailableMinutes,
  getNextWorkingDayWithBlocks,
  getShiftConfigWithBlocks
} from './shiftCalendar';

/**
 * Result of scheduling a single job.
 */
export interface JobTimingResult {
  plannedStartTime: number;
  plannedEndTime: number;
  breakAdjustmentMinutes: number;
  overflowMinutes: number;
}

/**
 * Entry representing an overflow that needs to be handled.
 */
export interface OverflowEntry {
  job: ScheduledJob;
  overflowMinutes: number;
}

/**
 * Result of cascade scheduling operation.
 */
export interface CascadeResult {
  scheduledJobs: ScheduledJob[];
  overflows: OverflowEntry[];
}

/**
 * Result of multi-day overflow processing.
 */
export interface MultiDayCascadeResult {
  affectedDays: string[];
  scheduledJobs: ScheduledJob[];
  newRollovers: ScheduledJob[];
}

/**
 * Represents a valid drop position for job insertion.
 */
export interface DropZone {
  index: number;
  startTime: number;
  endTime: number;
  availableMinutes: number;
}

/**
 * BREAK-AWARE: Schedules a job at a given start time.
 * If start time is in a break, adjusts to after the break.
 * End time accounts for any breaks spanned by the work duration.
 * 
 * IMPORTANT: plannedEndTime is NOT clamped to shift end - it reflects the true
 * break-adjusted end time. This allows cascade scheduling to properly compute
 * buffers from the real end position. Overflow represents work that didn't fit.
 */
export function scheduleJob(
  job: ScheduledJob,
  startTime: number,
  shift: ShiftConfig
): JobTimingResult {
  // Ensure we don't start in a break
  const adjustedStart = getNextValidStartTime(startTime, shift);
  
  const workDuration = getJobDuration(job);
  const timing = calculateEndTime(adjustedStart, workDuration, shift);
  
  // Calculate overflow based on break-expanded end time vs shift end
  let overflowMinutes = 0;
  
  // True end time including break expansion
  const trueEndTime = timing.endTime;
  
  // If the job extends past shift end, calculate overflow
  if (trueEndTime > shift.endTime) {
    // Overflow = how much of the job's CLOCK time extends past shift end
    // But we need to express this as WORK time (excluding breaks that occurred)
    // Work that completed = work before shift end
    // For simplicity: overflow is the portion past shift.endTime minus any breaks in that portion
    const clockOverflow = trueEndTime - shift.endTime;
    // Assume the overflow portion doesn't contain additional breaks (since we're past shift end)
    overflowMinutes = clockOverflow;
  }
  
  return {
    plannedStartTime: adjustedStart,
    // Return true break-adjusted end time - NOT clamped to shift end
    // This allows cascades to compute accurate buffers
    plannedEndTime: trueEndTime,
    breakAdjustmentMinutes: timing.breakMinutes,
    overflowMinutes: Math.max(0, overflowMinutes)
  };
}

/**
 * Finds the correct insert position for a job based on drop time.
 */
export function findInsertPosition(
  existingJobs: ScheduledJob[],
  dropTime: number
): number {
  if (existingJobs.length === 0) {
    return 0;
  }
  
  for (let i = 0; i < existingJobs.length; i++) {
    const job = existingJobs[i];
    const jobStartTime = job.plannedStartTime ?? 0;
    
    if (dropTime < jobStartTime) {
      return i;
    }
    
    const jobEndTime = job.plannedEndTime ?? jobStartTime;
    if (dropTime >= jobStartTime && dropTime <= jobEndTime) {
      return i;
    }
  }
  
  return existingJobs.length;
}

/**
 * Gets the next start time after a job ends, accounting for buffer and breaks.
 * Loops to ensure both buffer AND resulting start avoid breaks.
 * If buffer + end time lands in a break, skips to end of break and ensures buffer is maintained.
 */
function getNextStartTimeAfterJob(endTime: number, shift: ShiftConfig): number {
  let nextTime = endTime + BUFFER_MINUTES;
  
  // Loop to ensure we don't land in a break after adding buffer
  // and that the final position respects both buffer and break rules
  let iterations = 0;
  const maxIterations = 10; // Guard against infinite loop
  
  while (iterations < maxIterations) {
    const breakAt = isInBreak(nextTime, shift);
    if (!breakAt) {
      // Not in a break, we're good
      break;
    }
    
    // We're in a break - skip to end of break
    // After skipping, we need to ensure we're still past the buffer from the original end
    nextTime = breakAt.end;
    
    // If the break ends before the buffer would have placed us, we still need to maintain buffer
    // This can happen if break end is less than endTime + BUFFER_MINUTES
    if (nextTime < endTime + BUFFER_MINUTES) {
      nextTime = endTime + BUFFER_MINUTES;
    }
    
    iterations++;
  }
  
  return nextTime;
}

/**
 * BREAK-AWARE: Cascade scheduling - jobs form a train with 30-min buffers.
 * Jobs skip over breaks and maintain the buffer chain.
 */
export function cascadeSchedule(
  jobs: ScheduledJob[],
  insertedJob: ScheduledJob,
  insertIndex: number,
  shift: ShiftConfig
): CascadeResult {
  const scheduledJobs: ScheduledJob[] = [];
  const overflows: OverflowEntry[] = [];
  
  const jobsBefore = jobs.slice(0, insertIndex);
  const jobsAfter = jobs.slice(insertIndex);
  
  // Keep jobs before the insert point as-is
  for (const job of jobsBefore) {
    scheduledJobs.push({ ...job });
  }
  
  // Determine start time for inserted job
  let currentTime = shift.startTime;
  if (jobsBefore.length > 0) {
    const lastBefore = jobsBefore[jobsBefore.length - 1];
    const lastEndTime = lastBefore.plannedEndTime ?? shift.startTime;
    currentTime = getNextStartTimeAfterJob(lastEndTime, shift);
  }
  
  // Schedule the inserted job
  const insertedTiming = scheduleJob(insertedJob, currentTime, shift);
  const scheduledInserted: ScheduledJob = {
    ...insertedJob,
    plannedStartTime: insertedTiming.plannedStartTime,
    plannedEndTime: insertedTiming.plannedEndTime,
    breakAdjustmentMinutes: insertedTiming.breakAdjustmentMinutes,
    plannedDurationMinutes: getJobDuration(insertedJob)
  };
  scheduledJobs.push(scheduledInserted);
  
  if (insertedTiming.overflowMinutes > 0) {
    overflows.push({
      job: scheduledInserted,
      overflowMinutes: insertedTiming.overflowMinutes
    });
  }
  
  // Cascade subsequent jobs (the train moves back), but stop at gaps
  // First, identify which jobs should cascade (are sequential to their predecessor)
  const jobsToCascade: ScheduledJob[] = [];
  for (let i = 0; i < jobsAfter.length; i++) {
    const job = jobsAfter[i];
    const jobOriginalStart = job.plannedStartTime ?? 0;
    
    // Determine the previous job's original end time for gap detection
    let prevOriginalEnd: number;
    if (i === 0) {
      // First job after insert - check if it was sequential to what came before the insert point
      if (jobsBefore.length > 0) {
        prevOriginalEnd = jobsBefore[jobsBefore.length - 1].plannedEndTime ?? shift.startTime;
      } else {
        prevOriginalEnd = shift.startTime;
      }
    } else {
      prevOriginalEnd = jobsAfter[i - 1].plannedEndTime ?? 0;
    }
    
    // Check if this job was sequential to its predecessor (using original times)
    if (!isSequentialTo(prevOriginalEnd, jobOriginalStart, shift)) {
      // Gap detected - stop cascading, keep this and remaining jobs unchanged
      break;
    }
    
    jobsToCascade.push(job);
  }
  
  // Schedule jobs that should cascade
  currentTime = getNextStartTimeAfterJob(insertedTiming.plannedEndTime, shift);
  
  for (const job of jobsToCascade) {
    if (currentTime >= shift.endTime) {
      // Job is pushed completely out of the day
      const jobDuration = getJobDuration(job);
      overflows.push({
        job: { ...job },
        overflowMinutes: jobDuration
      });
      continue;
    }
    
    const timing = scheduleJob(job, currentTime, shift);
    const scheduledJob: ScheduledJob = {
      ...job,
      plannedStartTime: timing.plannedStartTime,
      plannedEndTime: timing.plannedEndTime,
      breakAdjustmentMinutes: timing.breakAdjustmentMinutes,
      plannedDurationMinutes: getJobDuration(job)
    };
    scheduledJobs.push(scheduledJob);
    
    if (timing.overflowMinutes > 0) {
      overflows.push({
        job: scheduledJob,
        overflowMinutes: timing.overflowMinutes
      });
    }
    
    currentTime = getNextStartTimeAfterJob(timing.plannedEndTime, shift);
  }
  
  // Add remaining jobs (with gaps) unchanged - they should not cascade
  for (let i = jobsToCascade.length; i < jobsAfter.length; i++) {
    scheduledJobs.push({ ...jobsAfter[i] });
  }
  
  return { scheduledJobs, overflows };
}

function generateRolloverId(parentId: string, sequence: number): string {
  return `${parentId}-rollover-${sequence}`;
}

/**
 * Creates a new rollover job segment for overflow work.
 */
export function createRolloverSegment(
  parentJob: ScheduledJob,
  overflowMinutes: number,
  targetDate: string,
  sequence: number
): ScheduledJob {
  const parentId = parentJob.parentProductionId || parentJob.id;
  
  return {
    id: generateRolloverId(parentId, sequence),
    orderNumber: parentJob.orderNumber,
    customer: parentJob.customer,
    estimatedEFinks: 0,
    plannedDateStr: targetDate,
    jigId: parentJob.jigId,
    plannedStartTime: null,
    plannedEndTime: null,
    plannedDurationMinutes: null,
    customDurationMinutes: overflowMinutes,
    breakAdjustmentMinutes: null,
    parentProductionId: parentId,
    rolloverSequence: sequence,
    productionComplete: false
  };
}

/**
 * Options for block-aware overflow processing.
 */
export interface MultiDayOverflowOptions {
  /** Full-day block dates per team (team ID -> array of date strings) */
  fullDayBlockDatesByTeam?: Record<string, string[]>;
  /** Partial schedule blocks per team per day for shift config (team ID -> date -> blocks) */
  scheduleBlocksByTeamDay?: Record<string, Record<string, Array<{ blockType: string; startTimeMinutes: number; endTimeMinutes: number }>>>;
}

/**
 * Processes multi-day overflow cascading.
 * BLOCK-AWARE: When options are provided, uses block-aware helpers to:
 * - Skip full-day blocked dates when finding next working day
 * - Include partial schedule blocks as breaks in shift config
 */
export function processMultiDayOverflows(
  overflows: OverflowEntry[],
  allJobs: ScheduledJob[],
  overtimeByTeamDay: Record<string, Record<string, OvertimeSettings>>,
  options?: MultiDayOverflowOptions
): MultiDayCascadeResult {
  const affectedDays = new Set<string>();
  const newRollovers: ScheduledJob[] = [];
  let scheduledJobs = [...allJobs];
  
  if (overflows.length === 0) {
    return {
      affectedDays: [],
      scheduledJobs,
      newRollovers: []
    };
  }
  
  const queue = [...overflows];
  const maxIterations = 30;
  let iterations = 0;
  
  const rolloverSequenceMap = new Map<string, number>();
  
  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const overflow = queue.shift()!;
    
    const sourceDate = overflow.job.plannedDateStr;
    if (!sourceDate) continue;
    
    affectedDays.add(sourceDate);
    
    const teamId = overflow.job.jigId || '';
    
    // Use block-aware next working day if full-day blocks are provided
    const fullDayBlocks = options?.fullDayBlockDatesByTeam?.[teamId] || [];
    const targetDate = fullDayBlocks.length > 0
      ? getNextWorkingDayWithBlocks(sourceDate, fullDayBlocks)
      : getNextWorkingDay(sourceDate);
    affectedDays.add(targetDate);
    
    const parentId = overflow.job.parentProductionId || overflow.job.id;
    const currentSequence = rolloverSequenceMap.get(parentId) || 0;
    const nextSequence = currentSequence + 1;
    rolloverSequenceMap.set(parentId, nextSequence);
    
    const rollover = createRolloverSegment(
      overflow.job,
      overflow.overflowMinutes,
      targetDate,
      nextSequence
    );
    
    const dayTeamOvertime = overtimeByTeamDay[targetDate]?.[teamId] || { enabled: false, closeTime: 1020 };
    
    // Use block-aware shift config if schedule blocks are provided
    const scheduleBlocks = options?.scheduleBlocksByTeamDay?.[teamId]?.[targetDate] || [];
    const dayShift = scheduleBlocks.length > 0
      ? getShiftConfigWithBlocks(
          dayTeamOvertime.enabled,
          dayTeamOvertime.closeTime,
          false, // earlyOtEnabled - not available in OvertimeSettings, use default
          undefined, // earlyOtStartTime
          scheduleBlocks
        )
      : getShiftConfig(dayTeamOvertime.enabled, dayTeamOvertime.closeTime);
    
    const dayJobs = scheduledJobs
      .filter(j => j.plannedDateStr === targetDate && j.jigId === rollover.jigId)
      .sort((a, b) => (a.plannedStartTime ?? 0) - (b.plannedStartTime ?? 0));
    
    const insertPosition = 0;
    
    const cascadeResult = cascadeSchedule(dayJobs, rollover, insertPosition, dayShift);
    
    scheduledJobs = scheduledJobs.filter(
      j => !(j.plannedDateStr === targetDate && j.jigId === rollover.jigId)
    );
    scheduledJobs.push(...cascadeResult.scheduledJobs);
    
    const scheduledRollover = cascadeResult.scheduledJobs.find(j => j.id === rollover.id);
    if (scheduledRollover) {
      newRollovers.push(scheduledRollover);
    }
    
    for (const newOverflow of cascadeResult.overflows) {
      if (newOverflow.overflowMinutes > 0) {
        queue.push({
          job: { ...newOverflow.job, plannedDateStr: targetDate },
          overflowMinutes: newOverflow.overflowMinutes
        });
      }
    }
  }
  
  return {
    affectedDays: Array.from(affectedDays).sort(),
    scheduledJobs,
    newRollovers
  };
}

/**
 * BREAK-AWARE: Calculate drop zones with break consideration.
 */
export function calculateDropZones(
  existingJobs: ScheduledJob[],
  shift: ShiftConfig
): DropZone[] {
  const zones: DropZone[] = [];
  
  if (existingJobs.length === 0) {
    zones.push({
      index: 0,
      startTime: shift.startTime,
      endTime: shift.endTime,
      availableMinutes: getAvailableMinutes(shift.startTime, shift)
    });
    return zones;
  }
  
  const sortedJobs = [...existingJobs].sort(
    (a, b) => (a.plannedStartTime ?? 0) - (b.plannedStartTime ?? 0)
  );
  
  const firstJob = sortedJobs[0];
  const firstStart = firstJob.plannedStartTime ?? shift.startTime;
  
  if (firstStart > shift.startTime) {
    const gapEnd = firstStart - BUFFER_MINUTES;
    if (gapEnd > shift.startTime) {
      zones.push({
        index: 0,
        startTime: shift.startTime,
        endTime: gapEnd,
        availableMinutes: gapEnd - shift.startTime
      });
    }
  }
  
  for (let i = 0; i < sortedJobs.length - 1; i++) {
    const currentJob = sortedJobs[i];
    const nextJob = sortedJobs[i + 1];
    
    const currentEnd = currentJob.plannedEndTime ?? shift.startTime;
    const nextStart = nextJob.plannedStartTime ?? shift.endTime;
    
    const gapStart = getNextStartTimeAfterJob(currentEnd, shift);
    const gapEnd = nextStart - BUFFER_MINUTES;
    
    if (gapEnd > gapStart) {
      zones.push({
        index: i + 1,
        startTime: gapStart,
        endTime: gapEnd,
        availableMinutes: gapEnd - gapStart
      });
    }
  }
  
  const lastJob = sortedJobs[sortedJobs.length - 1];
  const lastEnd = lastJob.plannedEndTime ?? shift.startTime;
  const afterLastStart = getNextStartTimeAfterJob(lastEnd, shift);
  
  if (afterLastStart < shift.endTime) {
    zones.push({
      index: sortedJobs.length,
      startTime: afterLastStart,
      endTime: shift.endTime,
      availableMinutes: getAvailableMinutes(afterLastStart, shift)
    });
  }
  
  return zones;
}

/**
 * BREAK-AWARE: Reschedule all jobs on a day from the beginning.
 * This is the "train" reschedule - all jobs cascade from shift start.
 */
export function rescheduleDay(
  jobs: ScheduledJob[],
  shift: ShiftConfig
): CascadeResult {
  if (jobs.length === 0) {
    return { scheduledJobs: [], overflows: [] };
  }
  
  const sortedJobs = [...jobs].sort(
    (a, b) => (a.plannedStartTime ?? 0) - (b.plannedStartTime ?? 0)
  );
  
  const scheduledJobs: ScheduledJob[] = [];
  const overflows: OverflowEntry[] = [];
  
  let currentTime = shift.startTime;
  
  for (const job of sortedJobs) {
    if (currentTime >= shift.endTime) {
      const jobDuration = getJobDuration(job);
      overflows.push({
        job: { ...job },
        overflowMinutes: jobDuration
      });
      continue;
    }
    
    const timing = scheduleJob(job, currentTime, shift);
    const scheduledJob: ScheduledJob = {
      ...job,
      plannedStartTime: timing.plannedStartTime,
      plannedEndTime: timing.plannedEndTime,
      breakAdjustmentMinutes: timing.breakAdjustmentMinutes,
      plannedDurationMinutes: getJobDuration(job)
    };
    scheduledJobs.push(scheduledJob);
    
    if (timing.overflowMinutes > 0) {
      overflows.push({
        job: scheduledJob,
        overflowMinutes: timing.overflowMinutes
      });
    }
    
    currentTime = getNextStartTimeAfterJob(timing.plannedEndTime, shift);
  }
  
  return { scheduledJobs, overflows };
}

/**
 * Checks if a job can fit at a specific time without overflow.
 */
export function canJobFit(
  job: ScheduledJob,
  startTime: number,
  shift: ShiftConfig
): boolean {
  const result = scheduleJob(job, startTime, shift);
  return result.overflowMinutes === 0;
}

/**
 * BREAK-AWARE: Gets the next available start time (adds buffer and skips breaks).
 */
export function getNextAvailableTime(
  afterTime: number,
  shift: ShiftConfig
): number | null {
  const nextTime = getNextStartTimeAfterJob(afterTime, shift);
  
  if (nextTime >= shift.endTime) {
    return null;
  }
  
  return nextTime;
}

/**
 * Checks if a job is "sequential" to a previous job.
 * A job is sequential if it starts within a reasonable tolerance of the expected
 * next start time (buffer + break adjustments).
 * 
 * Jobs with large gaps (e.g., pre-booked for later in the day) are NOT sequential
 * and should not cascade when the previous job resizes.
 * 
 * @param previousJobEnd - The end time of the previous job in minutes from midnight
 * @param nextJobStart - The start time of the next job in minutes from midnight
 * @param shift - The shift configuration with breaks
 * @returns true if the next job is sequential (should cascade), false if there's a gap
 */
export function isSequentialTo(
  previousJobEnd: number,
  nextJobStart: number,
  shift: ShiftConfig
): boolean {
  const expectedNextStart = getNextStartTimeAfterJob(previousJobEnd, shift);
  const tolerance = 15; // 15 minutes tolerance for minor scheduling differences
  return nextJobStart <= expectedNextStart + tolerance;
}

/**
 * Represents a breakdown block that can span single or multiple days.
 * Breakdowns STRETCH jobs rather than reducing capacity.
 */
export interface BreakdownBlock {
  startDate: string;
  startTimeMinutes: number;
  endDate: string;
  endTimeMinutes: number;
}

/**
 * Result of calculating how a breakdown affects a job's timing.
 */
export interface BreakdownStretchResult {
  /** Total minutes the job is stretched by on this day */
  stretchMinutes: number;
  /** Whether the job work spills over to the next day due to breakdown + shift end */
  spilloverToNextDay: boolean;
  /** Minutes of work that spill over to the next day */
  spilloverMinutes: number;
  /** Date when deferred work can resume (for multi-day breakdowns) */
  deferralDate: string | null;
  /** Time in minutes when deferred work can start on the deferral date */
  deferralStartMinutes: number | null;
  /** Whether this is a multi-day breakdown that requires deferral to a specific time */
  isMultiDayDeferral: boolean;
}

/**
 * Calculates how much a job should be stretched due to breakdown overlaps.
 * 
 * BREAKDOWN BEHAVIOR:
 * - If a breakdown occurs during a job, the job end time is stretched by the breakdown duration
 * - If the stretched job extends past shift end, the remaining work spills to the next day
 * - Multi-day breakdowns: Work resumes at the exact time the breakdown ENDS (not start of next day)
 * 
 * Example 1: Job runs 07:00-15:00 (8 hours work), breakdown 10:00-12:00 (2 hours)
 * Result: Job now ends at 17:00 (stretched by 2 hours)
 * 
 * Example 2: Job runs 07:00-15:00 (8 hours work), breakdown 12:00 Day 1 to 12:00 Day 2 (24-hour breakdown)
 * Result: 
 * - Day 1: Job runs 07:00-12:00 (5 hours completed)
 * - Day 2: Remaining 3 hours starts at 12:00 (deferralDate=Day2, deferralStartMinutes=720)
 * 
 * @param jobStartDate - The date the job is scheduled (YYYY-MM-DD)
 * @param jobStartMinutes - Job start time in minutes from midnight
 * @param jobEndMinutes - Job end time in minutes from midnight (before breakdown stretch)
 * @param shiftEndMinutes - Shift end time in minutes from midnight
 * @param breakdowns - Array of breakdown blocks to check for overlap
 * @returns Stretch information including spillover and deferral details
 */
export function calculateBreakdownStretch(
  jobStartDate: string,
  jobStartMinutes: number,
  jobEndMinutes: number,
  shiftEndMinutes: number,
  breakdowns: BreakdownBlock[]
): BreakdownStretchResult {
  let stretchMinutes = 0;
  let deferralDate: string | null = null;
  let deferralStartMinutes: number | null = null;
  let isMultiDayDeferral = false;
  
  for (const breakdown of breakdowns) {
    // Check if this is a multi-day breakdown that affects this job
    const isMultiDay = breakdown.startDate !== breakdown.endDate;
    
    // Calculate the effective breakdown window for this job's date
    let breakdownStart: number | null = null;
    let breakdownEnd: number | null = null;
    
    if (breakdown.startDate === jobStartDate && breakdown.endDate === jobStartDate) {
      // Breakdown is entirely on the same day
      breakdownStart = breakdown.startTimeMinutes;
      breakdownEnd = breakdown.endTimeMinutes;
    } else if (breakdown.startDate === jobStartDate && breakdown.endDate > jobStartDate) {
      // Breakdown starts on this day and extends to future days
      // On the start day, breakdown goes from start time to end of day (or shift end)
      breakdownStart = breakdown.startTimeMinutes;
      breakdownEnd = shiftEndMinutes; // Breakdown extends through rest of shift
      
      // For multi-day breakdown: if job overlaps with this breakdown,
      // remaining work should defer to when breakdown ends (not just next day start)
      if (breakdownStart < jobEndMinutes && breakdownEnd > jobStartMinutes) {
        deferralDate = breakdown.endDate;
        deferralStartMinutes = breakdown.endTimeMinutes;
        isMultiDayDeferral = true;
      }
    } else if (breakdown.startDate < jobStartDate && breakdown.endDate === jobStartDate) {
      // Breakdown started on a previous day and ends on this day
      // On the end day, breakdown goes from start of day to end time
      breakdownStart = 0; // Start of day
      breakdownEnd = breakdown.endTimeMinutes;
    } else if (breakdown.startDate < jobStartDate && breakdown.endDate > jobStartDate) {
      // Breakdown spans this entire day (started before, ends after)
      // Entire shift is blocked - all work defers to when breakdown ends
      breakdownStart = 0;
      breakdownEnd = shiftEndMinutes;
      
      // All work on this day must defer to when breakdown ends
      deferralDate = breakdown.endDate;
      deferralStartMinutes = breakdown.endTimeMinutes;
      isMultiDayDeferral = true;
    } else {
      // Breakdown doesn't affect this day
      continue;
    }
    
    if (breakdownStart === null || breakdownEnd === null) {
      continue;
    }
    
    // Calculate overlap between job and breakdown
    // Overlap exists if breakdown starts before job ends AND breakdown ends after job starts
    if (breakdownStart < jobEndMinutes && breakdownEnd > jobStartMinutes) {
      const overlapStart = Math.max(breakdownStart, jobStartMinutes);
      const overlapEnd = Math.min(breakdownEnd, jobEndMinutes);
      const overlapMinutes = Math.max(0, overlapEnd - overlapStart);
      stretchMinutes += overlapMinutes;
    }
  }
  
  // Calculate if the stretched job extends past shift end
  const stretchedEndTime = jobEndMinutes + stretchMinutes;
  let spilloverToNextDay = false;
  let spilloverMinutes = 0;
  
  if (stretchedEndTime > shiftEndMinutes) {
    spilloverToNextDay = true;
    spilloverMinutes = stretchedEndTime - shiftEndMinutes;
  }
  
  return {
    stretchMinutes,
    spilloverToNextDay,
    spilloverMinutes,
    deferralDate,
    deferralStartMinutes,
    isMultiDayDeferral
  };
}

/**
 * Applies breakdown stretching to a scheduled job's end time.
 * This should be called after initial scheduling to adjust for breakdowns.
 * 
 * @param job - The scheduled job to adjust
 * @param shiftEndMinutes - The shift end time in minutes from midnight
 * @param breakdowns - Array of breakdown blocks for this team/day
 * @returns Updated job with stretched end time and breakdown info
 */
export function applyBreakdownStretch(
  job: ScheduledJob,
  shiftEndMinutes: number,
  breakdowns: BreakdownBlock[]
): { 
  stretchedJob: ScheduledJob; 
  spilloverMinutes: number;
  stretchMinutes: number;
} {
  if (!job.plannedDateStr || job.plannedStartTime === null || job.plannedEndTime === null) {
    return { 
      stretchedJob: job, 
      spilloverMinutes: 0,
      stretchMinutes: 0
    };
  }
  
  const result = calculateBreakdownStretch(
    job.plannedDateStr,
    job.plannedStartTime,
    job.plannedEndTime,
    shiftEndMinutes,
    breakdowns
  );
  
  if (result.stretchMinutes === 0) {
    return { 
      stretchedJob: job, 
      spilloverMinutes: 0,
      stretchMinutes: 0
    };
  }
  
  // Apply the stretch to the job's end time
  // Cap at shift end - spillover is handled separately
  const stretchedEndTime = Math.min(
    job.plannedEndTime + result.stretchMinutes,
    shiftEndMinutes
  );
  
  const stretchedJob: ScheduledJob = {
    ...job,
    plannedEndTime: stretchedEndTime,
    breakAdjustmentMinutes: (job.breakAdjustmentMinutes ?? 0) + result.stretchMinutes
  };
  
  return {
    stretchedJob,
    spilloverMinutes: result.spilloverMinutes,
    stretchMinutes: result.stretchMinutes
  };
}

/**
 * Filters breakdown blocks from a list of schedule blocks.
 * Use this to extract breakdowns for stretch calculation.
 */
export function extractBreakdowns(
  scheduleBlocks: Array<{ 
    blockType: string; 
    startDate: string;
    startTimeMinutes: number; 
    endDate: string;
    endTimeMinutes: number 
  }>
): BreakdownBlock[] {
  return scheduleBlocks
    .filter(b => b.blockType === 'Breakdown')
    .map(b => ({
      startDate: b.startDate,
      startTimeMinutes: b.startTimeMinutes,
      endDate: b.endDate,
      endTimeMinutes: b.endTimeMinutes
    }));
}

/**
 * Represents a deferred work segment for multi-day breakdowns.
 * When a breakdown extends to a future date, remaining work is deferred.
 */
export interface DeferredWorkSegment {
  /** The original job that has deferred work */
  sourceJob: ScheduledJob;
  /** Minutes of work to be done on the deferral date */
  deferredMinutes: number;
  /** Date when deferred work can resume */
  deferralDate: string;
  /** Time in minutes when deferred work can start on the deferral date */
  deferralStartMinutes: number;
}

/**
 * Extended result of breakdown stretching with cascade, including multi-day deferral info.
 */
export interface BreakdownCascadeResult extends CascadeResult {
  /** Deferred work segments for multi-day breakdowns */
  deferredWork: DeferredWorkSegment[];
}

/**
 * Applies breakdown stretching to all jobs on a day, with cascade effect.
 * 
 * WORKFLOW:
 * 1. Apply breakdown stretching to each job (extends end time)
 * 2. Cascade subsequent jobs forward based on stretched end times
 * 3. Track spillover for jobs pushed past shift end
 * 4. For multi-day breakdowns, track deferral info so work resumes at the exact breakdown end time
 * 
 * @param jobs - Jobs scheduled on this day (already sorted by start time)
 * @param shift - Shift configuration for the day  
 * @param breakdowns - Breakdown blocks for this team on this day
 * @returns Updated jobs with breakdown stretching applied, overflows, and deferred work segments
 */
export function applyBreakdownStretchWithCascade(
  jobs: ScheduledJob[],
  shift: ShiftConfig,
  breakdowns: BreakdownBlock[]
): BreakdownCascadeResult {
  if (breakdowns.length === 0 || jobs.length === 0) {
    return { scheduledJobs: [...jobs], overflows: [], deferredWork: [] };
  }
  
  const scheduledJobs: ScheduledJob[] = [];
  const overflows: OverflowEntry[] = [];
  const deferredWork: DeferredWorkSegment[] = [];
  
  // Sort jobs by start time to ensure proper cascading
  const sortedJobs = [...jobs].sort(
    (a, b) => (a.plannedStartTime ?? 0) - (b.plannedStartTime ?? 0)
  );
  
  for (let i = 0; i < sortedJobs.length; i++) {
    const job = sortedJobs[i];
    
    if (job.plannedStartTime === null || job.plannedEndTime === null) {
      scheduledJobs.push({ ...job });
      continue;
    }
    
    // Determine if this job needs to cascade forward due to previous job's stretch
    let effectiveStartTime = job.plannedStartTime;
    
    if (i > 0) {
      const prevJob = scheduledJobs[scheduledJobs.length - 1];
      const prevEndTime = prevJob?.plannedEndTime ?? shift.startTime;
      
      // If current job starts before the previous job ends (after stretch), cascade it forward
      const expectedNextStart = prevEndTime + BUFFER_MINUTES;
      if (effectiveStartTime < expectedNextStart && prevEndTime > job.plannedStartTime - BUFFER_MINUTES) {
        effectiveStartTime = getNextValidStartTime(expectedNextStart, shift);
      }
    }
    
    // Check if job is pushed past shift end
    if (effectiveStartTime >= shift.endTime) {
      const jobDuration = getJobDuration(job);
      overflows.push({
        job: { ...job },
        overflowMinutes: jobDuration
      });
      continue;
    }
    
    // Calculate the original job end time at the new start position
    const workDuration = getJobDuration(job);
    const baseEndTime = effectiveStartTime + workDuration;
    
    // Apply breakdown stretch to this job
    const stretchResult = calculateBreakdownStretch(
      job.plannedDateStr!,
      effectiveStartTime,
      baseEndTime,
      shift.endTime,
      breakdowns
    );
    
    const stretchedEndTime = baseEndTime + stretchResult.stretchMinutes;
    
    // Cap end time at shift end; spillover becomes overflow
    const cappedEndTime = Math.min(stretchedEndTime, shift.endTime);
    
    const stretchedJob: ScheduledJob = {
      ...job,
      plannedStartTime: effectiveStartTime,
      plannedEndTime: cappedEndTime,
      breakAdjustmentMinutes: (job.breakAdjustmentMinutes ?? 0) + stretchResult.stretchMinutes
    };
    
    scheduledJobs.push(stretchedJob);
    
    // Handle multi-day breakdown deferrals
    // If this is a multi-day breakdown, remaining work should start at the breakdown end time
    if (stretchResult.isMultiDayDeferral && stretchResult.deferralDate && stretchResult.deferralStartMinutes !== null) {
      // For multi-day breakdowns: work deferred to breakdown end time
      if (stretchResult.spilloverMinutes > 0) {
        deferredWork.push({
          sourceJob: stretchedJob,
          deferredMinutes: stretchResult.spilloverMinutes,
          deferralDate: stretchResult.deferralDate,
          deferralStartMinutes: stretchResult.deferralStartMinutes
        });
      }
    } else if (stretchResult.spilloverToNextDay && stretchResult.spilloverMinutes > 0) {
      // Standard overflow (no specific deferral time) - goes to regular overflow handling
      overflows.push({
        job: stretchedJob,
        overflowMinutes: stretchResult.spilloverMinutes
      });
    }
  }
  
  return { scheduledJobs, overflows, deferredWork };
}

/**
 * Gets breakdown blocks that affect a specific team on a specific date.
 * Supports both single-day blocks (dateStr only) and multi-day blocks (startDate/endDate).
 * 
 * @param scheduleBlocks - All schedule blocks
 * @param teamId - The team ID to filter for
 * @param dateStr - The date to check (YYYY-MM-DD format)
 * @returns Breakdown blocks that affect this team on this date (converted to BreakdownBlock format)
 */
export function getBreakdownsForTeamDay(
  scheduleBlocks: Array<{
    blockType: string;
    teamId?: string | null;
    dateStr: string;
    startTimeMinutes: number;
    endTimeMinutes: number;
    startDate?: string;
    endDate?: string;
  }>,
  teamId: string | null,
  dateStr: string
): BreakdownBlock[] {
  return scheduleBlocks
    .filter(b => {
      // Only include Breakdown type
      if (b.blockType !== 'Breakdown') return false;
      
      // Team must match (null/undefined means applies to all teams)
      if (b.teamId !== null && b.teamId !== undefined && b.teamId !== teamId) {
        return false;
      }
      
      // Check if breakdown affects this date
      // Support both single-day (dateStr only) and multi-day (startDate/endDate) blocks
      const blockStartDate = b.startDate || b.dateStr;
      const blockEndDate = b.endDate || b.dateStr;
      
      // Date is affected if it falls within the block's date range
      return dateStr >= blockStartDate && dateStr <= blockEndDate;
    })
    .map(b => ({
      // Use startDate/endDate if available, otherwise fall back to dateStr
      startDate: b.startDate || b.dateStr,
      startTimeMinutes: b.startTimeMinutes,
      endDate: b.endDate || b.dateStr,
      endTimeMinutes: b.endTimeMinutes
    }));
}

/**
 * Creates a multi-day breakdown block.
 * Use this helper when creating breakdown blocks that span multiple days.
 * 
 * @param startDate - Start date in YYYY-MM-DD format
 * @param startTimeMinutes - Start time in minutes from midnight
 * @param endDate - End date in YYYY-MM-DD format
 * @param endTimeMinutes - End time in minutes from midnight on the end date
 * @returns A BreakdownBlock that can be used with calculateBreakdownStretch
 */
export function createMultiDayBreakdown(
  startDate: string,
  startTimeMinutes: number,
  endDate: string,
  endTimeMinutes: number
): BreakdownBlock {
  return {
    startDate,
    startTimeMinutes,
    endDate,
    endTimeMinutes
  };
}
