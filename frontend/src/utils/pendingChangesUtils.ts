export interface StagedJobData {
  jigId: string | null;
  plannedDateStr: string | null;
  plannedStartTime: number | null;
  plannedEndTime: number | null;
  plannedDurationMinutes: number | null;
  customDurationMinutes?: number | null;
  breakAdjustmentMinutes?: number | null;
}

export interface StagedJob {
  id: string;
  originalData: StagedJobData;
  pendingData: Partial<StagedJobData>;
  changeType: 'allocate' | 'unallocate' | 'resize' | 'move' | 'reorder';
  isPrimary: boolean;
}

export interface GlobalStagingState {
  stagedJobs: Map<string, StagedJob>;
  affectedDays: Set<string>;
  primaryJobId: string | null;
}

const BUFFER_MINUTES = 15;
const MINUTES_PER_EFINK = 6.5625;

export function createEmptyStagingState(): GlobalStagingState {
  return {
    stagedJobs: new Map(),
    affectedDays: new Set(),
    primaryJobId: null
  };
}

export function hasStagedChanges(state: GlobalStagingState): boolean {
  return state.stagedJobs.size > 0;
}

export function getStagedJobCount(state: GlobalStagingState): number {
  return state.stagedJobs.size;
}

export function isJobStaged(state: GlobalStagingState, jobId: string): boolean {
  return state.stagedJobs.has(jobId);
}

export function getStagedJob(state: GlobalStagingState, jobId: string): StagedJob | undefined {
  return state.stagedJobs.get(jobId);
}

export function getStagedJobsForDay(state: GlobalStagingState, dateStr: string): StagedJob[] {
  const result: StagedJob[] = [];
  for (const staged of state.stagedJobs.values()) {
    const pendingDate = staged.pendingData.plannedDateStr;
    const originalDate = staged.originalData.plannedDateStr;
    if (pendingDate === dateStr || (pendingDate === undefined && originalDate === dateStr)) {
      result.push(staged);
    }
  }
  return result;
}

export function roundUpToQuarterHour(minutes: number): number {
  return Math.ceil(minutes / 15) * 15;
}

export function snapToQuarterHour(minutes: number): number {
  return Math.round(minutes / 15) * 15;
}

export function getDefaultEfinksDuration(estimatedEFinks?: number): number {
  const efinks = estimatedEFinks || 0;
  const rawMinutes = efinks * MINUTES_PER_EFINK;
  return Math.max(15, roundUpToQuarterHour(rawMinutes));
}

export function isManuallyAltered(job: {
  customDurationMinutes?: number | null;
  estimatedEFinks?: number;
}): boolean {
  if (!job.customDurationMinutes) return false;
  const defaultDuration = getDefaultEfinksDuration(job.estimatedEFinks);
  return job.customDurationMinutes !== defaultDuration;
}

export function stageJob(
  state: GlobalStagingState,
  job: {
    id: string;
    jigId: string | null;
    plannedDateStr: string | null;
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
    plannedDurationMinutes?: number | null;
    customDurationMinutes?: number | null;
    breakAdjustmentMinutes?: number | null;
  },
  isPrimary: boolean = true,
  changeType: StagedJob['changeType'] = 'move'
): GlobalStagingState {
  const newStagedJobs = new Map(state.stagedJobs);
  const newAffectedDays = new Set(state.affectedDays);

  const stagedJob: StagedJob = {
    id: job.id,
    originalData: {
      jigId: job.jigId,
      plannedDateStr: job.plannedDateStr,
      plannedStartTime: job.plannedStartTime ?? null,
      plannedEndTime: job.plannedEndTime ?? null,
      plannedDurationMinutes: job.plannedDurationMinutes ?? null,
      customDurationMinutes: job.customDurationMinutes ?? null,
      breakAdjustmentMinutes: job.breakAdjustmentMinutes ?? null
    },
    pendingData: {},
    changeType,
    isPrimary
  };

  newStagedJobs.set(job.id, stagedJob);
  
  if (job.plannedDateStr) {
    newAffectedDays.add(job.plannedDateStr);
  }

  return {
    stagedJobs: newStagedJobs,
    affectedDays: newAffectedDays,
    primaryJobId: isPrimary ? job.id : state.primaryJobId
  };
}

export function stageMultipleJobs(
  state: GlobalStagingState,
  primaryJob: {
    id: string;
    jigId: string | null;
    plannedDateStr: string | null;
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
    plannedDurationMinutes?: number | null;
    customDurationMinutes?: number | null;
    breakAdjustmentMinutes?: number | null;
  },
  affectedJobs: Array<{
    id: string;
    jigId: string | null;
    plannedDateStr: string | null;
    plannedStartTime?: number | null;
    plannedEndTime?: number | null;
    plannedDurationMinutes?: number | null;
    customDurationMinutes?: number | null;
    breakAdjustmentMinutes?: number | null;
  }>,
  changeType: StagedJob['changeType'] = 'move'
): GlobalStagingState {
  let newState = stageJob(state, primaryJob, true, changeType);
  
  for (const job of affectedJobs) {
    newState = stageJob(newState, job, false, 'reorder');
  }
  
  return newState;
}

export function updateStagedJob(
  state: GlobalStagingState,
  jobId: string,
  updates: Partial<StagedJobData>,
  changeType?: StagedJob['changeType']
): GlobalStagingState {
  const existingStaged = state.stagedJobs.get(jobId);
  if (!existingStaged) return state;

  const newStagedJobs = new Map(state.stagedJobs);
  const newAffectedDays = new Set(state.affectedDays);

  const updatedStaged: StagedJob = {
    ...existingStaged,
    pendingData: {
      ...existingStaged.pendingData,
      ...updates
    },
    changeType: changeType || existingStaged.changeType
  };

  newStagedJobs.set(jobId, updatedStaged);

  if (updates.plannedDateStr) {
    newAffectedDays.add(updates.plannedDateStr);
  }

  return {
    stagedJobs: newStagedJobs,
    affectedDays: newAffectedDays,
    primaryJobId: state.primaryJobId
  };
}

export function unstageSingleJob(
  state: GlobalStagingState,
  jobId: string
): GlobalStagingState {
  if (!state.stagedJobs.has(jobId)) return state;

  const newStagedJobs = new Map(state.stagedJobs);
  newStagedJobs.delete(jobId);

  const newAffectedDays = new Set<string>();
  for (const staged of newStagedJobs.values()) {
    if (staged.originalData.plannedDateStr) {
      newAffectedDays.add(staged.originalData.plannedDateStr);
    }
    if (staged.pendingData.plannedDateStr) {
      newAffectedDays.add(staged.pendingData.plannedDateStr);
    }
  }

  return {
    stagedJobs: newStagedJobs,
    affectedDays: newAffectedDays,
    primaryJobId: state.primaryJobId === jobId ? null : state.primaryJobId
  };
}

export function clearAllStaged(): GlobalStagingState {
  return createEmptyStagingState();
}

export function getEffectiveValue<K extends keyof StagedJobData>(
  staged: StagedJob,
  key: K
): StagedJobData[K] {
  if (key in staged.pendingData && staged.pendingData[key] !== undefined) {
    return staged.pendingData[key] as StagedJobData[K];
  }
  return staged.originalData[key];
}

export function hasJobChanged(staged: StagedJob): boolean {
  const keys: (keyof StagedJobData)[] = [
    'jigId', 'plannedDateStr', 'plannedStartTime', 
    'plannedEndTime', 'plannedDurationMinutes', 'customDurationMinutes'
  ];
  
  for (const key of keys) {
    if (key in staged.pendingData && staged.pendingData[key] !== undefined) {
      if (staged.pendingData[key] !== staged.originalData[key]) {
        return true;
      }
    }
  }
  return false;
}

export function buildBatchUpdatePayloads(state: GlobalStagingState): Array<{
  id: string;
  payload: Record<string, any>;
}> {
  const results: Array<{ id: string; payload: Record<string, any> }> = [];
  
  for (const staged of state.stagedJobs.values()) {
    if (!hasJobChanged(staged)) continue;
    
    const payload: Record<string, any> = {};
    
    if (staged.pendingData.jigId !== undefined) {
      payload.jigId = staged.pendingData.jigId;
    }
    if (staged.pendingData.plannedDateStr !== undefined) {
      payload.productionPlannedDate = staged.pendingData.plannedDateStr;
    }
    if (staged.pendingData.plannedStartTime !== undefined) {
      payload.plannedStartTime = staged.pendingData.plannedStartTime;
    }
    if (staged.pendingData.plannedEndTime !== undefined) {
      payload.plannedEndTime = staged.pendingData.plannedEndTime;
    }
    if (staged.pendingData.plannedDurationMinutes !== undefined) {
      payload.plannedDurationMinutes = staged.pendingData.plannedDurationMinutes;
    }
    if (staged.pendingData.customDurationMinutes !== undefined) {
      payload.customDurationMinutes = staged.pendingData.customDurationMinutes;
    }
    if (staged.pendingData.breakAdjustmentMinutes !== undefined) {
      payload.breakAdjustmentMinutes = staged.pendingData.breakAdjustmentMinutes;
    }
    
    if (Object.keys(payload).length > 0) {
      results.push({ id: staged.id, payload });
    }
  }
  
  return results;
}

export function findAffectedJobs(
  primaryJobId: string,
  primaryEndTime: number,
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
): string[] {
  if (!jigId || !dateStr) return [];
  
  const nextAllowedStart = primaryEndTime + BUFFER_MINUTES;
  
  const affectedIds: string[] = [];
  
  const jobsOnTeamDay = allJobs
    .filter(j => 
      j.id !== primaryJobId && 
      j.plannedDateStr === dateStr && 
      j.jigId === jigId &&
      !j.productionComplete &&
      j.plannedStartTime != null
    )
    .sort((a, b) => (a.plannedStartTime ?? 0) - (b.plannedStartTime ?? 0));
  
  for (const job of jobsOnTeamDay) {
    if (job.plannedStartTime != null && job.plannedStartTime < nextAllowedStart) {
      affectedIds.push(job.id);
    }
  }
  
  return affectedIds;
}

export function getBufferMinutes(): number {
  return BUFFER_MINUTES;
}

export interface PendingJobChange {
  id: string;
  originalData: StagedJobData;
  pendingData: Partial<StagedJobData>;
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
