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
  getAvailableMinutes
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
  
  // Cascade subsequent jobs (the train moves back)
  currentTime = getNextStartTimeAfterJob(insertedTiming.plannedEndTime, shift);
  
  for (const job of jobsAfter) {
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
 * Processes multi-day overflow cascading.
 */
export function processMultiDayOverflows(
  overflows: OverflowEntry[],
  allJobs: ScheduledJob[],
  overtimeByTeamDay: Record<string, Record<string, OvertimeSettings>>
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
    
    const targetDate = getNextWorkingDay(sourceDate);
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
    
    const teamId = rollover.jigId || '';
    const dayTeamOvertime = overtimeByTeamDay[targetDate]?.[teamId] || { enabled: false, closeTime: 1020 };
    const dayShift = getShiftConfig(dayTeamOvertime.enabled, dayTeamOvertime.closeTime);
    
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
