/**
 * Working hours and break management for the plannerV2 module.
 * Handles shift configuration, break calculations, and day navigation.
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
 * Includes appropriate breaks based on whether overtime is enabled.
 * 
 * @param overtimeEnabled - Whether overtime hours are active
 * @param customCloseTime - Optional custom end time in minutes from midnight
 * @returns Complete shift configuration
 * 
 * @example
 * getShiftConfig()                    // Standard 7am-5pm shift
 * getShiftConfig(true)                // Overtime 7am-7pm shift
 * getShiftConfig(true, 1110)          // Custom overtime ending at 6:30pm
 */
export function getShiftConfig(
  overtimeEnabled: boolean = false,
  customCloseTime?: number
): ShiftConfig {
  const endTime = overtimeEnabled
    ? (customCloseTime ?? OVERTIME_END)
    : WORKING_END;
    
  const breaks = overtimeEnabled ? [...OVERTIME_BREAKS] : [...STANDARD_BREAKS];
  
  const applicableBreaks = breaks.filter(b => b.end <= endTime);
  
  return {
    startTime: WORKING_START,
    endTime,
    breaks: applicableBreaks
  };
}

/**
 * Gets all breaks that fall within a time range.
 * 
 * @param startTime - Start of range in minutes from midnight
 * @param endTime - End of range in minutes from midnight
 * @param shift - Shift configuration containing breaks
 * @returns Array of breaks within the range
 * 
 * @example
 * const shift = getShiftConfig();
 * getBreaksInRange(480, 600, shift)  // Returns morning tea break (540-555)
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
 * Calculates the total break time that a job spans.
 * This is the expansion needed to account for breaks within the job's duration.
 * 
 * @param startTime - Job start time in minutes from midnight
 * @param duration - Work duration in minutes (excluding breaks)
 * @param shift - Shift configuration
 * @returns Total break minutes spanned by the job
 * 
 * @example
 * const shift = getShiftConfig();
 * // Job starting at 8:30am (510) for 60 minutes will span morning tea
 * calculateBreakExpansion(510, 60, shift)  // Returns 15 (morning tea)
 */
export function calculateBreakExpansion(
  startTime: number,
  duration: number,
  shift: ShiftConfig
): number {
  if (duration <= 0 || startTime >= shift.endTime) {
    return 0;
  }
  
  let currentTime = startTime;
  let remainingWork = duration;
  let breakExpansion = 0;
  
  const maxIterations = 100;
  let iterations = 0;
  
  while (remainingWork > 0 && iterations < maxIterations) {
    iterations++;
    
    if (currentTime >= shift.endTime) {
      break;
    }
    
    let hitBreak = false;
    for (const brk of shift.breaks) {
      if (currentTime >= brk.start && currentTime < brk.end) {
        const breakRemaining = brk.end - currentTime;
        breakExpansion += breakRemaining;
        currentTime = brk.end;
        hitBreak = true;
        break;
      }
    }
    
    if (hitBreak) continue;
    
    let nextBreakStart = shift.endTime;
    for (const brk of shift.breaks) {
      if (brk.start > currentTime && brk.start < nextBreakStart) {
        nextBreakStart = brk.start;
      }
    }
    
    const workableTime = nextBreakStart - currentTime;
    
    if (workableTime <= 0) {
      break;
    }
    
    const workDone = Math.min(workableTime, remainingWork);
    currentTime += workDone;
    remainingWork -= workDone;
    
    if (remainingWork > 0 && currentTime === nextBreakStart) {
      for (const brk of shift.breaks) {
        if (brk.start === nextBreakStart) {
          breakExpansion += brk.duration;
          currentTime = brk.end;
          break;
        }
      }
    }
  }
  
  return breakExpansion;
}

/**
 * Calculates the end time for a job given its start time and work duration.
 * Accounts for breaks that the job spans.
 * 
 * @param startTime - Job start time in minutes from midnight
 * @param workDuration - Work duration in minutes (excluding breaks)
 * @param shift - Shift configuration
 * @returns Object containing end time and break minutes
 * 
 * @example
 * const shift = getShiftConfig();
 * calculateEndTime(510, 60, shift)
 * // Returns { endTime: 585, breakMinutes: 15 } - accounts for morning tea
 */
export function calculateEndTime(
  startTime: number,
  workDuration: number,
  shift: ShiftConfig
): EndTimeResult {
  if (workDuration <= 0) {
    return { endTime: startTime, breakMinutes: 0 };
  }
  
  if (startTime >= shift.endTime) {
    return { endTime: shift.endTime, breakMinutes: 0 };
  }
  
  let currentTime = startTime;
  let remainingWork = workDuration;
  let breakMinutes = 0;
  
  const maxIterations = 100;
  let iterations = 0;
  
  while (remainingWork > 0 && iterations < maxIterations) {
    iterations++;
    
    if (currentTime >= shift.endTime) {
      break;
    }
    
    let hitBreak = false;
    for (const brk of shift.breaks) {
      if (currentTime >= brk.start && currentTime < brk.end) {
        const breakRemaining = brk.end - currentTime;
        breakMinutes += breakRemaining;
        currentTime = brk.end;
        hitBreak = true;
        break;
      }
    }
    
    if (hitBreak) continue;
    
    let nextBreakStart = shift.endTime;
    for (const brk of shift.breaks) {
      if (brk.start > currentTime && brk.start < nextBreakStart) {
        nextBreakStart = brk.start;
      }
    }
    
    const workableTime = nextBreakStart - currentTime;
    
    if (workableTime <= 0) {
      break;
    }
    
    const workDone = Math.min(workableTime, remainingWork);
    currentTime += workDone;
    remainingWork -= workDone;
    
    if (remainingWork > 0 && currentTime === nextBreakStart) {
      for (const brk of shift.breaks) {
        if (brk.start === nextBreakStart) {
          breakMinutes += brk.duration;
          currentTime = brk.end;
          break;
        }
      }
    }
  }
  
  return {
    endTime: Math.min(currentTime, shift.endTime),
    breakMinutes
  };
}

/**
 * Calculates the available workable minutes from a start time to end of shift.
 * Excludes break times within that range.
 * 
 * @param startTime - Start time in minutes from midnight
 * @param shift - Shift configuration
 * @returns Available work minutes remaining in the day
 * 
 * @example
 * const shift = getShiftConfig();
 * getAvailableMinutes(420, shift)  // Returns ~540 (full day minus breaks)
 * getAvailableMinutes(900, shift)  // Returns ~105 (2pm to 5pm minus afternoon tea)
 */
export function getAvailableMinutes(startTime: number, shift: ShiftConfig): number {
  if (startTime >= shift.endTime) {
    return 0;
  }
  
  const effectiveStart = Math.max(startTime, shift.startTime);
  let availableMinutes = shift.endTime - effectiveStart;
  
  for (const brk of shift.breaks) {
    if (brk.end <= effectiveStart || brk.start >= shift.endTime) {
      continue;
    }
    
    const overlapStart = Math.max(brk.start, effectiveStart);
    const overlapEnd = Math.min(brk.end, shift.endTime);
    
    if (overlapEnd > overlapStart) {
      availableMinutes -= (overlapEnd - overlapStart);
    }
  }
  
  return Math.max(0, availableMinutes);
}

/**
 * Gets the next working day, skipping weekends (Saturday and Sunday).
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Next working day in YYYY-MM-DD format
 * 
 * @example
 * getNextWorkingDay('2025-01-03')  // Friday -> '2025-01-06' (Monday)
 * getNextWorkingDay('2025-01-06')  // Monday -> '2025-01-07' (Tuesday)
 * getNextWorkingDay('2025-01-04')  // Saturday -> '2025-01-06' (Monday)
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
 * Does not check for breaks - only shift start/end.
 * 
 * @param time - Time in minutes from midnight
 * @param shift - Shift configuration
 * @returns True if time is within shift hours
 * 
 * @example
 * const shift = getShiftConfig();
 * isWithinShift(420, shift)   // true (7:00 AM)
 * isWithinShift(1019, shift)  // true (4:59 PM)
 * isWithinShift(1020, shift)  // false (5:00 PM - at end)
 * isWithinShift(360, shift)   // false (6:00 AM - before shift)
 */
export function isWithinShift(time: number, shift: ShiftConfig): boolean {
  return time >= shift.startTime && time < shift.endTime;
}

/**
 * Checks if a time falls within a break period.
 * 
 * @param time - Time in minutes from midnight
 * @param shift - Shift configuration
 * @returns The break object if time is in a break, null otherwise
 * 
 * @example
 * const shift = getShiftConfig();
 * isInBreak(545, shift)  // Returns morning tea break object
 * isInBreak(600, shift)  // Returns null (10 AM, not in break)
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
 * Gets the total break duration within a shift.
 * 
 * @param shift - Shift configuration
 * @returns Total break minutes
 */
export function getTotalBreakMinutes(shift: ShiftConfig): number {
  return shift.breaks.reduce((total, brk) => total + brk.duration, 0);
}

/**
 * Gets the total workable minutes in a shift (excluding breaks).
 * 
 * @param shift - Shift configuration
 * @returns Total workable minutes
 */
export function getTotalWorkableMinutes(shift: ShiftConfig): number {
  const shiftDuration = shift.endTime - shift.startTime;
  return shiftDuration - getTotalBreakMinutes(shift);
}

/**
 * Formats minutes from midnight to HH:MM time string.
 * 
 * @param minutes - Minutes from midnight
 * @returns Formatted time string
 * 
 * @example
 * formatMinutesToTime(420)   // '07:00'
 * formatMinutesToTime(1020)  // '17:00'
 * formatMinutesToTime(855)   // '14:15'
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Parses a HH:MM time string to minutes from midnight.
 * 
 * @param time - Time string in HH:MM format
 * @returns Minutes from midnight
 * 
 * @example
 * parseTimeToMinutes('07:00')  // 420
 * parseTimeToMinutes('17:00')  // 1020
 * parseTimeToMinutes('14:15')  // 855
 */
export function parseTimeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}
