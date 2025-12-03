/**
 * Change tracking and persistence management for the plannerV2 module.
 * Handles staging changes, building payloads, and creating audit records.
 */

import type { ScheduledJob, StagedChange, ChangeType } from './types';

/**
 * State container for staged changes before they are committed.
 */
export interface StagingState {
  /** Map of job ID to staged change information */
  stagedChanges: Map<string, StagedChange>;
  /** Set of dates affected by the staged changes */
  affectedDates: Set<string>;
  /** The primary job ID that initiated the change (if any) */
  primaryJobId: string | null;
}

/**
 * Payload structure for API persistence calls.
 */
export interface PersistencePayload {
  /** Job ID being updated */
  jobId: string;
  /** Type of change */
  changeType: ChangeType;
  /** New field values to persist */
  updates: {
    jigId?: string | null;
    plannedDateStr?: string | null;
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
    plannedDurationMinutes?: number | null;
    customDurationMinutes?: number | null;
    breakAdjustmentMinutes?: number | null;
  };
}

/**
 * Additional job details for audit record creation.
 */
export interface JobDetails {
  /** Order number for the job */
  orderNumber: string;
  /** Customer name */
  customer: string;
  /** Jig/team name */
  jigName?: string;
}

/**
 * Audit record for change tracking.
 */
export interface AuditRecord {
  /** Job ID that was changed */
  jobId: string;
  /** Order number */
  orderNumber: string;
  /** Customer name */
  customer: string;
  /** Type of change */
  changeType: ChangeType;
  /** Original values before change */
  previousValues: {
    jigId?: string | null;
    jigName?: string;
    plannedDateStr?: string | null;
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
  };
  /** New values after change */
  newValues: {
    jigId?: string | null;
    jigName?: string;
    plannedDateStr?: string | null;
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
  };
  /** Whether this was the primary change (vs cascaded) */
  isPrimary: boolean;
  /** Timestamp when the change was made */
  timestamp: number;
}

/**
 * Creates an empty staging state.
 * 
 * @returns Empty staging state ready for changes
 * 
 * @example
 * const staging = createEmptyStaging();
 * // staging.stagedChanges is empty Map
 * // staging.affectedDates is empty Set
 * // staging.primaryJobId is null
 */
export function createEmptyStaging(): StagingState {
  return {
    stagedChanges: new Map<string, StagedChange>(),
    affectedDates: new Set<string>(),
    primaryJobId: null
  };
}

/**
 * Clones a staging state for immutable updates.
 * 
 * @param state - State to clone
 * @returns New staging state with cloned collections
 */
function cloneStagingState(state: StagingState): StagingState {
  return {
    stagedChanges: new Map(state.stagedChanges),
    affectedDates: new Set(state.affectedDates),
    primaryJobId: state.primaryJobId
  };
}

/**
 * Stages a change for a job.
 * Records original values and pending updates for later commit.
 * 
 * @param state - Current staging state
 * @param jobId - ID of the job being changed
 * @param originalJob - Original job before changes
 * @param updates - Partial updates to apply
 * @param changeType - Type of change being made
 * @returns New staging state with the change added
 * 
 * @example
 * let staging = createEmptyStaging();
 * staging = stageChange(staging, 'job-1', originalJob, { plannedStartTime: 480 }, 'cascade');
 */
export function stageChange(
  state: StagingState,
  jobId: string,
  originalJob: ScheduledJob,
  updates: Partial<ScheduledJob>,
  changeType: ChangeType
): StagingState {
  const newState = cloneStagingState(state);
  
  const isPrimary = state.primaryJobId === null || state.primaryJobId === jobId;
  
  if (state.primaryJobId === null) {
    newState.primaryJobId = jobId;
  }
  
  const existingChange = newState.stagedChanges.get(jobId);
  
  const stagedChange: StagedChange = {
    jobId,
    changeType,
    originalValues: existingChange?.originalValues ?? {
      jigId: originalJob.jigId,
      plannedDateStr: originalJob.plannedDateStr,
      plannedStartTime: originalJob.plannedStartTime,
      plannedEndTime: originalJob.plannedEndTime,
      plannedDurationMinutes: originalJob.plannedDurationMinutes,
      customDurationMinutes: originalJob.customDurationMinutes,
      breakAdjustmentMinutes: originalJob.breakAdjustmentMinutes
    },
    newValues: {
      ...(existingChange?.newValues ?? {}),
      ...(updates.jigId !== undefined && { jigId: updates.jigId }),
      ...(updates.plannedDateStr !== undefined && { plannedDateStr: updates.plannedDateStr }),
      ...(updates.plannedStartTime !== undefined && { plannedStartTime: updates.plannedStartTime }),
      ...(updates.plannedEndTime !== undefined && { plannedEndTime: updates.plannedEndTime }),
      ...(updates.plannedDurationMinutes !== undefined && { plannedDurationMinutes: updates.plannedDurationMinutes }),
      ...(updates.customDurationMinutes !== undefined && { customDurationMinutes: updates.customDurationMinutes }),
      ...(updates.breakAdjustmentMinutes !== undefined && { breakAdjustmentMinutes: updates.breakAdjustmentMinutes })
    },
    isPrimary: existingChange?.isPrimary ?? isPrimary,
    stagedAt: existingChange?.stagedAt ?? Date.now()
  };
  
  newState.stagedChanges.set(jobId, stagedChange);
  
  if (originalJob.plannedDateStr) {
    newState.affectedDates.add(originalJob.plannedDateStr);
  }
  if (updates.plannedDateStr) {
    newState.affectedDates.add(updates.plannedDateStr);
  }
  
  return newState;
}

/**
 * Removes a staged change for a job.
 * 
 * @param state - Current staging state
 * @param jobId - ID of the job to unstage
 * @returns New staging state with the change removed
 * 
 * @example
 * staging = unstageChange(staging, 'job-1');
 */
export function unstageChange(
  state: StagingState,
  jobId: string
): StagingState {
  const newState = cloneStagingState(state);
  
  newState.stagedChanges.delete(jobId);
  
  if (newState.primaryJobId === jobId) {
    newState.primaryJobId = null;
  }
  
  return newState;
}

/**
 * Checks if there are any staged changes.
 * 
 * @param state - Staging state to check
 * @returns True if there are pending changes
 * 
 * @example
 * if (hasChanges(staging)) {
 *   // Show commit button
 * }
 */
export function hasChanges(state: StagingState): boolean {
  return state.stagedChanges.size > 0;
}

/**
 * Gets the count of staged changes.
 * 
 * @param state - Staging state to check
 * @returns Number of staged changes
 * 
 * @example
 * const count = getChangeCount(staging);
 * // "3 changes pending"
 */
export function getChangeCount(state: StagingState): number {
  return state.stagedChanges.size;
}

/**
 * Gets the effective job state with pending changes applied.
 * 
 * @param state - Staging state containing changes
 * @param job - Original job to apply changes to
 * @returns Job with pending changes applied
 * 
 * @example
 * const effectiveJob = getEffectiveJobState(staging, originalJob);
 * // effectiveJob has pending updates merged in
 */
export function getEffectiveJobState(
  state: StagingState,
  job: ScheduledJob
): ScheduledJob {
  const stagedChange = state.stagedChanges.get(job.id);
  
  if (!stagedChange) {
    return job;
  }
  
  return {
    ...job,
    jigId: stagedChange.newValues.jigId ?? job.jigId,
    plannedDateStr: stagedChange.newValues.plannedDateStr ?? job.plannedDateStr,
    plannedStartTime: stagedChange.newValues.plannedStartTime ?? job.plannedStartTime,
    plannedEndTime: stagedChange.newValues.plannedEndTime ?? job.plannedEndTime,
    plannedDurationMinutes: stagedChange.newValues.plannedDurationMinutes ?? job.plannedDurationMinutes,
    customDurationMinutes: stagedChange.newValues.customDurationMinutes ?? job.customDurationMinutes,
    breakAdjustmentMinutes: stagedChange.newValues.breakAdjustmentMinutes ?? job.breakAdjustmentMinutes
  };
}

/**
 * Checks if a specific job has staged changes.
 * 
 * @param state - Staging state to check
 * @param jobId - Job ID to check
 * @returns True if the job has pending changes
 */
export function hasJobChanges(state: StagingState, jobId: string): boolean {
  return state.stagedChanges.has(jobId);
}

/**
 * Gets the staged change for a specific job.
 * 
 * @param state - Staging state
 * @param jobId - Job ID to get change for
 * @returns Staged change or undefined if none
 */
export function getStagedChange(
  state: StagingState,
  jobId: string
): StagedChange | undefined {
  return state.stagedChanges.get(jobId);
}

/**
 * Gets all affected dates from staged changes.
 * 
 * @param state - Staging state
 * @returns Array of date strings that have changes
 */
export function getAffectedDates(state: StagingState): string[] {
  return Array.from(state.affectedDates).sort();
}

/**
 * Builds persistence payloads for API updates.
 * Converts staged changes into the format needed for persistence.
 * 
 * @param state - Staging state with changes to persist
 * @returns Array of persistence payloads
 * 
 * @example
 * const payloads = buildPersistencePayloads(staging);
 * await Promise.all(payloads.map(p => api.updateJob(p)));
 */
export function buildPersistencePayloads(state: StagingState): PersistencePayload[] {
  const payloads: PersistencePayload[] = [];
  
  for (const [jobId, change] of state.stagedChanges) {
    const payload: PersistencePayload = {
      jobId,
      changeType: change.changeType,
      updates: {}
    };
    
    if (change.newValues.jigId !== undefined) {
      payload.updates.jigId = change.newValues.jigId;
    }
    if (change.newValues.plannedDateStr !== undefined) {
      payload.updates.plannedDateStr = change.newValues.plannedDateStr;
    }
    if (change.newValues.plannedStartTime !== undefined) {
      payload.updates.plannedStartTime = change.newValues.plannedStartTime;
    }
    if (change.newValues.plannedEndTime !== undefined) {
      payload.updates.plannedEndTime = change.newValues.plannedEndTime;
    }
    if (change.newValues.plannedDurationMinutes !== undefined) {
      payload.updates.plannedDurationMinutes = change.newValues.plannedDurationMinutes;
    }
    if (change.newValues.customDurationMinutes !== undefined) {
      payload.updates.customDurationMinutes = change.newValues.customDurationMinutes;
    }
    if (change.newValues.breakAdjustmentMinutes !== undefined) {
      payload.updates.breakAdjustmentMinutes = change.newValues.breakAdjustmentMinutes;
    }
    
    payloads.push(payload);
  }
  
  return payloads;
}

/**
 * Builds audit records for all staged changes.
 * Creates a comprehensive audit trail for reporting and history.
 * 
 * @param state - Staging state with changes
 * @param jobDetails - Map of job IDs to additional details
 * @returns Array of audit records
 * 
 * @example
 * const details = new Map([['job-1', { orderNumber: 'ORD-001', customer: 'Acme' }]]);
 * const audits = buildAuditRecords(staging, details);
 */
export function buildAuditRecords(
  state: StagingState,
  jobDetails: Map<string, JobDetails>
): AuditRecord[] {
  const records: AuditRecord[] = [];
  const now = Date.now();
  
  for (const [jobId, change] of state.stagedChanges) {
    const details = jobDetails.get(jobId) ?? {
      orderNumber: 'Unknown',
      customer: 'Unknown'
    };
    
    const record: AuditRecord = {
      jobId,
      orderNumber: details.orderNumber,
      customer: details.customer,
      changeType: change.changeType,
      previousValues: {
        jigId: change.originalValues.jigId,
        jigName: details.jigName,
        plannedDateStr: change.originalValues.plannedDateStr,
        plannedStartTime: change.originalValues.plannedStartTime,
        plannedEndTime: change.originalValues.plannedEndTime
      },
      newValues: {
        jigId: change.newValues.jigId ?? change.originalValues.jigId,
        jigName: details.jigName,
        plannedDateStr: change.newValues.plannedDateStr ?? change.originalValues.plannedDateStr,
        plannedStartTime: change.newValues.plannedStartTime ?? change.originalValues.plannedStartTime,
        plannedEndTime: change.newValues.plannedEndTime ?? change.originalValues.plannedEndTime
      },
      isPrimary: change.isPrimary,
      timestamp: now
    };
    
    records.push(record);
  }
  
  records.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return 0;
  });
  
  return records;
}

/**
 * Clears all staged changes.
 * 
 * @returns Fresh empty staging state
 */
export function clearStaging(): StagingState {
  return createEmptyStaging();
}

/**
 * Stages multiple changes at once.
 * Useful for batch operations like cascading.
 * 
 * @param state - Current staging state
 * @param changes - Array of changes to stage
 * @returns New staging state with all changes added
 * 
 * @example
 * const changes = [
 *   { jobId: 'job-1', originalJob, updates: { startTime: 480 }, changeType: 'cascade' },
 *   { jobId: 'job-2', originalJob2, updates: { startTime: 540 }, changeType: 'cascade' }
 * ];
 * staging = stageMultipleChanges(staging, changes);
 */
export function stageMultipleChanges(
  state: StagingState,
  changes: Array<{
    jobId: string;
    originalJob: ScheduledJob;
    updates: Partial<ScheduledJob>;
    changeType: ChangeType;
  }>
): StagingState {
  let newState = state;
  
  for (const change of changes) {
    newState = stageChange(
      newState,
      change.jobId,
      change.originalJob,
      change.updates,
      change.changeType
    );
  }
  
  return newState;
}

/**
 * Gets a summary of staged changes for display.
 * 
 * @param state - Staging state
 * @returns Object with change counts by type
 */
export function getStagingSummary(state: StagingState): {
  total: number;
  allocations: number;
  cascades: number;
  rollovers: number;
  unallocations: number;
  affectedDays: number;
} {
  let allocations = 0;
  let cascades = 0;
  let rollovers = 0;
  let unallocations = 0;
  
  for (const change of state.stagedChanges.values()) {
    switch (change.changeType) {
      case 'allocate':
        allocations++;
        break;
      case 'cascade':
        cascades++;
        break;
      case 'rollover':
        rollovers++;
        break;
      case 'unallocate':
        unallocations++;
        break;
    }
  }
  
  return {
    total: state.stagedChanges.size,
    allocations,
    cascades,
    rollovers,
    unallocations,
    affectedDays: state.affectedDates.size
  };
}

/**
 * Checks if a specific date is affected by staged changes.
 * 
 * @param state - Staging state
 * @param dateStr - Date string to check
 * @returns True if the date has changes
 */
export function isDateAffected(state: StagingState, dateStr: string): boolean {
  return state.affectedDates.has(dateStr);
}

/**
 * Gets all staged changes for jobs on a specific date.
 * 
 * @param state - Staging state
 * @param dateStr - Date string to filter by
 * @returns Map of job IDs to staged changes for that date
 */
export function getChangesForDate(
  state: StagingState,
  dateStr: string
): Map<string, StagedChange> {
  const changes = new Map<string, StagedChange>();
  
  for (const [jobId, change] of state.stagedChanges) {
    const affectsDate =
      change.originalValues.plannedDateStr === dateStr ||
      change.newValues.plannedDateStr === dateStr;
    
    if (affectsDate) {
      changes.set(jobId, change);
    }
  }
  
  return changes;
}
