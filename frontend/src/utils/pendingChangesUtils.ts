export interface PendingJobChange {
  id: string;
  originalData: {
    jigId: string | null;
    plannedDateStr: string | null;
    plannedStartTime: number | null;
    plannedEndTime: number | null;
    plannedDurationMinutes: number | null;
    customDurationMinutes?: number;
    breakAdjustmentMinutes?: number | null;
  };
  pendingData: {
    jigId?: string | null;
    plannedDateStr?: string | null;
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
    plannedDurationMinutes?: number | null;
    customDurationMinutes?: number | null;
    breakAdjustmentMinutes?: number | null;
  };
  changeType: 'allocate' | 'unallocate' | 'resize' | 'rollover' | 'reorder';
}

export interface PendingChangesState {
  changes: Map<string, PendingJobChange>;
  affectedDays: Set<string>;
  rolloverTargetDay?: string;
  activeJobId: string | null;
}

export function createEmptyPendingState(): PendingChangesState {
  return {
    changes: new Map(),
    affectedDays: new Set(),
    activeJobId: null
  };
}

export function hasPendingChanges(state: PendingChangesState): boolean {
  return state.changes.size > 0;
}

export function getPendingChangesForDay(
  state: PendingChangesState,
  dateStr: string
): PendingJobChange[] {
  const result: PendingJobChange[] = [];
  for (const change of state.changes.values()) {
    if (
      change.pendingData.plannedDateStr === dateStr ||
      change.originalData.plannedDateStr === dateStr
    ) {
      result.push(change);
    }
  }
  return result;
}

export function dayHasPendingChanges(
  state: PendingChangesState,
  dateStr: string
): boolean {
  return state.affectedDays.has(dateStr);
}

export function addPendingChange(
  state: PendingChangesState,
  change: PendingJobChange,
  isPrimaryChange: boolean = true
): PendingChangesState {
  const newChanges = new Map(state.changes);
  newChanges.set(change.id, change);
  
  const newAffectedDays = new Set(state.affectedDays);
  if (change.originalData.plannedDateStr) {
    newAffectedDays.add(change.originalData.plannedDateStr);
  }
  if (change.pendingData.plannedDateStr) {
    newAffectedDays.add(change.pendingData.plannedDateStr);
  }
  
  return {
    changes: newChanges,
    affectedDays: newAffectedDays,
    rolloverTargetDay: change.changeType === 'rollover' 
      ? change.pendingData.plannedDateStr || state.rolloverTargetDay
      : state.rolloverTargetDay,
    activeJobId: isPrimaryChange ? change.id : state.activeJobId
  };
}

export function getActiveJobId(state: PendingChangesState): string | null {
  return state.activeJobId;
}

export function isJobLocked(state: PendingChangesState, jobId: string): boolean {
  return state.activeJobId !== null && state.activeJobId !== jobId;
}

/**
 * Calculate the next job start time considering:
 * 1. 30-minute gap after previous job
 * 2. If gap end falls within 15 min of a break start, snap to break end
 */
function calculateGapAdjustedStart(previousEndTime: number): number {
  const GAP_MINUTES = 30;
  const BREAK_PROXIMITY_MINUTES = 15;
  
  const breaks = [
    { start: 9 * 60, end: 9 * 60 + 15 },      // 9:00-9:15
    { start: 12 * 60, end: 12 * 60 + 30 },    // 12:00-12:30
    { start: 14 * 60 + 30, end: 14 * 60 + 45 } // 14:30-14:45
  ];
  
  const gapEndTime = previousEndTime + GAP_MINUTES;
  
  // Check if gap end falls within 15 min of any break start or inside a break
  for (const brk of breaks) {
    if (gapEndTime >= brk.start - BREAK_PROXIMITY_MINUTES && gapEndTime < brk.end) {
      return brk.end;
    }
  }
  
  // If we're inside a break, skip to break end
  for (const brk of breaks) {
    if (gapEndTime >= brk.start && gapEndTime < brk.end) {
      return brk.end;
    }
  }
  
  return gapEndTime;
}

/**
 * Detect if a job overlaps with another job on the same jig/day
 * Returns the first overlapping job ID if found
 * Uses gap + break proximity rules for overlap detection
 */
export function findFirstOverlappingJob(
  activeJobId: string,
  activeEndTime: number,
  jigId: string | null,
  dateStr: string | null,
  allJobs: Array<{
    id: string;
    jigId: string | null;
    plannedDateStr: string | null;
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
    productionComplete?: boolean;
  }>
): string | null {
  if (!jigId || !dateStr) return null;
  
  // Calculate where the next job should start (with gap + break proximity)
  const nextJobStart = calculateGapAdjustedStart(activeEndTime);
  
  // Find jobs on the same jig/day, sorted by start time
  const jobsOnTeamDay = allJobs
    .filter(j => 
      j.id !== activeJobId && 
      j.plannedDateStr === dateStr && 
      j.jigId === jigId &&
      !j.productionComplete &&
      j.plannedStartTime != null
    )
    .sort((a, b) => (a.plannedStartTime ?? 0) - (b.plannedStartTime ?? 0));
  
  // Find the first job that starts before where the next job should start
  for (const job of jobsOnTeamDay) {
    if (job.plannedStartTime != null && job.plannedStartTime < nextJobStart) {
      return job.id;
    }
  }
  
  return null;
}

export function getPendingChangeForJob(state: PendingChangesState, jobId: string): PendingJobChange | undefined {
  return state.changes.get(jobId);
}

export function clearPendingChanges(): PendingChangesState {
  return createEmptyPendingState();
}

export function buildUpdatePayload(change: PendingJobChange): Record<string, any> {
  const payload: Record<string, any> = {};
  
  if (change.pendingData.jigId !== undefined) {
    payload.jigId = change.pendingData.jigId;
  }
  if (change.pendingData.plannedDateStr !== undefined) {
    payload.productionPlannedDate = change.pendingData.plannedDateStr;
  }
  if (change.pendingData.plannedStartTime !== undefined) {
    payload.plannedStartTime = change.pendingData.plannedStartTime;
  }
  if (change.pendingData.plannedEndTime !== undefined) {
    payload.plannedEndTime = change.pendingData.plannedEndTime;
  }
  if (change.pendingData.plannedDurationMinutes !== undefined) {
    payload.plannedDurationMinutes = change.pendingData.plannedDurationMinutes;
  }
  if (change.pendingData.customDurationMinutes !== undefined) {
    payload.customDurationMinutes = change.pendingData.customDurationMinutes;
  }
  if (change.pendingData.breakAdjustmentMinutes !== undefined) {
    payload.breakAdjustmentMinutes = change.pendingData.breakAdjustmentMinutes;
  }
  
  return payload;
}
