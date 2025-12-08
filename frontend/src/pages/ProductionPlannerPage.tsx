import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stack, Text, CommandBar, Spinner, MessageBar, MessageBarType, Dropdown
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
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [currentDateStr, setCurrentDateStr] = useState(() => startOfMonthUtc(new Date()));
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [_selectedDayStr, _setSelectedDayStr] = useState<string | null>(null);
  const [basketCollapsed, setBasketCollapsed] = useState(true);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [overtimeByTeamDay, setOvertimeByTeamDay] = useState<Record<string, Record<string, { enabled: boolean; closeTime: number; earlyEnabled?: boolean; earlyStartTime?: number }>>>({});
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
            plannedDateStr: p.productionPlannedDate ? formatIsoDateLocal(p.productionPlannedDate) : null,
            jigId: p.jigId || null,
            productionComplete: p.productionComplete === true,
            parentProductionId: p.parentProductionId || undefined,
            rolloverSequence: p.rolloverSequence || undefined,
            createdOn: p.createdOn || undefined,
            plannedStartTime: p.plannedStartTime !== undefined ? p.plannedStartTime : null,
            plannedEndTime: p.plannedEndTime !== undefined ? p.plannedEndTime : null,
            plannedDurationMinutes: p.plannedDurationMinutes !== undefined ? p.plannedDurationMinutes : null,
            breakAdjustmentMinutes: p.breakAdjustmentMinutes !== undefined ? p.breakAdjustmentMinutes : null
          };
        });
        
        const allocatedCount = jobList.filter(j => j.wipId).length;
        console.log(`[PLANNER] ✓ Mapped ${jobList.length} production jobs (${allocatedCount} allocated via WIP, ${jobList.filter(j => j.productionComplete).length} completed)`);
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

  // Save job allocation immediately to database
  const saveJobAllocation = useCallback(async (
    jobId: string, 
    updates: {
      teamId: string;
      workDate: string;
      plannedStartMinutes: number;
      plannedEndMinutes: number;
      plannedDurationMinutes: number;
      breakAdjustmentMinutes: number;
    },
    existingWipId?: string
  ): Promise<boolean> => {
    try {
      setIsSaving(true);
      const job = baseJobs.find(j => j.id === jobId);
      if (!job) {
        console.error('[PLANNER] Job not found:', jobId);
        return false;
      }

      if (existingWipId) {
        await teamWorkItemService.update(existingWipId, {
          teamId: updates.teamId,
          workDate: updates.workDate,
          plannedStartMinutes: updates.plannedStartMinutes,
          plannedEndMinutes: updates.plannedEndMinutes,
          plannedDurationMinutes: updates.plannedDurationMinutes,
          breakAdjustmentMinutes: updates.breakAdjustmentMinutes
        });
        console.log('[PLANNER] ✓ Updated WIP record:', existingWipId);
      } else {
        const allocation: CreateTeamWorkItemDto = {
          productionId: jobId,
          teamId: updates.teamId,
          workDate: updates.workDate,
          sequence: 0,
          plannedStartMinutes: updates.plannedStartMinutes,
          plannedEndMinutes: updates.plannedEndMinutes,
          plannedDurationMinutes: updates.plannedDurationMinutes,
          breakAdjustmentMinutes: updates.breakAdjustmentMinutes,
          status: 'scheduled'
        };
        await teamWorkItemService.create(allocation);
        console.log('[PLANNER] ✓ Created WIP record for job:', jobId);
      }

      setJobs(prevJobs => prevJobs.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            jigId: updates.teamId,
            plannedDateStr: updates.workDate,
            plannedStartTime: updates.plannedStartMinutes,
            plannedEndTime: updates.plannedEndMinutes,
            plannedDurationMinutes: updates.plannedDurationMinutes,
            breakAdjustmentMinutes: updates.breakAdjustmentMinutes
          };
        }
        return j;
      }));

      return true;
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to save job allocation:', err);
      setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [baseJobs]);

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
    }>
  ): Promise<boolean> => {
    try {
      setIsSaving(true);
      
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
              breakAdjustmentMinutes: update.breakAdjustmentMinutes
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
      setIsSaving(false);
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
        console.log('[PLANNER] Dropping without team assignment, skipping save');
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
      setIsSaving(true);
      
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
      setIsSaving(false);
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
      setIsSaving(true);
      
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
      setIsSaving(false);
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
      const shift = PlannerV2.getShiftConfig(teamOvertime?.enabled, teamOvertime?.closeTime);
      
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
      
      const resizedJob: PlannerV2.ScheduledJob = {
        ...toScheduledJob(job),
        plannedDurationMinutes: roundedDuration,
        plannedEndTime: timing.endTime,
        breakAdjustmentMinutes: timing.breakMinutes
      };
      
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
      
      updates.push({
        jobId: job.id,
        wipId: job.wipId,
        teamId: jigId,
        workDate: dateStr,
        plannedStartMinutes: job.plannedStartTime,
        plannedEndMinutes: timing.endTime,
        plannedDurationMinutes: roundedDuration,
        breakAdjustmentMinutes: timing.breakMinutes
      });
      
      if (subsequentJobs.length > 0) {
        let currentEnd = timing.endTime;
        
        for (const subsequentJob of subsequentJobs) {
          const origJob = allJobs.find(j => j.id === subsequentJob.id);
          if (!origJob) continue;
          
          const jobDuration = subsequentJob.plannedDurationMinutes ?? 
            PlannerV2.calculateEfinksDuration(subsequentJob.estimatedEFinks);
          
          let newStartTime = Math.max(currentEnd, shift.startTime);
          if (newStartTime >= shift.lunchStart && newStartTime < shift.lunchEnd) {
            newStartTime = shift.lunchEnd;
          }
          
          const subTiming = PlannerV2.calculateEndTime(newStartTime, jobDuration, shift);
          
          updates.push({
            jobId: subsequentJob.id,
            wipId: origJob.wipId,
            teamId: jigId,
            workDate: dateStr,
            plannedStartMinutes: newStartTime,
            plannedEndMinutes: subTiming.endTime,
            plannedDurationMinutes: jobDuration,
            breakAdjustmentMinutes: subTiming.breakMinutes
          });
          
          currentEnd = subTiming.endTime;
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
    
    try {
      // Build batch update for WIP records
      const updates: { id: string; data: UpdateTeamWorkItemDto }[] = affectedJobs.map(job => ({
        id: job.wipId!,
        data: {
          earlyOvertimeEnabled: earlyEnabled,
          dayStartMinutes: earlyEnabled ? earlyStartTime : undefined
        }
      }));
      
      // Persist to WIP table
      await teamWorkItemService.batchUpdate(updates);
      console.log(`[PLANNER] ✓ Early overtime settings persisted for ${affectedJobs.length} jobs`);
      
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
    }
  };

  const getTeamOvertimeForDay = (dayStr: string): Record<string, { enabled: boolean; closeTime: number; earlyEnabled?: boolean; earlyStartTime?: number }> => {
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
