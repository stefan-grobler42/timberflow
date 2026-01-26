/**
 * Adapter that converts SystemSettings from the database into scheduler-compatible configuration.
 * This allows the Production Planner to use dynamic settings instead of hardcoded constants.
 */

import type { SystemSettings } from '../../services/systemSettingsService';
import type { Break } from './types';

/**
 * Scheduler configuration derived from SystemSettings.
 * All time values are in minutes from midnight unless otherwise specified.
 */
export interface SchedulerConfig {
  bufferMinutes: number;
  minJobDuration: number;
  durationRoundingIncrement: number;
  pixelsPerMinute: number;
  
  weekdayShift: {
    startTime: number;
    endTime: number;
    fridayEndTime: number;
  };
  
  weekdayOvertimeDefaults: {
    enabled: boolean;
    lateEndTime: number;
    earlyStartEnabled: boolean;
    earlyStartTime: number;
  };
  
  weekendOvertimeDefaults: {
    enabled: boolean;
    startTime: number;
    endTime: number;
  };
  
  weekdayBreaks: Break[];
  weekdayOvertimeBreaks: Break[];
  weekendBreaks: Break[];
}

/**
 * Default configuration values matching the original hardcoded constants.
 * Used as fallbacks when settings are not configured.
 */
export const DEFAULT_CONFIG: SchedulerConfig = {
  bufferMinutes: 15,
  minJobDuration: 10,
  durationRoundingIncrement: 15,
  pixelsPerMinute: 1.5,
  
  weekdayShift: {
    startTime: 420,     // 07:00
    endTime: 1020,      // 17:00
    fridayEndTime: 960  // 16:00
  },
  
  weekdayOvertimeDefaults: {
    enabled: false,
    lateEndTime: 1260,  // 21:00
    earlyStartEnabled: false,
    earlyStartTime: 360 // 06:00
  },
  
  weekendOvertimeDefaults: {
    enabled: false,
    startTime: 420,     // 07:00
    endTime: 900        // 15:00
  },
  
  weekdayBreaks: [
    { name: 'Morning Tea', start: 540, end: 570, duration: 30 },   // 09:00-09:30
    { name: 'Lunch', start: 720, end: 765, duration: 45 }          // 12:00-12:45
  ],
  
  weekdayOvertimeBreaks: [
    { name: 'Morning Tea', start: 540, end: 570, duration: 30 },   // 09:00-09:30
    { name: 'Lunch', start: 720, end: 765, duration: 45 },         // 12:00-12:45
    { name: 'Dinner', start: 1080, end: 1110, duration: 30 }       // 18:00-18:30
  ],
  
  weekendBreaks: [
    { name: 'Morning Tea', start: 540, end: 570, duration: 30 },   // 09:00-09:30
    { name: 'Lunch', start: 720, end: 765, duration: 45 }          // 12:00-12:45 (if end > 16:00)
  ]
};

/**
 * Parses a time string (HH:MM) to minutes from midnight.
 */
function parseTime(timeStr: string | undefined): number | null {
  if (!timeStr || !timeStr.includes(':')) return null;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return null;
  return parts[0] * 60 + parts[1];
}

/**
 * Converts a break time range from settings to a Break object.
 */
function parseBreakRange(
  name: string,
  range: { start?: string; end?: string } | undefined
): Break | null {
  if (!range?.start || !range?.end) return null;
  const start = parseTime(range.start);
  const end = parseTime(range.end);
  if (start === null || end === null || end <= start) return null;
  return { name, start, end, duration: end - start };
}

/**
 * Maps SystemSettings from the database to a SchedulerConfig.
 * Uses default values as fallbacks for any missing settings.
 */
export function mapSystemSettingsToSchedulerConfig(settings: SystemSettings | null): SchedulerConfig {
  if (!settings) return DEFAULT_CONFIG;
  
  const config: SchedulerConfig = { ...DEFAULT_CONFIG };
  
  // Factory staff working hours
  if (settings.workingHours?.factoryStaff) {
    const factory = settings.workingHours.factoryStaff;
    
    // Parse weekday hours (use Monday as reference for standard weekdays, with fallback to any defined day)
    const weekdayReference = factory.monday || factory.tuesday || factory.wednesday || factory.thursday;
    if (weekdayReference && weekdayReference.includes('-')) {
      const [start, end] = weekdayReference.split('-');
      const startTime = parseTime(start);
      const endTime = parseTime(end);
      if (startTime !== null) config.weekdayShift.startTime = startTime;
      if (endTime !== null) config.weekdayShift.endTime = endTime;
    }
    
    // Parse Friday hours (may have different start and/or end time)
    if (factory.friday && factory.friday.includes('-')) {
      const [, end] = factory.friday.split('-');
      const endTime = parseTime(end);
      // Friday end time is usually earlier (16:00 instead of 17:00)
      if (endTime !== null) config.weekdayShift.fridayEndTime = endTime;
    }
  }
  
  // Production scheduling general settings
  if (settings.productionScheduling?.general) {
    const general = settings.productionScheduling.general;
    if (general.bufferMinutes !== undefined && general.bufferMinutes > 0) {
      config.bufferMinutes = general.bufferMinutes;
    }
    if (general.minJobDuration !== undefined && general.minJobDuration > 0) {
      config.minJobDuration = general.minJobDuration;
    }
    if (general.durationRoundingIncrement !== undefined && general.durationRoundingIncrement > 0) {
      config.durationRoundingIncrement = general.durationRoundingIncrement;
    }
  }
  
  // UI display settings
  if (settings.productionScheduling?.uiDisplay?.pixelsPerMinute) {
    config.pixelsPerMinute = settings.productionScheduling.uiDisplay.pixelsPerMinute;
  }
  
  // Weekday overtime defaults
  if (settings.overtimeDefaults) {
    const ot = settings.overtimeDefaults;
    config.weekdayOvertimeDefaults = {
      enabled: ot.defaultOvertimeEnabled ?? false,
      lateEndTime: parseTime(ot.defaultLateOtEndTime) ?? DEFAULT_CONFIG.weekdayOvertimeDefaults.lateEndTime,
      earlyStartEnabled: ot.allowEarlyStartOt ?? false,
      earlyStartTime: parseTime(ot.defaultEarlyStartTime) ?? DEFAULT_CONFIG.weekdayOvertimeDefaults.earlyStartTime
    };
  }
  
  // Weekend overtime defaults
  if (settings.overtimeDefaultsWeekend) {
    const wknd = settings.overtimeDefaultsWeekend;
    config.weekendOvertimeDefaults = {
      enabled: wknd.defaultWeekendWorkEnabled ?? false,
      startTime: parseTime(wknd.defaultStartTime) ?? DEFAULT_CONFIG.weekendOvertimeDefaults.startTime,
      endTime: parseTime(wknd.defaultEndTime) ?? DEFAULT_CONFIG.weekendOvertimeDefaults.endTime
    };
  }
  
  // Weekday breaks
  if (settings.breakTimes) {
    const breaks: Break[] = [];
    
    const morningTea = parseBreakRange('Morning Tea', settings.breakTimes.teaMorning);
    if (morningTea) breaks.push(morningTea);
    
    const lunch = parseBreakRange('Lunch', settings.breakTimes.lunch);
    if (lunch) breaks.push(lunch);
    
    const afternoonTea = parseBreakRange('Afternoon Tea', settings.breakTimes.teaAfternoon);
    if (afternoonTea) breaks.push(afternoonTea);
    
    if (breaks.length > 0) {
      config.weekdayBreaks = breaks.sort((a, b) => a.start - b.start);
    }
    
    // Overtime breaks include dinner
    const dinnerBreak = parseBreakRange('Dinner', settings.breakTimes.dinnerOvertime);
    if (dinnerBreak) {
      config.weekdayOvertimeBreaks = [...config.weekdayBreaks, dinnerBreak].sort((a, b) => a.start - b.start);
    } else {
      config.weekdayOvertimeBreaks = [...config.weekdayBreaks];
    }
  }
  
  // Weekend breaks
  if (settings.breakTimesWeekend) {
    const breaks: Break[] = [];
    
    const morningTea = parseBreakRange('Morning Tea', settings.breakTimesWeekend.teaMorning);
    if (morningTea) breaks.push(morningTea);
    
    const lunch = parseBreakRange('Lunch', settings.breakTimesWeekend.lunch);
    if (lunch) breaks.push(lunch);
    
    const afternoonTea = parseBreakRange('Afternoon Tea', settings.breakTimesWeekend.teaAfternoon);
    if (afternoonTea) breaks.push(afternoonTea);
    
    config.weekendBreaks = breaks.sort((a, b) => a.start - b.start);
  }
  
  return config;
}

/**
 * Gets the applicable breaks for a given shift configuration.
 */
export function getBreaksForShift(
  config: SchedulerConfig,
  isWeekend: boolean,
  isOvertime: boolean,
  shiftStart: number,
  shiftEnd: number
): Break[] {
  let breaks: Break[];
  
  if (isWeekend) {
    breaks = [...config.weekendBreaks];
  } else if (isOvertime) {
    breaks = [...config.weekdayOvertimeBreaks];
  } else {
    breaks = [...config.weekdayBreaks];
  }
  
  // Filter to only breaks that fall within the shift
  return breaks.filter(b => b.start >= shiftStart && b.end <= shiftEnd);
}

/**
 * Gets the default end time for a shift based on config.
 */
export function getDefaultEndTime(
  config: SchedulerConfig,
  isFriday: boolean,
  isWeekend: boolean,
  isOvertime: boolean
): number {
  if (isWeekend) {
    return isOvertime ? config.weekendOvertimeDefaults.endTime : config.weekdayShift.startTime;
  }
  
  if (isOvertime) {
    return config.weekdayOvertimeDefaults.lateEndTime;
  }
  
  return isFriday ? config.weekdayShift.fridayEndTime : config.weekdayShift.endTime;
}

/**
 * Gets the default start time for a shift based on config.
 */
export function getDefaultStartTime(
  config: SchedulerConfig,
  isWeekend: boolean,
  isEarlyOvertime: boolean
): number {
  if (isWeekend) {
    return config.weekendOvertimeDefaults.startTime;
  }
  
  if (isEarlyOvertime) {
    return config.weekdayOvertimeDefaults.earlyStartTime;
  }
  
  return config.weekdayShift.startTime;
}
