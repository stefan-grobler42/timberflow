import type { ShiftConfig } from './types';
import { BUFFER_MINUTES } from './constants';
import { getNextJobStartTime, getNextValidStartTime } from './shiftCalendar';

export interface ScheduleTiming {
  startTime: number;
  endTime: number;
  durationMinutes: number;
  breakMinutes: number;
}

export interface ScheduleOverlap<T> {
  groupKey: string;
  previous: T;
  current: T;
  previousEnd: number;
  currentStart: number;
}

export interface ScheduleNormalizationChange<T> {
  item: T;
  before: ScheduleTiming;
  after: ScheduleTiming;
}

export interface ScheduleNormalizationResult<T> {
  items: T[];
  changes: ScheduleNormalizationChange<T>[];
  overlapsBefore: ScheduleOverlap<T>[];
  overlapsAfter: ScheduleOverlap<T>[];
}

export interface ScheduleNormalizerOptions<T> {
  items: T[];
  bufferMinutes?: number;
  anchorIds?: Set<string>;
  isScheduled: (item: T) => boolean;
  getId: (item: T) => string;
  getGroupKey: (item: T) => string;
  getStart: (item: T) => number;
  getEnd: (item: T) => number | null | undefined;
  getDuration: (item: T) => number;
  getBreakMinutes: (item: T) => number;
  getShift: (item: T) => ShiftConfig;
  calculateTiming: (item: T, startTime: number) => { endTime: number; breakMinutes: number };
  updateItem: (item: T, timing: ScheduleTiming) => T;
}

const getLogicalEnd = <T>(item: T, options: ScheduleNormalizerOptions<T>): number => {
  const start = options.getStart(item);
  const visualEnd = start + options.getDuration(item) + options.getBreakMinutes(item);
  return Math.max(options.getEnd(item) ?? visualEnd, visualEnd);
};

export const findScheduleOverlaps = <T>(options: ScheduleNormalizerOptions<T>): ScheduleOverlap<T>[] => {
  const overlaps: ScheduleOverlap<T>[] = [];
  const groups = new Map<string, T[]>();

  for (const item of options.items) {
    if (!options.isScheduled(item)) continue;
    const groupKey = options.getGroupKey(item);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), item]);
  }

  for (const [groupKey, groupItems] of groups) {
    const sorted = [...groupItems].sort((a, b) => options.getStart(a) - options.getStart(b));
    let previous: T | null = null;
    let previousEnd = 0;

    for (const item of sorted) {
      const start = options.getStart(item);
      if (previous && start < previousEnd) {
        overlaps.push({ groupKey, previous, current: item, previousEnd, currentStart: start });
      }

      const itemEnd = getLogicalEnd(item, options);
      if (!previous || itemEnd > previousEnd) {
        previous = item;
        previousEnd = itemEnd;
      }
    }
  }

  return overlaps;
};

export const resolveScheduleOverlaps = <T>(options: ScheduleNormalizerOptions<T>): ScheduleNormalizationResult<T> => {
  const bufferMinutes = options.bufferMinutes ?? BUFFER_MINUTES;
  const overlapsBefore = findScheduleOverlaps(options);
  const updatedById = new Map<string, T>();
  const changes: ScheduleNormalizationChange<T>[] = [];
  const groups = new Map<string, T[]>();

  for (const item of options.items) {
    if (!options.isScheduled(item)) continue;
    const groupKey = options.getGroupKey(item);
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), item]);
  }

  const moveItem = (item: T, startTime: number): T => {
    const shiftedStart = getNextValidStartTime(startTime, options.getShift(item));
    const timing = options.calculateTiming(item, shiftedStart);
    const before: ScheduleTiming = {
      startTime: options.getStart(item),
      endTime: getLogicalEnd(item, options),
      durationMinutes: options.getDuration(item),
      breakMinutes: options.getBreakMinutes(item)
    };
    const after: ScheduleTiming = {
      startTime: shiftedStart,
      endTime: timing.endTime,
      durationMinutes: options.getDuration(item),
      breakMinutes: timing.breakMinutes
    };
    const updated = options.updateItem(item, after);
    updatedById.set(options.getId(item), updated);
    changes.push({ item, before, after });
    return updated;
  };

  for (const groupItems of groups.values()) {
    const sorted = [...groupItems].sort((a, b) => options.getStart(a) - options.getStart(b));
    const anchors = sorted.filter(item => options.anchorIds?.has(options.getId(item)));

    if (anchors.length > 0) {
      const anchor = anchors.sort((a, b) => options.getStart(a) - options.getStart(b))[0];
      const anchorStart = options.getStart(anchor);
      let nextStart = getNextJobStartTime(getLogicalEnd(anchor, options), bufferMinutes, options.getShift(anchor));

      const candidates = sorted
        .filter(item => options.getId(item) !== options.getId(anchor))
        .filter(item => getLogicalEnd(item, options) > anchorStart);

      for (const item of candidates) {
        const start = options.getStart(item);

        if (start < nextStart) {
          const updated = moveItem(item, nextStart);
          nextStart = getNextJobStartTime(getLogicalEnd(updated, options), bufferMinutes, options.getShift(updated));
        } else {
          const existingEnd = getLogicalEnd(item, options);
          nextStart = getNextJobStartTime(existingEnd, bufferMinutes, options.getShift(item));
        }
      }

      continue;
    }

    let nextStart: number | null = null;
    for (const item of sorted) {
      const start = options.getStart(item);

      if (nextStart !== null && start < nextStart) {
        const updated = moveItem(item, nextStart);
        nextStart = getNextJobStartTime(getLogicalEnd(updated, options), bufferMinutes, options.getShift(updated));
      } else {
        nextStart = getNextJobStartTime(getLogicalEnd(item, options), bufferMinutes, options.getShift(item));
      }
    }
  }

  const items = options.items.map(item => updatedById.get(options.getId(item)) ?? item);
  const overlapsAfter = findScheduleOverlaps({ ...options, items });

  return { items, changes, overlapsBefore, overlapsAfter };
};
