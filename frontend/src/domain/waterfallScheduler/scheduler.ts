import type {
  JobAllocation,
  JobSlice,
  DayCapacity,
  BreakPeriod
} from './types';
import { MINUTES_PER_EFINK } from './types';
import { getDayCapacity, addDays, isWeekend } from './dayCapacity';

export interface DaySettings {
  earlyOtEnabled: boolean;
  earlyOtStartMinutes?: number;
  lateOtEnabled: boolean;
  lateOtEndMinutes?: number;
}

export interface ScheduleResult {
  slices: JobSlice[];
  spanEndDate: string;
  spanEndMinutes: number;
  totalDurationMinutes: number;
  totalBreakMinutes: number;
}

export function eFinksToMinutes(efinks: number, teamAverageEfinks: number = 80): number {
  const factor = teamAverageEfinks / 80;
  return Math.round((efinks * MINUTES_PER_EFINK) / factor);
}

export function minutesToEfinks(minutes: number, teamAverageEfinks: number = 80): number {
  const factor = teamAverageEfinks / 80;
  return (minutes / MINUTES_PER_EFINK) * factor;
}

function isWithinBreak(time: number, breaks: BreakPeriod[]): BreakPeriod | null {
  for (const brk of breaks) {
    if (time >= brk.startMinutes && time < brk.endMinutes) {
      return brk;
    }
  }
  return null;
}

function getNextAvailableTime(time: number, dayCapacity: DayCapacity): number {
  let currentTime = time;

  for (const brk of dayCapacity.breaks) {
    if (currentTime >= brk.startMinutes && currentTime < brk.endMinutes) {
      currentTime = brk.endMinutes;
    }
  }

  for (const block of dayCapacity.blocks) {
    if (!block.isFullDay && currentTime >= block.startMinutes && currentTime < block.endMinutes) {
      currentTime = block.endMinutes;
    }
  }

  return Math.min(currentTime, dayCapacity.workingHours.endMinutes);
}

function scheduleOnDay(
  allocationId: string,
  remainingWork: number,
  totalEfinks: number,
  startMinutes: number,
  dayCapacity: DayCapacity,
  isFirstDay: boolean
): { slice: JobSlice | null; remainingWork: number; endMinutes: number } {
  if (!dayCapacity.isWorkingDay || dayCapacity.availableMinutes === 0) {
    return { slice: null, remainingWork, endMinutes: startMinutes };
  }

  let currentTime = getNextAvailableTime(
    Math.max(startMinutes, dayCapacity.workingHours.startMinutes),
    dayCapacity
  );

  if (currentTime >= dayCapacity.workingHours.endMinutes) {
    return { slice: null, remainingWork, endMinutes: currentTime };
  }

  let workDone = 0;
  let breakAccum = 0;
  let endTime = currentTime;

  while (workDone < remainingWork && endTime < dayCapacity.workingHours.endMinutes) {
    const inBreak = isWithinBreak(endTime, dayCapacity.breaks);
    
    if (inBreak) {
      breakAccum += inBreak.endMinutes - endTime;
      endTime = inBreak.endMinutes;
      continue;
    }

    let nextBreakOrEnd = dayCapacity.workingHours.endMinutes;
    for (const brk of dayCapacity.breaks) {
      if (brk.startMinutes > endTime && brk.startMinutes < nextBreakOrEnd) {
        nextBreakOrEnd = brk.startMinutes;
      }
    }

    const availableInSegment = nextBreakOrEnd - endTime;
    const neededWork = remainingWork - workDone;
    const workInSegment = Math.min(availableInSegment, neededWork);

    workDone += workInSegment;
    endTime += workInSegment;
  }

  if (workDone === 0) {
    return { slice: null, remainingWork, endMinutes: endTime };
  }

  const sliceEfinks = (workDone / remainingWork) * totalEfinks * (remainingWork / (remainingWork));
  const isLastDay = remainingWork - workDone <= 0;

  const slice: JobSlice = {
    allocationId,
    dateStr: dayCapacity.dateStr,
    startMinutes: currentTime,
    endMinutes: endTime,
    durationMinutes: workDone,
    breakMinutes: breakAccum,
    efinks: Math.round(sliceEfinks * 100) / 100,
    isFirstDay,
    isLastDay
  };

  return {
    slice,
    remainingWork: remainingWork - workDone,
    endMinutes: endTime
  };
}

export function scheduleJob(
  allocation: JobAllocation,
  getDaySettings: (dateStr: string) => DaySettings,
  getBlocks: (dateStr: string) => { id: string; type: any; startMinutes: number; endMinutes: number; isFullDay: boolean }[],
  teamAverageEfinks: number = 80
): ScheduleResult {
  const totalDuration = eFinksToMinutes(allocation.estimatedEfinks, teamAverageEfinks);
  let remainingWork = totalDuration;
  const slices: JobSlice[] = [];
  let currentDate = allocation.spanStartDate;
  let currentStartMinutes = allocation.spanStartMinutes;
  let isFirstDay = true;
  let totalBreakMinutes = 0;
  let attempts = 0;

  while (remainingWork > 0 && attempts < 365) {
    const settings = getDaySettings(currentDate);
    const blocks = getBlocks(currentDate);
    
    const dayCapacity = getDayCapacity(
      currentDate,
      settings.earlyOtEnabled,
      settings.earlyOtStartMinutes,
      settings.lateOtEnabled,
      settings.lateOtEndMinutes,
      blocks
    );

    const result = scheduleOnDay(
      allocation.id,
      remainingWork,
      allocation.estimatedEfinks,
      currentStartMinutes,
      dayCapacity,
      isFirstDay
    );

    if (result.slice) {
      slices.push(result.slice);
      totalBreakMinutes += result.slice.breakMinutes;
      remainingWork = result.remainingWork;
      isFirstDay = false;
    }

    if (remainingWork > 0) {
      currentDate = addDays(currentDate, 1);
      currentStartMinutes = 0;
      
      while (isWeekend(currentDate) && attempts < 365) {
        const weekendSettings = getDaySettings(currentDate);
        if (weekendSettings.earlyOtEnabled || weekendSettings.lateOtEnabled) {
          break;
        }
        currentDate = addDays(currentDate, 1);
        attempts++;
      }
    }

    attempts++;
  }

  const lastSlice = slices[slices.length - 1];

  return {
    slices,
    spanEndDate: lastSlice?.dateStr ?? allocation.spanStartDate,
    spanEndMinutes: lastSlice?.endMinutes ?? allocation.spanStartMinutes,
    totalDurationMinutes: totalDuration,
    totalBreakMinutes
  };
}

export function cascadeQueue(
  allocations: JobAllocation[],
  startFromPosition: number,
  getDaySettings: (dateStr: string) => DaySettings,
  getBlocks: (dateStr: string) => { id: string; type: any; startMinutes: number; endMinutes: number; isFullDay: boolean }[],
  teamAverageEfinks: number = 80
): JobAllocation[] {
  const sorted = [...allocations].sort((a, b) => a.queuePosition - b.queuePosition);
  const result: JobAllocation[] = [];
  let nextStartDate = '';
  let nextStartMinutes = 0;

  for (const alloc of sorted) {
    if (alloc.queuePosition < startFromPosition || alloc.isComplete) {
      if (alloc.spanEndDate && alloc.spanEndMinutes) {
        nextStartDate = alloc.spanEndDate;
        nextStartMinutes = alloc.spanEndMinutes;
      }
      result.push(alloc);
      continue;
    }

    const updatedAlloc: JobAllocation = {
      ...alloc,
      spanStartDate: nextStartDate || alloc.spanStartDate,
      spanStartMinutes: nextStartMinutes || alloc.spanStartMinutes
    };

    const scheduleResult = scheduleJob(updatedAlloc, getDaySettings, getBlocks, teamAverageEfinks);

    const finalAlloc: JobAllocation = {
      ...updatedAlloc,
      spanEndDate: scheduleResult.spanEndDate,
      spanEndMinutes: scheduleResult.spanEndMinutes,
      slices: scheduleResult.slices
    };

    result.push(finalAlloc);

    nextStartDate = scheduleResult.spanEndDate;
    nextStartMinutes = scheduleResult.spanEndMinutes;
  }

  return result;
}

export function insertJobAtPosition(
  newJob: Omit<JobAllocation, 'id' | 'slices' | 'spanEndDate' | 'spanEndMinutes'>,
  existingAllocations: JobAllocation[],
  insertPosition: number,
  getDaySettings: (dateStr: string) => DaySettings,
  getBlocks: (dateStr: string) => { id: string; type: any; startMinutes: number; endMinutes: number; isFullDay: boolean }[],
  teamAverageEfinks: number = 80
): { newAllocation: JobAllocation; updatedQueue: JobAllocation[] } {
  const id = crypto.randomUUID();

  const allocationWithId: JobAllocation = {
    ...newJob,
    id,
    queuePosition: insertPosition,
    slices: [],
    spanEndDate: undefined,
    spanEndMinutes: undefined
  };

  const reorderedQueue = existingAllocations.map(a => {
    if (a.queuePosition >= insertPosition) {
      return { ...a, queuePosition: a.queuePosition + 1 };
    }
    return a;
  });

  reorderedQueue.push(allocationWithId);

  const cascaded = cascadeQueue(
    reorderedQueue,
    insertPosition,
    getDaySettings,
    getBlocks,
    teamAverageEfinks
  );

  const newAllocation = cascaded.find(a => a.id === id)!;

  return {
    newAllocation,
    updatedQueue: cascaded
  };
}
