/**
 * Core types and interfaces for the plannerV2 scheduling module.
 * These types define the data structures used throughout the scheduling system.
 */

/**
 * Represents a scheduled production job on the planner.
 * CONTINUOUS FLOW MODEL: Jobs are single blocks that span their full duration.
 * No parent/child relationships or rollover segments.
 */
export interface ScheduledJob {
  /** Unique identifier for the job */
  id: string;
  /** Sales order number */
  orderNumber: string;
  /** Customer name */
  customer: string;
  /** Estimated E-Finks value for duration calculation */
  estimatedEFinks: number;
  /** Date string in YYYY-MM-DD format */
  plannedDateStr: string | null;
  /** Jig/team identifier */
  jigId: string | null;
  /** Start time in minutes from midnight */
  plannedStartTime: number | null;
  /** End time in minutes from midnight */
  plannedEndTime: number | null;
  /** Total duration including break adjustments */
  plannedDurationMinutes: number | null;
  /** User-overridden duration (takes precedence over EFinks calculation) */
  customDurationMinutes: number | null;
  /** Minutes added due to breaks spanned by this job */
  breakAdjustmentMinutes: number | null;
  /** Whether production is complete */
  productionComplete: boolean;
}

/**
 * Represents a break period during the work day.
 */
export interface Break {
  /** Display name of the break (e.g., "Morning Tea", "Lunch") */
  name: string;
  /** Start time in minutes from midnight */
  start: number;
  /** End time in minutes from midnight */
  end: number;
  /** Duration in minutes */
  duration: number;
}

/**
 * Configuration for a work shift including hours and breaks.
 */
export interface ShiftConfig {
  /** Shift start time in minutes from midnight */
  startTime: number;
  /** Shift end time in minutes from midnight */
  endTime: number;
  /** Array of breaks during the shift */
  breaks: Break[];
}

/**
 * Settings for overtime configuration.
 */
export interface OvertimeSettings {
  /** Whether overtime is enabled for this day */
  enabled: boolean;
  /** Custom close time in minutes from midnight (defaults to 7:00 PM = 1140) */
  closeTime: number;
}

/**
 * Enum for types of changes that can be staged.
 */
export type ChangeType = 'allocate' | 'cascade' | 'unallocate' | 'resize';

/**
 * Represents a staged change to a job before it's committed.
 * Used for preview and batch operations.
 */
export interface StagedChange {
  /** The job ID being changed */
  jobId: string;
  /** Type of change being made */
  changeType: ChangeType;
  /** Original values before the change */
  originalValues: {
    jigId: string | null;
    plannedDateStr: string | null;
    plannedStartTime: number | null;
    plannedEndTime: number | null;
    plannedDurationMinutes: number | null;
    customDurationMinutes: number | null;
    breakAdjustmentMinutes: number | null;
  };
  /** New values after the change */
  newValues: {
    jigId?: string | null;
    plannedDateStr?: string | null;
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
    plannedDurationMinutes?: number | null;
    customDurationMinutes?: number | null;
    breakAdjustmentMinutes?: number | null;
  };
  /** Whether this is the primary change (vs cascaded) */
  isPrimary: boolean;
  /** Timestamp when the change was staged */
  stagedAt: number;
}

/**
 * Result of end time calculation including break information.
 */
export interface EndTimeResult {
  /** Calculated end time in minutes from midnight */
  endTime: number;
  /** Total break minutes spanned by the job */
  breakMinutes: number;
}

/**
 * Summary of job timing after scheduling calculations.
 * CONTINUOUS FLOW: Jobs are single blocks - no overflow to next day.
 */
export interface JobTimingSummary {
  /** Start time in minutes from midnight */
  startTime: number;
  /** End time in minutes from midnight */
  endTime: number;
  /** Work duration excluding breaks */
  workDuration: number;
  /** Total duration including breaks */
  totalDuration: number;
  /** Break minutes included in the job span */
  breakMinutes: number;
}
