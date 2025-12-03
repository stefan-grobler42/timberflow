import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stack, Text, CommandBar, Spinner, MessageBar, MessageBarType, Dropdown,
  PrimaryButton, DefaultButton, Icon
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { productionService, d365OrderService } from '../services/d365Services';
import { jigService, productionAuditService } from '../services/millenniumServices';
import type { CreateProductionAuditDto } from '../services/millenniumServices';
import type { Jig, D365Order } from '../types/millennium';
import { MonthView } from '../components/ProductionPlanner/MonthView';
import { WeekView } from '../components/ProductionPlanner/WeekView';
import { DayView } from '../components/ProductionPlanner/DayView';
import { 
  startOfMonthUtc, 
  startOfWeekUtc, 
  formatIsoDateLocal, 
  addMonths, 
  addDays, 
  getDaysInMonth, 
  getDaysInWeek 
} from '../utils/dateUtils';
import * as PlannerV2 from '../domain/plannerV2';

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


export const ProductionPlannerPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jigTeams, setJigTeams] = useState<Jig[]>([]);
  const [selectedJigIds, setSelectedJigIds] = useState<string[]>([]);
  const [unallocatedOrders, setUnallocatedOrders] = useState<Job[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [currentDateStr, setCurrentDateStr] = useState(() => startOfMonthUtc(new Date()));
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [_selectedDayStr, _setSelectedDayStr] = useState<string | null>(null);
  const [basketCollapsed, setBasketCollapsed] = useState(true);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [overtimeByDay, setOvertimeByDay] = useState<Record<string, { enabled: boolean; closeTime: string }>>({});
  const [globalStaging, setGlobalStaging] = useState<PlannerV2.StagingState>(PlannerV2.createEmptyStaging());
  const [isSaving, setIsSaving] = useState(false);
  

  const loadData = async () => {
    console.log('[PLANNER] Starting to load data...');
    setLoading(true);
    setError(null);
    try {
      // SIMPLIFIED: Load productions, jigs, and orders only
      // Production.jigId is the source of truth for team assignment
      const [productions, jigs, orders] = await Promise.all([
        productionService.getAll(),
        jigService.getAll(),
        d365OrderService.getAll()
      ]);
      
      console.log(`[PLANNER] ✓ Loaded ${productions.length} productions`);
      console.log(`[PLANNER] ✓ Loaded ${jigs.length} jig teams`);
      console.log(`[PLANNER] ✓ Loaded ${orders.length} sales orders`);
      
      // Map productions to jobs using Production.jigId as source of truth
      const jobList: Job[] = productions.map((p: any) => ({
        id: p.id,
        name: p.name || '',
        orderNumber: p.orderNumber || p.name || 'N/A',
        customer: p.customerName || 'Unknown',
        estimatedEFinks: p.newEstimateDefinks || 0,
        customDurationMinutes: p.customDurationMinutes || undefined,
        plannedDateStr: formatIsoDateLocal(p.productionPlannedDate),
        jigId: p.jigId || null, // Direct from Production record
        productionComplete: p.productionComplete === true,
        parentProductionId: p.parentProductionId || undefined,
        rolloverSequence: p.rolloverSequence || undefined,
        createdOn: p.createdOn || undefined,
        plannedStartTime: p.plannedStartTime ?? null,
        plannedEndTime: p.plannedEndTime ?? null,
        plannedDurationMinutes: p.plannedDurationMinutes ?? null,
        breakAdjustmentMinutes: p.breakAdjustmentMinutes ?? null
      }));
      
      console.log(`[PLANNER] ✓ Mapped ${jobList.length} production jobs (${jobList.filter(j => j.productionComplete).length} completed)`);
      
      // Find sales orders that require production but don't have production records yet
      const productionOrderIds = new Set(productions.map((p: any) => p.orderNo).filter(Boolean));
      const ordersNeedingProduction = orders
        .filter((o: D365Order) => o.productionRequired === true && !productionOrderIds.has(o.id))
        .map((o: D365Order) => ({
          id: `order-${o.id}`,
          name: o.name || '',
          orderNumber: o.orderNumber || o.name || 'N/A',
          customer: o.customerName || 'Unknown',
          estimatedEFinks: o.estimatedEFinks || 0,
          plannedDateStr: null,
          jigId: null,
          productionComplete: false
        }));
      
      console.log(`[PLANNER] ✓ Found ${ordersNeedingProduction.length} sales orders without production records`);
      
      setJobs(jobList);
      setUnallocatedOrders(ordersNeedingProduction);
      setJigTeams(jigs);
      if (selectedJigIds.length === 0) {
        setSelectedJigIds(jigs.map(j => j.id));
      }
      setLoading(false);
      console.log(`[PLANNER] ✓ State updated: loading=false, jobs.length=${jobList.length}, unallocatedOrders=${ordersNeedingProduction.length}`);
    } catch (err) {
      console.error('[PLANNER] ✗ Error loading:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[PLANNER] Component mounted, calling loadData()');
    loadData();
  }, []);

  // Stable base jobs array - only changes when jobs/unallocatedOrders change
  const baseJobs = useMemo(() => {
    return [...jobs, ...unallocatedOrders];
  }, [jobs, unallocatedOrders]);

  // Chain jobs map - stable, only changes when baseJobs changes (not on staging updates)
  // This is used for rollover chain detection and doesn't need staging overlays
  const chainJobsMap = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of baseJobs) {
      const rootId = job.parentProductionId || job.id;
      const existing = map.get(rootId) || [];
      existing.push(job);
      map.set(rootId, existing);
    }
    return map;
  }, [baseJobs]);

  // Cache for allJobs to avoid unnecessary recreations
  const allJobsCache = useRef<Job[]>([]);
  const lastBaseJobsRef = useRef<Job[]>([]);
  const lastStagingMapRef = useRef<Map<string, any>>(new Map());

  // Compute allJobs with staging overlay - stable references when unchanged
  const allJobs = useMemo(() => {
    // Fast path: no staging changes, return baseJobs directly
    if (globalStaging.stagedChanges.size === 0) {
      if (baseJobs !== lastBaseJobsRef.current) {
        lastBaseJobsRef.current = baseJobs;
        allJobsCache.current = baseJobs;
      }
      return allJobsCache.current;
    }

    // Check if anything actually changed
    const stagingChanged = globalStaging.stagedChanges !== lastStagingMapRef.current;
    const baseChanged = baseJobs !== lastBaseJobsRef.current;
    
    if (!stagingChanged && !baseChanged && allJobsCache.current.length > 0) {
      return allJobsCache.current;
    }

    // Build result with staging overlays
    const result: Job[] = baseJobs.map(job => {
      const staged = globalStaging.stagedChanges.get(job.id);
      if (!staged) return job;
      
      return { 
        ...job,
        jigId: staged.newValues.jigId !== undefined ? staged.newValues.jigId : job.jigId,
        plannedDateStr: staged.newValues.plannedDateStr !== undefined ? staged.newValues.plannedDateStr : job.plannedDateStr,
        plannedStartTime: staged.newValues.plannedStartTime !== undefined ? staged.newValues.plannedStartTime : job.plannedStartTime,
        plannedEndTime: staged.newValues.plannedEndTime !== undefined ? staged.newValues.plannedEndTime : job.plannedEndTime,
        plannedDurationMinutes: staged.newValues.plannedDurationMinutes !== undefined ? staged.newValues.plannedDurationMinutes : job.plannedDurationMinutes,
        customDurationMinutes: staged.newValues.customDurationMinutes !== undefined 
          ? (staged.newValues.customDurationMinutes === null ? undefined : staged.newValues.customDurationMinutes) 
          : job.customDurationMinutes,
        breakAdjustmentMinutes: staged.newValues.breakAdjustmentMinutes !== undefined 
          ? (staged.newValues.breakAdjustmentMinutes === null ? undefined : staged.newValues.breakAdjustmentMinutes)
          : job.breakAdjustmentMinutes
      };
    });

    lastBaseJobsRef.current = baseJobs;
    lastStagingMapRef.current = globalStaging.stagedChanges;
    allJobsCache.current = result;
    return result;
  }, [baseJobs, globalStaging]);

  // Memoized map of jobs by date and team for efficient lookups (excludes unallocated jobs)
  const jobsByDateAndTeam = useMemo(() => {
    const map = new Map<string, Map<string, Job[]>>();
    
    for (const job of allJobs) {
      // Skip unallocated jobs - they don't follow scheduling rules
      if (!job.plannedDateStr || !job.jigId) continue;
      
      if (!map.has(job.plannedDateStr)) {
        map.set(job.plannedDateStr, new Map());
      }
      const dayMap = map.get(job.plannedDateStr)!;
      if (!dayMap.has(job.jigId)) {
        dayMap.set(job.jigId, []);
      }
      dayMap.get(job.jigId)!.push(job);
    }
    
    return map;
  }, [allJobs]);
  
  // Helper to find affected jobs using efficient map lookup
  const findAffectedJobsOptimized = useCallback((
    sourceJobId: string,
    sourceEndTime: number,
    jigId: string,
    dateStr: string
  ): Job[] => {
    // Get jobs for this specific date and team only (fast O(1) lookup)
    const dayMap = jobsByDateAndTeam.get(dateStr);
    if (!dayMap) return [];
    
    const teamJobs = dayMap.get(jigId);
    if (!teamJobs) return [];
    
    // Filter to jobs that start at or after the source job's end time
    return teamJobs.filter(job => 
      job.id !== sourceJobId && 
      job.plannedStartTime !== null && 
      job.plannedStartTime !== undefined &&
      job.plannedStartTime >= sourceEndTime
    );
  }, [jobsByDateAndTeam]);

  // Convert Job to ScheduledJob for plannerV2
  const toScheduledJob = useCallback((job: Job): PlannerV2.ScheduledJob => ({
    id: job.id,
    orderNumber: job.orderNumber,
    customer: job.customer,
    estimatedEFinks: job.estimatedEFinks,
    plannedDateStr: job.plannedDateStr,
    jigId: job.jigId,
    plannedStartTime: job.plannedStartTime ?? null,
    plannedEndTime: job.plannedEndTime ?? null,
    plannedDurationMinutes: job.plannedDurationMinutes ?? null,
    customDurationMinutes: job.customDurationMinutes ?? null,
    breakAdjustmentMinutes: job.breakAdjustmentMinutes ?? null,
    parentProductionId: job.parentProductionId ?? null,
    rolloverSequence: job.rolloverSequence ?? 0,
    productionComplete: job.productionComplete
  }), []);

  // Stage a job click - adds job to global staging
  const handleJobClick = useCallback((jobId: string) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    
    // Skip staging for unallocated jobs - they don't follow scheduling rules
    if (!job.jigId || !job.plannedDateStr) {
      console.log('[PLANNER] Skipping staging for unallocated job:', jobId);
      return;
    }
    
    // Use functional updater to check latest staging state and avoid stale closures
    setGlobalStaging(prev => {
      // If already staged, return unchanged
      if (PlannerV2.hasJobChanges(prev, jobId)) {
        console.log('[PLANNER] Job already staged:', jobId);
        return prev;
      }
      
      console.log('[PLANNER] Staging job:', jobId);
      return PlannerV2.stageChange(prev, jobId, toScheduledJob(job), {}, 'allocate');
    });
  }, [allJobs, toScheduledJob]);

  // Stage a change to a job (for resize, move, etc.)
  const stageJobUpdate = useCallback((jobId: string, updates: Partial<PlannerV2.ScheduledJob>, changeType: PlannerV2.ChangeType = 'allocate') => {
    const job = baseJobs.find(j => j.id === jobId);
    if (!job) return;
    
    console.log('[PLANNER] Staging job update:', jobId, updates, changeType);
    setGlobalStaging(prev => PlannerV2.stageChange(prev, jobId, toScheduledJob(job), updates, changeType));
  }, [baseJobs, toScheduledJob]);

  // Global Accept - persist ALL staged changes
  const acceptAllChanges = async () => {
    if (!PlannerV2.hasChanges(globalStaging)) return;
    
    setIsSaving(true);
    console.log('[PLANNER] Accepting all staged changes:', PlannerV2.getChangeCount(globalStaging), 'jobs');
    
    try {
      const payloads = PlannerV2.buildPersistencePayloads(globalStaging);
      
      // Build job details map for audit records
      const jobDetailsMap = new Map<string, PlannerV2.JobDetails>();
      for (const job of [...jobs, ...unallocatedOrders]) {
        jobDetailsMap.set(job.id, { orderNumber: job.orderNumber, customer: job.customer });
      }
      
      // Build audit records before persisting
      const auditRecords = PlannerV2.buildAuditRecords(globalStaging, jobDetailsMap);
      console.log('[PLANNER] Creating', auditRecords.length, 'audit records');
      
      // Persist all production changes
      for (const payload of payloads) {
        const apiPayload: Record<string, any> = {};
        if (payload.updates.jigId !== undefined) apiPayload.jigId = payload.updates.jigId;
        if (payload.updates.plannedDateStr !== undefined) apiPayload.productionPlannedDate = payload.updates.plannedDateStr;
        if (payload.updates.plannedStartTime !== undefined) apiPayload.plannedStartTime = payload.updates.plannedStartTime;
        if (payload.updates.plannedEndTime !== undefined) apiPayload.plannedEndTime = payload.updates.plannedEndTime;
        if (payload.updates.plannedDurationMinutes !== undefined) apiPayload.plannedDurationMinutes = payload.updates.plannedDurationMinutes;
        if (payload.updates.customDurationMinutes !== undefined) apiPayload.customDurationMinutes = payload.updates.customDurationMinutes;
        if (payload.updates.breakAdjustmentMinutes !== undefined) apiPayload.breakAdjustmentMinutes = payload.updates.breakAdjustmentMinutes;
        
        console.log('[PLANNER] Persisting job:', payload.jobId, apiPayload);
        await productionService.update(payload.jobId, apiPayload);
      }
      
      // Send audit records to backend
      if (auditRecords.length > 0) {
        const auditDtos: CreateProductionAuditDto[] = auditRecords.map(record => ({
          productionId: record.jobId,
          changeType: record.changeType,
          oldJigId: record.previousValues.jigId,
          newJigId: record.newValues.jigId,
          oldPlannedDate: record.previousValues.plannedDateStr,
          newPlannedDate: record.newValues.plannedDateStr,
          oldStartTime: record.previousValues.plannedStartTime,
          newStartTime: record.newValues.plannedStartTime,
          oldEndTime: record.previousValues.plannedEndTime,
          newEndTime: record.newValues.plannedEndTime,
          orderNumber: record.orderNumber,
          customerName: record.customer,
          notes: record.isPrimary ? 'Primary job change' : 'Affected by cascade'
        }));
        
        await productionAuditService.createBatch(auditDtos);
        console.log('[PLANNER] ✓ Audit records saved');
      }
      
      console.log('[PLANNER] ✓ All changes persisted');
      
      // Clear staging and reload data
      setGlobalStaging(PlannerV2.createEmptyStaging());
      await loadData();
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to persist changes:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Global Discard - clear all staged changes
  const discardAllChanges = () => {
    console.log('[PLANNER] Discarding all staged changes');
    setGlobalStaging(PlannerV2.createEmptyStaging());
  };

  // Unallocated basket: all production without planned date + orders needing production
  const unallocated = useMemo(() => {
    return allJobs.filter(j => !j.plannedDateStr);
  }, [allJobs]);

  const getDaysInView = useMemo(() => {
    if (viewMode === 'day') {
      return [currentDateStr];
    } else if (viewMode === 'week') {
      const weekStart = startOfWeekUtc(currentDateStr);
      return getDaysInWeek(weekStart);
    } else {
      return getDaysInMonth(currentDateStr);
    }
  }, [currentDateStr, viewMode]);

  const handleDragStart = useCallback((jobId: string) => {
    setDraggedJobId(jobId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Drop to a team/day column - assign jig, date, and calculate time
  // Uses sequential scheduling with cascade and multi-day overflow handling via plannerV2
  const handleDrop = async (dateStr: string, jigId?: string | null, dropTimeMinutes?: number) => {
    console.log('[PLANNER] handleDrop START:', { dateStr, jigId, draggedJobId, dropTimeMinutes });
    
    if (!draggedJobId) return;
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;
    
    console.log('[PLANNER] Found job to drop:', job.id, job.name);

    const isSalesOrder = job.id.startsWith('order-');
    const updatedJigId = jigId !== undefined ? jigId : job.jigId;

    try {
      if (updatedJigId) {
        const overtime = overtimeByDay[dateStr];
        const shift = PlannerV2.getShiftConfig(overtime?.enabled, overtime?.closeTime);
        
        const existingJobsOnDay = allJobs.filter(
          j => j.plannedDateStr === dateStr && 
               j.jigId === updatedJigId && 
               j.id !== job.id &&
               !j.productionComplete
        ).sort((a, b) => (a.plannedStartTime ?? shift.startTime) - (b.plannedStartTime ?? shift.startTime))
         .map(j => toScheduledJob(j));
        
        const insertIndex = existingJobsOnDay.length === 0 
          ? 0 
          : PlannerV2.findInsertPosition(existingJobsOnDay, dropTimeMinutes ?? (shift.endTime - 60));
        
        console.log('[PLANNER] Insert index:', insertIndex, 'out of', existingJobsOnDay.length, 'existing jobs');
        
        const droppedJob: PlannerV2.ScheduledJob = {
          ...toScheduledJob(job),
          plannedDateStr: dateStr,
          jigId: updatedJigId
        };
        
        const cascadeResult = PlannerV2.cascadeSchedule(existingJobsOnDay, droppedJob, insertIndex, shift);
        
        console.log('[PLANNER] Cascade result:', cascadeResult.scheduledJobs.length, 'jobs scheduled,', cascadeResult.overflows.length, 'overflows');
        
        setGlobalStaging(prev => {
          let newStaging = prev;
          
          for (const scheduledJob of cascadeResult.scheduledJobs) {
            const isDroppedJob = scheduledJob.id === job.id;
            const originalJob = isDroppedJob ? job : allJobs.find(j => j.id === scheduledJob.id);
            
            if (originalJob) {
              const changeType: PlannerV2.ChangeType = isDroppedJob ? 'allocate' : 'cascade';
              newStaging = PlannerV2.stageChange(newStaging, scheduledJob.id, toScheduledJob(originalJob), {
                plannedDateStr: dateStr,
                jigId: updatedJigId,
                plannedStartTime: scheduledJob.plannedStartTime,
                plannedEndTime: scheduledJob.plannedEndTime,
                plannedDurationMinutes: scheduledJob.plannedDurationMinutes,
                breakAdjustmentMinutes: scheduledJob.breakAdjustmentMinutes
              }, changeType);
            }
          }
          
          return newStaging;
        });
        
        if (cascadeResult.overflows.length > 0) {
          console.log('[PLANNER] Processing', cascadeResult.overflows.length, 'multi-day overflows');
          
          const allScheduledJobs = allJobs.map(j => toScheduledJob(j));
          
          const multiDayResult = PlannerV2.processMultiDayOverflows(
            cascadeResult.overflows,
            allScheduledJobs,
            overtimeByDay
          );
          
          console.log('[PLANNER] Multi-day result:', multiDayResult.affectedDays.length, 'days affected,', multiDayResult.newRollovers.length, 'rollovers');
          
          setGlobalStaging(prev => {
            let newStaging = prev;
            
            for (const scheduledJob of multiDayResult.scheduledJobs) {
              const originalJob = allJobs.find(j => j.id === scheduledJob.id);
              
              if (originalJob && scheduledJob.plannedDateStr && scheduledJob.plannedStartTime !== null) {
                newStaging = PlannerV2.stageChange(newStaging, scheduledJob.id, toScheduledJob(originalJob), {
                  plannedDateStr: scheduledJob.plannedDateStr,
                  jigId: scheduledJob.jigId,
                  plannedStartTime: scheduledJob.plannedStartTime,
                  plannedEndTime: scheduledJob.plannedEndTime,
                  plannedDurationMinutes: scheduledJob.plannedDurationMinutes,
                  breakAdjustmentMinutes: scheduledJob.breakAdjustmentMinutes
                }, 'cascade');
              }
            }
            
            for (const rollover of multiDayResult.newRollovers) {
              const parentJob = allJobs.find(j => j.id === rollover.parentProductionId);
              if (parentJob) {
                newStaging = PlannerV2.stageChange(newStaging, rollover.id, rollover, {
                  plannedDateStr: rollover.plannedDateStr,
                  jigId: rollover.jigId,
                  plannedStartTime: rollover.plannedStartTime,
                  plannedEndTime: rollover.plannedEndTime,
                  plannedDurationMinutes: rollover.plannedDurationMinutes,
                  breakAdjustmentMinutes: rollover.breakAdjustmentMinutes,
                  parentProductionId: rollover.parentProductionId,
                  rolloverSequence: rollover.rolloverSequence
                }, 'rollover');
              }
            }
            
            return newStaging;
          });
        }
        
        if (viewMode !== 'day') {
          setViewMode('day');
          setCurrentDateStr(dateStr);
        }
      } else {
        const jobDuration = PlannerV2.getJobDuration(toScheduledJob(job));
        stageJobUpdate(job.id, {
          plannedDateStr: dateStr,
          jigId: null,
          plannedStartTime: null,
          plannedEndTime: null,
          plannedDurationMinutes: jobDuration,
          breakAdjustmentMinutes: null
        }, 'allocate');
        
        if (viewMode !== 'day') {
          setViewMode('day');
          setCurrentDateStr(dateStr);
        }
      }
      
      if (isSalesOrder) {
        console.log('[PLANNER] Note: Sales order will be created on accept');
      }
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to schedule job:', err);
      setError(`Failed to schedule job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDraggedJobId(null);
    }
  };

  // Drop to global unallocated basket - reset to EFinks and clear assignment
  const handleDropToUnallocated = () => {
    if (!draggedJobId) return;
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;

    // Can't unallocate a sales order that doesn't have a production record yet
    const isSalesOrder = job.id.startsWith('order-');
    if (isSalesOrder) {
      setDraggedJobId(null);
      return;
    }

    // Reset to EFinks default when moving to unallocated
    const defaultDuration = PlannerV2.calculateEfinksDuration(job.estimatedEFinks);
    
    // Stage the unallocate - resets to EFinks default
    stageJobUpdate(job.id, {
      jigId: null,
      plannedDateStr: null,
      plannedStartTime: null,
      plannedEndTime: null,
      plannedDurationMinutes: defaultDuration,
      customDurationMinutes: undefined,
      breakAdjustmentMinutes: null
    }, 'unallocate');
    
    console.log('[PLANNER] Staged unallocate for job:', job.id, 'reset to EFinks:', defaultDuration, 'min');
    setDraggedJobId(null);
  };

  // Drop to team unallocated column - assign team but no date/time, reset to EFinks
  const handleDropToTeamUnallocated = (jigId: string) => {
    if (!draggedJobId) return;
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;

    const isSalesOrder = job.id.startsWith('order-');
    if (isSalesOrder) {
      setDraggedJobId(null);
      return;
    }

    // Reset to EFinks default when moving to team unallocated
    const defaultDuration = PlannerV2.calculateEfinksDuration(job.estimatedEFinks);
    
    stageJobUpdate(job.id, {
      jigId: jigId,
      plannedDateStr: null,
      plannedStartTime: null,
      plannedEndTime: null,
      plannedDurationMinutes: defaultDuration,
      customDurationMinutes: undefined,
      breakAdjustmentMinutes: null
    }, 'unallocate');
    
    console.log('[PLANNER] Staged team unallocate for job:', job.id, 'team:', jigId);
    setDraggedJobId(null);
  };

  const handleJobDoubleClick = (jobId: string) => {
    navigate(`/production-planner/${jobId}`);
  };

  const handleJobDurationChange = (jobId: string, durationMinutes: number) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const dateStr = job.plannedDateStr;
    const jigId = job.jigId;
    
    // Round duration to 15-minute increment
    const roundedDuration = PlannerV2.roundToQuarterHour(durationMinutes);
    
    // Calculate new end time based on the resized duration
    if (job.plannedStartTime != null && jigId && dateStr) {
      const overtime = overtimeByDay[dateStr];
      const shift = PlannerV2.getShiftConfig(overtime?.enabled, overtime?.closeTime);
      
      // Calculate new end time and break adjustments
      const timing = PlannerV2.calculateEndTime(job.plannedStartTime, roundedDuration, shift);
      
      // Stage the resize - no cascading, overlaps allowed during staging
      stageJobUpdate(jobId, {
        customDurationMinutes: roundedDuration,
        plannedDurationMinutes: roundedDuration,
        plannedEndTime: timing.endTime,
        breakAdjustmentMinutes: timing.breakMinutes
      }, 'resize');
      
      console.log('[PLANNER] Staged resize for job:', jobId, 'duration:', roundedDuration, 'minutes');
    } else {
      stageJobUpdate(jobId, {
        customDurationMinutes: roundedDuration,
        plannedDurationMinutes: roundedDuration
      }, 'resize');
    }
  };

  const handleJobDurationReset = (jobId: string) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const dateStr = job.plannedDateStr;
    const jigId = job.jigId;
    
    // Calculate default duration from EFinks
    const defaultDuration = PlannerV2.calculateEfinksDuration(job.estimatedEFinks);
    
    if (job.plannedStartTime != null && jigId && dateStr) {
      const overtime = overtimeByDay[dateStr];
      const shift = PlannerV2.getShiftConfig(overtime?.enabled, overtime?.closeTime);
      
      // Calculate end time using default duration
      const timing = PlannerV2.calculateEndTime(job.plannedStartTime, defaultDuration, shift);
      
      // Stage the reset - clears customDurationMinutes
      stageJobUpdate(jobId, {
        customDurationMinutes: undefined,
        plannedDurationMinutes: defaultDuration,
        plannedEndTime: timing.endTime,
        breakAdjustmentMinutes: timing.breakMinutes
      }, 'resize');
      
      console.log('[PLANNER] Staged reset for job:', jobId, 'duration:', defaultDuration, 'minutes');
    } else {
      stageJobUpdate(jobId, {
        customDurationMinutes: undefined,
        plannedDurationMinutes: defaultDuration
      }, 'resize');
    }
  };

  const handleOvertimeChange = async (dayStr: string, enabled: boolean, closeTime: string, _additionalMinutes?: number) => {
    // SIMPLIFIED: For now, overtime is UI-only state
    // Future: Can persist to Production or separate settings table
    setOvertimeByDay(prev => ({
      ...prev,
      [dayStr]: { enabled, closeTime }
    }));
    console.log(`[PLANNER] Overtime for ${dayStr}: enabled=${enabled}, closeTime=${closeTime}`);
  };

  const handleJobRollover = async (jobId: string, overflowMinutes: number, nextDateStr: string, jigId: string | null) => {
    try {
      console.log('[ROLLOVER] ========== Starting rollover ==========');
      console.log('[ROLLOVER] Job ID:', jobId);
      console.log('[ROLLOVER] Overflow minutes:', overflowMinutes);
      console.log('[ROLLOVER] Next date:', nextDateStr);
      console.log('[ROLLOVER] Passed jigId:', jigId);
      
      const job = allJobs.find(j => j.id === jobId);
      if (!job) {
        console.log('[ROLLOVER] ✗ Job not found in allJobs');
        return;
      }
      console.log('[ROLLOVER] Found job:', job.orderNumber, 'jigId:', job.jigId);

      // Fetch the full production record to get all fields for cloning
      const fullProduction = await productionService.getById(jobId);
      if (!fullProduction) {
        console.error('[PLANNER] Could not fetch full production data for rollover');
        return;
      }
      console.log('[ROLLOVER] Full production jigId:', fullProduction.jigId);

      const currentDuration = job.customDurationMinutes || Math.round(job.estimatedEFinks * 6.5625);
      const remainingDuration = currentDuration - overflowMinutes;

      // Determine the root parent ID for this job chain
      const rootParentId = job.parentProductionId || jobId;
      const currentSequence = job.rolloverSequence || 0;
      console.log('[ROLLOVER] Root parent ID:', rootParentId);
      console.log('[ROLLOVER] Current sequence:', currentSequence);

      // BUG FIX 1: Preserve jigId - use nullish coalescing to handle edge cases
      // jigId parameter from overflow detection takes priority, fallback to job's existing jigId
      // Using ?? instead of || to correctly handle falsy-but-valid values
      const preservedJigId = jigId ?? job.jigId;
      console.log('[ROLLOVER] Preserved jigId:', preservedJigId);

      // BUG FIX 2: Check if a rollover child already exists for this job
      // Look for jobs where parentProductionId matches rootParentId and rolloverSequence > currentSequence
      const existingRollover = allJobs.find(j => 
        j.parentProductionId === rootParentId && 
        (j.rolloverSequence || 0) === currentSequence + 1
      );
      console.log('[ROLLOVER] Existing rollover found:', existingRollover?.id, existingRollover?.orderNumber);

      // Update original job with reduced duration - always explicitly include jigId
      const updateData: any = {
        customDurationMinutes: Math.max(20, remainingDuration),
        rolloverSequence: currentSequence,
        // Always send jigId to maintain team assignment - send null explicitly if clearing
        jigId: preservedJigId ?? null
      };
      if (job.parentProductionId) {
        updateData.parentProductionId = job.parentProductionId;
      }
      
      console.log('[ROLLOVER] Updating parent job with:', JSON.stringify(updateData));
      await productionService.update(jobId, updateData);
      console.log('[ROLLOVER] ✓ Parent job updated');

      // If existing rollover child exists, DELETE it first - then create fresh one
      // This ensures the rollover always has the correct duration after overtime changes
      if (existingRollover) {
        console.log('[ROLLOVER] Deleting existing rollover:', existingRollover.id, existingRollover.orderNumber);
        await productionService.delete(existingRollover.id);
        console.log('[ROLLOVER] ✓ Existing rollover deleted');
      }

      // Create rollover with same name but "(Rollover)" after order number
      const baseName = job.name?.replace(' (Rollover)', '').replace(' (Roll Over)', '') || job.orderNumber;
      const rolloverName = `${baseName} (Rollover)`;

      // Clone all fields from original production, adjusting only what's needed for rollover
      const rolloverData: any = {
        // Core identification - cloned from original
        name: rolloverName,
        orderNo: fullProduction.orderNo,
        customer: fullProduction.customer,
        
        // Scheduling - adjusted for rollover
        productionPlannedDate: new Date(nextDateStr).toISOString(),
        newEstimateDefinks: Math.round(overflowMinutes / 6.5625),
        customDurationMinutes: overflowMinutes,
        productionComplete: false,
        
        // Team assignments - use preserved jigId to maintain team allocation
        jigId: preservedJigId,
        pickingTeamId: fullProduction.pickingTeamId,
        sawId: fullProduction.sawId,
        
        // Jig team staff - clone from original
        jigLeader: fullProduction.jigLeader,
        jigHelper1: fullProduction.jigHelper1,
        jigHelper2: fullProduction.jigHelper2,
        jigHelper3: fullProduction.jigHelper3,
        jigHelper4: fullProduction.jigHelper4,
        
        // Picking team staff - clone from original
        pickingMaster: fullProduction.pickingMaster,
        pickingHelper1: fullProduction.pickingHelper1,
        pickingHelper2: fullProduction.pickingHelper2,
        pickingHelper3: fullProduction.pickingHelper3,
        
        // Saw team staff - clone from original
        sawOperator: fullProduction.sawOperator,
        sawHelper1: fullProduction.sawHelper1,
        sawHelper2: fullProduction.sawHelper2,
        
        // Production metrics - clone from original
        totalCuts: fullProduction.totalCuts,
        totalTimberCubes: fullProduction.totalTimberCubes,
        trussCost: fullProduction.trussCost,
        trussSelling: fullProduction.trussSelling,
        workUnitsEfinks: fullProduction.workUnitsEfinks,
        
        // Chain tracking
        parentProductionId: rootParentId,
        rolloverSequence: currentSequence + 1
      };

      console.log('[ROLLOVER] Creating rollover with jigId:', rolloverData.jigId);
      await productionService.create(rolloverData);
      console.log('[ROLLOVER] ✓ Rollover created, linked to parent:', rootParentId);
      console.log('[ROLLOVER] ========== Reloading data ==========');

      await loadData();
      console.log('[ROLLOVER] ========== Rollover complete ==========');
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to roll over job:', err);
      setError(`Failed to roll over job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDeleteRolloverSegment = async (jobId: string) => {
    try {
      const job = allJobs.find(j => j.id === jobId);
      if (!job) {
        console.log('[DELETE] Job not found:', jobId);
        return;
      }

      const { canDelete, reason } = canDeleteRolloverSegment(jobId, allJobs as ScheduledJob[]);
      if (!canDelete) {
        setError(reason || 'Cannot delete this segment');
        return;
      }

      console.log('[DELETE] Deleting rollover segment:', jobId);
      
      const result = deleteRolloverSegment(jobId, allJobs as ScheduledJob[], overtimeByDay);
      
      for (const updatedJob of result.updatedJobs) {
        stageJobUpdate(updatedJob.id, {
          plannedStartTime: updatedJob.plannedStartTime,
          plannedEndTime: updatedJob.plannedEndTime,
          plannedDurationMinutes: updatedJob.plannedDurationMinutes,
          customDurationMinutes: updatedJob.customDurationMinutes,
          breakAdjustmentMinutes: updatedJob.breakAdjustmentMinutes
        }, 'cascade');
      }
      
      for (const deletedId of result.deletedJobIds) {
        await productionService.delete(deletedId);
        console.log('[DELETE] Deleted segment:', deletedId);
      }
      
      for (const updatedJob of result.updatedJobs) {
        await productionService.update(updatedJob.id, {
          plannedStartTime: updatedJob.plannedStartTime ?? undefined,
          plannedEndTime: updatedJob.plannedEndTime ?? undefined,
          plannedDurationMinutes: updatedJob.plannedDurationMinutes ?? undefined,
          customDurationMinutes: updatedJob.customDurationMinutes,
          breakAdjustmentMinutes: updatedJob.breakAdjustmentMinutes ?? undefined
        });
      }
      
      console.log('[DELETE] Segment deleted successfully, updated', result.updatedJobs.length, 'related jobs');
      
      await loadData();
    } catch (err) {
      console.error('[DELETE] Failed to delete segment:', err);
      setError(`Failed to delete segment: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Suppress unused variable warning - function will be connected to DayView component
  void handleDeleteRolloverSegment;

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const increment = direction === 'next' ? 1 : -1;
    if (viewMode === 'day') {
      setCurrentDateStr(addDays(currentDateStr, increment));
    } else if (viewMode === 'week') {
      setCurrentDateStr(addDays(currentDateStr, increment * 7));
    } else {
      setCurrentDateStr(addMonths(currentDateStr, increment));
    }
  };

  const handleWeekClick = (weekStartDate: string) => {
    setSelectedWeekStart(weekStartDate);
    setCurrentDateStr(weekStartDate);
    setViewMode('week');
  };

  const handleDayClick = (dayStr: string) => {
    _setSelectedDayStr(dayStr);
    setCurrentDateStr(dayStr);
    setViewMode('day');
  };

  const navigateToMonthView = () => {
    setViewMode('month');
    setSelectedWeekStart(null);
    _setSelectedDayStr(null);
  };

  const navigateToWeekView = () => {
    setViewMode('week');
    _setSelectedDayStr(null);
  };

  const handleTeamDoubleClick = (teamId: string) => {
    navigate(`/jigs/${teamId}`);
  };

  const getCurrentViewTitle = (): string => {
    const date = new Date(currentDateStr);
    if (viewMode === 'month') {
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    } else if (viewMode === 'week') {
      const weekStart = new Date(selectedWeekStart || currentDateStr);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      return `Week of ${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`;
    } else {
      return formatDate(currentDateStr);
    }
  };

  const filteredJigTeams = useMemo(() => {
    return jigTeams.filter(jig => selectedJigIds.includes(jig.id));
  }, [jigTeams, selectedJigIds]);

  const jigFilterOptions: IDropdownOption[] = useMemo(() => {
    return [
      { key: 'all', text: 'All Jigs' },
      ...jigTeams.map(jig => ({ key: jig.id, text: jig.name }))
    ];
  }, [jigTeams]);

  const handleJigFilterChange = (_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
    if (!option) return;
    
    if (option.key === 'all') {
      setSelectedJigIds(jigTeams.map(j => j.id));
    } else {
      const jigId = option.key as string;
      if (selectedJigIds.includes(jigId)) {
        const newSelection = selectedJigIds.filter(id => id !== jigId);
        setSelectedJigIds(newSelection.length > 0 ? newSelection : jigTeams.map(j => j.id));
      } else {
        setSelectedJigIds([...selectedJigIds, jigId]);
      }
    }
  };

  const commandItems: ICommandBarItemProps[] = [
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadData
    },
    {
      key: 'prev',
      text: 'Previous',
      iconProps: { iconName: 'ChevronLeft' },
      onClick: () => navigateDate('prev')
    },
    {
      key: 'today',
      text: 'Today',
      iconProps: { iconName: 'Calendar' },
      onClick: () => setCurrentDateStr(new Date().toISOString().split('T')[0])
    },
    {
      key: 'next',
      text: 'Next',
      iconProps: { iconName: 'ChevronRight' },
      onClick: () => navigateDate('next')
    }
  ];

  console.log('[PLANNER] RENDER - loading:', loading, 'jobs.length:', jobs.length, 'viewMode:', viewMode);
  console.log('[PLANNER] RENDER - loading check will be:', loading && jobs.length === 0);

  if (loading && jobs.length === 0) {
    console.log('[PLANNER] Showing loading screen');
    return (
      <Stack verticalAlign="center" horizontalAlign="center" styles={{ root: { height: '100vh' } }}>
        <Spinner label="Loading production planner..." size={3} />
        <Text variant="small" styles={{ root: { marginTop: 10, color: '#666' } }}>
          Loading {jobs.length} jobs...
        </Text>
      </Stack>
    );
  }

  console.log('[PLANNER] ✓✓✓ RENDERING MAIN CONTENT - ViewMode:', viewMode, 'Jobs:', jobs.length);
  
  return (
    <Stack styles={{ root: { minHeight: '100%' } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { marginBottom: 15 } }}>
        <Text variant="xxLarge">
          Production Planner ({jobs.length} jobs)
        </Text>
        <Dropdown
          placeholder="Filter by Jig"
          multiSelect
          options={jigFilterOptions}
          selectedKeys={selectedJigIds.length === jigTeams.length ? ['all'] : selectedJigIds}
          onChange={handleJigFilterChange}
          styles={{ root: { minWidth: 200 } }}
        />
      </Stack>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 10 } }}>
        <Text 
          variant="medium" 
          styles={{ root: { cursor: 'pointer', color: viewMode === 'month' ? '#0078d4' : '#605e5c', fontWeight: viewMode === 'month' ? 600 : 400 } }}
          onClick={navigateToMonthView}
        >
          Month View
        </Text>
        {viewMode !== 'month' && (
          <>
            <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>/</Text>
            <Text 
              variant="medium" 
              styles={{ root: { cursor: 'pointer', color: viewMode === 'week' ? '#0078d4' : '#605e5c', fontWeight: viewMode === 'week' ? 600 : 400 } }}
              onClick={navigateToWeekView}
            >
              Week View
            </Text>
          </>
        )}
        {viewMode === 'day' && (
          <>
            <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>/</Text>
            <Text variant="medium" styles={{ root: { color: '#0078d4', fontWeight: 600 } }}>
              Day View
            </Text>
          </>
        )}
        <Text variant="medium" styles={{ root: { marginLeft: 20, color: '#323130', fontWeight: 600 } }}>
          {getCurrentViewTitle()}
        </Text>
      </Stack>

      <CommandBar items={commandItems} />

      {PlannerV2.hasChanges(globalStaging) && (
        <Stack 
          horizontal 
          verticalAlign="center" 
          tokens={{ childrenGap: 15 }}
          styles={{ 
            root: { 
              padding: '12px 16px',
              marginTop: 10,
              backgroundColor: '#fff4ce',
              borderRadius: 4,
              border: '1px solid #ffb900'
            } 
          }}
        >
          <Icon iconName="Edit" styles={{ root: { color: '#ffb900', fontSize: 18 } }} />
          <Text styles={{ root: { fontWeight: 600, color: '#323130' } }}>
            {PlannerV2.getChangeCount(globalStaging)} job{PlannerV2.getChangeCount(globalStaging) !== 1 ? 's' : ''} staged for changes
          </Text>
          <Stack horizontal tokens={{ childrenGap: 10 }} styles={{ root: { marginLeft: 'auto' } }}>
            <DefaultButton
              text="Discard All"
              onClick={discardAllChanges}
              disabled={isSaving}
              styles={{ root: { minWidth: 100 } }}
            />
            <PrimaryButton
              text={isSaving ? 'Saving...' : 'Accept All Changes'}
              onClick={acceptAllChanges}
              disabled={isSaving}
              iconProps={{ iconName: 'CheckMark' }}
              styles={{ root: { minWidth: 150 } }}
            />
          </Stack>
        </Stack>
      )}

      <Stack horizontal styles={{ root: { flex: 1, marginTop: 20, gap: 15 } }}>
        <div
          onMouseEnter={() => setBasketCollapsed(false)}
          onMouseLeave={() => setBasketCollapsed(true)}
          onDragOver={handleDragOver}
          onDrop={handleDropToUnallocated}
          style={{
            width: basketCollapsed ? 40 : 280,
            minWidth: basketCollapsed ? 40 : 280,
            flexShrink: 0,
            backgroundColor: draggedJobId ? '#e1f5fe' : (basketCollapsed ? '#666' : '#f3f2f1'),
            borderRadius: basketCollapsed ? '0 4px 4px 0' : 4,
            padding: basketCollapsed ? '10px 5px' : 15,
            transition: 'all 0.2s ease',
            border: draggedJobId ? '2px dashed #0078d4' : '2px solid transparent',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {basketCollapsed ? (
            <Stack verticalAlign="center" horizontalAlign="center" styles={{ root: { height: '100%' } }}>
              <Text styles={{ root: { color: 'white', fontSize: 16, fontWeight: 'bold' } }}>
                »
              </Text>
              <Text styles={{ root: { color: 'white', fontSize: 11, writingMode: 'vertical-rl', textOrientation: 'mixed', marginTop: 10 } }}>
                Unallocated ({unallocated.length})
              </Text>
            </Stack>
          ) : (
            <>
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                  Unallocated ({unallocated.length})
                </Text>
                <Text styles={{ root: { color: '#666', fontSize: 12 } }}>
                  «
                </Text>
              </Stack>

              <Stack styles={{ root: { marginTop: 15, gap: 8 } }}>
                {unallocated.map(job => (
                  <Stack
                    key={job.id}
                    draggable
                    onDragStart={() => handleDragStart(job.id)}
                    onDoubleClick={() => handleJobDoubleClick(job.id)}
                    styles={{
                      root: {
                        padding: 10,
                        backgroundColor: 'white',
                        borderRadius: 4,
                        cursor: 'grab',
                        border: '1px solid #ddd',
                        ':hover': {
                          backgroundColor: '#f8f8f8'
                        }
                      }
                    }}
                  >
                    <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                      {job.orderNumber}
                    </Text>
                    <Text variant="small" block>
                      {job.customer}
                    </Text>
                    <Text variant="tiny" block styles={{ root: { color: '#666' } }}>
                      {job.name}
                    </Text>
                    <Text variant="tiny" block styles={{ root: { color: '#0078d4', fontWeight: 600 } }}>
                      {job.estimatedEFinks} E-Finks
                    </Text>
                  </Stack>
                ))}
                {unallocated.length === 0 && (
                  <Text variant="small" styles={{ root: { color: '#666', textAlign: 'center', marginTop: 20 } }}>
                    No unallocated jobs
                  </Text>
                )}
              </Stack>
            </>
          )}
        </div>

        <Stack styles={{ root: { flex: 1, minWidth: 0 } }}>
          {viewMode === 'month' && (
            <MonthView
              daysInView={getDaysInView}
              jobs={allJobs}
              jigTeams={filteredJigTeams}
              currentMonth={currentDateStr}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={(dateStr) => handleDrop(dateStr)}
              onJobDoubleClick={handleJobDoubleClick}
              onWeekClick={handleWeekClick}
              onDayClick={handleDayClick}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              daysInView={getDaysInView}
              jobs={allJobs}
              jigTeams={filteredJigTeams}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={(dateStr, jigId) => handleDrop(dateStr, jigId)}
              onJobDoubleClick={handleJobDoubleClick}
              onDayClick={handleDayClick}
              onTeamDoubleClick={handleTeamDoubleClick}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              dayStr={currentDateStr}
              jobs={allJobs}
              allJobs={allJobs}
              jigTeams={filteredJigTeams}
              chainJobsMap={chainJobsMap}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={(dateStr, jigId, dropTimeMinutes) => handleDrop(dateStr, jigId, dropTimeMinutes)}
              onJobDoubleClick={handleJobDoubleClick}
              onJobClick={handleJobClick}
              onJobDurationChange={handleJobDurationChange}
              onJobDurationReset={handleJobDurationReset}
              onTeamDoubleClick={handleTeamDoubleClick}
              onJobRollover={handleJobRollover}
              overtimeSettings={overtimeByDay[currentDateStr]}
              onOvertimeChange={handleOvertimeChange}
              globalStaging={globalStaging}
              onDropToTeamUnallocated={handleDropToTeamUnallocated}
              isDragging={!!draggedJobId}
            />
          )}
        </Stack>
      </Stack>

    </Stack>
  );
};
