import type { StagedJob } from './pendingChangesUtils';
import { getEffectiveValue } from './pendingChangesUtils';

interface Job {
  id: string;
  name: string;
  orderNumber: string;
  customer: string;
  estimatedEFinks: number;
  customDurationMinutes?: number;
  plannedDateStr: string | null;
  jigId: string | null;
  productionComplete: boolean;
  parentProductionId?: string;
  rolloverSequence?: number;
  createdOn?: string;
  plannedStartTime?: number | null;
  plannedEndTime?: number | null;
  plannedDurationMinutes?: number | null;
  breakAdjustmentMinutes?: number | null;
}

const UNPLANNED_DAY_KEY = '__UNPLANNED__';
const NO_JIG_KEY = '__NO_JIG__';

type DayKey = string;
type BucketKey = `${DayKey}|${string}`;

interface JobRecord {
  base: Job;
  staged?: StagedJob;
  effective: Job;
  bucket: BucketKey;
}

interface JobBucket {
  key: BucketKey;
  day: DayKey;
  jig: string;
  jobs: Job[];
  version: number;
}

export interface IndexedJobStore {
  replaceBaseJobs(next: Job[]): Set<DayKey>;
  syncStaging(next: Map<string, StagedJob>): Set<DayKey>;
  getJobsForDay(day: string, jigFilter?: string[] | null): Job[];
  getJobsForDayAndJig(day: string, jigId: string | null): Job[];
  getUnallocatedJobs(): Job[];
  snapshotAll(): Job[];
  getAllVersion(): number;
  getJobById(id: string): Job | undefined;
}

function getBucketKey(dayStr: string | null, jigId: string | null): BucketKey {
  const day = dayStr || UNPLANNED_DAY_KEY;
  const jig = jigId || NO_JIG_KEY;
  return `${day}|${jig}` as BucketKey;
}

function parseBucketKey(key: BucketKey): { day: DayKey; jig: string } {
  const [day, jig] = key.split('|');
  return { day, jig };
}

export function createIndexedJobStore(initial: Job[] = []): IndexedJobStore {
  const records = new Map<string, JobRecord>();
  const buckets = new Map<BucketKey, JobBucket>();
  const dayVersions = new Map<DayKey, number>();
  let allVersion = 0;
  let allJobsCache: Job[] = [];
  let lastStagingRef: Map<string, StagedJob> | null = null;
  
  const dayCaches = new Map<string, { jigFilter: string | null; jobs: Job[]; version: number }>();

  function getOrCreateBucket(key: BucketKey): JobBucket {
    let bucket = buckets.get(key);
    if (!bucket) {
      const { day, jig } = parseBucketKey(key);
      bucket = { key, day, jig, jobs: [], version: 0 };
      buckets.set(key, bucket);
    }
    return bucket;
  }

  function computeEffectiveJob(base: Job, staged?: StagedJob): Job {
    if (!staged) return base;
    return {
      ...base,
      jigId: getEffectiveValue(staged, 'jigId') ?? base.jigId,
      plannedDateStr: getEffectiveValue(staged, 'plannedDateStr') ?? base.plannedDateStr,
      plannedStartTime: getEffectiveValue(staged, 'plannedStartTime') ?? base.plannedStartTime,
      plannedEndTime: getEffectiveValue(staged, 'plannedEndTime') ?? base.plannedEndTime,
      plannedDurationMinutes: getEffectiveValue(staged, 'plannedDurationMinutes') ?? base.plannedDurationMinutes,
      customDurationMinutes: getEffectiveValue(staged, 'customDurationMinutes') ?? base.customDurationMinutes,
      breakAdjustmentMinutes: getEffectiveValue(staged, 'breakAdjustmentMinutes') ?? base.breakAdjustmentMinutes
    };
  }

  function bumpDayVersion(day: DayKey): void {
    dayVersions.set(day, (dayVersions.get(day) || 0) + 1);
  }

  function rebuildBuckets(): void {
    buckets.clear();
    
    for (const [_jobId, record] of records) {
      const bucketKey = getBucketKey(record.effective.plannedDateStr, record.effective.jigId);
      const bucket = getOrCreateBucket(bucketKey);
      bucket.jobs.push(record.effective);
      record.bucket = bucketKey;
    }
    
    for (const bucket of buckets.values()) {
      bucket.version++;
      bumpDayVersion(bucket.day);
    }
  }

  function rebuildAllJobsCache(): void {
    allJobsCache = Array.from(records.values()).map(r => r.effective);
    allVersion++;
  }

  function replaceBaseJobs(next: Job[]): Set<DayKey> {
    const touched = new Set<DayKey>();
    
    records.clear();
    
    for (const job of next) {
      const bucketKey = getBucketKey(job.plannedDateStr, job.jigId);
      records.set(job.id, {
        base: job,
        staged: undefined,
        effective: job,
        bucket: bucketKey
      });
      touched.add(job.plannedDateStr || UNPLANNED_DAY_KEY);
    }
    
    rebuildBuckets();
    
    if (lastStagingRef && lastStagingRef.size > 0) {
      const stagingTouched = syncStaging(lastStagingRef);
      for (const day of stagingTouched) touched.add(day);
    }
    
    rebuildAllJobsCache();
    dayCaches.clear();
    
    return touched;
  }

  function syncStaging(next: Map<string, StagedJob>): Set<DayKey> {
    const touched = new Set<DayKey>();
    
    if (next === lastStagingRef) {
      return touched;
    }
    
    const previouslyStaged = new Set<string>();
    for (const [jobId, record] of records) {
      if (record.staged) {
        previouslyStaged.add(jobId);
      }
    }
    
    for (const jobId of previouslyStaged) {
      if (!next.has(jobId)) {
        const record = records.get(jobId);
        if (record) {
          const oldBucket = record.bucket;
          const { day: oldDay } = parseBucketKey(oldBucket);
          touched.add(oldDay);
          
          record.staged = undefined;
          record.effective = record.base;
          const newBucket = getBucketKey(record.effective.plannedDateStr, record.effective.jigId);
          
          if (newBucket !== oldBucket) {
            const { day: newDay } = parseBucketKey(newBucket);
            touched.add(newDay);
            record.bucket = newBucket;
          }
        }
      }
    }
    
    for (const [jobId, staged] of next) {
      const record = records.get(jobId);
      if (record) {
        const oldBucket = record.bucket;
        const { day: oldDay } = parseBucketKey(oldBucket);
        
        record.staged = staged;
        record.effective = computeEffectiveJob(record.base, staged);
        
        const newBucket = getBucketKey(record.effective.plannedDateStr, record.effective.jigId);
        
        if (newBucket !== oldBucket) {
          touched.add(oldDay);
          const { day: newDay } = parseBucketKey(newBucket);
          touched.add(newDay);
          record.bucket = newBucket;
        } else {
          touched.add(oldDay);
        }
      }
    }
    
    if (touched.size > 0) {
      rebuildBuckets();
      rebuildAllJobsCache();
      
      for (const day of touched) {
        const cacheKey = `${day}|all`;
        dayCaches.delete(cacheKey);
      }
    }
    
    lastStagingRef = next;
    
    return touched;
  }

  function getJobsForDay(day: string, jigFilter?: string[] | null): Job[] {
    const effectiveDay = day || UNPLANNED_DAY_KEY;
    const filterKey = jigFilter ? jigFilter.sort().join(',') : 'all';
    const cacheKey = `${effectiveDay}|${filterKey}`;
    
    const cached = dayCaches.get(cacheKey);
    const currentDayVersion = dayVersions.get(effectiveDay) || 0;
    
    if (cached && cached.version === currentDayVersion) {
      return cached.jobs;
    }
    
    const result: Job[] = [];
    
    for (const bucket of buckets.values()) {
      if (bucket.day !== effectiveDay) continue;
      
      if (jigFilter && jigFilter.length > 0) {
        const actualJig = bucket.jig === NO_JIG_KEY ? null : bucket.jig;
        if (actualJig === null || !jigFilter.includes(actualJig)) continue;
      }
      
      result.push(...bucket.jobs);
    }
    
    dayCaches.set(cacheKey, { jigFilter: filterKey, jobs: result, version: currentDayVersion });
    
    return result;
  }

  function getJobsForDayAndJig(day: string, jigId: string | null): Job[] {
    const bucketKey = getBucketKey(day, jigId);
    const bucket = buckets.get(bucketKey);
    return bucket ? bucket.jobs : [];
  }

  function getUnallocatedJobs(): Job[] {
    const result: Job[] = [];
    
    for (const bucket of buckets.values()) {
      if (bucket.day === UNPLANNED_DAY_KEY || bucket.jig === NO_JIG_KEY) {
        result.push(...bucket.jobs);
      }
    }
    
    return result;
  }

  function snapshotAll(): Job[] {
    return allJobsCache;
  }

  function getAllVersion(): number {
    return allVersion;
  }

  function getJobById(id: string): Job | undefined {
    const record = records.get(id);
    return record?.effective;
  }

  if (initial.length > 0) {
    replaceBaseJobs(initial);
  }

  return {
    replaceBaseJobs,
    syncStaging,
    getJobsForDay,
    getJobsForDayAndJig,
    getUnallocatedJobs,
    snapshotAll,
    getAllVersion,
    getJobById
  };
}
