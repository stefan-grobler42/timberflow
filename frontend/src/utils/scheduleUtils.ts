interface Break {
  start: number;
  end: number;
  duration: number;
}

interface ShiftConfig {
  startTime: number;
  endTime: number;
  overtimeEndTime: number;
  breaks: Break[];
}

const MINUTES_PER_EFINK = 6.5625;
const GAP_MINUTES = 30; // Standard gap between jobs
const BREAK_PROXIMITY_MINUTES = 15; // If gap ends within this of a break, snap to break end

/**
 * Round up to nearest 15-minute increment
 * e.g., 7 -> 15, 16 -> 30, 45 -> 45, 46 -> 60
 */
export function roundUpToQuarterHour(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}

/**
 * Calculate the next job start time considering:
 * 1. 30-minute gap after previous job
 * 2. If gap end falls within 15 min of a break start, snap to break end
 */
export function calculateGapAdjustedStartTime(
  previousEndTime: number,
  shift: ShiftConfig
): number {
  const gapEndTime = previousEndTime + GAP_MINUTES;
  
  // Check if gap end falls within 15 min of any break start
  for (const brk of shift.breaks) {
    // If gapEndTime is within BREAK_PROXIMITY_MINUTES of break start
    // OR if gapEndTime falls inside the break
    if (gapEndTime >= brk.start - BREAK_PROXIMITY_MINUTES && gapEndTime < brk.end) {
      // Snap to break end
      return brk.end;
    }
  }
  
  // If we're inside a break, skip to break end
  for (const brk of shift.breaks) {
    if (gapEndTime >= brk.start && gapEndTime < brk.end) {
      return brk.end;
    }
  }
  
  return gapEndTime;
}

const DEFAULT_SHIFT: ShiftConfig = {
  startTime: 7 * 60,
  endTime: 17 * 60,
  overtimeEndTime: 19 * 60,
  breaks: [
    { start: 9 * 60, end: 9 * 60 + 15, duration: 15 },
    { start: 12 * 60, end: 12 * 60 + 30, duration: 30 },
    { start: 14 * 60 + 30, end: 14 * 60 + 45, duration: 15 }
  ]
};

export function getShiftConfig(overtimeEnabled: boolean = false, overtimeEndTime?: string): ShiftConfig {
  const endTime = overtimeEnabled && overtimeEndTime 
    ? parseTimeToMinutes(overtimeEndTime)
    : DEFAULT_SHIFT.endTime;
    
  return {
    ...DEFAULT_SHIFT,
    endTime
  };
}

export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export function getBreakMinutesBetween(startMinutes: number, endMinutes: number, shift: ShiftConfig): number {
  let breakTime = 0;
  for (const brk of shift.breaks) {
    if (endMinutes <= brk.start || startMinutes >= brk.end) {
      continue;
    }
    const overlapStart = Math.max(startMinutes, brk.start);
    const overlapEnd = Math.min(endMinutes, brk.end);
    breakTime += Math.max(0, overlapEnd - overlapStart);
  }
  return breakTime;
}

/**
 * Calculate break adjustments - how many minutes of breaks are spanned by a job
 */
export function calculateBreakAdjustment(
  startTimeMinutes: number,
  baseDurationMinutes: number,
  shift: ShiftConfig
): number {
  let currentTime = startTimeMinutes;
  let remainingWork = baseDurationMinutes;
  let breakAdjustment = 0;
  
  while (remainingWork > 0) {
    // Check if we're inside a break
    let inBreak = false;
    for (const brk of shift.breaks) {
      if (currentTime >= brk.start && currentTime < brk.end) {
        breakAdjustment += (brk.end - currentTime);
        currentTime = brk.end;
        inBreak = true;
        break;
      }
    }
    
    if (inBreak) continue;
    
    // Find next break start
    let nextBreakStart = shift.endTime;
    for (const brk of shift.breaks) {
      if (brk.start > currentTime && brk.start < nextBreakStart) {
        nextBreakStart = brk.start;
      }
    }
    
    const workableTime = nextBreakStart - currentTime;
    const workDone = Math.min(workableTime, remainingWork);
    currentTime += workDone;
    remainingWork -= workDone;
    
    // If we hit a break after working, add the break duration
    if (remainingWork > 0 && currentTime === nextBreakStart) {
      for (const brk of shift.breaks) {
        if (brk.start === nextBreakStart) {
          breakAdjustment += brk.duration;
          currentTime = brk.end;
          break;
        }
      }
    }
  }
  
  return breakAdjustment;
}

export function calculatePlannedTimes(
  startTimeMinutes: number,
  durationMinutes: number,
  shift: ShiftConfig
): { plannedStartTime: number; plannedEndTime: number; plannedDurationMinutes: number; breakAdjustmentMinutes: number; overflowMinutes: number } {
  let currentTime = startTimeMinutes;
  let remainingDuration = durationMinutes;
  
  // Use the actual end time (including overtime if enabled)
  const effectiveEndTime = shift.endTime;
  
  // Calculate break adjustment for this job
  const breakAdjustmentMinutes = calculateBreakAdjustment(startTimeMinutes, durationMinutes, shift);
  
  while (remainingDuration > 0) {
    let inBreak = false;
    for (const brk of shift.breaks) {
      if (currentTime >= brk.start && currentTime < brk.end) {
        currentTime = brk.end;
        inBreak = true;
        break;
      }
    }
    
    if (inBreak) continue;
    
    let nextBreakStart = effectiveEndTime;
    for (const brk of shift.breaks) {
      if (brk.start > currentTime && brk.start < nextBreakStart) {
        nextBreakStart = brk.start;
      }
    }
    
    const workableTime = nextBreakStart - currentTime;
    const workDone = Math.min(workableTime, remainingDuration);
    currentTime += workDone;
    remainingDuration -= workDone;
    
    if (currentTime >= effectiveEndTime) {
      break;
    }
  }
  
  // Calculate overflow if job extends beyond shift end
  const overflowMinutes = remainingDuration > 0 ? remainingDuration : 0;
  
  return {
    plannedStartTime: startTimeMinutes,
    plannedEndTime: currentTime,
    plannedDurationMinutes: durationMinutes,
    breakAdjustmentMinutes,
    overflowMinutes
  };
}

export function calculateNextAvailableStartTime(
  date: string,
  jigId: string,
  existingJobs: Array<{ 
    plannedDateStr: string | null; 
    jigId: string | null; 
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
    customDurationMinutes?: number;
    estimatedEFinks?: number;
  }>,
  shift: ShiftConfig
): number {
  const jobsOnTeamDay = existingJobs.filter(
    j => j.plannedDateStr === date && j.jigId === jigId
  );
  
  if (jobsOnTeamDay.length === 0) {
    return shift.startTime;
  }
  
  // Sort jobs by plannedStartTime - jobs without times maintain their order
  const sortedJobs = [...jobsOnTeamDay].sort((a, b) => {
    if (a.plannedStartTime != null && b.plannedStartTime != null) {
      return a.plannedStartTime - b.plannedStartTime;
    }
    // If either lacks time, maintain original order (don't push to end)
    return 0;
  });
  
  // Walk through jobs to find the last end time
  let lastEndTime = shift.startTime;
  
  for (const job of sortedJobs) {
    const duration = getJobDurationMinutes(job);
    
    if (job.plannedStartTime != null && job.plannedEndTime != null) {
      // Job has persisted times
      lastEndTime = Math.max(lastEndTime, job.plannedEndTime);
    } else {
      // Legacy job without planned times - compute its end time
      const timing = calculatePlannedTimes(lastEndTime, duration, shift);
      lastEndTime = timing.plannedEndTime;
    }
  }
  
  // Apply 30-minute gap with break proximity logic
  // If no jobs exist yet, start at shift start (no gap needed)
  if (lastEndTime === shift.startTime) {
    return shift.startTime;
  }
  
  return calculateGapAdjustedStartTime(lastEndTime, shift);
}

export function getJobDurationMinutes(job: { customDurationMinutes?: number; estimatedEFinks?: number }): number {
  if (job.customDurationMinutes && job.customDurationMinutes > 0) {
    // Custom duration should already be rounded, but ensure it
    return roundUpToQuarterHour(job.customDurationMinutes);
  }
  const efinks = job.estimatedEFinks || 0;
  const rawMinutes = efinks * MINUTES_PER_EFINK;
  // Round UP to nearest 15 minutes, minimum 15 minutes
  return Math.max(15, roundUpToQuarterHour(rawMinutes));
}

export function getShiftTotalMinutes(shift: ShiftConfig): number {
  let totalBreaks = 0;
  for (const brk of shift.breaks) {
    if (brk.start >= shift.startTime && brk.end <= shift.endTime) {
      totalBreaks += brk.duration;
    }
  }
  return shift.endTime - shift.startTime - totalBreaks;
}

export function getRemainingCapacity(
  date: string,
  jigId: string,
  existingJobs: Array<{ 
    plannedDateStr: string | null; 
    jigId: string | null; 
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
  }>,
  shift: ShiftConfig
): number {
  const nextStart = calculateNextAvailableStartTime(date, jigId, existingJobs, shift);
  const totalMinutes = getShiftTotalMinutes(shift);
  const usedMinutes = nextStart - shift.startTime - getBreakMinutesBetween(shift.startTime, nextStart, shift);
  return Math.max(0, totalMinutes - usedMinutes);
}
