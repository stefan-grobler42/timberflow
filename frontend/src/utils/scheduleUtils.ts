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

export function calculatePlannedTimes(
  startTimeMinutes: number,
  durationMinutes: number,
  shift: ShiftConfig
): { plannedStartTime: number; plannedEndTime: number; plannedDurationMinutes: number; overflowMinutes: number } {
  let currentTime = startTimeMinutes;
  let remainingDuration = durationMinutes;
  
  // Use the actual end time (including overtime if enabled)
  const effectiveEndTime = shift.endTime;
  
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
  
  // Build a unified timeline with strictly monotonic progression
  // Sort jobs by plannedStartTime (if available), placing legacy jobs at the end
  const sortedJobs = [...jobsOnTeamDay].sort((a, b) => {
    if (a.plannedStartTime != null && b.plannedStartTime != null) {
      return a.plannedStartTime - b.plannedStartTime;
    }
    if (a.plannedStartTime != null) return -1;
    if (b.plannedStartTime != null) return 1;
    return 0;
  });
  
  // Walk through jobs, maintaining monotonic currentTime
  let currentTime = shift.startTime;
  
  for (const job of sortedJobs) {
    const duration = getJobDurationMinutes(job);
    
    if (job.plannedStartTime != null && job.plannedEndTime != null) {
      // Job has persisted times - ensure monotonic progress
      // Start from the later of currentTime or job's start
      currentTime = Math.max(currentTime, job.plannedStartTime);
      // Advance to the job's end time
      currentTime = Math.max(currentTime, job.plannedEndTime);
    } else {
      // Legacy job without planned times - compute its end time sequentially
      // It starts after all previously scheduled work
      const timing = calculatePlannedTimes(currentTime, duration, shift);
      currentTime = timing.plannedEndTime;
    }
  }
  
  // Advance past any break if we're inside one
  let nextStart = currentTime;
  for (const brk of shift.breaks) {
    if (nextStart >= brk.start && nextStart < brk.end) {
      nextStart = brk.end;
      break;
    }
  }
  
  return nextStart;
}

export function getJobDurationMinutes(job: { customDurationMinutes?: number; estimatedEFinks?: number }): number {
  if (job.customDurationMinutes && job.customDurationMinutes > 0) {
    return job.customDurationMinutes;
  }
  const efinks = job.estimatedEFinks || 0;
  return Math.max(15, Math.round(efinks * MINUTES_PER_EFINK));
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
