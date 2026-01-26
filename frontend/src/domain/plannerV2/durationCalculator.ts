/**
 * Job duration and sizing calculations for the plannerV2 module.
 * All functions handle edge cases and return consistent, rounded values.
 */

import { MINUTES_PER_EFINK, MIN_DURATION, PIXELS_PER_MINUTE, QUARTER_HOUR } from './constants';
import { type SchedulerConfig, DEFAULT_CONFIG } from './schedulerSettings';

/** Default team E-Finks capacity per day (baseline for efficiency calculations) */
const DEFAULT_TEAM_EFINKS = 80;

/**
 * Rounds a number UP to the nearest quarter hour (15 minutes).
 * LEGACY: Use roundToIncrement with config for configurable rounding.
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
 * Rounds a number to the NEAREST multiple of the increment (configurable).
 * Uses standard rounding: 0.5 and above rounds up, below 0.5 rounds down.
 * 
 * @param minutes - The number of minutes to round
 * @param increment - The rounding increment (default: 15 minutes)
 * @param minDuration - Minimum duration to return (default: 10 minutes)
 * @returns Minutes rounded to nearest increment, minimum minDuration
 * 
 * @example (increment=10)
 * roundToIncrement(7, 10)   // returns 10 (7/10=0.7, rounds to 1*10=10)
 * roundToIncrement(14, 10)  // returns 10 (14/10=1.4, rounds to 1*10=10)
 * roundToIncrement(15, 10)  // returns 20 (15/10=1.5, rounds to 2*10=20)
 * roundToIncrement(23, 10)  // returns 20 (23/10=2.3, rounds to 2*10=20)
 * roundToIncrement(27, 10)  // returns 30 (27/10=2.7, rounds to 3*10=30)
 */
export function roundToIncrement(
  minutes: number, 
  increment: number = QUARTER_HOUR,
  minDuration: number = MIN_DURATION
): number {
  if (minutes <= 0) {
    return minDuration;
  }
  const rounded = Math.round(minutes / increment) * increment;
  return Math.max(minDuration, rounded);
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
 * Multiplies by the conversion factor, rounds to NEAREST increment (from config),
 * and ensures a minimum duration.
 * 
 * @param efinks - The estimated E-Finks value for the job
 * @param teamAverageEfinks - Optional team's average E-Finks capacity (for team-specific efficiency)
 * @param config - Optional SchedulerConfig for dynamic rounding settings
 * @returns Duration in minutes, minimum from config, rounded to config increment
 * 
 * @example (with default 15-min increment)
 * calculateEfinksDuration(0)           // returns 10 (minimum)
 * calculateEfinksDuration(1)           // returns 10 (6.5625 rounds to nearest 15 = 0, but min 10)
 * calculateEfinksDuration(3)           // returns 20 (19.6875 rounds to nearest 15 = 15, but at least min)
 * calculateEfinksDuration(10)          // returns 60 (65.625 rounds to nearest 15 = 60)
 * calculateEfinksDuration(10, 100)     // returns 50 (52.5 rounds to nearest 15 = 45, but... actually 53)
 */
export function calculateEfinksDuration(
  efinks: number, 
  teamAverageEfinks?: number | null,
  config: SchedulerConfig = DEFAULT_CONFIG
): number {
  const minDuration = config.minJobDuration;
  const increment = config.durationRoundingIncrement;
  
  if (!efinks || efinks <= 0) {
    return minDuration;
  }
  
  const rawMinutes = efinks * MINUTES_PER_EFINK;
  const efficiencyFactor = getTeamEfficiencyFactor(teamAverageEfinks);
  const adjustedMinutes = efficiencyFactor > 0 ? rawMinutes / efficiencyFactor : rawMinutes;
  const rounded = roundToIncrement(adjustedMinutes, increment, minDuration);
  
  return Math.max(minDuration, rounded);
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
 * @param config - Optional SchedulerConfig for dynamic rounding settings
 * @returns Duration in minutes, always rounded to config increment
 * 
 * @example
 * getJobDuration({ customDurationMinutes: 45 })           // returns 45
 * getJobDuration({ plannedDurationMinutes: 60 })          // returns 60
 * getJobDuration({ estimatedEFinks: 5 })                  // returns 30-35 depending on config
 * getJobDuration({ customDurationMinutes: 60, estimatedEFinks: 5 })  // returns 60 (custom takes precedence)
 * getJobDuration({})                                       // returns minDuration from config
 * getJobDuration({ estimatedEFinks: 10 }, 100)            // team is 25% faster
 */
export function getJobDuration(
  job: {
    customDurationMinutes?: number | null;
    plannedDurationMinutes?: number | null;
    estimatedEFinks?: number | null;
  }, 
  teamAverageEfinks?: number | null,
  config: SchedulerConfig = DEFAULT_CONFIG
): number {
  const increment = config.durationRoundingIncrement;
  const minDuration = config.minJobDuration;
  
  // Priority 1: Custom duration (manual resize)
  if (job.customDurationMinutes && job.customDurationMinutes > 0) {
    return roundToIncrement(job.customDurationMinutes, increment, minDuration);
  }
  
  // Priority 2: Planned duration from WIP (truncated rollovers, allocated jobs)
  if (job.plannedDurationMinutes && job.plannedDurationMinutes > 0) {
    return job.plannedDurationMinutes;
  }
  
  // Priority 3: Calculate from E-Finks
  return calculateEfinksDuration(job.estimatedEFinks || 0, teamAverageEfinks, config);
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

