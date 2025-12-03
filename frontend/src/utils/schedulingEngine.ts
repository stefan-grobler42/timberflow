import {
  getShiftConfig,
  calculatePlannedTimes,
  getJobDurationMinutes,
  getShiftTotalMinutes,
  BUFFER_MINUTES
} from './scheduleUtils';

export interface ScheduledJob {
  id: string;
  name: string;
  orderNumber: string;
  customer: string;
  estimatedEFinks: number;
  customDurationMinutes?: number;
  plannedDateStr: string | null;
  jigId: string | null;
  productionComplete: boolean;
  parentProductionId?: string | null;
  rolloverSequence?: number;
  createdOn?: string;
  plannedStartTime?: number | null;
  plannedEndTime?: number | null;
  plannedDurationMinutes?: number | null;
  breakAdjustmentMinutes?: number | null;
}

export interface OvertimeSettings {
  enabled: boolean;
  closeTime: string;
}

export interface ScheduleResult {
  jobs: ScheduledJob[];
  overflows: OverflowInfo[];
  requiresRollover: boolean;
}

export interface OverflowInfo {
  jobId: string;
  jobName: string;
  orderNumber: string;
  overflowMinutes: number;
  jigId: string | null;
  availableMinutesOnDay: number;
  usedMinutesOnDay: number;
}

export interface DropZone {
  index: number;
  startMinutes: number;
  endMinutes: number;
  label: string;
  isValid: boolean;
}

export interface RolloverChain {
  parentId: string;
  segments: ScheduledJob[];
  totalDurationMinutes: number;
}

export function getAvailableMinutesForDay(
  dateStr: string,
  overtimeByDay: Record<string, OvertimeSettings>
): number {
  const overtime = overtimeByDay[dateStr];
  const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
  return getShiftTotalMinutes(shift);
}

export function isWorkingDay(
  dateStr: string,
  overtimeByDay: Record<string, OvertimeSettings>
): boolean {
  const date = new Date(dateStr);
  const dayOfWeek = date.getDay();
  
  if (dayOfWeek === 0) return false;
  
  if (dayOfWeek === 6) {
    const overtime = overtimeByDay[dateStr];
    return overtime?.enabled === true;
  }
  
  return true;
}

export function getNextWorkingDay(
  currentDateStr: string,
  overtimeByDay: Record<string, OvertimeSettings>
): string {
  let date = new Date(currentDateStr);
  date.setDate(date.getDate() + 1);
  
  let iterations = 0;
  const maxIterations = 14;
  
  while (!isWorkingDay(date.toISOString().split('T')[0], overtimeByDay) && iterations < maxIterations) {
    date.setDate(date.getDate() + 1);
    iterations++;
  }
  
  return date.toISOString().split('T')[0];
}

export function scheduleJobsSequentially(
  jobs: ScheduledJob[],
  dateStr: string,
  jigId: string,
  overtimeByDay: Record<string, OvertimeSettings>,
  insertJobAtIndex?: { job: ScheduledJob; index: number }
): ScheduleResult {
  const overtime = overtimeByDay[dateStr];
  const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
  const WORKING_START = shift.startTime;
  const WORKING_END = shift.endTime;
  const availableMinutes = getShiftTotalMinutes(shift);
  
  let jobsList = jobs
    .filter(j => j.plannedDateStr === dateStr && j.jigId === jigId && !j.productionComplete)
    .sort((a, b) => {
      const aSeq = a.rolloverSequence || 0;
      const bSeq = b.rolloverSequence || 0;
      if (aSeq !== bSeq) return aSeq - bSeq;
      
      const aStart = a.plannedStartTime ?? WORKING_START;
      const bStart = b.plannedStartTime ?? WORKING_START;
      return aStart - bStart;
    });
  
  if (insertJobAtIndex) {
    const { job, index } = insertJobAtIndex;
    jobsList = [
      ...jobsList.slice(0, index),
      job,
      ...jobsList.slice(index)
    ];
  }
  
  const scheduledJobs: ScheduledJob[] = [];
  const overflows: OverflowInfo[] = [];
  let currentTime = WORKING_START;
  let usedMinutes = 0;
  
  for (let i = 0; i < jobsList.length; i++) {
    const job = jobsList[i];
    const jobDuration = getJobDurationMinutes(job);
    
    if (i > 0) {
      currentTime += BUFFER_MINUTES;
    }
    
    const timing = calculatePlannedTimes(currentTime, jobDuration, shift);
    const effectiveEnd = currentTime + jobDuration + timing.breakAdjustmentMinutes;
    
    if (effectiveEnd > WORKING_END) {
      const availableTimeFromCurrent = WORKING_END - currentTime;
      let workableMinutes = availableTimeFromCurrent;
      
      for (const brk of shift.breaks) {
        if (brk.start >= currentTime && brk.end <= WORKING_END) {
          workableMinutes -= brk.duration;
        }
      }
      workableMinutes = Math.max(0, workableMinutes);
      
      const overflowMinutes = jobDuration - workableMinutes;
      
      if (workableMinutes >= 15) {
        const truncatedTiming = calculatePlannedTimes(currentTime, workableMinutes, shift);
        
        scheduledJobs.push({
          ...job,
          plannedStartTime: currentTime,
          plannedEndTime: Math.min(WORKING_END, truncatedTiming.plannedEndTime),
          plannedDurationMinutes: workableMinutes,
          breakAdjustmentMinutes: truncatedTiming.breakAdjustmentMinutes
        });
        
        usedMinutes += workableMinutes + truncatedTiming.breakAdjustmentMinutes;
        currentTime = WORKING_END;
      }
      
      if (overflowMinutes > 0) {
        overflows.push({
          jobId: job.id,
          jobName: job.name,
          orderNumber: job.orderNumber,
          overflowMinutes,
          jigId,
          availableMinutesOnDay: availableMinutes,
          usedMinutesOnDay: usedMinutes
        });
      }
    } else {
      scheduledJobs.push({
        ...job,
        plannedStartTime: currentTime,
        plannedEndTime: timing.plannedEndTime,
        plannedDurationMinutes: jobDuration,
        breakAdjustmentMinutes: timing.breakAdjustmentMinutes
      });
      
      currentTime = timing.plannedEndTime;
      usedMinutes += jobDuration + timing.breakAdjustmentMinutes;
    }
  }
  
  return {
    jobs: scheduledJobs,
    overflows,
    requiresRollover: overflows.length > 0
  };
}

export function calculateDropZones(
  existingJobs: ScheduledJob[],
  dateStr: string,
  jigId: string,
  overtimeByDay: Record<string, OvertimeSettings>
): DropZone[] {
  const overtime = overtimeByDay[dateStr];
  const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
  const WORKING_START = shift.startTime;
  const WORKING_END = shift.endTime;
  
  const jobsOnDay = existingJobs
    .filter(j => j.plannedDateStr === dateStr && j.jigId === jigId && !j.productionComplete)
    .sort((a, b) => {
      const aStart = a.plannedStartTime ?? WORKING_START;
      const bStart = b.plannedStartTime ?? WORKING_START;
      return aStart - bStart;
    });
  
  const dropZones: DropZone[] = [];
  
  if (jobsOnDay.length === 0) {
    dropZones.push({
      index: 0,
      startMinutes: WORKING_START,
      endMinutes: WORKING_END,
      label: 'Drop here to schedule',
      isValid: true
    });
    return dropZones;
  }
  
  const firstJob = jobsOnDay[0];
  const firstStart = firstJob.plannedStartTime ?? WORKING_START;
  
  if (firstStart > WORKING_START) {
    dropZones.push({
      index: 0,
      startMinutes: WORKING_START,
      endMinutes: firstStart - BUFFER_MINUTES,
      label: 'Before first job',
      isValid: true
    });
  } else {
    dropZones.push({
      index: 0,
      startMinutes: WORKING_START,
      endMinutes: WORKING_START + 30,
      label: 'Insert at start (shifts all down)',
      isValid: true
    });
  }
  
  for (let i = 0; i < jobsOnDay.length; i++) {
    const job = jobsOnDay[i];
    const isCompleted = job.productionComplete;
    
    if (isCompleted && i < jobsOnDay.length - 1) {
      const nextJob = jobsOnDay[i + 1];
      const gapStart = (job.plannedEndTime ?? WORKING_START) + BUFFER_MINUTES;
      const gapEnd = (nextJob.plannedStartTime ?? WORKING_END) - BUFFER_MINUTES;
      
      if (gapEnd > gapStart) {
        dropZones.push({
          index: i + 1,
          startMinutes: gapStart,
          endMinutes: gapEnd,
          label: `After ${job.name.substring(0, 20)}...`,
          isValid: true
        });
      }
    }
  }
  
  const lastJob = jobsOnDay[jobsOnDay.length - 1];
  const afterLastStart = (lastJob.plannedEndTime ?? WORKING_END) + BUFFER_MINUTES;
  
  if (afterLastStart < WORKING_END) {
    dropZones.push({
      index: jobsOnDay.length,
      startMinutes: afterLastStart,
      endMinutes: WORKING_END,
      label: 'After last job',
      isValid: true
    });
  }
  
  return dropZones;
}

export function createRolloverJob(
  parentJob: ScheduledJob,
  overflowMinutes: number,
  nextDateStr: string,
  rolloverSequence: number
): ScheduledJob {
  return {
    ...parentJob,
    id: `rollover-${parentJob.id}-${rolloverSequence}`,
    parentProductionId: parentJob.parentProductionId || parentJob.id,
    rolloverSequence,
    plannedDateStr: nextDateStr,
    plannedStartTime: null,
    plannedEndTime: null,
    plannedDurationMinutes: overflowMinutes,
    customDurationMinutes: overflowMinutes,
    breakAdjustmentMinutes: null,
    productionComplete: false
  };
}

export function cascadeRollover(
  sourceJob: ScheduledJob,
  overflowMinutes: number,
  allJobs: ScheduledJob[],
  overtimeByDay: Record<string, OvertimeSettings>,
  maxDays: number = 30
): { updatedJobs: ScheduledJob[]; newRollovers: ScheduledJob[] } {
  const updatedJobs: ScheduledJob[] = [...allJobs];
  const newRollovers: ScheduledJob[] = [];
  
  let remainingOverflow = overflowMinutes;
  let currentDateStr = sourceJob.plannedDateStr!;
  let rolloverSequence = (sourceJob.rolloverSequence || 0) + 1;
  let iterations = 0;
  
  while (remainingOverflow > 0 && iterations < maxDays) {
    iterations++;
    
    const nextDateStr = getNextWorkingDay(currentDateStr, overtimeByDay);
    const availableMinutes = getAvailableMinutesForDay(nextDateStr, overtimeByDay);
    
    const jobsOnNextDay = updatedJobs.filter(
      j => j.plannedDateStr === nextDateStr && j.jigId === sourceJob.jigId && !j.productionComplete
    );
    
    const rolloverJob = createRolloverJob(
      sourceJob,
      Math.min(remainingOverflow, availableMinutes),
      nextDateStr,
      rolloverSequence
    );
    
    const insertResult = scheduleJobsSequentially(
      [...jobsOnNextDay, rolloverJob],
      nextDateStr,
      sourceJob.jigId!,
      overtimeByDay,
      { job: rolloverJob, index: 0 }
    );
    
    for (const scheduledJob of insertResult.jobs) {
      if (scheduledJob.id === rolloverJob.id) {
        newRollovers.push(scheduledJob);
      } else {
        const idx = updatedJobs.findIndex(j => j.id === scheduledJob.id);
        if (idx >= 0) {
          updatedJobs[idx] = scheduledJob;
        }
      }
    }
    
    if (insertResult.overflows.length > 0) {
      for (const overflow of insertResult.overflows) {
        if (overflow.jobId === rolloverJob.id) {
          remainingOverflow = overflow.overflowMinutes;
        } else {
          const overflowingJob = updatedJobs.find(j => j.id === overflow.jobId);
          if (overflowingJob) {
            const cascadeResult = cascadeRollover(
              overflowingJob,
              overflow.overflowMinutes,
              updatedJobs,
              overtimeByDay,
              maxDays - iterations
            );
            updatedJobs.push(...cascadeResult.newRollovers);
            newRollovers.push(...cascadeResult.newRollovers);
          }
        }
      }
    } else {
      remainingOverflow = 0;
    }
    
    currentDateStr = nextDateStr;
    rolloverSequence++;
  }
  
  return { updatedJobs, newRollovers };
}

export function recalculateChain(
  parentJobId: string,
  allJobs: ScheduledJob[],
  overtimeByDay: Record<string, OvertimeSettings>
): { updatedJobs: ScheduledJob[]; deletedJobIds: string[] } {
  const chainJobs = allJobs.filter(
    j => j.id === parentJobId || j.parentProductionId === parentJobId
  ).sort((a, b) => (a.rolloverSequence || 0) - (b.rolloverSequence || 0));
  
  if (chainJobs.length === 0) return { updatedJobs: [], deletedJobIds: [] };
  
  const parentJob = chainJobs[0];
  const totalDuration = chainJobs.reduce((sum, j) => {
    return sum + (j.plannedDurationMinutes || getJobDurationMinutes(j));
  }, 0);
  
  const updatedJobs: ScheduledJob[] = [];
  const deletedJobIds: string[] = [];
  
  let remainingDuration = totalDuration;
  let currentJob = parentJob;
  let currentDateStr = parentJob.plannedDateStr!;
  let sequence = 0;
  
  while (remainingDuration > 0) {
    const overtime = overtimeByDay[currentDateStr];
    const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
    const WORKING_START = shift.startTime;
    const availableMinutes = getShiftTotalMinutes(shift);
    
    const startTime = currentJob.plannedStartTime ?? WORKING_START;
    const timing = calculatePlannedTimes(startTime, Math.min(remainingDuration, availableMinutes), shift);
    
    const usedOnDay = Math.min(remainingDuration, availableMinutes);
    remainingDuration -= usedOnDay;
    
    if (sequence === 0) {
      updatedJobs.push({
        ...parentJob,
        plannedDurationMinutes: usedOnDay,
        plannedEndTime: timing.plannedEndTime,
        breakAdjustmentMinutes: timing.breakAdjustmentMinutes
      });
    } else {
      const existingRollover = chainJobs.find(j => j.rolloverSequence === sequence);
      
      if (usedOnDay > 0) {
        if (existingRollover) {
          updatedJobs.push({
            ...existingRollover,
            plannedDateStr: currentDateStr,
            plannedStartTime: WORKING_START,
            plannedEndTime: timing.plannedEndTime,
            plannedDurationMinutes: usedOnDay,
            breakAdjustmentMinutes: timing.breakAdjustmentMinutes
          });
        } else {
          updatedJobs.push(createRolloverJob(parentJob, usedOnDay, currentDateStr, sequence));
        }
      } else if (existingRollover) {
        deletedJobIds.push(existingRollover.id);
      }
    }
    
    if (remainingDuration > 0) {
      currentDateStr = getNextWorkingDay(currentDateStr, overtimeByDay);
      sequence++;
    }
  }
  
  for (const oldRollover of chainJobs) {
    if (oldRollover.rolloverSequence && oldRollover.rolloverSequence > sequence) {
      if (!deletedJobIds.includes(oldRollover.id)) {
        deletedJobIds.push(oldRollover.id);
      }
    }
  }
  
  return { updatedJobs, deletedJobIds };
}

export function findInsertPosition(
  dropTimeMinutes: number,
  existingJobs: ScheduledJob[],
  dateStr: string,
  jigId: string,
  overtimeByDay: Record<string, OvertimeSettings>
): number {
  const overtime = overtimeByDay[dateStr];
  const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
  const WORKING_START = shift.startTime;
  
  const jobsOnDay = existingJobs
    .filter(j => j.plannedDateStr === dateStr && j.jigId === jigId && !j.productionComplete)
    .sort((a, b) => {
      const aStart = a.plannedStartTime ?? WORKING_START;
      const bStart = b.plannedStartTime ?? WORKING_START;
      return aStart - bStart;
    });
  
  if (jobsOnDay.length === 0) return 0;
  
  // dropTimeMinutes is already in absolute minutes from midnight (e.g., 420 for 07:00)
  // DayView passes the snapped position which is in absolute time
  const dropMinutes = dropTimeMinutes;
  
  for (let i = 0; i < jobsOnDay.length; i++) {
    const job = jobsOnDay[i];
    const jobStart = job.plannedStartTime ?? WORKING_START;
    
    // If dropping before this job's start time, insert at this position
    if (dropMinutes <= jobStart) {
      return i;
    }
    
    // For completed jobs, check if dropping after them
    if (job.productionComplete) {
      const jobEnd = job.plannedEndTime ?? jobStart;
      if (dropMinutes > jobEnd) {
        return i + 1;
      }
    }
  }
  
  return jobsOnDay.length;
}

export function getRolloverChain(
  jobId: string,
  allJobs: ScheduledJob[]
): RolloverChain | null {
  const job = allJobs.find(j => j.id === jobId);
  if (!job) return null;
  
  const parentId = job.parentProductionId || job.id;
  
  const segments = allJobs
    .filter(j => j.id === parentId || j.parentProductionId === parentId)
    .sort((a, b) => (a.rolloverSequence || 0) - (b.rolloverSequence || 0));
  
  if (segments.length === 0) return null;
  
  const totalDuration = segments.reduce((sum, j) => {
    return sum + (j.plannedDurationMinutes || getJobDurationMinutes(j));
  }, 0);
  
  return {
    parentId,
    segments,
    totalDurationMinutes: totalDuration
  };
}

export function canDeleteRolloverSegment(
  jobId: string,
  allJobs: ScheduledJob[]
): { canDelete: boolean; reason?: string } {
  const job = allJobs.find(j => j.id === jobId);
  if (!job) return { canDelete: false, reason: 'Job not found' };
  
  if (!job.parentProductionId) {
    return { canDelete: false, reason: 'Cannot delete parent job from planner' };
  }
  
  return { canDelete: true };
}

export function deleteRolloverSegment(
  segmentId: string,
  allJobs: ScheduledJob[],
  overtimeByDay: Record<string, OvertimeSettings>
): { updatedJobs: ScheduledJob[]; deletedJobIds: string[] } {
  const segment = allJobs.find(j => j.id === segmentId);
  if (!segment || !segment.parentProductionId) {
    return { updatedJobs: [], deletedJobIds: [] };
  }
  
  const chain = getRolloverChain(segmentId, allJobs);
  if (!chain) return { updatedJobs: [], deletedJobIds: [] };
  
  const segmentDuration = segment.plannedDurationMinutes || getJobDurationMinutes(segment);
  
  const remainingSegments = chain.segments.filter(s => s.id !== segmentId);
  if (remainingSegments.length === 0) {
    return { updatedJobs: [], deletedJobIds: [segmentId] };
  }
  
  const lastSegment = remainingSegments[remainingSegments.length - 1];
  const updatedLastSegment: ScheduledJob = {
    ...lastSegment,
    plannedDurationMinutes: (lastSegment.plannedDurationMinutes || 0) + segmentDuration,
    customDurationMinutes: (lastSegment.customDurationMinutes || 0) + segmentDuration
  };
  
  const result = recalculateChain(chain.parentId, 
    allJobs.map(j => j.id === lastSegment.id ? updatedLastSegment : j),
    overtimeByDay
  );
  
  return {
    updatedJobs: result.updatedJobs,
    deletedJobIds: [segmentId, ...result.deletedJobIds]
  };
}
