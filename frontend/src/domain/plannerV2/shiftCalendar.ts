/**
 * Working hours and shift management for the plannerV2 module.
 * SIMPLIFIED: No break logic in scheduling calculations.
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
 * Breaks are still stored for visual display but NOT used in scheduling calculations.
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
 * Gets all breaks that fall within a time range (for visual display only).
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
 * SIMPLIFIED: No break expansion - just returns 0.
 * Kept for API compatibility.
 */
export function calculateBreakExpansion(
  startTime: number,
  duration: number,
  shift: ShiftConfig
): number {
  return 0;
}

/**
 * SIMPLIFIED: End time = start time + work duration (no break expansion).
 */
export function calculateEndTime(
  startTime: number,
  workDuration: number,
  shift: ShiftConfig
): EndTimeResult {
  if (workDuration <= 0) {
    return { endTime: startTime, breakMinutes: 0 };
  }
  
  const endTime = startTime + workDuration;
  
  return {
    endTime: Math.min(endTime, shift.endTime),
    breakMinutes: 0
  };
}

/**
 * SIMPLIFIED: Available minutes = time from start to shift end (no break subtraction).
 */
export function getAvailableMinutes(startTime: number, shift: ShiftConfig): number {
  if (startTime >= shift.endTime) {
    return 0;
  }
  
  const effectiveStart = Math.max(startTime, shift.startTime);
  return Math.max(0, shift.endTime - effectiveStart);
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
 * Checks if a time falls within a break period (for visual display).
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
 * SIMPLIFIED: No "near break" adjustment - just returns the proposed start time.
 * Kept for API compatibility.
 */
export function getAdjustedStartTime(
  proposedStartTime: number,
  shift: ShiftConfig,
  bufferMinutes: number = 30
): number {
  return proposedStartTime;
}

/**
 * Gets the total break duration within a shift (for display purposes).
 */
export function getTotalBreakMinutes(shift: ShiftConfig): number {
  return shift.breaks.reduce((total, brk) => total + brk.duration, 0);
}

/**
 * Gets the total workable minutes in a shift (for display purposes).
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
