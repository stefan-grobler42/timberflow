import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stack, Text, CommandBar, Spinner, MessageBar, MessageBarType, Dropdown,
  PrimaryButton, DefaultButton, Icon
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { productionService, d365OrderService } from '../services/d365Services';
import { jigService, productionAuditService, scheduleBlockService } from '../services/millenniumServices';
import type { CreateProductionAuditDto, ScheduleBlock } from '../services/millenniumServices';
import { syncService } from '../services/syncService';
import { teamWorkItemService, type CreateTeamWorkItemDto, type UpdateTeamWorkItemDto } from '../services/teamWorkItemService';
import type { Jig } from '../types/millennium';
import { MonthView } from '../components/ProductionPlanner/MonthView';
import { WeekView } from '../components/ProductionPlanner/WeekView';
import { DayView } from '../components/ProductionPlanner/DayView';
import { ScheduleBlockPanel } from '../components/ProductionPlanner/ScheduleBlockPanel';
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
import { ShiftConfigProvider } from '../contexts/ShiftConfigContext';

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
  wipId?: string;
  dayStartMinutes?: number;
  dayEndMinutes?: number;
  overtimeEnabled?: boolean;
}


export const ProductionPlannerPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jigTeams, setJigTeams] = useState<Jig[]>([]);
  const [selectedJigIds, setSelectedJigIds] = useState<string[]>([]);
  const [unallocatedOrders, setUnallocatedOrders] = useState<Job[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
  const [currentDateStr, setCurrentDateStr] = useState(() => startOfMonthUtc(new Date()));
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [_selectedDayStr, _setSelectedDayStr] = useState<string | null>(null);
  const [basketCollapsed, setBasketCollapsed] = useState(true);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [overtimeByTeamDay, setOvertimeByTeamDay] = useState<Record<string, Record<string, { enabled: boolean; closeTime: number }>>>({});
  const [globalStaging, setGlobalStaging] = useState<PlannerV2.StagingState>(PlannerV2.createEmptyStaging());
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [blockPanelOpen, setBlockPanelOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [selectedBlockType, setSelectedBlockType] = useState<'PublicHoliday' | 'Breakdown' | 'Maintenance' | 'MaterialShortage' | 'GeneralDelay' | undefined>(undefined);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Date range for loading productions - default: 12 months back, 3 months forward
  const getDefaultDateRange = () => {
    const today = new Date();
    const fromDate = new Date(today);
    fromDate.setMonth(fromDate.getMonth() - 12);
    const toDate = new Date(today);
    toDate.setMonth(toDate.getMonth() + 3);
    return {
      dateFrom: fromDate.toISOString().split('T')[0],
      dateTo: toDate.toISOString().split('T')[0]
    };
  };
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const loadingRef = useRef(false);
  
  const loadData = async () => {
    if (loadingRef.current) {
      console.log('[PLANNER] Already loading, skipping duplicate call');
      return;
    }
    loadingRef.current = true;
    console.log('[PLANNER] Starting to load data...');
    console.log(`[PLANNER] Date range: ${dateRange.dateFrom} to ${dateRange.dateTo}`);
    setLoading(true);
    setError(null);
    try {
      console.log('[PLANNER] Starting API calls using optimized planner endpoints...');
      const startTime = Date.now();
      
      const productionsPromise = productionService.getForPlanner({ 
        dateFrom: dateRange.dateFrom, 
        dateTo: dateRange.dateTo 
      }).then(r => { 
        console.log('[PLANNER] productions loaded in', Date.now() - startTime, 'ms, count:', r.length); 
        return r; 
      }).catch(e => {
        console.error('[PLANNER] ✗ productions FAILED:', e);
        throw e;
      });
      
      const wipItemsPromise = teamWorkItemService.getForPlanner({
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo
      }).then(r => {
        console.log('[PLANNER] WIP items loaded in', Date.now() - startTime, 'ms, count:', r.length);
        return r;
      }).catch(e => {
        console.error('[PLANNER] ✗ WIP items FAILED:', e);
        throw e;
      });
      
      const jigsPromise = jigService.getAll().then(r => { 
        console.log('[PLANNER] jigs loaded in', Date.now() - startTime, 'ms'); 
        return r; 
      }).catch(e => {
        console.error('[PLANNER] ✗ jigs FAILED:', e);
        throw e;
      });
      
      const unallocatedPromise = d365OrderService.getUnallocated().then(r => { 
        console.log('[PLANNER] unallocated orders loaded in', Date.now() - startTime, 'ms, count:', r.length); 
        return r; 
      }).catch(e => {
        console.error('[PLANNER] ✗ unallocated FAILED:', e);
        throw e;
      });
      
      const blocksPromise = scheduleBlockService.getAll().then(r => { 
        console.log('[PLANNER] blocks loaded in', Date.now() - startTime, 'ms'); 
        return r; 
      }).catch(e => {
        console.error('[PLANNER] ✗ blocks FAILED:', e);
        throw e;
      });
      
      const [productions, wipItems, jigs, unallocated, blocks] = await Promise.all([
        productionsPromise,
        wipItemsPromise,
        jigsPromise,
        unallocatedPromise,
        blocksPromise
      ]);
      
      console.log(`[PLANNER] ✓ All data loaded in ${Date.now() - startTime}ms`);
      console.log(`[PLANNER] ✓ ${productions.length} productions, ${wipItems.length} WIP items, ${jigs.length} jig teams, ${unallocated.length} unallocated orders, ${blocks.length} blocks`);
      
      const wipByProductionId = new Map<string, typeof wipItems[0]>();
      for (const wip of wipItems) {
        wipByProductionId.set(wip.productionId, wip);
      }
      console.log(`[PLANNER] ✓ Built WIP lookup map with ${wipByProductionId.size} entries`);
      
      let jobList: Job[];
      try {
        console.log('[PLANNER] Starting job mapping with WIP overlay...');
        jobList = productions.map((p: any) => {
          const wipData = wipByProductionId.get(p.id);
          
          if (wipData) {
            return {
              id: p.id,
              name: p.name || '',
              orderNumber: wipData.orderNumber || p.orderNumber || p.name || 'N/A',
              customer: wipData.customerName || p.customerName || 'Unknown',
              estimatedEFinks: wipData.estimatedEfinks || p.newEstimateDefinks || 0,
              customDurationMinutes: p.customDurationMinutes || undefined,
              plannedDateStr: formatIsoDateLocal(wipData.workDate),
              jigId: wipData.teamId || null,
              productionComplete: p.productionComplete === true,
              parentProductionId: p.parentProductionId || undefined,
              rolloverSequence: wipData.rolloverSequence || p.rolloverSequence || undefined,
              createdOn: p.createdOn || undefined,
              plannedStartTime: wipData.plannedStartMinutes !== undefined ? wipData.plannedStartMinutes : null,
              plannedEndTime: wipData.plannedEndMinutes !== undefined ? wipData.plannedEndMinutes : null,
              plannedDurationMinutes: wipData.plannedDurationMinutes !== undefined ? wipData.plannedDurationMinutes : null,
              breakAdjustmentMinutes: wipData.breakAdjustmentMinutes !== undefined ? wipData.breakAdjustmentMinutes : null,
              wipId: wipData.id,
              dayStartMinutes: wipData.dayStartMinutes !== undefined ? wipData.dayStartMinutes : undefined,
              dayEndMinutes: wipData.dayEndMinutes !== undefined ? wipData.dayEndMinutes : undefined,
              overtimeEnabled: wipData.overtimeEnabled !== undefined ? wipData.overtimeEnabled : undefined
            };
          }
          
          return {
            id: p.id,
            name: p.name || '',
            orderNumber: p.orderNumber || p.name || 'N/A',
            customer: p.customerName || 'Unknown',
            estimatedEFinks: p.newEstimateDefinks || 0,
            customDurationMinutes: p.customDurationMinutes || undefined,
            plannedDateStr: null,
            jigId: null,
            productionComplete: p.productionComplete === true,
            parentProductionId: p.parentProductionId || undefined,
            rolloverSequence: p.rolloverSequence || undefined,
            createdOn: p.createdOn || undefined,
            plannedStartTime: null,
            plannedEndTime: null,
            plannedDurationMinutes: null,
            breakAdjustmentMinutes: null
          };
        });
        
        const allocatedCount = jobList.filter(j => j.wipId).length;
        console.log(`[PLANNER] ✓ Mapped ${jobList.length} production jobs (${allocatedCount} allocated via WIP, ${jobList.filter(j => j.productionComplete).length} completed)`);
      } catch (mapErr) {
        console.error('[PLANNER] ✗ Job mapping FAILED:', mapErr);
        throw mapErr;
      }
      
      // D365 orders that don't have Production records yet
      const ordersNeedingProduction = unallocated.map((o: any) => ({
        id: `order-${o.id}`,
        name: o.name || '',
        orderNumber: o.orderNumber || o.name || 'N/A',
        customer: o.customerName || 'Unknown',
        estimatedEFinks: o.estimatedEFinks || 0,
        plannedDateStr: null,
        jigId: null,
        productionComplete: false
      }));
      
      // Production records that exist but are NOT allocated to any team (no WIP entry)
      // These are the main source of unallocated jobs that need to be dragged to teams
      const unallocatedProductions = jobList.filter(j => 
        !j.wipId && // No WIP allocation
        !j.productionComplete && // Not completed
        j.jigId === null // Not assigned to a team
      );
      
      // Combine both sources for the unallocated basket
      const allUnallocated = [...unallocatedProductions, ...ordersNeedingProduction];
      
      console.log(`[PLANNER] ✓ Found ${unallocatedProductions.length} unallocated productions (no WIP) + ${ordersNeedingProduction.length} D365 orders = ${allUnallocated.length} total unallocated`);
      
      try {
        console.log('[PLANNER] Updating state...');
        setJobs(jobList);
        setUnallocatedOrders(allUnallocated);
        setJigTeams(jigs);
        setScheduleBlocks(blocks);
        if (selectedJigIds.length === 0) {
          setSelectedJigIds(jigs.map(j => j.id));
        }
        setLoading(false);
        console.log(`[PLANNER] ✓ State updated: loading=false, jobs.length=${jobList.length}, unallocatedOrders=${allUnallocated.length}`);
      } catch (stateErr) {
        console.error('[PLANNER] ✗ State update FAILED:', stateErr);
        throw stateErr;
      }
    } catch (err) {
      console.error('[PLANNER] ✗ Error loading:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
      setLoading(false);
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    console.log('[PLANNER] Loading data for date range:', dateRange.dateFrom, 'to', dateRange.dateTo);
    loadData();
  }, [dateRange]);

  const handleSyncFromDynamics = async () => {
    if (syncInProgress) return;
    setSyncInProgress(true);
    setSyncMessage(null);
    try {
      const result = await syncService.triggerManualSync();
      const ordersResult = result.results.find(r => r.entity === 'salesorder');
      const productionsResult = result.results.find(r => r.entity === 'cr694_production');
      const ordersCount = ordersResult?.recordsImported || 0;
      const productionsCount = productionsResult?.recordsImported || 0;
      setSyncMessage({
        type: 'success',
        text: `Synced ${ordersCount} orders and ${productionsCount} productions`
      });
      await loadData();
    } catch (err) {
      setSyncMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Sync failed'
      });
    } finally {
      setSyncInProgress(false);
    }
  };

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
      
      // Build WIP allocations for batch save
      // NOTE: dayStartMinutes/dayEndMinutes are intentionally NOT set here.
      // These fields should only be populated when there's a true user override
      // (e.g., user explicitly toggled overtime). Leaving them null allows the
      // planner to use ShiftConfig defaults at runtime.
      const wipAllocations: CreateTeamWorkItemDto[] = payloads
        .filter(p => p.updates.jigId && p.updates.plannedDateStr)
        .map((payload, idx) => {
          const existingJob = allJobs.find(j => j.id === payload.jobId);
          const allocation: CreateTeamWorkItemDto = {
            productionId: payload.jobId,
            teamId: payload.updates.jigId!,
            workDate: payload.updates.plannedDateStr!,
            sequence: idx,
            plannedStartMinutes: payload.updates.plannedStartTime ?? 420,
            plannedEndMinutes: payload.updates.plannedEndTime ?? 1020,
            plannedDurationMinutes: payload.updates.plannedDurationMinutes ?? 60,
            breakAdjustmentMinutes: payload.updates.breakAdjustmentMinutes ?? 0,
            status: 'scheduled',
            overtimeEnabled: existingJob?.overtimeEnabled ?? false
          };
          // Only set dayEndMinutes when overtime is explicitly enabled by user
          // This represents a true user override, not a ShiftConfig default
          if (existingJob?.overtimeEnabled === true && existingJob?.dayEndMinutes !== undefined) {
            allocation.dayEndMinutes = existingJob.dayEndMinutes;
          }
          return allocation;
        });
      
      // Batch save WIP entries (this also syncs to Production table)
      if (wipAllocations.length > 0) {
        console.log('[PLANNER] Saving', wipAllocations.length, 'WIP allocations via batch API');
        await teamWorkItemService.batchAllocate(wipAllocations);
        console.log('[PLANNER] ✓ WIP allocations saved');
      }
      
      // Also persist any jobs that don't have team assignment (just updates)
      const jobsWithoutTeam = payloads.filter(p => !p.updates.jigId || !p.updates.plannedDateStr);
      for (const payload of jobsWithoutTeam) {
        const apiPayload: Record<string, any> = {};
        if (payload.updates.jigId !== undefined) apiPayload.jigId = payload.updates.jigId;
        if (payload.updates.plannedDateStr !== undefined) apiPayload.productionPlannedDate = payload.updates.plannedDateStr;
        if (payload.updates.plannedStartTime !== undefined) apiPayload.plannedStartTime = payload.updates.plannedStartTime;
        if (payload.updates.plannedEndTime !== undefined) apiPayload.plannedEndTime = payload.updates.plannedEndTime;
        if (payload.updates.plannedDurationMinutes !== undefined) apiPayload.plannedDurationMinutes = payload.updates.plannedDurationMinutes;
        if (payload.updates.customDurationMinutes !== undefined) apiPayload.customDurationMinutes = payload.updates.customDurationMinutes;
        if (payload.updates.breakAdjustmentMinutes !== undefined) apiPayload.breakAdjustmentMinutes = payload.updates.breakAdjustmentMinutes;
        
        console.log('[PLANNER] Persisting job directly:', payload.jobId, apiPayload);
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
        const teamOvertimeSettings = overtimeByTeamDay[dateStr]?.[updatedJigId];
        const shift = PlannerV2.getShiftConfig(teamOvertimeSettings?.enabled, teamOvertimeSettings?.closeTime);
        
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
            overtimeByTeamDay
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
      const teamOvertime = overtimeByTeamDay[dateStr]?.[jigId];
      const shift = PlannerV2.getShiftConfig(teamOvertime?.enabled, teamOvertime?.closeTime);
      
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
      const teamOvertime = overtimeByTeamDay[dateStr]?.[jigId];
      const shift = PlannerV2.getShiftConfig(teamOvertime?.enabled, teamOvertime?.closeTime);
      
      // Calculate end time using default duration
      const timing = PlannerV2.calculateEndTime(job.plannedStartTime, defaultDuration, shift);
      
      // Stage the reset - clears customDurationMinutes (use null, not undefined, to properly clear)
      stageJobUpdate(jobId, {
        customDurationMinutes: null,
        plannedDurationMinutes: defaultDuration,
        plannedEndTime: timing.endTime,
        breakAdjustmentMinutes: timing.breakMinutes
      }, 'resize');
      
      console.log('[PLANNER] Staged reset for job:', jobId, 'duration:', defaultDuration, 'minutes');
    } else {
      stageJobUpdate(jobId, {
        customDurationMinutes: null,
        plannedDurationMinutes: defaultDuration
      }, 'resize');
    }
  };

  const handleTeamOvertimeChange = async (dayStr: string, teamId: string, enabled: boolean, closeTime: number, _additionalMinutes?: number) => {
    console.log(`[PLANNER] Team overtime change for ${dayStr}/${teamId}: enabled=${enabled}, closeTime=${closeTime}`);
    
    // Update local state immediately for UI responsiveness
    setOvertimeByTeamDay(prev => ({
      ...prev,
      [dayStr]: {
        ...(prev[dayStr] || {}),
        [teamId]: { enabled, closeTime }
      }
    }));
    
    // Find all jobs for this team-day that have WIP records
    const affectedJobs = allJobs.filter(
      j => j.plannedDateStr === dayStr && 
           j.jigId === teamId && 
           j.wipId
    );
    
    if (affectedJobs.length === 0) {
      console.log(`[PLANNER] No WIP records to update for ${dayStr}/${teamId}`);
      return;
    }
    
    console.log(`[PLANNER] Updating ${affectedJobs.length} WIP records with overtime=${enabled}, closeTime=${closeTime}`);
    
    try {
      // Get the new shift configuration based on overtime settings
      const newShift = PlannerV2.getShiftConfig(enabled, closeTime);
      
      // Convert affected jobs to ScheduledJob format for the scheduler
      const scheduledJobs: PlannerV2.ScheduledJob[] = affectedJobs.map(job => ({
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
      }));
      
      // Recalculate job positions with the new shift configuration
      const { scheduledJobs: rescheduledJobs } = PlannerV2.rescheduleDay(scheduledJobs, newShift);
      console.log(`[PLANNER] ✓ Recalculated ${rescheduledJobs.length} job positions with new shift config`);
      
      // Build a map of job ID to rescheduled timing
      const rescheduledMap = new Map<string, PlannerV2.ScheduledJob>();
      for (const rj of rescheduledJobs) {
        rescheduledMap.set(rj.id, rj);
      }
      
      // Build batch update for WIP records with recalculated times
      const updates: { id: string; data: UpdateTeamWorkItemDto }[] = affectedJobs.map(job => {
        const rescheduled = rescheduledMap.get(job.id);
        return {
          id: job.wipId!,
          data: {
            overtimeEnabled: enabled,
            // When disabling overtime, explicitly clear the override (undefined will trigger backend to set null)
            dayEndMinutes: enabled ? closeTime : undefined,
            plannedStartMinutes: rescheduled?.plannedStartTime ?? (job.plannedStartTime ?? undefined),
            plannedEndMinutes: rescheduled?.plannedEndTime ?? (job.plannedEndTime ?? undefined),
            plannedDurationMinutes: rescheduled?.plannedDurationMinutes ?? (job.plannedDurationMinutes ?? undefined),  // Keep existing WIP value - don't recalculate from E-Finks
            breakAdjustmentMinutes: rescheduled?.breakAdjustmentMinutes ?? (job.breakAdjustmentMinutes ?? 0)
          }
        };
      });
      
      // Persist to WIP table
      await teamWorkItemService.batchUpdate(updates);
      console.log(`[PLANNER] ✓ WIP overtime settings and recalculated times persisted for ${affectedJobs.length} jobs`);
      
      // Update local job state to reflect all changes (use explicit undefined checks to preserve zero values)
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.plannedDateStr === dayStr && job.jigId === teamId && job.wipId) {
          const rescheduled = rescheduledMap.get(job.id);
          return {
            ...job,
            overtimeEnabled: enabled,
            // When disabling overtime, explicitly clear the override to revert to shift defaults
            dayEndMinutes: enabled ? closeTime : undefined,
            plannedStartTime: rescheduled?.plannedStartTime !== undefined ? rescheduled.plannedStartTime : job.plannedStartTime,
            plannedEndTime: rescheduled?.plannedEndTime !== undefined ? rescheduled.plannedEndTime : job.plannedEndTime,
            plannedDurationMinutes: rescheduled?.plannedDurationMinutes !== undefined ? rescheduled.plannedDurationMinutes : job.plannedDurationMinutes,
            breakAdjustmentMinutes: rescheduled?.breakAdjustmentMinutes !== undefined ? rescheduled.breakAdjustmentMinutes : job.breakAdjustmentMinutes
          };
        }
        return job;
      }));
      
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to persist overtime settings:', err);
      // Revert local state on error
      setOvertimeByTeamDay(prev => ({
        ...prev,
        [dayStr]: {
          ...(prev[dayStr] || {}),
          [teamId]: { enabled: !enabled, closeTime }
        }
      }));
    }
  };

  const getTeamOvertimeForDay = (dayStr: string): Record<string, { enabled: boolean; closeTime: number }> => {
    return overtimeByTeamDay[dayStr] || {};
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

  const handleBlockSave = () => {
    loadData();
  };

  const commandItems: ICommandBarItemProps[] = [
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: () => { loadData(); }
    },
    {
      key: 'syncDynamics',
      text: syncInProgress ? 'Syncing...' : 'Refresh from Dynamics',
      iconProps: { iconName: syncInProgress ? 'ProgressRingDots' : 'Sync' },
      disabled: syncInProgress,
      onClick: () => { handleSyncFromDynamics(); }
    },
    {
      key: 'addBlock',
      text: 'Add Block',
      iconProps: { iconName: 'Add' },
      subMenuProps: {
        items: [
          {
            key: 'publicHoliday',
            text: 'Public Holiday',
            iconProps: { iconName: 'Calendar' },
            onClick: () => {
              setEditingBlock(null);
              setSelectedBlockType('PublicHoliday');
              setBlockPanelOpen(true);
            }
          },
          {
            key: 'breakdown',
            text: 'Breakdown',
            iconProps: { iconName: 'Warning' },
            onClick: () => {
              setEditingBlock(null);
              setSelectedBlockType('Breakdown');
              setBlockPanelOpen(true);
            }
          },
          {
            key: 'maintenance',
            text: 'Maintenance',
            iconProps: { iconName: 'Settings' },
            onClick: () => {
              setEditingBlock(null);
              setSelectedBlockType('Maintenance');
              setBlockPanelOpen(true);
            }
          },
          {
            key: 'materialShortage',
            text: 'Material Shortage',
            iconProps: { iconName: 'Package' },
            onClick: () => {
              setEditingBlock(null);
              setSelectedBlockType('MaterialShortage');
              setBlockPanelOpen(true);
            }
          },
          {
            key: 'generalDelay',
            text: 'General Delay',
            iconProps: { iconName: 'Clock' },
            onClick: () => {
              setEditingBlock(null);
              setSelectedBlockType('GeneralDelay');
              setBlockPanelOpen(true);
            }
          }
        ]
      }
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
    },
    {
      key: 'divider',
      text: '|',
      disabled: true
    },
    {
      key: 'dateRange',
      text: `Range: ${dateRange.dateFrom} to ${dateRange.dateTo}`,
      iconProps: { iconName: 'DateTimeMirrored' },
      subMenuProps: {
        items: [
          {
            key: 'lastYear',
            text: 'Last 12 Months + 3 Months Forward',
            onClick: () => {
              const range = getDefaultDateRange();
              setDateRange(range);
            }
          },
          {
            key: 'last2Years',
            text: 'Last 24 Months + 3 Months Forward',
            onClick: () => {
              const today = new Date();
              const fromDate = new Date(today);
              fromDate.setMonth(fromDate.getMonth() - 24);
              const toDate = new Date(today);
              toDate.setMonth(toDate.getMonth() + 3);
              setDateRange({
                dateFrom: fromDate.toISOString().split('T')[0],
                dateTo: toDate.toISOString().split('T')[0]
              });
            }
          },
          {
            key: 'allTime',
            text: 'All Time (May be slow)',
            onClick: () => {
              setDateRange({
                dateFrom: '2020-01-01',
                dateTo: '2030-12-31'
              });
            }
          }
        ]
      }
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
    <ShiftConfigProvider>
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

      {syncMessage && (
        <MessageBar
          messageBarType={syncMessage.type === 'success' ? MessageBarType.success : MessageBarType.error}
          onDismiss={() => setSyncMessage(null)}
          styles={{ root: { marginBottom: 10 } }}
        >
          {syncMessage.text}
        </MessageBar>
      )}

      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 10 } }}>
        <Text 
          variant="medium" 
          styles={{ root: { cursor: 'pointer', color: viewMode === 'month' ? '#0078d4' : '#605e5c', fontWeight: viewMode === 'month' ? 600 : 400 } }}
          onClick={navigateToMonthView}
        >
          Month
        </Text>
        {(viewMode === 'week' || viewMode === 'day') && (
          <>
            <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>/</Text>
            <Text 
              variant="medium" 
              styles={{ root: { cursor: 'pointer', color: viewMode === 'week' ? '#0078d4' : '#605e5c', fontWeight: viewMode === 'week' ? 600 : 400 } }}
              onClick={navigateToWeekView}
            >
              Week
            </Text>
          </>
        )}
        {viewMode === 'day' && (
          <>
            <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>/</Text>
            <Text variant="medium" styles={{ root: { color: '#0078d4', fontWeight: 600 } }}>
              Day
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

              <Stack styles={{ root: { marginTop: 10, gap: 4, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' } }}>
                {unallocated.map(job => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={() => handleDragStart(job.id)}
                    onDoubleClick={() => handleJobDoubleClick(job.id)}
                    style={{
                      padding: '5px 8px',
                      backgroundColor: 'white',
                      borderRadius: 3,
                      cursor: 'grab',
                      border: '1px solid #ddd',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.08)'
                    }}
                  >
                    <Text variant="small" styles={{ root: { fontWeight: 600, fontSize: 11, color: '#333' } }}>
                      {job.orderNumber}
                    </Text>
                    <Text variant="tiny" styles={{ root: { fontSize: 10, color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' } }}>
                      {job.customer}
                    </Text>
                    <Text variant="tiny" styles={{ root: { fontSize: 9, color: '#0078d4', fontWeight: 500 } }}>
                      {job.estimatedEFinks} E-Finks
                    </Text>
                  </div>
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
              overtimeByTeam={getTeamOvertimeForDay(currentDateStr)}
              onTeamOvertimeChange={handleTeamOvertimeChange}
              globalStaging={globalStaging}
              onDropToTeamUnallocated={handleDropToTeamUnallocated}
              isDragging={!!draggedJobId}
              scheduleBlocks={scheduleBlocks.filter(block => block.dateStr === currentDateStr)}
              onBlockClick={(block) => {
                setEditingBlock(block);
                setBlockPanelOpen(true);
              }}
            />
          )}
        </Stack>
      </Stack>

      <ScheduleBlockPanel
        isOpen={blockPanelOpen}
        onDismiss={() => {
          setBlockPanelOpen(false);
          setSelectedBlockType(undefined);
        }}
        onSave={handleBlockSave}
        block={editingBlock}
        teams={jigTeams}
        defaultDate={viewMode === 'day' ? currentDateStr : undefined}
        defaultBlockType={selectedBlockType}
      />
    </Stack>
    </ShiftConfigProvider>
  );
};
