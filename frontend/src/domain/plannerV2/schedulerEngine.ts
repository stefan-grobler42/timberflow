/**
 * Core cascade scheduling logic for the plannerV2 module.
 * SIMPLIFIED: No break logic - jobs start 30 minutes after previous job ends.
 */

import type { ScheduledJob, ShiftConfig, OvertimeSettings } from './types';
import { BUFFER_MINUTES } from './constants';
import { getJobDuration } from './durationCalculator';
import { getShiftConfig, getNextWorkingDay } from './shiftCalendar';

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
 * SIMPLIFIED: Schedules a job at a given start time.
 * End time = start time + work duration (no break expansion).
 * Overflow = amount that extends past shift end.
 */
export function scheduleJob(
  job: ScheduledJob,
  startTime: number,
  shift: ShiftConfig
): JobTimingResult {
  const workDuration = getJobDuration(job);
  const endTime = startTime + workDuration;
  
  let overflowMinutes = 0;
  let actualEndTime = endTime;
  
  if (endTime > shift.endTime) {
    overflowMinutes = endTime - shift.endTime;
    actualEndTime = shift.endTime;
  }
  
  return {
    plannedStartTime: startTime,
    plannedEndTime: actualEndTime,
    breakAdjustmentMinutes: 0,
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
 * SIMPLIFIED: Cascade scheduling - jobs start 30 min after previous job ends.
 * No break adjustments.
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
    breakAdjustmentMinutes: 0,
    plannedDurationMinutes: getJobDuration(insertedJob)
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
      breakAdjustmentMinutes: 0,
      plannedDurationMinutes: getJobDuration(job)
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
 * SIMPLIFIED: Calculate drop zones without break considerations.
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
      availableMinutes: shift.endTime - shift.startTime
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
    
    const gapStart = currentEnd + BUFFER_MINUTES;
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
  const afterLastStart = lastEnd + BUFFER_MINUTES;
  
  if (afterLastStart < shift.endTime) {
    zones.push({
      index: sortedJobs.length,
      startTime: afterLastStart,
      endTime: shift.endTime,
      availableMinutes: shift.endTime - afterLastStart
    });
  }
  
  return zones;
}

/**
 * SIMPLIFIED: Reschedule day without break adjustments.
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
      breakAdjustmentMinutes: 0,
      plannedDurationMinutes: getJobDuration(job)
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
 * SIMPLIFIED: Gets the next available start time (just adds buffer).
 */
export function getNextAvailableTime(
  afterTime: number,
  shift: ShiftConfig
): number | null {
  const nextTime = afterTime + BUFFER_MINUTES;
  
  if (nextTime >= shift.endTime) {
    return null;
  }
  
  return nextTime;
}
