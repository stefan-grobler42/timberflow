/**
 * Scheduling constants for the plannerV2 module.
 * All time values are in minutes unless otherwise specified.
 */

import type { Break } from './types';

/** Mandatory buffer time between jobs in minutes (for paperwork) */
export const BUFFER_MINUTES = 30;

/** Conversion factor: minutes of work per E-Fink unit */
export const MINUTES_PER_EFINK = 6.5625;

/** Minimum job duration in minutes */
export const MIN_DURATION = 15;

/** Pixels per minute for visual height calculation */
export const PIXELS_PER_MINUTE = 1.5;

/** Standard shift start time: 7:00 AM = 420 minutes from midnight */
export const WORKING_START = 420;

/** Standard shift end time: 5:00 PM = 1020 minutes from midnight */
export const WORKING_END = 1020;

/** Overtime end time: 7:00 PM = 1140 minutes from midnight */
export const OVERTIME_END = 1140;

/**
 * Standard breaks for a normal work day.
 * Times are in minutes from midnight.
 */
export const STANDARD_BREAKS: Break[] = [
  {
    name: 'Morning Tea',
    start: 540,  // 9:00 AM
    end: 570,    // 9:30 AM
    duration: 30
  },
  {
    name: 'Lunch',
    start: 720,  // 12:00 PM
    end: 765,    // 12:45 PM
    duration: 45
  }
];

/**
 * Overtime breaks include dinner for extended work hours.
 * Times are in minutes from midnight.
 */
export const OVERTIME_BREAKS: Break[] = [
  {
    name: 'Morning Tea',
    start: 540,  // 9:00 AM
    end: 570,    // 9:30 AM
    duration: 30
  },
  {
    name: 'Lunch',
    start: 720,  // 12:00 PM
    end: 765,    // 12:45 PM
    duration: 45
  },
  {
    name: 'Dinner',
    start: 1080, // 6:00 PM
    end: 1110,   // 6:30 PM
    duration: 30
  }
];

/** Quarter hour increment in minutes */
export const QUARTER_HOUR = 15;

/** Total standard breaks duration in minutes */
export const STANDARD_BREAKS_TOTAL = STANDARD_BREAKS.reduce((sum, b) => sum + b.duration, 0);

/** Total overtime breaks duration in minutes */
export const OVERTIME_BREAKS_TOTAL = OVERTIME_BREAKS.reduce((sum, b) => sum + b.duration, 0);

/** Standard working hours excluding breaks */
export const STANDARD_WORKING_MINUTES = WORKING_END - WORKING_START - STANDARD_BREAKS_TOTAL;

/** Overtime working hours excluding breaks */
export const OVERTIME_WORKING_MINUTES = OVERTIME_END - WORKING_START - OVERTIME_BREAKS_TOTAL;
