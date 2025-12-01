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
  change: PendingJobChange
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
    activeJobId: change.id
  };
}

export function getActiveJobId(state: PendingChangesState): string | null {
  return state.activeJobId;
}

export function isJobLocked(state: PendingChangesState, jobId: string): boolean {
  return state.activeJobId !== null && state.activeJobId !== jobId;
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
