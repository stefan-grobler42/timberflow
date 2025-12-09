import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stack, Text, CommandBar, Spinner, MessageBar, MessageBarType, Dropdown
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { productionService, d365OrderService } from '../services/d365Services';
import { jigService, scheduleBlockService } from '../services/millenniumServices';
import type { ScheduleBlock } from '../services/millenniumServices';
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
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [currentDateStr, setCurrentDateStr] = useState(() => startOfMonthUtc(new Date()));
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [_selectedDayStr, _setSelectedDayStr] = useState<string | null>(null);
  const [basketCollapsed, setBasketCollapsed] = useState(true);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [overtimeByTeamDay, setOvertimeByTeamDay] = useState<Record<string, Record<string, { enabled: boolean; closeTime: number; earlyEnabled?: boolean; earlyStartTime?: number }>>>({});
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [operationMessage, setOperationMessage] = useState<string>('');
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
        // Only map WIP items that have a productionId (not WIP-only rollovers)
        if (wip.productionId) {
          wipByProductionId.set(wip.productionId, wip);
        }
      }
      console.log(`[PLANNER] ✓ Built WIP lookup map with ${wipByProductionId.size} entries`);
      
      // RESTORE OT STATE FROM WIP RECORDS
      // Group WIP items by workDate + teamId to derive per-team/day OT settings
      const restoredOTState: Record<string, Record<string, { enabled: boolean; closeTime: number; earlyEnabled?: boolean; earlyStartTime?: number }>> = {};
      
      for (const wip of wipItems) {
        if (!wip.workDate || !wip.teamId) continue;
        
        const dayStr = formatIsoDateLocal(wip.workDate);
        if (!dayStr) continue; // Skip if date couldn't be formatted
        
        const teamId = wip.teamId; // Now guaranteed non-null
        
        if (!restoredOTState[dayStr]) {
          restoredOTState[dayStr] = {};
        }
        
        const existing = restoredOTState[dayStr][teamId];
        
        // Prioritize enabled=true when any WIP record has it enabled
        // Use the most permissive settings (latest closeTime, earliest startTime)
        const newEnabled = wip.overtimeEnabled ?? false;
        const newCloseTime = wip.dayEndMinutes ?? 1140; // Default 19:00
        const newEarlyEnabled = wip.earlyOvertimeEnabled ?? false;
        const newEarlyStartTime = wip.dayStartMinutes ?? 360; // Default 06:00
        
        if (existing) {
          // Merge: any enabled wins, max closeTime, min earlyStartTime
          restoredOTState[dayStr][teamId] = {
            enabled: existing.enabled || newEnabled,
            closeTime: Math.max(existing.closeTime, newCloseTime),
            earlyEnabled: existing.earlyEnabled || newEarlyEnabled,
            earlyStartTime: Math.min(existing.earlyStartTime ?? 360, newEarlyStartTime)
          };
        } else {
          restoredOTState[dayStr][teamId] = {
            enabled: newEnabled,
            closeTime: newCloseTime,
            earlyEnabled: newEarlyEnabled,
            earlyStartTime: newEarlyStartTime
          };
        }
      }
      
      // Count how many team/days have OT enabled for logging
      let lateOTCount = 0;
      let earlyOTCount = 0;
      for (const dayStr of Object.keys(restoredOTState)) {
        for (const teamId of Object.keys(restoredOTState[dayStr])) {
          if (restoredOTState[dayStr][teamId].enabled) lateOTCount++;
          if (restoredOTState[dayStr][teamId].earlyEnabled) earlyOTCount++;
        }
      }
      console.log(`[PLANNER] ✓ Restored OT state: ${lateOTCount} late OT, ${earlyOTCount} early OT settings across ${Object.keys(restoredOTState).length} days`);
      
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
            customDurationMinutes: undefined,
            plannedDateStr: p.productionPlannedDate ? formatIsoDateLocal(p.productionPlannedDate) : null,
            jigId: null,
            productionComplete: p.productionComplete === true,
            parentProductionId: p.parentProductionId || undefined,
            rolloverSequence: undefined,
            createdOn: p.createdOn || undefined,
            plannedStartTime: null,
            plannedEndTime: null,
            plannedDurationMinutes: null,
            breakAdjustmentMinutes: null
          };
        });
        
        const allocatedCount = jobList.filter(j => j.wipId).length;
        console.log(`[PLANNER] ✓ Mapped ${jobList.length} production jobs (${allocatedCount} allocated via WIP, ${jobList.filter(j => j.productionComplete).length} completed)`);
        
        // WIP-FIRST: Add WIP-only rollover records (no Production record yet)
        // A WIP-only record is one where productionId is null/undefined (regardless of isRolloverOnly flag)
        const wipOnlyRollovers = wipItems.filter(wip => !wip.productionId);
        console.log(`[PLANNER] Found ${wipOnlyRollovers.length} WIP-only records to add (productionId is null)`);
        
        for (const wip of wipOnlyRollovers) {
          const wipOnlyJob: Job = {
            id: `wip-${wip.id}`, // Use wip prefix to distinguish from production IDs
            name: wip.productionName || 'Rollover',
            orderNumber: wip.orderNumber || 'N/A',
            customer: wip.customerName || 'Unknown',
            estimatedEFinks: wip.estimatedEfinks || 0,
            customDurationMinutes: wip.customDurationMinutes ?? undefined,
            plannedDateStr: formatIsoDateLocal(wip.workDate),
            jigId: wip.teamId || null,
            productionComplete: false,
            parentProductionId: wip.parentProductionId ?? undefined,
            rolloverSequence: wip.rolloverSequence || undefined,
            createdOn: wip.createdOn || undefined,
            plannedStartTime: wip.plannedStartMinutes !== undefined ? wip.plannedStartMinutes : null,
            plannedEndTime: wip.plannedEndMinutes !== undefined ? wip.plannedEndMinutes : null,
            plannedDurationMinutes: wip.plannedDurationMinutes !== undefined ? wip.plannedDurationMinutes : null,
            breakAdjustmentMinutes: wip.breakAdjustmentMinutes !== undefined ? wip.breakAdjustmentMinutes : null,
            wipId: wip.id,
            dayStartMinutes: wip.dayStartMinutes !== undefined ? wip.dayStartMinutes : undefined,
            dayEndMinutes: wip.dayEndMinutes !== undefined ? wip.dayEndMinutes : undefined,
            overtimeEnabled: wip.overtimeEnabled !== undefined ? wip.overtimeEnabled : undefined
          };
          jobList.push(wipOnlyJob);
        }
        
        console.log(`[PLANNER] ✓ Total jobs after adding WIP-only rollovers: ${jobList.length}`);
      } catch (mapErr) {
        console.error('[PLANNER] ✗ Job mapping FAILED:', mapErr);
        throw mapErr;
      }
      
      // D365 orders that don't have Production records yet - these go in the basket
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
      
      // Count productions with date but no team (these show in "Unallocated" column, not basket)
      const productionsWithDateNoTeam = jobList.filter(j => 
        j.plannedDateStr && // Has a production date
        j.jigId === null && // Not assigned to a team
        !j.productionComplete // Not completed
      ).length;
      
      // Only D365 orders without Production records go in the basket
      // Productions with dates but no team will appear in the "Unallocated" column in DayView
      console.log(`[PLANNER] ✓ Found ${productionsWithDateNoTeam} productions with date but no team (Unallocated column) + ${ordersNeedingProduction.length} D365 orders (basket)`);
      
      try {
        console.log('[PLANNER] Updating state...');
        setJobs(jobList);
        setUnallocatedOrders(ordersNeedingProduction);
        setJigTeams(jigs);
        setScheduleBlocks(blocks);
        setOvertimeByTeamDay(restoredOTState); // Restore OT toggle state from WIP records
        if (selectedJigIds.length === 0) {
          setSelectedJigIds(jigs.map(j => j.id));
        }
        setLoading(false);
        console.log(`[PLANNER] ✓ State updated: loading=false, jobs.length=${jobList.length}, unallocatedOrders=${ordersNeedingProduction.length}`);
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

  // All jobs is simply the combination of jobs and unallocated orders (no staging overlay)
  const allJobs = useMemo(() => baseJobs, [baseJobs]);

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

  // Save multiple job updates (for cascade operations)
  const saveMultipleJobUpdates = useCallback(async (
    updates: Array<{
      jobId: string;
      wipId?: string;
      teamId: string;
      workDate: string;
      plannedStartMinutes: number;
      plannedEndMinutes: number;
      plannedDurationMinutes: number;
      breakAdjustmentMinutes: number;
      customDurationMinutes?: number;
    }>
  ): Promise<boolean> => {
    try {
      setOperationInProgress(true); setOperationMessage('Saving changes...');
      
      const wipUpdates: { id: string; data: UpdateTeamWorkItemDto }[] = [];
      const wipCreates: CreateTeamWorkItemDto[] = [];

      for (const update of updates) {
        if (update.wipId) {
          wipUpdates.push({
            id: update.wipId,
            data: {
              teamId: update.teamId,
              workDate: update.workDate,
              plannedStartMinutes: update.plannedStartMinutes,
              plannedEndMinutes: update.plannedEndMinutes,
              plannedDurationMinutes: update.plannedDurationMinutes,
              breakAdjustmentMinutes: update.breakAdjustmentMinutes
            }
          });
        } else {
          wipCreates.push({
            productionId: update.jobId,
            teamId: update.teamId,
            workDate: update.workDate,
            sequence: 0,
            plannedStartMinutes: update.plannedStartMinutes,
            plannedEndMinutes: update.plannedEndMinutes,
            plannedDurationMinutes: update.plannedDurationMinutes,
            breakAdjustmentMinutes: update.breakAdjustmentMinutes,
            status: 'scheduled'
          });
        }
      }

      if (wipUpdates.length > 0) {
        await teamWorkItemService.batchUpdate(wipUpdates);
        console.log('[PLANNER] ✓ Batch updated', wipUpdates.length, 'WIP records');
      }

      if (wipCreates.length > 0) {
        await teamWorkItemService.batchAllocate(wipCreates);
        console.log('[PLANNER] ✓ Batch created', wipCreates.length, 'WIP records');
      }

      setJobs(prevJobs => {
        const updateMap = new Map(updates.map(u => [u.jobId, u]));
        return prevJobs.map(j => {
          const update = updateMap.get(j.id);
          if (update) {
            return {
              ...j,
              jigId: update.teamId,
              plannedDateStr: update.workDate,
              plannedStartTime: update.plannedStartMinutes,
              plannedEndTime: update.plannedEndMinutes,
              plannedDurationMinutes: update.plannedDurationMinutes,
              breakAdjustmentMinutes: update.breakAdjustmentMinutes,
              customDurationMinutes: update.customDurationMinutes ?? j.customDurationMinutes
            };
          }
          return j;
        });
      });

      return true;
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to save multiple jobs:', err);
      setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    } finally {
      setOperationInProgress(false); setOperationMessage('');
    }
  }, []);


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

  // Drop to a team/day column - assign jig, date, and calculate time with team-specific duration
  // Immediately saves to database (no staging)
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
        const team = jigTeams.find(t => t.id === updatedJigId);
        const teamAverageEfinks = team?.averageEfinks ?? 80;
        
        const teamSpecificDuration = PlannerV2.calculateEfinksDuration(job.estimatedEFinks, teamAverageEfinks);
        console.log('[PLANNER] Team-specific duration:', teamSpecificDuration, 'min (team avg efinks:', teamAverageEfinks, ')');
        
        const teamOvertimeSettings = overtimeByTeamDay[dateStr]?.[updatedJigId];
        const shift = PlannerV2.getShiftConfig(
          teamOvertimeSettings?.enabled, 
          teamOvertimeSettings?.closeTime,
          teamOvertimeSettings?.earlyEnabled,
          teamOvertimeSettings?.earlyStartTime
        );
        
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
          jigId: updatedJigId,
          plannedDurationMinutes: teamSpecificDuration
        };
        
        const cascadeResult = PlannerV2.cascadeSchedule(existingJobsOnDay, droppedJob, insertIndex, shift);
        
        console.log('[PLANNER] Cascade result:', cascadeResult.scheduledJobs.length, 'jobs scheduled,', cascadeResult.overflows.length, 'overflows');
        
        const updates: Array<{
          jobId: string;
          wipId?: string;
          teamId: string;
          workDate: string;
          plannedStartMinutes: number;
          plannedEndMinutes: number;
          plannedDurationMinutes: number;
          breakAdjustmentMinutes: number;
        }> = [];
        
        for (const scheduledJob of cascadeResult.scheduledJobs) {
          const originalJob = allJobs.find(j => j.id === scheduledJob.id);
          if (originalJob) {
            updates.push({
              jobId: scheduledJob.id,
              wipId: originalJob.wipId,
              teamId: updatedJigId,
              workDate: dateStr,
              plannedStartMinutes: scheduledJob.plannedStartTime ?? shift.startTime,
              plannedEndMinutes: scheduledJob.plannedEndTime ?? shift.endTime,
              plannedDurationMinutes: scheduledJob.plannedDurationMinutes ?? teamSpecificDuration,
              breakAdjustmentMinutes: scheduledJob.breakAdjustmentMinutes ?? 0
            });
          }
        }
        
        if (cascadeResult.overflows.length > 0) {
          console.log('[PLANNER] Processing', cascadeResult.overflows.length, 'multi-day overflows');
          
          const allScheduledJobs = allJobs.map(j => toScheduledJob(j));
          
          const multiDayResult = PlannerV2.processMultiDayOverflows(
            cascadeResult.overflows,
            allScheduledJobs,
            overtimeByTeamDay
          );
          
          console.log('[PLANNER] Multi-day result:', multiDayResult.affectedDays.length, 'days affected');
          
          for (const scheduledJob of multiDayResult.scheduledJobs) {
            const originalJob = allJobs.find(j => j.id === scheduledJob.id);
            if (originalJob && scheduledJob.plannedDateStr && scheduledJob.plannedStartTime !== null) {
              const existingUpdate = updates.find(u => u.jobId === scheduledJob.id);
              if (!existingUpdate) {
                updates.push({
                  jobId: scheduledJob.id,
                  wipId: originalJob.wipId,
                  teamId: scheduledJob.jigId ?? updatedJigId,
                  workDate: scheduledJob.plannedDateStr,
                  plannedStartMinutes: scheduledJob.plannedStartTime ?? shift.startTime,
                  plannedEndMinutes: scheduledJob.plannedEndTime ?? shift.endTime,
                  plannedDurationMinutes: scheduledJob.plannedDurationMinutes ?? 60,
                  breakAdjustmentMinutes: scheduledJob.breakAdjustmentMinutes ?? 0
                });
              }
            }
          }
        }
        
        const success = await saveMultipleJobUpdates(updates);
        if (!success) {
          console.error('[PLANNER] Failed to save job allocations');
        }
        
        if (viewMode !== 'day') {
          setViewMode('day');
          setCurrentDateStr(dateStr);
        }
      } else {
        console.log('[PLANNER] Dropping to unallocated - removing from team');
        
        if (job.wipId) {
          setOperationInProgress(true); setOperationMessage('Saving changes...');
          await teamWorkItemService.deleteByProductionId(job.id);
          console.log('[PLANNER] ✓ Deleted WIP record for job:', job.id);
        }
        
        setJobs(prevJobs => prevJobs.map(j => {
          if (j.id === job.id) {
            return {
              ...j,
              jigId: null,
              plannedDateStr: dateStr,
              plannedStartTime: null,
              plannedEndTime: null,
              plannedDurationMinutes: null,
              wipId: undefined
            };
          }
          return j;
        }));
        
        setOperationInProgress(false); setOperationMessage('');
        console.log('[PLANNER] ✓ Job unallocated successfully');
        
        if (viewMode !== 'day') {
          setViewMode('day');
          setCurrentDateStr(dateStr);
        }
      }
      
      if (isSalesOrder) {
        console.log('[PLANNER] Note: Sales order dropped - production will be created');
      }
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to schedule job:', err);
      setError(`Failed to schedule job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDraggedJobId(null);
    }
  };

  // Drop to global unallocated basket - delete WIP record
  const handleDropToUnallocated = async () => {
    if (!draggedJobId) return;
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;

    const isSalesOrder = job.id.startsWith('order-');
    if (isSalesOrder) {
      setDraggedJobId(null);
      return;
    }

    try {
      setOperationInProgress(true); setOperationMessage('Saving changes...');
      
      if (job.wipId) {
        await teamWorkItemService.deleteByProductionId(job.id);
        console.log('[PLANNER] ✓ Deleted WIP record for job:', job.id);
      }
      
      setJobs(prevJobs => prevJobs.map(j => {
        if (j.id === job.id) {
          return {
            ...j,
            jigId: null,
            plannedDateStr: null,
            plannedStartTime: null,
            plannedEndTime: null,
            plannedDurationMinutes: null,
            wipId: undefined
          };
        }
        return j;
      }));
      
      console.log('[PLANNER] ✓ Unallocated job:', job.id);
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to unallocate job:', err);
      setError(`Failed to unallocate: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(false); setOperationMessage('');
      setDraggedJobId(null);
    }
  };

  // Drop to team unallocated column - for now just unallocate (team-only assignment not supported via WIP)
  const handleDropToTeamUnallocated = async (jigId: string) => {
    if (!draggedJobId) return;
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;

    const isSalesOrder = job.id.startsWith('order-');
    if (isSalesOrder) {
      setDraggedJobId(null);
      return;
    }

    try {
      setOperationInProgress(true); setOperationMessage('Saving changes...');
      
      if (job.wipId) {
        await teamWorkItemService.deleteByProductionId(job.id);
        console.log('[PLANNER] ✓ Deleted WIP record for team unallocate:', job.id);
      }
      
      setJobs(prevJobs => prevJobs.map(j => {
        if (j.id === job.id) {
          return {
            ...j,
            jigId: null,
            plannedDateStr: null,
            plannedStartTime: null,
            plannedEndTime: null,
            plannedDurationMinutes: null,
            wipId: undefined
          };
        }
        return j;
      }));
      
      console.log('[PLANNER] ✓ Team unallocated job:', job.id, 'from team:', jigId);
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to team unallocate job:', err);
      setError(`Failed to unallocate: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(false); setOperationMessage('');
      setDraggedJobId(null);
    }
  };

  const handleJobDoubleClick = (jobId: string) => {
    navigate(`/production-planner/${jobId}`);
  };

  const handleJobDurationChange = async (jobId: string, durationMinutes: number) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const dateStr = job.plannedDateStr;
    const jigId = job.jigId;
    
    const roundedDuration = PlannerV2.roundToQuarterHour(durationMinutes);
    
    if (job.plannedStartTime != null && jigId && dateStr) {
      const teamOvertime = overtimeByTeamDay[dateStr]?.[jigId];
      const shift = PlannerV2.getShiftConfig(
        teamOvertime?.enabled, 
        teamOvertime?.closeTime,
        teamOvertime?.earlyEnabled,
        teamOvertime?.earlyStartTime
      );
      
      const timing = PlannerV2.calculateEndTime(job.plannedStartTime, roundedDuration, shift);
      
      const existingJobsOnDay = allJobs.filter(
        j => j.plannedDateStr === dateStr && 
             j.jigId === jigId && 
             j.id !== job.id &&
             !j.productionComplete
      ).sort((a, b) => (a.plannedStartTime ?? shift.startTime) - (b.plannedStartTime ?? shift.startTime))
       .map(j => toScheduledJob(j));
      
      const subsequentJobs = existingJobsOnDay.filter(
        j => (j.plannedStartTime ?? 0) >= (job.plannedStartTime ?? 0)
      );
      
      const updates: Array<{
        jobId: string;
        wipId?: string;
        teamId: string;
        workDate: string;
        plannedStartMinutes: number;
        plannedEndMinutes: number;
        plannedDurationMinutes: number;
        breakAdjustmentMinutes: number;
        customDurationMinutes?: number;
      }> = [];
      
      updates.push({
        jobId: job.id,
        wipId: job.wipId,
        teamId: jigId,
        workDate: dateStr,
        plannedStartMinutes: job.plannedStartTime,
        plannedEndMinutes: timing.endTime,
        plannedDurationMinutes: roundedDuration,
        breakAdjustmentMinutes: timing.breakMinutes,
        customDurationMinutes: roundedDuration
      });
      
      if (subsequentJobs.length > 0) {
        // Cascade uses break-aware scheduling
        // Start from resized job's end time + buffer, skipping breaks
        let nextStartTime = PlannerV2.getNextAvailableTime(timing.endTime, shift) ?? shift.endTime;
        
        for (const subsequentJob of subsequentJobs) {
          const origJob = allJobs.find(j => j.id === subsequentJob.id);
          if (!origJob) continue;
          
          const jobDuration = subsequentJob.plannedDurationMinutes ?? 
            PlannerV2.calculateEfinksDuration(subsequentJob.estimatedEFinks);
          
          // Schedule job at next available time (break-aware)
          const subTiming = PlannerV2.calculateEndTime(nextStartTime, jobDuration, shift);
          
          updates.push({
            jobId: subsequentJob.id,
            wipId: origJob.wipId,
            teamId: jigId,
            workDate: dateStr,
            plannedStartMinutes: nextStartTime,
            plannedEndMinutes: subTiming.endTime,
            plannedDurationMinutes: jobDuration,
            breakAdjustmentMinutes: subTiming.breakMinutes
          });
          
          // Next job starts after this one ends (break-aware with buffer)
          nextStartTime = PlannerV2.getNextAvailableTime(subTiming.endTime, shift) ?? shift.endTime;
        }
      }
      
      const success = await saveMultipleJobUpdates(updates);
      if (success) {
        console.log('[PLANNER] ✓ Saved resize with', updates.length, 'affected jobs');
      }
    } else {
      console.log('[PLANNER] Resize for unallocated job - skipping save');
    }
  };

  const handleJobDurationReset = async (jobId: string) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const calculatedDuration = PlannerV2.calculateEfinksDuration(job.estimatedEFinks);
    console.log(`[PLANNER] Resetting job ${jobId} from custom duration to calculated: ${calculatedDuration}m`);
    
    setJobs(prevJobs => prevJobs.map(j => 
      j.id === jobId ? { ...j, customDurationMinutes: undefined } : j
    ));
    
    if (job.plannedStartTime != null && job.jigId && job.plannedDateStr) {
      const teamOvertime = overtimeByTeamDay[job.plannedDateStr]?.[job.jigId];
      const shift = PlannerV2.getShiftConfig(
        teamOvertime?.enabled, 
        teamOvertime?.closeTime,
        teamOvertime?.earlyEnabled,
        teamOvertime?.earlyStartTime
      );
      const timing = PlannerV2.calculateEndTime(job.plannedStartTime, calculatedDuration, shift);
      
      const updates = [{
        jobId: job.id,
        wipId: job.wipId,
        teamId: job.jigId,
        workDate: job.plannedDateStr,
        plannedStartMinutes: job.plannedStartTime,
        plannedEndMinutes: timing.endTime,
        plannedDurationMinutes: calculatedDuration,
        breakAdjustmentMinutes: timing.breakMinutes,
        customDurationMinutes: undefined
      }];
      
      await saveMultipleJobUpdates(updates);
      console.log('[PLANNER] ✓ Reset job duration to calculated value');
    }
  };

  const handleTeamOvertimeChange = async (dayStr: string, teamId: string, enabled: boolean, closeTime: number, _additionalMinutes?: number) => {
    console.log(`[PLANNER] Team overtime change for ${dayStr}/${teamId}: enabled=${enabled}, closeTime=${closeTime}`);
    
    // Update local state immediately for UI responsiveness
    // IMPORTANT: Spread existing team entry to preserve earlyEnabled/earlyStartTime when changing Late OT
    setOvertimeByTeamDay(prev => ({
      ...prev,
      [dayStr]: {
        ...(prev[dayStr] || {}),
        [teamId]: { 
          ...(prev[dayStr]?.[teamId] || { earlyEnabled: false, earlyStartTime: 360 }),
          enabled, 
          closeTime 
        }
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
    
    // Show loading overlay
    setOperationInProgress(true);
    setOperationMessage(enabled ? 'Enabling overtime...' : 'Disabling overtime...');
    
    try {
      // Get the new shift configuration based on overtime settings
      // Preserve early OT settings when changing late OT
      const existingEarlySettings = overtimeByTeamDay[dayStr]?.[teamId];
      const newShift = PlannerV2.getShiftConfig(
        enabled, 
        closeTime,
        existingEarlySettings?.earlyEnabled,
        existingEarlySettings?.earlyStartTime
      );
      
      // Get the OLD shift config (without OT) to understand the previous capacity
      const oldShift = PlannerV2.getShiftConfig(
        false, // no late OT
        1020,  // default 17:00
        existingEarlySettings?.earlyEnabled,
        existingEarlySettings?.earlyStartTime
      );
      
      // ROLLOVER REDISTRIBUTION: When OT is enabled, extend first-day segments and shrink rollovers
      // IMPORTANT: Do this BEFORE any rescheduling to preserve original WIP durations
      if (enabled) {
        console.log(`[OT-ROLLOVER] Checking for rollover chains to redistribute...`);
        
        // Find jobs on this day/team that are parents of rollover chains
        for (const parentJob of affectedJobs) {
          const rootParentId = parentJob.parentProductionId || parentJob.id;
          const currentSequence = parentJob.rolloverSequence || 0;
          
          // Find rollover child (next segment in chain)
          const rolloverChild = allJobs.find(j => 
            j.parentProductionId === rootParentId && 
            (j.rolloverSequence || 0) === currentSequence + 1
          );
          
          if (!rolloverChild) continue;
          
          console.log(`[OT-ROLLOVER] Found rollover chain: ${parentJob.orderNumber} -> ${rolloverChild.orderNumber}`);
          
          // CRITICAL: Use the CURRENT WIP durations directly - don't recalculate from E-Finks
          // These are the truncated durations that represent actual work allocation
          const parentCurrentDuration = parentJob.plannedDurationMinutes ?? parentJob.customDurationMinutes ?? 
            PlannerV2.getJobDuration({ estimatedEFinks: parentJob.estimatedEFinks });
          const rolloverCurrentDuration = rolloverChild.plannedDurationMinutes ?? rolloverChild.customDurationMinutes ??
            PlannerV2.getJobDuration({ estimatedEFinks: rolloverChild.estimatedEFinks });
          
          console.log(`[OT-ROLLOVER] Current parent WIP duration: ${parentCurrentDuration}m, Current rollover WIP duration: ${rolloverCurrentDuration}m`);
          
          // Calculate how much EXTRA time is available with the new OT shift
          // Parent's start time determines when we begin working
          const parentStartTime = parentJob.plannedStartTime ?? newShift.startTime;
          
          // Available time WITH OT (including dinner break if applicable)
          const availableWithOT = PlannerV2.getAvailableMinutes(parentStartTime, newShift);
          
          // Available time WITHOUT OT (what we had before)
          const availableWithoutOT = PlannerV2.getAvailableMinutes(parentStartTime, oldShift);
          
          // Extra time gained from OT
          const extraTimeFromOT = availableWithOT - availableWithoutOT;
          
          console.log(`[OT-ROLLOVER] Available without OT: ${availableWithoutOT}m, Available with OT: ${availableWithOT}m, Extra time: ${extraTimeFromOT}m`);
          
          if (extraTimeFromOT <= 0) {
            console.log(`[OT-ROLLOVER] No extra time available from OT, skipping redistribution`);
            continue;
          }
          
          // Calculate how much of the rollover we can absorb
          // We can absorb up to the extra time available, but not more than the rollover duration
          const timeToAbsorb = Math.min(extraTimeFromOT, rolloverCurrentDuration);
          const newParentDuration = parentCurrentDuration + timeToAbsorb;
          const newRolloverDuration = rolloverCurrentDuration - timeToAbsorb;
          
          console.log(`[OT-ROLLOVER] Absorbing ${timeToAbsorb}m from rollover. New parent: ${newParentDuration}m, New rollover: ${newRolloverDuration}m`);
          
          // PROPORTIONAL E-FINKS REDISTRIBUTION
          // Total E-Finks must be preserved across the chain
          const totalEFinks = parentJob.estimatedEFinks + rolloverChild.estimatedEFinks;
          const totalDuration = newParentDuration + newRolloverDuration;
          
          // Calculate proportional E-Finks based on new durations
          // Parent gets more E-Finks (more work time), rollover gets less
          const newParentEFinks = Math.round((newParentDuration / totalDuration) * totalEFinks);
          const newRolloverEFinks = totalEFinks - newParentEFinks; // Ensures sum is exact
          
          console.log(`[OT-ROLLOVER] E-Finks redistribution: Total=${totalEFinks}, Parent=${newParentEFinks} (was ${parentJob.estimatedEFinks}), Rollover=${newRolloverEFinks} (was ${rolloverChild.estimatedEFinks})`);
          
          // Update parent job with extended duration - recalculate end time with new duration
          const parentTiming = PlannerV2.calculateEndTime(parentStartTime, newParentDuration, newShift);
          
          // Update parent Production with new E-Finks
          await productionService.update(parentJob.id, {
            plannedDurationMinutes: newParentDuration,
            newEstimateDefinks: newParentEFinks
          });
          console.log(`[OT-ROLLOVER] ✓ Updated parent Production: duration=${newParentDuration}m, efinks=${newParentEFinks}`);
          
          if (parentJob.wipId) {
            await teamWorkItemService.batchUpdate([{
              id: parentJob.wipId,
              data: {
                overtimeEnabled: enabled,
                dayEndMinutes: closeTime,
                plannedDurationMinutes: newParentDuration,
                plannedEndMinutes: parentTiming.endTime,
                breakAdjustmentMinutes: parentTiming.breakMinutes,
                estimatedEfinks: newParentEFinks,
                customDurationMinutes: newParentDuration
              }
            }]);
            console.log(`[OT-ROLLOVER] ✓ Extended parent WIP to ${newParentDuration}m, ends at ${parentTiming.endTime}, efinks=${newParentEFinks}`);
          }
          
          // Update or delete rollover
          // Check if rollover is WIP-only (no Production record exists)
          // WIP-only rollovers have IDs starting with "wip-" or are rollovers without a valid production ID
          const isWipOnlyRollover = rolloverChild.id.startsWith('wip-');
          
          if (newRolloverDuration <= 0) {
            // Rollover no longer needed - delete it
            // Restore all E-Finks to parent
            console.log(`[OT-ROLLOVER] Rollover fully absorbed, restoring all ${totalEFinks} E-Finks to parent`);
            
            await productionService.update(parentJob.id, {
              newEstimateDefinks: totalEFinks
            });
            
            // Delete WIP record first (if exists)
            if (rolloverChild.wipId) {
              await teamWorkItemService.delete(rolloverChild.wipId);
              console.log(`[OT-ROLLOVER] ✓ Deleted rollover WIP`);
            }
            
            // Delete Production record only if it exists (not WIP-only)
            if (!isWipOnlyRollover) {
              await productionService.delete(rolloverChild.id);
              console.log(`[OT-ROLLOVER] ✓ Deleted rollover Production`);
            }
          } else {
            // Update rollover with reduced duration and E-Finks
            // Only update Production if it exists (not WIP-only)
            if (!isWipOnlyRollover) {
              await productionService.update(rolloverChild.id, {
                plannedDurationMinutes: newRolloverDuration,
                newEstimateDefinks: newRolloverEFinks
              });
              console.log(`[OT-ROLLOVER] ✓ Reduced rollover Production: duration=${newRolloverDuration}m, efinks=${newRolloverEFinks}`);
            } else {
              console.log(`[OT-ROLLOVER] Rollover is WIP-only, skipping Production update`);
            }
            
            // Update rollover WIP if exists - ALWAYS start at day's shift start time
            if (rolloverChild.wipId) {
              const rolloverDateStr = rolloverChild.plannedDateStr!;
              const rolloverTeamOvertime = overtimeByTeamDay[rolloverDateStr]?.[teamId];
              const rolloverShift = PlannerV2.getShiftConfig(
                rolloverTeamOvertime?.enabled,
                rolloverTeamOvertime?.closeTime,
                rolloverTeamOvertime?.earlyEnabled,
                rolloverTeamOvertime?.earlyStartTime
              );
              // Rollover should ALWAYS start at day's shift start time
              const rolloverStartTime = rolloverShift.startTime;
              const rolloverTiming = PlannerV2.calculateEndTime(rolloverStartTime, newRolloverDuration, rolloverShift);
              
              console.log(`[OT-ROLLOVER] Resetting rollover to start at day start: ${rolloverStartTime}`);
              
              await teamWorkItemService.batchUpdate([{
                id: rolloverChild.wipId,
                data: {
                  plannedStartMinutes: rolloverStartTime,
                  plannedDurationMinutes: newRolloverDuration,
                  plannedEndMinutes: rolloverTiming.endTime,
                  breakAdjustmentMinutes: rolloverTiming.breakMinutes,
                  estimatedEfinks: newRolloverEFinks,
                  customDurationMinutes: newRolloverDuration
                }
              }]);
              console.log(`[OT-ROLLOVER] ✓ Updated rollover WIP: start=${rolloverStartTime}, duration=${newRolloverDuration}m, efinks=${newRolloverEFinks}`);
            }
          }
        }
        
        // For jobs that are NOT part of rollover chains, just update OT settings
        const nonRolloverJobs = affectedJobs.filter(job => {
          const rootParentId = job.parentProductionId || job.id;
          const currentSequence = job.rolloverSequence || 0;
          // Check if this job has a rollover child
          const hasRolloverChild = allJobs.some(j => 
            j.parentProductionId === rootParentId && 
            (j.rolloverSequence || 0) === currentSequence + 1
          );
          return !hasRolloverChild;
        });
        
        if (nonRolloverJobs.length > 0) {
          const nonRolloverUpdates = nonRolloverJobs.map(job => ({
            id: job.wipId!,
            data: {
              overtimeEnabled: enabled,
              dayEndMinutes: closeTime
            }
          }));
          await teamWorkItemService.batchUpdate(nonRolloverUpdates);
          console.log(`[PLANNER] ✓ Updated OT settings for ${nonRolloverJobs.length} non-rollover jobs`);
        }
        
        // Reload data to reflect all changes
        await loadData();
        return; // Skip the regular state update since we're reloading
      }
      
      // OT being DISABLED - redistribute time back from parent to rollover
      console.log(`[OT-ROLLOVER] OT disabled - checking for rollover chains to redistribute back...`);
      
      // Get the shift without OT (standard hours)
      const noOTShift = PlannerV2.getShiftConfig(
        false, // no late OT
        1020,  // default 17:00
        existingEarlySettings?.earlyEnabled,
        existingEarlySettings?.earlyStartTime
      );
      
      // Find jobs on this day/team that are parents of rollover chains
      for (const parentJob of affectedJobs) {
        const rootParentId = parentJob.parentProductionId || parentJob.id;
        const currentSequence = parentJob.rolloverSequence || 0;
        
        // Find rollover child (next segment in chain)
        const rolloverChild = allJobs.find(j => 
          j.parentProductionId === rootParentId && 
          (j.rolloverSequence || 0) === currentSequence + 1
        );
        
        if (!rolloverChild) continue;
        
        console.log(`[OT-ROLLOVER] Found rollover chain to redistribute back: ${parentJob.orderNumber} -> ${rolloverChild.orderNumber}`);
        
        // Get current durations
        const parentCurrentDuration = parentJob.plannedDurationMinutes ?? parentJob.customDurationMinutes ?? 
          PlannerV2.getJobDuration({ estimatedEFinks: parentJob.estimatedEFinks });
        const rolloverCurrentDuration = rolloverChild.plannedDurationMinutes ?? rolloverChild.customDurationMinutes ??
          PlannerV2.getJobDuration({ estimatedEFinks: rolloverChild.estimatedEFinks });
        
        console.log(`[OT-ROLLOVER] Current parent duration: ${parentCurrentDuration}m, Current rollover duration: ${rolloverCurrentDuration}m`);
        
        // Calculate how much time is available WITHOUT OT
        const parentStartTime = parentJob.plannedStartTime ?? noOTShift.startTime;
        const availableWithoutOT = PlannerV2.getAvailableMinutes(parentStartTime, noOTShift);
        
        // If parent currently exceeds available time without OT, need to shrink it
        if (parentCurrentDuration > availableWithoutOT) {
          const excessTime = parentCurrentDuration - availableWithoutOT;
          const newParentDuration = availableWithoutOT;
          const newRolloverDuration = rolloverCurrentDuration + excessTime;
          
          console.log(`[OT-ROLLOVER] Redistributing ${excessTime}m back to rollover. New parent: ${newParentDuration}m, New rollover: ${newRolloverDuration}m`);
          
          // PROPORTIONAL E-FINKS REDISTRIBUTION
          const totalEFinks = parentJob.estimatedEFinks + rolloverChild.estimatedEFinks;
          const totalDuration = newParentDuration + newRolloverDuration;
          
          // Parent gets less E-Finks (less work time), rollover gets more
          const newParentEFinks = Math.round((newParentDuration / totalDuration) * totalEFinks);
          const newRolloverEFinks = totalEFinks - newParentEFinks;
          
          console.log(`[OT-ROLLOVER] E-Finks redistribution: Total=${totalEFinks}, Parent=${newParentEFinks} (was ${parentJob.estimatedEFinks}), Rollover=${newRolloverEFinks} (was ${rolloverChild.estimatedEFinks})`);
          
          // Check if rollover is WIP-only (no Production record exists)
          const isWipOnlyRolloverDisable = rolloverChild.id.startsWith('wip-');
          
          // Update parent Production with new E-Finks and duration
          await productionService.update(parentJob.id, {
            plannedDurationMinutes: newParentDuration,
            newEstimateDefinks: newParentEFinks
          });
          
          // Update parent WIP
          const parentTiming = PlannerV2.calculateEndTime(parentStartTime, newParentDuration, noOTShift);
          if (parentJob.wipId) {
            await teamWorkItemService.batchUpdate([{
              id: parentJob.wipId,
              data: {
                overtimeEnabled: false,
                dayEndMinutes: undefined,
                plannedDurationMinutes: newParentDuration,
                plannedEndMinutes: parentTiming.endTime,
                breakAdjustmentMinutes: parentTiming.breakMinutes,
                estimatedEfinks: newParentEFinks
              }
            }]);
            console.log(`[OT-ROLLOVER] ✓ Shrunk parent WIP to ${newParentDuration}m, efinks=${newParentEFinks}`);
          }
          
          // Update rollover Production with new E-Finks and duration (only if not WIP-only)
          if (!isWipOnlyRolloverDisable) {
            await productionService.update(rolloverChild.id, {
              plannedDurationMinutes: newRolloverDuration,
              newEstimateDefinks: newRolloverEFinks
            });
            console.log(`[OT-ROLLOVER] ✓ Enlarged rollover Production: duration=${newRolloverDuration}m, efinks=${newRolloverEFinks}`);
          } else {
            console.log(`[OT-ROLLOVER] Rollover is WIP-only, skipping Production update`);
          }
          
          // Update rollover WIP - CRITICAL: Also set overtimeEnabled: false so loadData doesn't re-enable OT
          if (rolloverChild.wipId) {
            const rolloverDateStr = rolloverChild.plannedDateStr!;
            const rolloverTeamOvertime = overtimeByTeamDay[rolloverDateStr]?.[teamId];
            const rolloverShift = PlannerV2.getShiftConfig(
              rolloverTeamOvertime?.enabled,
              rolloverTeamOvertime?.closeTime,
              rolloverTeamOvertime?.earlyEnabled,
              rolloverTeamOvertime?.earlyStartTime
            );
            const rolloverStartTime = rolloverShift.startTime;
            const rolloverTiming = PlannerV2.calculateEndTime(rolloverStartTime, newRolloverDuration, rolloverShift);
            
            await teamWorkItemService.batchUpdate([{
              id: rolloverChild.wipId,
              data: {
                plannedStartMinutes: rolloverStartTime,
                plannedDurationMinutes: newRolloverDuration,
                plannedEndMinutes: rolloverTiming.endTime,
                breakAdjustmentMinutes: rolloverTiming.breakMinutes,
                estimatedEfinks: newRolloverEFinks,
                customDurationMinutes: newRolloverDuration,
                overtimeEnabled: false,
                dayEndMinutes: undefined
              }
            }]);
            console.log(`[OT-ROLLOVER] ✓ Enlarged rollover WIP to ${newRolloverDuration}m, efinks=${newRolloverEFinks}`);
          }
        } else {
          // Parent fits in standard hours, just update OT flag for both parent AND any rollover children
          if (parentJob.wipId) {
            await teamWorkItemService.batchUpdate([{
              id: parentJob.wipId,
              data: {
                overtimeEnabled: false,
                dayEndMinutes: undefined
              }
            }]);
          }
          // Also update rollover child's OT flag if it exists
          if (rolloverChild.wipId) {
            await teamWorkItemService.batchUpdate([{
              id: rolloverChild.wipId,
              data: {
                overtimeEnabled: false,
                dayEndMinutes: undefined
              }
            }]);
          }
        }
      }
      
      // For jobs that are NOT part of rollover chains, just update OT settings
      const nonRolloverJobsOff = affectedJobs.filter(job => {
        const rootParentId = job.parentProductionId || job.id;
        const currentSequence = job.rolloverSequence || 0;
        const hasRolloverChild = allJobs.some(j => 
          j.parentProductionId === rootParentId && 
          (j.rolloverSequence || 0) === currentSequence + 1
        );
        return !hasRolloverChild;
      });
      
      if (nonRolloverJobsOff.length > 0) {
        const updates: { id: string; data: UpdateTeamWorkItemDto }[] = nonRolloverJobsOff.map(job => ({
          id: job.wipId!,
          data: {
            overtimeEnabled: false,
            dayEndMinutes: undefined
          }
        }));
        await teamWorkItemService.batchUpdate(updates);
        console.log(`[PLANNER] ✓ WIP overtime settings disabled for ${nonRolloverJobsOff.length} non-rollover jobs`);
      }
      
      // Reload data to reflect all changes
      await loadData();
      
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to persist overtime settings:', err);
      // Revert local state on error - preserve early OT settings
      setOvertimeByTeamDay(prev => ({
        ...prev,
        [dayStr]: {
          ...(prev[dayStr] || {}),
          [teamId]: { 
            ...(prev[dayStr]?.[teamId] || { earlyEnabled: false, earlyStartTime: 360 }),
            enabled: !enabled, 
            closeTime 
          }
        }
      }));
    } finally {
      setOperationInProgress(false);
      setOperationMessage('');
    }
  };

  const handleTeamEarlyOvertimeChange = async (dayStr: string, teamId: string, earlyEnabled: boolean, earlyStartTime: number) => {
    console.log(`[PLANNER] Team early overtime change for ${dayStr}/${teamId}: earlyEnabled=${earlyEnabled}, earlyStartTime=${earlyStartTime}`);
    
    // Update local state immediately for UI responsiveness
    setOvertimeByTeamDay(prev => ({
      ...prev,
      [dayStr]: {
        ...(prev[dayStr] || {}),
        [teamId]: { 
          ...(prev[dayStr]?.[teamId] || { enabled: false, closeTime: 1140 }),
          earlyEnabled, 
          earlyStartTime 
        }
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
    
    console.log(`[PLANNER] Updating ${affectedJobs.length} WIP records with earlyOvertimeEnabled=${earlyEnabled}, earlyStartTime=${earlyStartTime}`);
    
    // Show loading overlay
    setOperationInProgress(true);
    setOperationMessage(earlyEnabled ? 'Enabling early overtime...' : 'Disabling early overtime...');
    
    try {
      // Get the new shift configuration based on early OT settings
      // Preserve late OT settings when changing early OT
      const existingLateSettings = overtimeByTeamDay[dayStr]?.[teamId];
      const newShift = PlannerV2.getShiftConfig(
        existingLateSettings?.enabled,
        existingLateSettings?.closeTime,
        earlyEnabled,
        earlyStartTime
      );
      
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
      
      // Recalculate job positions with the new shift configuration (jobs start at new start time)
      const { scheduledJobs: rescheduledJobs } = PlannerV2.rescheduleDay(scheduledJobs, newShift);
      console.log(`[PLANNER] ✓ Recalculated ${rescheduledJobs.length} job positions with new early OT shift config`);
      
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
            earlyOvertimeEnabled: earlyEnabled,
            dayStartMinutes: earlyEnabled ? earlyStartTime : undefined,
            plannedStartMinutes: rescheduled?.plannedStartTime ?? job.plannedStartTime ?? undefined,
            plannedEndMinutes: rescheduled?.plannedEndTime ?? job.plannedEndTime ?? undefined,
            plannedDurationMinutes: rescheduled?.plannedDurationMinutes ?? job.plannedDurationMinutes ?? undefined,
            breakAdjustmentMinutes: rescheduled?.breakAdjustmentMinutes ?? job.breakAdjustmentMinutes ?? undefined
          }
        };
      });
      
      // Persist to WIP table
      await teamWorkItemService.batchUpdate(updates);
      console.log(`[PLANNER] ✓ Early overtime settings and rescheduled times persisted for ${affectedJobs.length} jobs`);
      
      // Update local jobs state with rescheduled times
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.plannedDateStr === dayStr && job.jigId === teamId && job.wipId) {
          const rescheduled = rescheduledMap.get(job.id);
          if (rescheduled) {
            return {
              ...job,
              plannedStartTime: rescheduled.plannedStartTime ?? job.plannedStartTime,
              plannedEndTime: rescheduled.plannedEndTime ?? job.plannedEndTime,
              plannedDurationMinutes: rescheduled.plannedDurationMinutes !== undefined ? rescheduled.plannedDurationMinutes : job.plannedDurationMinutes,
              breakAdjustmentMinutes: rescheduled.breakAdjustmentMinutes !== undefined ? rescheduled.breakAdjustmentMinutes : job.breakAdjustmentMinutes
            };
          }
        }
        return job;
      }));
      
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to persist early overtime settings:', err);
      // Revert local state on error
      setOvertimeByTeamDay(prev => ({
        ...prev,
        [dayStr]: {
          ...(prev[dayStr] || {}),
          [teamId]: { 
            ...(prev[dayStr]?.[teamId] || { enabled: false, closeTime: 1140 }),
            earlyEnabled: !earlyEnabled, 
            earlyStartTime 
          }
        }
      }));
    } finally {
      setOperationInProgress(false);
      setOperationMessage('');
    }
  };

  const getTeamOvertimeForDay = (dayStr: string): Record<string, { enabled: boolean; closeTime: number; earlyEnabled?: boolean; earlyStartTime?: number }> => {
    return overtimeByTeamDay[dayStr] || {};
  };

  const handleJobRollover = async (jobId: string, _overflowMinutes: number, nextDateStr: string, jigId: string | null) => {
    try {
      // Show loading overlay
      setOperationInProgress(true);
      setOperationMessage('Creating rollover...');
      
      console.log('[ROLLOVER] ========== Starting rollover ==========');
      console.log('[ROLLOVER] Job ID:', jobId);
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

      // BUG FIX: Calculate available time using getAvailableMinutes instead of subtracting overflow
      // The overflow calculation includes break visual time, but we need WORK TIME only
      const preservedJigId = jigId ?? job.jigId;
      const dateStr = job.plannedDateStr!;
      const teamOvertime = overtimeByTeamDay[dateStr]?.[preservedJigId || ''];
      const shift = PlannerV2.getShiftConfig(
        teamOvertime?.enabled,
        teamOvertime?.closeTime,
        teamOvertime?.earlyEnabled,
        teamOvertime?.earlyStartTime
      );
      
      const jobStartTime = job.plannedStartTime ?? shift.startTime;
      const currentDuration = job.plannedDurationMinutes ?? job.customDurationMinutes ?? Math.round(job.estimatedEFinks * 6.5625);
      
      // Calculate EXACTLY how much work time fits on day 1 (from job start to end of day)
      const availableOnDay1 = PlannerV2.getAvailableMinutes(jobStartTime, shift);
      const remainingDuration = Math.min(availableOnDay1, currentDuration);
      const overflowMinutes = currentDuration - remainingDuration;
      
      console.log('[ROLLOVER] Duration calculation:', {
        currentDuration,
        jobStartTime,
        shiftEnd: shift.endTime,
        availableOnDay1,
        remainingDuration,
        overflowMinutes
      });

      // Determine the root parent ID for this job chain
      const rootParentId = job.parentProductionId || jobId;
      const currentSequence = job.rolloverSequence || 0;
      console.log('[ROLLOVER] Root parent ID:', rootParentId);
      console.log('[ROLLOVER] Current sequence:', currentSequence);

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

      // WIP-FIRST ARCHITECTURE: Rollovers are created as WIP-only records initially
      // No Production record is created until job completion
      
      // Look up the original job's WIP record from API if not in local state
      let originalWipId = job.wipId;
      if (!originalWipId && preservedJigId) {
        console.log('[ROLLOVER] wipId not in local state, looking up from API...');
        try {
          const wipRecords = await teamWorkItemService.getByProductionId(jobId);
          if (wipRecords && wipRecords.length > 0) {
            originalWipId = wipRecords[0].id;
            console.log('[ROLLOVER] Found WIP record from API:', originalWipId);
          }
        } catch (lookupErr) {
          console.log('[ROLLOVER] Could not look up WIP record:', lookupErr);
        }
      }
      
      // If existing rollover child exists, DELETE it first
      // Check if it's a WIP-only rollover (no productionId) or has a Production record
      if (existingRollover) {
        console.log('[ROLLOVER] Deleting existing rollover:', existingRollover.id, existingRollover.orderNumber);
        // For WIP-only rollovers, delete via WIP service; for Production-backed, delete via Production service
        if (existingRollover.wipId && !existingRollover.id.includes('-')) {
          // This is a WIP-only rollover - delete the WIP record
          await teamWorkItemService.delete(existingRollover.wipId);
          console.log('[ROLLOVER] ✓ Existing WIP-only rollover deleted');
        } else {
          // This is a Production-backed rollover - delete both Production and WIP
          await productionService.delete(existingRollover.id);
          console.log('[ROLLOVER] ✓ Existing Production rollover deleted');
        }
      }
      
      // Calculate truncated timing for parent job
      const truncatedDuration = Math.max(20, remainingDuration);
      const originalStartTime = jobStartTime;
      const originalTiming = PlannerV2.calculateEndTime(originalStartTime, truncatedDuration, shift);
      
      // Calculate E-Finks apportionment between parent and rollover
      const totalEFinks = job.estimatedEFinks || 0;
      const totalDuration = truncatedDuration + overflowMinutes;
      const parentEFinks = totalDuration > 0 ? Math.round((truncatedDuration / totalDuration) * totalEFinks) : totalEFinks;
      const rolloverEFinks = totalEFinks - parentEFinks; // Ensure they sum to total
      
      console.log('[ROLLOVER] E-Finks apportionment:', {
        totalEFinks,
        totalDuration,
        parentDuration: truncatedDuration,
        rolloverDuration: overflowMinutes,
        parentEFinks,
        rolloverEFinks
      });
      
      // Update original job's WIP record with truncated timing AND reduced E-Finks (if WIP exists)
      if (originalWipId) {
        console.log('[ROLLOVER] Updating original WIP with truncated timing:', {
          wipId: originalWipId,
          start: originalStartTime,
          end: originalTiming.endTime,
          duration: truncatedDuration,
          breaks: originalTiming.breakMinutes,
          estimatedEfinks: parentEFinks
        });
        
        await teamWorkItemService.batchUpdate([{
          id: originalWipId,
          data: {
            plannedEndMinutes: originalTiming.endTime,
            plannedDurationMinutes: truncatedDuration,
            breakAdjustmentMinutes: originalTiming.breakMinutes,
            estimatedEfinks: parentEFinks,
            customDurationMinutes: truncatedDuration
          }
        }]);
        console.log('[ROLLOVER] ✓ Original WIP record updated with truncated timing and E-Finks');
      }
      
      // WIP-FIRST: Create WIP-only rollover record (NO Production record yet)
      if (preservedJigId) {
        // Get next day's overtime settings for rollover job scheduling
        const nextDayTeamOvertime = overtimeByTeamDay[nextDateStr]?.[preservedJigId];
        const nextDayShift = PlannerV2.getShiftConfig(
          nextDayTeamOvertime?.enabled,
          nextDayTeamOvertime?.closeTime,
          nextDayTeamOvertime?.earlyEnabled,
          nextDayTeamOvertime?.earlyStartTime
        );
        
        // Find existing jobs on next day to determine start time
        // CRITICAL: Exclude jobs from the SAME rollover chain - rollovers replace each other, don't stack
        const existingJobsNextDay = allJobs.filter(
          j => j.plannedDateStr === nextDateStr && 
               j.jigId === preservedJigId && 
               !j.productionComplete &&
               // Exclude jobs from the same rollover chain
               j.parentProductionId !== rootParentId &&
               j.id !== rootParentId
        ).sort((a, b) => (a.plannedStartTime ?? nextDayShift.startTime) - (b.plannedStartTime ?? nextDayShift.startTime));
        
        // Rollover ALWAYS starts at day's first available time
        let rolloverStartTime = nextDayShift.startTime;
        if (existingJobsNextDay.length > 0) {
          const lastJob = existingJobsNextDay[existingJobsNextDay.length - 1];
          const lastEndTime = lastJob.plannedEndTime ?? nextDayShift.startTime;
          // Apply 30min buffer + near-break adjustment
          rolloverStartTime = PlannerV2.getAdjustedStartTime(lastEndTime + PlannerV2.BUFFER_MINUTES, nextDayShift);
        }
        
        console.log('[ROLLOVER] Calculated rollover start time:', rolloverStartTime, 
          'existingJobsNextDay (non-chain):', existingJobsNextDay.length);
        
        const rolloverTiming = PlannerV2.calculateEndTime(rolloverStartTime, overflowMinutes, nextDayShift);
        
        // Create rollover name for display
        const baseName = job.name?.replace(' (Rollover)', '').replace(' (Roll Over)', '') || job.orderNumber;
        const rolloverName = `${baseName} (Rollover)`;
        
        // Create WIP-ONLY rollover record with all display fields
        console.log('[ROLLOVER] Creating WIP-only rollover:', {
          isRolloverOnly: true,
          teamId: preservedJigId,
          workDate: nextDateStr,
          start: rolloverStartTime,
          end: rolloverTiming.endTime,
          duration: overflowMinutes,
          productionName: rolloverName
        });
        
        await teamWorkItemService.batchAllocate([{
          productionId: null, // WIP-only - no Production record yet
          teamId: preservedJigId,
          workDate: nextDateStr,
          sequence: existingJobsNextDay.length + 1,
          plannedStartMinutes: rolloverStartTime,
          plannedEndMinutes: rolloverTiming.endTime,
          plannedDurationMinutes: overflowMinutes,
          breakAdjustmentMinutes: rolloverTiming.breakMinutes,
          rolloverSequence: currentSequence + 1,
          parentWipId: originalWipId,
          customDurationMinutes: overflowMinutes,
          // WIP-first fields - copy display data from parent
          isRolloverOnly: true,
          rootProductionId: rootParentId,
          parentProductionId: jobId,
          orderNumber: job.orderNumber,
          customerName: job.customer,
          productionName: rolloverName,
          estimatedEfinks: rolloverEFinks,
          salesOrderId: fullProduction.orderNo ?? undefined
        }]);
        console.log('[ROLLOVER] ✓ WIP-only rollover created');
      } else {
        console.log('[ROLLOVER] No team assignment - skipping WIP record creation');
      }

      console.log('[ROLLOVER] ========== Reloading data ==========');
      await loadData();
      console.log('[ROLLOVER] ========== Rollover complete ==========');
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to roll over job:', err);
      setError(`Failed to roll over job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(false);
      setOperationMessage('');
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
    <Stack styles={{ root: { minHeight: '100%', position: 'relative' } }}>
      {/* Loading overlay - blocks interactions during background operations */}
      {operationInProgress && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          pointerEvents: 'all'
        }}>
          <Spinner size={3} label={operationMessage || 'Processing...'} />
        </div>
      )}
      
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
              onJobDurationChange={handleJobDurationChange}
              onJobDurationReset={handleJobDurationReset}
              onTeamDoubleClick={handleTeamDoubleClick}
              onJobRollover={handleJobRollover}
              overtimeByTeam={getTeamOvertimeForDay(currentDateStr)}
              onTeamOvertimeChange={handleTeamOvertimeChange}
              onTeamEarlyOvertimeChange={handleTeamEarlyOvertimeChange}
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
