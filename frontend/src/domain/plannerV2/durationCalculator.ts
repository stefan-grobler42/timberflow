/**
 * Job duration and sizing calculations for the plannerV2 module.
 * All functions handle edge cases and return consistent, rounded values.
 */

import { MINUTES_PER_EFINK, MIN_DURATION, PIXELS_PER_MINUTE, QUARTER_HOUR } from './constants';

/**
 * Rounds a number UP to the nearest quarter hour (15 minutes).
 * 
 * @param minutes - The number of minutes to round
 * @returns Minutes rounded up to nearest 15-minute increment
 * 
 * @example
 * roundToQuarterHour(7)   // returns 15
 * roundToQuarterHour(15)  // returns 15
 * roundToQuarterHour(16)  // returns 30
 * roundToQuarterHour(45)  // returns 45
 * roundToQuarterHour(46)  // returns 60
 */
export function roundToQuarterHour(minutes: number): number {
  if (minutes <= 0) {
    return QUARTER_HOUR;
  }
  return Math.ceil(minutes / QUARTER_HOUR) * QUARTER_HOUR;
}

/**
 * Calculates the work duration based on E-Finks estimate.
 * Multiplies by the conversion factor, rounds UP to nearest 15 minutes,
 * and ensures a minimum duration.
 * 
 * @param efinks - The estimated E-Finks value for the job
 * @returns Duration in minutes, minimum 15, rounded to quarter hour
 * 
 * @example
 * calculateEfinksDuration(0)    // returns 15 (minimum)
 * calculateEfinksDuration(1)    // returns 15 (6.5625 rounds up to 15)
 * calculateEfinksDuration(3)    // returns 30 (19.6875 rounds up to 30)
 * calculateEfinksDuration(10)   // returns 75 (65.625 rounds up to 75)
 */
export function calculateEfinksDuration(efinks: number): number {
  if (!efinks || efinks <= 0) {
    return MIN_DURATION;
  }
  
  const rawMinutes = efinks * MINUTES_PER_EFINK;
  const rounded = roundToQuarterHour(rawMinutes);
  
  return Math.max(MIN_DURATION, rounded);
}

/**
 * Gets the effective duration for a job, using custom duration if set,
 * otherwise calculating from E-Finks.
 * 
 * @param job - Object containing customDurationMinutes and/or estimatedEFinks
 * @returns Duration in minutes, always rounded to quarter hour
 * 
 * @example
 * getJobDuration({ customDurationMinutes: 45 })           // returns 45
 * getJobDuration({ estimatedEFinks: 5 })                  // returns 45 (32.8125 -> 45)
 * getJobDuration({ customDurationMinutes: 60, estimatedEFinks: 5 })  // returns 60 (custom takes precedence)
 * getJobDuration({})                                       // returns 15 (minimum)
 */
export function getJobDuration(job: {
  customDurationMinutes?: number | null;
  estimatedEFinks?: number | null;
}): number {
  if (job.customDurationMinutes && job.customDurationMinutes > 0) {
    return roundToQuarterHour(job.customDurationMinutes);
  }
  
  return calculateEfinksDuration(job.estimatedEFinks || 0);
}

/**
 * Calculates the visual height in pixels for a job card based on its duration.
 * Uses the PIXELS_PER_MINUTE constant for consistent scaling.
 * 
 * @param durationMinutes - The duration of the job in minutes
 * @returns Height in pixels
 * 
 * @example
 * calculateJobHeight(15)   // returns 22.5 (15 * 1.5)
 * calculateJobHeight(30)   // returns 45 (30 * 1.5)
 * calculateJobHeight(60)   // returns 90 (60 * 1.5)
 */
export function calculateJobHeight(durationMinutes: number): number {
  if (durationMinutes <= 0) {
    return MIN_DURATION * PIXELS_PER_MINUTE;
  }
  
  return durationMinutes * PIXELS_PER_MINUTE;
}

/**
 * Checks if a job's duration has been manually altered from the E-Finks default.
 * 
 * @param job - Object containing customDurationMinutes and estimatedEFinks
 * @returns True if the job has a custom duration that differs from the calculated default
 * 
 * @example
 * isManuallyAltered({ customDurationMinutes: 60, estimatedEFinks: 5 }) // true (default would be 45)
 * isManuallyAltered({ customDurationMinutes: 45, estimatedEFinks: 5 }) // false (matches default)
 * isManuallyAltered({ estimatedEFinks: 5 })                            // false (no custom set)
 */
export function isManuallyAltered(job: {
  customDurationMinutes?: number | null;
  estimatedEFinks?: number | null;
}): boolean {
  if (!job.customDurationMinutes) {
    return false;
  }
  
  const defaultDuration = calculateEfinksDuration(job.estimatedEFinks || 0);
  return job.customDurationMinutes !== defaultDuration;
}

/**
 * Calculates the minimum height in pixels for the job card.
 * Ensures all job cards have at least a minimum visual presence.
 * 
 * @returns Minimum height in pixels
 */
export function getMinimumJobHeight(): number {
  return MIN_DURATION * PIXELS_PER_MINUTE;
}

/**
 * Converts a pixel height back to duration in minutes.
 * Useful for drag resizing operations.
 * 
 * @param pixels - Height in pixels
 * @returns Duration in minutes, rounded to quarter hour
 * 
 * @example
 * pixelsToDuration(45)  // returns 30 (45 / 1.5 = 30)
 * pixelsToDuration(50)  // returns 45 (50 / 1.5 = 33.3, rounds up to 45)
 */
export function pixelsToDuration(pixels: number): number {
  if (pixels <= 0) {
    return MIN_DURATION;
  }
  
  const rawMinutes = pixels / PIXELS_PER_MINUTE;
  return Math.max(MIN_DURATION, roundToQuarterHour(rawMinutes));
}
