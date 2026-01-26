/**
 * Working hours and shift management for the plannerV2 module.
 * BREAK-AWARE: Jobs cannot start or end within breaks - breaks are non-working hours.
 * TYPE-A-BLOCK-AWARE: Type A blocks (PublicHoliday, Maintenance, GeneralDelay) are treated as non-working intervals.
 */

import type { Break, ShiftConfig, EndTimeResult } from './types';
import { FRIDAY, SATURDAY, SUNDAY } from './constants';
import { type SchedulerConfig, DEFAULT_CONFIG } from './schedulerSettings';

/**
 * Type A schedule block types - these create non-working intervals that jobs skip over.
 * Jobs cannot occupy time within Type A blocks, similar to breaks.
 * - PublicHoliday: Official holidays
 * - Maintenance: Scheduled maintenance windows  
 * - GeneralDelay: General delays that prevent work
 */
export const TYPE_A_BLOCK_TYPES = ['PublicHoliday', 'Maintenance', 'GeneralDelay'] as const;
export type TypeABlockType = typeof TYPE_A_BLOCK_TYPES[number];

/**
 * Type B schedule block types - these affect jobs differently (stretch or attach to jobs).
 * - Breakdown: Stretches job duration (equipment failure during work)
 * - MaterialShortage: Attached to specific jobs
 */
export const TYPE_B_BLOCK_TYPES = ['Breakdown', 'MaterialShortage'] as const;
export type TypeBBlockType = typeof TYPE_B_BLOCK_TYPES[number];

/**
 * Checks if a block type is Type A (non-working interval).
 */
export function isTypeABlock(blockType: string): boolean {
  return TYPE_A_BLOCK_TYPES.includes(blockType as TypeABlockType);
}

/**
 * Checks if a block type is Type B (job-attached or job-stretching).
 */
export function isTypeBBlock(blockType: string): boolean {
  return TYPE_B_BLOCK_TYPES.includes(blockType as TypeBBlockType);
}

/**
 * Gets the shift configuration for a work day.
 * Breaks are used in scheduling calculations - jobs skip over breaks.
 * @param overtimeEnabled - Whether overtime is enabled
 * @param customCloseTime - Custom close time override (in minutes from midnight)
 * @param earlyOtEnabled - Whether early overtime start is enabled
 * @param earlyOtStartTime - Early overtime start time (in minutes from midnight)
 * @param config - Optional SchedulerConfig for dynamic configuration (defaults to DEFAULT_CONFIG)
 */
export function getShiftConfig(
  overtimeEnabled: boolean = false,
  customCloseTime?: number,
  earlyOtEnabled: boolean = false,
  earlyOtStartTime?: number,
  config: SchedulerConfig = DEFAULT_CONFIG
): ShiftConfig {
  const defaultStartTime = config.weekdayShift.startTime;
  const defaultEndTime = config.weekdayShift.endTime;
  const overtimeEndTime = config.weekdayOvertimeDefaults.lateEndTime;
  const standardBreaks = config.weekdayBreaks;
  const overtimeBreaks = config.weekdayOvertimeBreaks;
  
  const startTime = earlyOtEnabled && earlyOtStartTime !== undefined
    ? earlyOtStartTime
    : defaultStartTime;
  
  const endTime = overtimeEnabled
    ? (customCloseTime ?? overtimeEndTime)
    : defaultEndTime;
    
  const breaks = overtimeEnabled ? [...overtimeBreaks] : [...standardBreaks];
  const applicableBreaks = breaks.filter(b => b.start >= startTime && b.end <= endTime);
  
  return {
    startTime,
    endTime,
    breaks: applicableBreaks
  };
}

/**
 * Helper to get day of week from date string.
 */
export function getDayOfWeek(dateStr: string): number {
  const date = new Date(dateStr + 'T12:00:00');
  return date.getDay();
}

/**
 * Checks if a date is a weekend (Saturday or Sunday).
 */
export function isWeekend(dateStr: string): boolean {
  const dayOfWeek = getDayOfWeek(dateStr);
  return dayOfWeek === SATURDAY || dayOfWeek === SUNDAY;
}

/**
 * Checks if a date is a Friday.
 */
export function isFriday(dateStr: string): boolean {
  return getDayOfWeek(dateStr) === FRIDAY;
}

/**
 * Gets the shift configuration for a specific date, accounting for:
 * - Friday: 07:00-16:00 (instead of 17:00)
 * - Weekend: Non-working unless overtime is enabled with custom start/end times
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param overtimeEnabled - Whether overtime is enabled
 * @param customCloseTime - Custom close time override (in minutes from midnight)
 * @param earlyOtEnabled - Whether early overtime start is enabled
 * @param earlyOtStartTime - Early overtime start time (in minutes from midnight)
 * @param config - Optional SchedulerConfig for dynamic configuration (defaults to DEFAULT_CONFIG)
 */
export function getShiftConfigForDate(
  dateStr: string,
  overtimeEnabled: boolean = false,
  customCloseTime?: number,
  earlyOtEnabled: boolean = false,
  earlyOtStartTime?: number,
  config: SchedulerConfig = DEFAULT_CONFIG
): ShiftConfig {
  const dayOfWeek = getDayOfWeek(dateStr);
  
  const defaultStartTime = config.weekdayShift.startTime;
  const fridayEndTime = config.weekdayShift.fridayEndTime;
  const overtimeEndTime = config.weekdayOvertimeDefaults.lateEndTime;
  const standardBreaks = config.weekdayBreaks;
  const overtimeBreaks = config.weekdayOvertimeBreaks;
  const weekendBreaks = config.weekendBreaks;
  const weekendDefaults = config.weekendOvertimeDefaults;
  
  // Weekend handling
  if (dayOfWeek === SATURDAY || dayOfWeek === SUNDAY) {
    if (!overtimeEnabled) {
      // Non-working day - return zero-capacity shift
      return {
        startTime: defaultStartTime,
        endTime: defaultStartTime, // Same as start = zero capacity
        breaks: []
      };
    }
    // Weekend overtime - use custom start/end times or weekend defaults
    const startTime = earlyOtStartTime ?? weekendDefaults.startTime;
    const endTime = customCloseTime ?? weekendDefaults.endTime;
    // Weekend can have its own breaks from config
    // Special rule: Lunch only taken if working PAST 15:00 (end time > 900)
    // Morning tea is always taken if within working hours
    const applicableBreaks = weekendBreaks.filter(b => {
      // Must be within working hours
      if (b.start < startTime || b.end > endTime) return false;
      // Lunch only if working past 15:00
      if (b.name.toLowerCase().includes('lunch') && endTime <= 900) return false;
      return true;
    });
    return {
      startTime,
      endTime,
      breaks: applicableBreaks
    };
  }
  
  // Friday handling: default end time is from config
  if (dayOfWeek === FRIDAY) {
    const startTime = earlyOtEnabled && earlyOtStartTime !== undefined
      ? earlyOtStartTime
      : defaultStartTime;
    
    const endTime = overtimeEnabled
      ? (customCloseTime ?? overtimeEndTime)
      : fridayEndTime;
      
    const breaks = overtimeEnabled ? [...overtimeBreaks] : [...standardBreaks];
    const applicableBreaks = breaks.filter(b => b.start >= startTime && b.end <= endTime);
    
    return {
      startTime,
      endTime,
      breaks: applicableBreaks
    };
  }
  
  // Monday-Thursday: standard shift
  return getShiftConfig(overtimeEnabled, customCloseTime, earlyOtEnabled, earlyOtStartTime, config);
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
 * Gets the next calendar day.
 */
export function getNextDay(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + 1);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Gets the next working day, skipping weekends.
 * Use getNextWorkingDayWithOvertime if you need to consider weekend work.
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
 * Overtime settings lookup by date then team.
 */
export interface OvertimeSettingsMap {
  [dateStr: string]: {
    [teamId: string]: {
      enabled?: boolean;
      closeTime?: number;
      earlyEnabled?: boolean;
      earlyStartTime?: number;
    } | undefined;
  } | undefined;
}

/**
 * Gets the next working day, considering weekend overtime settings.
 * If a weekend day has overtime enabled for the team, it's considered a working day.
 */
export function getNextWorkingDayWithOvertime(
  dateStr: string,
  teamId: string,
  overtimeMap: OvertimeSettingsMap
): string {
  let currentDate = getNextDay(dateStr);
  let iterations = 0;
  const maxIterations = 14; // Safety limit - max 2 weeks of searching
  
  while (iterations < maxIterations) {
    const dayOfWeek = getDayOfWeek(currentDate);
    
    // If it's a weekday, it's a working day
    if (dayOfWeek !== SATURDAY && dayOfWeek !== SUNDAY) {
      return currentDate;
    }
    
    // If it's a weekend, check if overtime is enabled for this team
    const dayOT = overtimeMap[currentDate]?.[teamId];
    if (dayOT?.enabled) {
      return currentDate;
    }
    
    // Skip to next day
    currentDate = getNextDay(currentDate);
    iterations++;
  }
  
  // Fallback to simple next working day if something goes wrong
  return getNextWorkingDay(dateStr);
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
 * BREAK-PROXIMITY AWARE: Calculates the start time for the next job after a previous job ends.
 * 
 * Rules (hardcoded as per user requirements):
 * 1. If the previous job ends within BREAK_PROXIMITY_THRESHOLD (10min) of a break start,
 *    the next job starts after the break ends.
 * 2. Otherwise, the next job starts after the buffer.
 * 3. If the calculated start time lands in a break, skip to after the break.
 * 
 * @param previousJobEndTime - The clock time (minutes from midnight) when the previous job ended
 * @param bufferMinutes - The buffer between jobs from config
 * @param shift - The shift configuration with breaks
 * @returns The start time for the next job
 */
export function getNextJobStartTime(
  previousJobEndTime: number,
  bufferMinutes: number,
  shift: ShiftConfig
): number {
  const BREAK_PROXIMITY_THRESHOLD = 10; // Hardcoded: if job ends within 10min of break, skip to after break
  
  // Check if ending within proximity of any break start
  for (const brk of shift.breaks) {
    const timeUntilBreak = brk.start - previousJobEndTime;
    
    // If job ends within threshold before a break starts
    if (timeUntilBreak >= 0 && timeUntilBreak <= BREAK_PROXIMITY_THRESHOLD) {
      // Next job starts after the break
      return brk.end;
    }
  }
  
  // No break proximity - apply standard buffer
  let nextStart = previousJobEndTime + bufferMinutes;
  
  // If next start lands in a break, skip to after the break
  const breakAt = isInBreak(nextStart, shift);
  if (breakAt) {
    nextStart = breakAt.end;
  }
  
  return nextStart;
}

/**
 * Gets shift configuration with Type A schedule blocks treated as additional breaks (non-working intervals).
 * 
 * TYPE A BLOCKS (PublicHoliday, Maintenance, GeneralDelay):
 * - Create non-working intervals that jobs skip over
 * - Jobs cannot occupy time within these blocks
 * - Similar to breaks, jobs are split around them
 * 
 * TYPE B BLOCKS (Breakdown, MaterialShortage):
 * - NOT included here - handled separately
 * - Breakdowns STRETCH jobs rather than reducing capacity
 * - MaterialShortage is attached to specific jobs
 * 
 * @param overtimeEnabled - Whether overtime is enabled
 * @param customCloseTime - Custom close time override (in minutes from midnight)
 * @param earlyOtEnabled - Whether early overtime start is enabled
 * @param earlyOtStartTime - Early overtime start time (in minutes from midnight)
 * @param scheduleBlocks - Array of schedule blocks to check for Type A blocks
 * @param config - Optional SchedulerConfig for dynamic configuration (defaults to DEFAULT_CONFIG)
 */
export function getShiftConfigWithBlocks(
  overtimeEnabled: boolean,
  customCloseTime: number | undefined,
  earlyOtEnabled: boolean,
  earlyOtStartTime: number | undefined,
  scheduleBlocks: Array<{ blockType: string; startTimeMinutes: number; endTimeMinutes: number }>,
  config: SchedulerConfig = DEFAULT_CONFIG
): ShiftConfig {
  const baseConfig = getShiftConfig(overtimeEnabled, customCloseTime, earlyOtEnabled, earlyOtStartTime, config);
  
  // Only Type A blocks (PublicHoliday, Maintenance, GeneralDelay) reduce capacity
  // These are treated as non-working intervals that jobs skip over
  const typeABlocks = scheduleBlocks.filter(b => isTypeABlock(b.blockType));
  
  const blockBreaks: Break[] = typeABlocks.map(b => ({
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
 * Gets shift configuration for a specific date with Type A schedule blocks.
 * Combines date-aware shift handling (Friday/weekend) with Type A block awareness.
 * 
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param overtimeEnabled - Whether overtime is enabled
 * @param customCloseTime - Custom close time override (in minutes from midnight)
 * @param earlyOtEnabled - Whether early overtime start is enabled
 * @param earlyOtStartTime - Early overtime start time (in minutes from midnight)
 * @param scheduleBlocks - Array of schedule blocks applicable to this day
 * @param config - Optional SchedulerConfig for dynamic configuration (defaults to DEFAULT_CONFIG)
 */
export function getShiftConfigForDateWithBlocks(
  dateStr: string,
  overtimeEnabled: boolean,
  customCloseTime: number | undefined,
  earlyOtEnabled: boolean,
  earlyOtStartTime: number | undefined,
  scheduleBlocks: Array<{ blockType: string; startTimeMinutes: number; endTimeMinutes: number }>,
  config: SchedulerConfig = DEFAULT_CONFIG
): ShiftConfig {
  const baseConfig = getShiftConfigForDate(dateStr, overtimeEnabled, customCloseTime, earlyOtEnabled, earlyOtStartTime, config);
  
  // Only Type A blocks (PublicHoliday, Maintenance, GeneralDelay) reduce capacity
  const typeABlocks = scheduleBlocks.filter(b => isTypeABlock(b.blockType));
  
  // Filter blocks to only those within the working hours
  const applicableBlocks = typeABlocks.filter(b => 
    b.startTimeMinutes < baseConfig.endTime && b.endTimeMinutes > baseConfig.startTime
  );
  
  const blockBreaks: Break[] = applicableBlocks.map(b => ({
    name: b.blockType,
    start: Math.max(b.startTimeMinutes, baseConfig.startTime),
    end: Math.min(b.endTimeMinutes, baseConfig.endTime),
    duration: Math.min(b.endTimeMinutes, baseConfig.endTime) - Math.max(b.startTimeMinutes, baseConfig.startTime)
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
