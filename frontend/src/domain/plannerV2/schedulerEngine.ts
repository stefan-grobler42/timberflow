/**
 * Core cascade scheduling logic for the plannerV2 module.
 * Handles job scheduling, cascading, overflow management, and drop zone calculations.
 */

import type { ScheduledJob, ShiftConfig, OvertimeSettings } from './types';
import { BUFFER_MINUTES } from './constants';
import { getJobDuration } from './durationCalculator';
import { calculateEndTime, getShiftConfig, getNextWorkingDay, getAvailableMinutes } from './shiftCalendar';

/**
 * Result of scheduling a single job.
 */
export interface JobTimingResult {
  /** Start time in minutes from midnight */
  plannedStartTime: number;
  /** End time in minutes from midnight */
  plannedEndTime: number;
  /** Minutes added due to breaks spanned by this job */
  breakAdjustmentMinutes: number;
  /** Minutes that overflow past shift end (0 if job fits) */
  overflowMinutes: number;
}

/**
 * Entry representing an overflow that needs to be handled.
 */
export interface OverflowEntry {
  /** The job that overflowed */
  job: ScheduledJob;
  /** Minutes that overflow past shift end */
  overflowMinutes: number;
}

/**
 * Result of cascade scheduling operation.
 */
export interface CascadeResult {
  /** All jobs after scheduling (including inserted and cascaded) */
  scheduledJobs: ScheduledJob[];
  /** Jobs that overflow past shift end */
  overflows: OverflowEntry[];
}

/**
 * Result of multi-day overflow processing.
 */
export interface MultiDayCascadeResult {
  /** All dates that were affected by the cascade */
  affectedDays: string[];
  /** All scheduled jobs after processing */
  scheduledJobs: ScheduledJob[];
  /** New rollover job segments created */
  newRollovers: ScheduledJob[];
}

/**
 * Represents a valid drop position for job insertion.
 */
export interface DropZone {
  /** Index in the job list where a job can be inserted */
  index: number;
  /** Start time of the drop zone in minutes from midnight */
  startTime: number;
  /** End time of the drop zone in minutes from midnight */
  endTime: number;
  /** Available minutes in this zone (excluding breaks) */
  availableMinutes: number;
}

/**
 * Schedules a single job at a given start time, accounting for breaks.
 * 
 * @param job - The job to schedule
 * @param startTime - Start time in minutes from midnight
 * @param shift - Shift configuration with breaks
 * @returns Job timing result including overflow information
 * 
 * @example
 * const shift = getShiftConfig();
 * const result = scheduleJob(myJob, 510, shift);
 * // result.plannedStartTime = 510
 * // result.plannedEndTime accounts for breaks
 * // result.overflowMinutes > 0 if job extends past shift end
 */
export function scheduleJob(
  job: ScheduledJob,
  startTime: number,
  shift: ShiftConfig
): JobTimingResult {
  const workDuration = getJobDuration(job);
  
  if (startTime >= shift.endTime) {
    return {
      plannedStartTime: startTime,
      plannedEndTime: startTime + workDuration,
      breakAdjustmentMinutes: 0,
      overflowMinutes: workDuration
    };
  }
  
  const { endTime, breakMinutes } = calculateEndTime(startTime, workDuration, shift);
  
  let overflowMinutes = 0;
  let actualEndTime = endTime;
  
  if (endTime > shift.endTime) {
    const workedBeforeEnd = getAvailableMinutes(startTime, shift);
    overflowMinutes = workDuration - workedBeforeEnd;
    actualEndTime = shift.endTime;
  }
  
  return {
    plannedStartTime: startTime,
    plannedEndTime: actualEndTime,
    breakAdjustmentMinutes: breakMinutes,
    overflowMinutes: Math.max(0, overflowMinutes)
  };
}

/**
 * Finds the correct insert position for a job based on drop time.
 * Jobs are sorted by their planned start time.
 * 
 * @param existingJobs - Array of already scheduled jobs (assumed sorted by start time)
 * @param dropTime - The time position where the job should be inserted
 * @returns Index where the job should be inserted
 * 
 * @example
 * const jobs = [
 *   { plannedStartTime: 420 },  // 7:00 AM
 *   { plannedStartTime: 540 },  // 9:00 AM
 *   { plannedStartTime: 660 }   // 11:00 AM
 * ];
 * findInsertPosition(jobs, 600) // returns 2 (after 9am, before 11am)
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
 * Performs cascade scheduling after inserting a job.
 * All subsequent jobs are pushed forward with BUFFER_MINUTES gaps.
 * 
 * @param jobs - Existing jobs on the same day/jig (sorted by start time)
 * @param insertedJob - The job being inserted
 * @param insertIndex - Position where the job is inserted
 * @param shift - Shift configuration
 * @returns Cascade result with scheduled jobs and overflow information
 * 
 * @example
 * const result = cascadeSchedule(existingJobs, newJob, 0, shift);
 * // result.scheduledJobs contains all jobs with updated times
 * // result.overflows contains jobs that don't fit in the day
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
  
  for (const job of jobsBefore) {
    scheduledJobs.push({ ...job });
  }
  
  let currentTime = shift.startTime;
  if (jobsBefore.length > 0) {
    const lastBefore = jobsBefore[jobsBefore.length - 1];
    const lastEndTime = lastBefore.plannedEndTime ?? shift.startTime;
    currentTime = lastEndTime + BUFFER_MINUTES;
  }
  
  const insertedTiming = scheduleJob(insertedJob, currentTime, shift);
  const scheduledInserted: ScheduledJob = {
    ...insertedJob,
    plannedStartTime: insertedTiming.plannedStartTime,
    plannedEndTime: insertedTiming.plannedEndTime,
    breakAdjustmentMinutes: insertedTiming.breakAdjustmentMinutes,
    plannedDurationMinutes: getJobDuration(insertedJob) + insertedTiming.breakAdjustmentMinutes
  };
  scheduledJobs.push(scheduledInserted);
  
  if (insertedTiming.overflowMinutes > 0) {
    overflows.push({
      job: scheduledInserted,
      overflowMinutes: insertedTiming.overflowMinutes
    });
  }
  
  currentTime = insertedTiming.plannedEndTime + BUFFER_MINUTES;
  
  for (const job of jobsAfter) {
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
      plannedDurationMinutes: getJobDuration(job) + timing.breakAdjustmentMinutes
    };
    scheduledJobs.push(scheduledJob);
    
    if (timing.overflowMinutes > 0) {
      overflows.push({
        job: scheduledJob,
        overflowMinutes: timing.overflowMinutes
      });
    }
    
    currentTime = timing.plannedEndTime + BUFFER_MINUTES;
  }
  
  return { scheduledJobs, overflows };
}

/**
 * Generates a unique ID for a rollover job segment.
 * 
 * @param parentId - The parent job ID
 * @param sequence - The sequence number
 * @returns Unique rollover ID
 */
function generateRolloverId(parentId: string, sequence: number): string {
  return `${parentId}-rollover-${sequence}`;
}

/**
 * Creates a new rollover job segment for overflow work.
 * 
 * @param parentJob - The original job that overflowed
 * @param overflowMinutes - Minutes of work to carry over
 * @param targetDate - Target date in YYYY-MM-DD format
 * @param sequence - Sequence number for the rollover (1 = first rollover, etc.)
 * @returns New rollover job segment
 * 
 * @example
 * const rollover = createRolloverSegment(originalJob, 60, '2025-01-07', 1);
 * // Creates a new job linked to the original with 60 minutes of work
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
 * Uses queue-based processing to handle overflows that may cascade across multiple days.
 * 
 * @param overflows - Initial overflow entries to process
 * @param allJobs - All existing jobs across all days (for reference)
 * @param overtimeByTeamDay - Overtime settings keyed by date string, then by team ID
 * @returns Multi-day cascade result
 * 
 * @example
 * const result = processMultiDayOverflows(overflows, allJobs, overtimeByTeamDay);
 * // result.affectedDays shows which days were modified
 * // result.newRollovers contains created rollover segments
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
 * Calculates valid drop zones for job insertion.
 * Includes positions at shift start, between jobs (with buffer), and after last job.
 * 
 * @param existingJobs - Jobs already scheduled on the day/jig (sorted by start time)
 * @param shift - Shift configuration
 * @returns Array of drop zones with availability information
 * 
 * @example
 * const zones = calculateDropZones(jobs, shift);
 * // zones[0] might be { index: 0, startTime: 420, endTime: 480, availableMinutes: 60 }
 */
export function calculateDropZones(
  existingJobs: ScheduledJob[],
  shift: ShiftConfig
): DropZone[] {
  const zones: DropZone[] = [];
  
  if (existingJobs.length === 0) {
    const availableMinutes = getAvailableMinutes(shift.startTime, shift);
    zones.push({
      index: 0,
      startTime: shift.startTime,
      endTime: shift.endTime,
      availableMinutes
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
        availableMinutes: getAvailableMinutes(shift.startTime, {
          ...shift,
          endTime: gapEnd
        })
      });
    }
  }
  
  for (let i = 0; i < sortedJobs.length - 1; i++) {
    const currentJob = sortedJobs[i];
    const nextJob = sortedJobs[i + 1];
    
    const currentEnd = currentJob.plannedEndTime ?? shift.startTime;
    const nextStart = nextJob.plannedStartTime ?? shift.endTime;
    
    const gapStart = currentEnd + BUFFER_MINUTES;
    const gapEnd = nextStart - BUFFER_MINUTES;
    
    if (gapEnd > gapStart) {
      zones.push({
        index: i + 1,
        startTime: gapStart,
        endTime: gapEnd,
        availableMinutes: getAvailableMinutes(gapStart, {
          ...shift,
          endTime: gapEnd
        })
      });
    }
  }
  
  const lastJob = sortedJobs[sortedJobs.length - 1];
  const lastEnd = lastJob.plannedEndTime ?? shift.startTime;
  const afterLastStart = lastEnd + BUFFER_MINUTES;
  
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
 * Reschedules all jobs on a day/jig from the start.
 * Useful for full recalculation after changes.
 * 
 * @param jobs - Jobs to reschedule (will be sorted by current start time)
 * @param shift - Shift configuration
 * @returns Cascade result with rescheduled jobs and overflows
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
      plannedDurationMinutes: getJobDuration(job) + timing.breakAdjustmentMinutes
    };
    scheduledJobs.push(scheduledJob);
    
    if (timing.overflowMinutes > 0) {
      overflows.push({
        job: scheduledJob,
        overflowMinutes: timing.overflowMinutes
      });
    }
    
    currentTime = timing.plannedEndTime + BUFFER_MINUTES;
  }
  
  return { scheduledJobs, overflows };
}

/**
 * Checks if a job can fit at a specific time without overflow.
 * 
 * @param job - The job to check
 * @param startTime - Proposed start time
 * @param shift - Shift configuration
 * @returns True if the job fits entirely within the shift
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
 * Gets the next available start time after a given time, accounting for buffer.
 * 
 * @param afterTime - Time after which to find availability
 * @param shift - Shift configuration
 * @returns Next available start time, or null if no time available
 */
export function getNextAvailableTime(
  afterTime: number,
  shift: ShiftConfig
): number | null {
  const nextTime = afterTime + BUFFER_MINUTES;
  
  if (nextTime >= shift.endTime) {
    return null;
  }
  
  for (const brk of shift.breaks) {
    if (nextTime >= brk.start && nextTime < brk.end) {
      const afterBreak = brk.end;
      if (afterBreak >= shift.endTime) {
        return null;
      }
      return afterBreak;
    }
  }
  
  return nextTime;
}
