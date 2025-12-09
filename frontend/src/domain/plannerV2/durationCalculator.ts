/**
 * Job duration and sizing calculations for the plannerV2 module.
 * All functions handle edge cases and return consistent, rounded values.
 */

import { MINUTES_PER_EFINK, MIN_DURATION, PIXELS_PER_MINUTE, QUARTER_HOUR } from './constants';

/** Default team E-Finks capacity per day (baseline for efficiency calculations) */
const DEFAULT_TEAM_EFINKS = 80;

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
 * Calculates the team efficiency factor based on their average E-Finks capacity.
 * Teams with higher capacity complete work faster.
 * 
 * @param teamAverageEfinks - The team's average E-Finks capacity per day (default: 80)
 * @returns Efficiency factor (1.0 = baseline, >1 = faster, <1 = slower)
 * 
 * @example
 * getTeamEfficiencyFactor(80)   // returns 1.0 (baseline)
 * getTeamEfficiencyFactor(100)  // returns 1.25 (25% faster)
 * getTeamEfficiencyFactor(60)   // returns 0.75 (25% slower)
 */
export function getTeamEfficiencyFactor(teamAverageEfinks?: number | null): number {
  if (!teamAverageEfinks || teamAverageEfinks <= 0) {
    return 1.0;
  }
  return teamAverageEfinks / DEFAULT_TEAM_EFINKS;
}

/**
 * Calculates the work duration based on E-Finks estimate.
 * Multiplies by the conversion factor, rounds UP to nearest 15 minutes,
 * and ensures a minimum duration.
 * 
 * @param efinks - The estimated E-Finks value for the job
 * @param teamAverageEfinks - Optional team's average E-Finks capacity (for team-specific efficiency)
 * @returns Duration in minutes, minimum 15, rounded to quarter hour
 * 
 * @example
 * calculateEfinksDuration(0)           // returns 15 (minimum)
 * calculateEfinksDuration(1)           // returns 15 (6.5625 rounds up to 15)
 * calculateEfinksDuration(3)           // returns 30 (19.6875 rounds up to 30)
 * calculateEfinksDuration(10)          // returns 75 (65.625 rounds up to 75)
 * calculateEfinksDuration(10, 100)     // returns 60 (65.625 / 1.25 = 52.5, rounds up to 60)
 * calculateEfinksDuration(10, 60)      // returns 90 (65.625 / 0.75 = 87.5, rounds up to 90)
 */
export function calculateEfinksDuration(efinks: number, teamAverageEfinks?: number | null): number {
  if (!efinks || efinks <= 0) {
    return MIN_DURATION;
  }
  
  const rawMinutes = efinks * MINUTES_PER_EFINK;
  const efficiencyFactor = getTeamEfficiencyFactor(teamAverageEfinks);
  const adjustedMinutes = efficiencyFactor > 0 ? rawMinutes / efficiencyFactor : rawMinutes;
  const rounded = roundToQuarterHour(adjustedMinutes);
  
  return Math.max(MIN_DURATION, rounded);
}

/**
 * Gets the effective duration for a job, using custom duration if set,
 * otherwise planned duration from WIP, otherwise calculating from E-Finks.
 * 
 * Priority order:
 * 1. customDurationMinutes - Manual resize by user
 * 2. plannedDurationMinutes - WIP record duration (for truncated rollovers, etc.)
 * 3. Calculate from estimatedEFinks
 * 
 * @param job - Object containing customDurationMinutes, plannedDurationMinutes and/or estimatedEFinks
 * @param teamAverageEfinks - Optional team's average E-Finks capacity (for team-specific efficiency)
 * @returns Duration in minutes, always rounded to quarter hour
 * 
 * @example
 * getJobDuration({ customDurationMinutes: 45 })           // returns 45
 * getJobDuration({ plannedDurationMinutes: 60 })          // returns 60
 * getJobDuration({ estimatedEFinks: 5 })                  // returns 45 (32.8125 -> 45)
 * getJobDuration({ customDurationMinutes: 60, estimatedEFinks: 5 })  // returns 60 (custom takes precedence)
 * getJobDuration({})                                       // returns 15 (minimum)
 * getJobDuration({ estimatedEFinks: 10 }, 100)            // returns 60 (team is 25% faster)
 */
export function getJobDuration(job: {
  customDurationMinutes?: number | null;
  plannedDurationMinutes?: number | null;
  estimatedEFinks?: number | null;
}, teamAverageEfinks?: number | null): number {
  // Priority 1: Custom duration (manual resize)
  if (job.customDurationMinutes && job.customDurationMinutes > 0) {
    return roundToQuarterHour(job.customDurationMinutes);
  }
  
  // Priority 2: Planned duration from WIP (truncated rollovers, allocated jobs)
  if (job.plannedDurationMinutes && job.plannedDurationMinutes > 0) {
    return job.plannedDurationMinutes;
  }
  
  // Priority 3: Calculate from E-Finks
  return calculateEfinksDuration(job.estimatedEFinks || 0, teamAverageEfinks);
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

/**
 * Rounds E-Finks value to 2 decimal places.
 * CRITICAL: All E-Finks fields must use this to avoid infinitely long decimals.
 * 
 * @param efinks - The E-Finks value to round
 * @returns E-Finks rounded to 2 decimal places
 * 
 * @example
 * roundEfinks(12.345678)  // returns 12.35
 * roundEfinks(12.344)     // returns 12.34
 * roundEfinks(12)         // returns 12.00
 */
export function roundEfinks(efinks: number): number {
  return Math.round(efinks * 100) / 100;
}

/**
 * Converts duration in minutes to E-Finks based on team efficiency.
 * Inverse of calculateEfinksDuration.
 * 
 * @param minutes - Duration in minutes
 * @param teamAverageEfinks - Optional team's average E-Finks capacity
 * @returns E-Finks value rounded to 2 decimal places
 * 
 * @example
 * minutesToEfinks(65.625)      // returns 10.00 (65.625 / 6.5625 = 10)
 * minutesToEfinks(60, 100)     // returns 11.43 (60 * 1.25 / 6.5625)
 */
export function minutesToEfinks(minutes: number, teamAverageEfinks?: number | null): number {
  if (!minutes || minutes <= 0) {
    return 0;
  }
  
  const efficiencyFactor = getTeamEfficiencyFactor(teamAverageEfinks);
  const rawEfinks = (minutes * efficiencyFactor) / MINUTES_PER_EFINK;
  
  return roundEfinks(rawEfinks);
}

/**
 * Redistributes E-Finks between parent and child jobs based on their durations.
 * Ensures parent + child E-Finks equals total, with proper 2-decimal rounding.
 * 
 * @param totalEfinks - Total E-Finks for the chain (from Production record)
 * @param parentMinutes - Parent job duration in minutes
 * @param childMinutes - Child job duration in minutes  
 * @returns Object with parentEfinks and childEfinks, both rounded to 2 decimals
 * 
 * @example
 * redistributeEfinks(100, 300, 200)  // { parentEfinks: 60.00, childEfinks: 40.00 }
 * redistributeEfinks(100, 450, 75)   // { parentEfinks: 85.71, childEfinks: 14.29 }
 */
export function redistributeEfinks(
  totalEfinks: number,
  parentMinutes: number,
  childMinutes: number
): { parentEfinks: number; childEfinks: number } {
  const totalMinutes = parentMinutes + childMinutes;
  
  if (totalMinutes <= 0) {
    return { parentEfinks: roundEfinks(totalEfinks), childEfinks: 0 };
  }
  
  // Calculate parent's proportion
  const parentRatio = parentMinutes / totalMinutes;
  const rawParentEfinks = totalEfinks * parentRatio;
  const parentEfinks = roundEfinks(rawParentEfinks);
  
  // Child gets the remainder to ensure exact total (handles rounding drift)
  const childEfinks = roundEfinks(totalEfinks - parentEfinks);
  
  return { parentEfinks, childEfinks };
}
