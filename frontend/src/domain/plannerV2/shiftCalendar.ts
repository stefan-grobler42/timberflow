/**
 * Working hours and shift management for the plannerV2 module.
 * BREAK-AWARE: Jobs cannot start or end within breaks - breaks are non-working hours.
 */

import type { Break, ShiftConfig, EndTimeResult } from './types';
import {
  WORKING_START,
  WORKING_END,
  OVERTIME_END,
  STANDARD_BREAKS,
  OVERTIME_BREAKS
} from './constants';

/**
 * Gets the shift configuration for a work day.
 * Breaks are used in scheduling calculations - jobs skip over breaks.
 */
export function getShiftConfig(
  overtimeEnabled: boolean = false,
  customCloseTime?: number,
  earlyOtEnabled: boolean = false,
  earlyOtStartTime?: number
): ShiftConfig {
  const startTime = earlyOtEnabled && earlyOtStartTime !== undefined
    ? earlyOtStartTime
    : WORKING_START;
  
  const endTime = overtimeEnabled
    ? (customCloseTime ?? OVERTIME_END)
    : WORKING_END;
    
  const breaks = overtimeEnabled ? [...OVERTIME_BREAKS] : [...STANDARD_BREAKS];
  const applicableBreaks = breaks.filter(b => b.start >= startTime && b.end <= endTime);
  
  return {
    startTime,
    endTime,
    breaks: applicableBreaks
  };
}

/**
 * Gets all breaks that fall within a time range.
 */
export function getBreaksInRange(
  startTime: number,
  endTime: number,
  shift: ShiftConfig
): Break[] {
  if (startTime >= endTime) {
    return [];
  }
  
  return shift.breaks.filter(brk => {
    const breakOverlapsStart = brk.start < endTime;
    const breakOverlapsEnd = brk.end > startTime;
    return breakOverlapsStart && breakOverlapsEnd;
  });
}

/**
 * Calculates how much break time is added when working from startTime for duration minutes.
 * Jobs that span breaks must add the full break duration.
 */
export function calculateBreakExpansion(
  startTime: number,
  duration: number,
  shift: ShiftConfig
): number {
  if (duration <= 0) return 0;
  
  let breakMinutes = 0;
  let currentTime = startTime;
  let workRemaining = duration;
  
  // Sort breaks by start time
  const sortedBreaks = [...shift.breaks].sort((a, b) => a.start - b.start);
  
  for (const brk of sortedBreaks) {
    if (workRemaining <= 0) break;
    
    // If we're before this break
    if (currentTime < brk.start) {
      const workBeforeBreak = brk.start - currentTime;
      
      if (workRemaining <= workBeforeBreak) {
        // Job ends before this break
        break;
      }
      
      // Work up to the break, then skip over it
      workRemaining -= workBeforeBreak;
      breakMinutes += brk.duration;
      currentTime = brk.end;
    } else if (currentTime >= brk.start && currentTime < brk.end) {
      // We're inside a break - this shouldn't happen but handle it
      // Skip to end of break
      breakMinutes += (brk.end - currentTime);
      currentTime = brk.end;
    }
    // If we're past this break, continue to next
  }
  
  return breakMinutes;
}

/**
 * BREAK-AWARE: Calculates end time accounting for breaks.
 * If a job would end during a break, it extends past the break.
 * Returns the actual clock time when the job ends, including break time.
 */
export function calculateEndTime(
  startTime: number,
  workDuration: number,
  shift: ShiftConfig
): EndTimeResult {
  if (workDuration <= 0) {
    return { endTime: startTime, breakMinutes: 0 };
  }
  
  let currentTime = startTime;
  let workRemaining = workDuration;
  let totalBreakMinutes = 0;
  
  // Sort breaks by start time
  const sortedBreaks = [...shift.breaks].sort((a, b) => a.start - b.start);
  
  for (const brk of sortedBreaks) {
    if (workRemaining <= 0) break;
    
    // Skip breaks that are before our current time
    if (brk.end <= currentTime) continue;
    
    // If current time is within a break, jump to end of break
    if (currentTime >= brk.start && currentTime < brk.end) {
      totalBreakMinutes += (brk.end - currentTime);
      currentTime = brk.end;
      continue;
    }
    
    // Work until we hit the break or finish
    if (currentTime < brk.start) {
      const workBeforeBreak = brk.start - currentTime;
      
      if (workRemaining <= workBeforeBreak) {
        // Job ends before this break
        currentTime += workRemaining;
        workRemaining = 0;
        break;
      }
      
      // Work up to the break
      workRemaining -= workBeforeBreak;
      currentTime = brk.start;
      
      // Skip over the break (add full break duration)
      totalBreakMinutes += brk.duration;
      currentTime = brk.end;
    }
  }
  
  // Add any remaining work time
  if (workRemaining > 0) {
    currentTime += workRemaining;
  }
  
  // Cap at shift end
  const finalEndTime = Math.min(currentTime, shift.endTime);
  
  return {
    endTime: finalEndTime,
    breakMinutes: totalBreakMinutes
  };
}

/**
 * BREAK-AWARE: Available working minutes from startTime to shift end.
 * Subtracts any breaks that fall within the remaining time.
 */
export function getAvailableMinutes(startTime: number, shift: ShiftConfig): number {
  if (startTime >= shift.endTime) {
    return 0;
  }
  
  const effectiveStart = Math.max(startTime, shift.startTime);
  let availableMinutes = shift.endTime - effectiveStart;
  
  // Subtract breaks that fall within the available time
  for (const brk of shift.breaks) {
    if (brk.end > effectiveStart && brk.start < shift.endTime) {
      const breakStart = Math.max(brk.start, effectiveStart);
      const breakEnd = Math.min(brk.end, shift.endTime);
      availableMinutes -= (breakEnd - breakStart);
    }
  }
  
  return Math.max(0, availableMinutes);
}

/**
 * Gets the next working day, skipping weekends.
 */
export function getNextWorkingDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  
  date.setDate(date.getDate() + 1);
  
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a time is within the shift boundaries.
 */
export function isWithinShift(time: number, shift: ShiftConfig): boolean {
  return time >= shift.startTime && time < shift.endTime;
}

/**
 * Checks if a time falls within a break period.
 */
export function isInBreak(time: number, shift: ShiftConfig): Break | null {
  for (const brk of shift.breaks) {
    if (time >= brk.start && time < brk.end) {
      return brk;
    }
  }
  return null;
}

/**
 * BREAK-AWARE: Adjusts start time to skip over breaks.
 * If the proposed start time falls within a break, returns the end of that break.
 * Also checks if adding buffer would land in a break.
 */
export function getAdjustedStartTime(
  proposedStartTime: number,
  shift: ShiftConfig,
  bufferMinutes: number = 30
): number {
  let adjustedTime = proposedStartTime;
  
  // Check if we're in a break
  const breakAt = isInBreak(adjustedTime, shift);
  if (breakAt) {
    adjustedTime = breakAt.end;
  }
  
  // Check if adding buffer would land us in a break
  // (This is for the next job's start time)
  const timeWithBuffer = adjustedTime + bufferMinutes;
  const bufferBreak = isInBreak(timeWithBuffer, shift);
  if (bufferBreak) {
    // The buffer lands in a break, so next job starts after the break
    // But we return the current adjusted time, not the buffered time
  }
  
  return adjustedTime;
}

/**
 * Gets the total break duration within a shift.
 */
export function getTotalBreakMinutes(shift: ShiftConfig): number {
  return shift.breaks.reduce((total, brk) => total + brk.duration, 0);
}

/**
 * Gets the total workable minutes in a shift (excluding breaks).
 */
export function getTotalWorkableMinutes(shift: ShiftConfig): number {
  const shiftDuration = shift.endTime - shift.startTime;
  return shiftDuration - getTotalBreakMinutes(shift);
}

/**
 * Formats minutes from midnight to HH:MM time string.
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Parses a HH:MM time string to minutes from midnight.
 */
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}

/**
 * Gets the next valid start time after a given time, skipping any breaks.
 * Used to ensure jobs don't start within breaks.
 */
export function getNextValidStartTime(afterTime: number, shift: ShiftConfig): number {
  let startTime = afterTime;
  
  // Check if we're in a break and skip to end of break
  const breakAt = isInBreak(startTime, shift);
  if (breakAt) {
    startTime = breakAt.end;
  }
  
  return startTime;
}

/**
 * Gets shift configuration with schedule blocks treated as additional breaks.
 * Partial blocks (Breakdown, MaterialShortage, GeneralDelay) reduce available time.
 */
export function getShiftConfigWithBlocks(
  overtimeEnabled: boolean,
  customCloseTime: number | undefined,
  earlyOtEnabled: boolean,
  earlyOtStartTime: number | undefined,
  scheduleBlocks: Array<{ blockType: string; startTimeMinutes: number; endTimeMinutes: number }>
): ShiftConfig {
  const baseConfig = getShiftConfig(overtimeEnabled, customCloseTime, earlyOtEnabled, earlyOtStartTime);
  
  const blockBreaks: Break[] = scheduleBlocks.map(b => ({
    name: b.blockType,
    start: b.startTimeMinutes,
    end: b.endTimeMinutes,
    duration: b.endTimeMinutes - b.startTimeMinutes
  }));
  
  return {
    ...baseConfig,
    breaks: [...baseConfig.breaks, ...blockBreaks].sort((a, b) => a.start - b.start)
  };
}

/**
 * Gets the next working day, skipping weekends AND fully blocked dates.
 * Full-day blocks (PublicHoliday, Maintenance) cause the date to be skipped entirely.
 */
export function getNextWorkingDayWithBlocks(
  fromDateStr: string,
  fullDayBlockDates: string[]
): string {
  let nextDate = getNextWorkingDay(fromDateStr);
  
  let iterations = 0;
  while (fullDayBlockDates.includes(nextDate) && iterations < 30) {
    nextDate = getNextWorkingDay(nextDate);
    iterations++;
  }
  
  return nextDate;
}
