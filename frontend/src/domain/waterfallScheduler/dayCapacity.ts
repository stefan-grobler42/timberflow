import type {
  DayCapacity,
  WorkingHours,
  BreakPeriod,
  ScheduleBlockInfo
} from './types';
import {
  DEFAULT_WORKING_HOURS,
  DEFAULT_BREAKS,
  OVERTIME_DINNER_BREAK,
  EARLY_OT_DEFAULT_START,
  LATE_OT_DEFAULT_END
} from './types';

export function isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function getWorkingHours(
  earlyOtEnabled: boolean,
  earlyOtStartMinutes?: number,
  lateOtEnabled: boolean = false,
  lateOtEndMinutes?: number
): WorkingHours {
  let startMinutes = DEFAULT_WORKING_HOURS.startMinutes;
  let endMinutes = DEFAULT_WORKING_HOURS.endMinutes;

  if (earlyOtEnabled) {
    startMinutes = earlyOtStartMinutes ?? EARLY_OT_DEFAULT_START;
  }

  if (lateOtEnabled) {
    endMinutes = lateOtEndMinutes ?? LATE_OT_DEFAULT_END;
  }

  return { startMinutes, endMinutes };
}

export function getBreaks(
  workingHours: WorkingHours,
  lateOtEnabled: boolean
): BreakPeriod[] {
  const breaks: BreakPeriod[] = [];

  for (const brk of DEFAULT_BREAKS) {
    if (brk.startMinutes >= workingHours.startMinutes && brk.endMinutes <= workingHours.endMinutes) {
      breaks.push(brk);
    }
  }

  if (lateOtEnabled && workingHours.endMinutes > OVERTIME_DINNER_BREAK.startMinutes) {
    breaks.push(OVERTIME_DINNER_BREAK);
  }

  return breaks;
}

export function calculateAvailableMinutes(
  workingHours: WorkingHours,
  breaks: BreakPeriod[],
  blocks: ScheduleBlockInfo[]
): number {
  let totalMinutes = workingHours.endMinutes - workingHours.startMinutes;

  for (const brk of breaks) {
    if (brk.startMinutes >= workingHours.startMinutes && brk.endMinutes <= workingHours.endMinutes) {
      totalMinutes -= (brk.endMinutes - brk.startMinutes);
    }
  }

  for (const block of blocks) {
    if (block.isFullDay) {
      return 0;
    }
    const blockStart = Math.max(block.startMinutes, workingHours.startMinutes);
    const blockEnd = Math.min(block.endMinutes, workingHours.endMinutes);
    if (blockEnd > blockStart) {
      totalMinutes -= (blockEnd - blockStart);
    }
  }

  return Math.max(0, totalMinutes);
}

export function getDayCapacity(
  dateStr: string,
  earlyOtEnabled: boolean = false,
  earlyOtStartMinutes?: number,
  lateOtEnabled: boolean = false,
  lateOtEndMinutes?: number,
  blocks: ScheduleBlockInfo[] = []
): DayCapacity {
  const weekend = isWeekend(dateStr);

  const hasOtOnWeekend = weekend && (earlyOtEnabled || lateOtEnabled);
  const isWorkingDay = !weekend || hasOtOnWeekend;

  if (!isWorkingDay) {
    return {
      dateStr,
      isWorkingDay: false,
      earlyOtEnabled: false,
      lateOtEnabled: false,
      blocks: [],
      workingHours: { startMinutes: 0, endMinutes: 0 },
      breaks: [],
      availableMinutes: 0
    };
  }

  const workingHours = getWorkingHours(
    earlyOtEnabled,
    earlyOtStartMinutes,
    lateOtEnabled,
    lateOtEndMinutes
  );

  const dayBreaks = getBreaks(workingHours, lateOtEnabled);
  const availableMinutes = calculateAvailableMinutes(workingHours, dayBreaks, blocks);

  return {
    dateStr,
    isWorkingDay: true,
    earlyOtEnabled,
    earlyOtStartMinutes,
    lateOtEnabled,
    lateOtEndMinutes,
    blocks,
    workingHours,
    breaks: dayBreaks,
    availableMinutes
  };
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

export function getNextWorkingDay(
  currentDateStr: string,
  getDaySettings: (dateStr: string) => { earlyOtEnabled: boolean; lateOtEnabled: boolean }
): string {
  let nextDate = addDays(currentDateStr, 1);
  let attempts = 0;

  while (attempts < 365) {
    const settings = getDaySettings(nextDate);
    const capacity = getDayCapacity(nextDate, settings.earlyOtEnabled, undefined, settings.lateOtEnabled);
    
    if (capacity.isWorkingDay && capacity.availableMinutes > 0) {
      return nextDate;
    }
    
    nextDate = addDays(nextDate, 1);
    attempts++;
  }

  return addDays(currentDateStr, 1);
}
