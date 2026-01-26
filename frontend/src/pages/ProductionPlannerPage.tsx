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
import { systemSettingsService } from '../services/systemSettingsService';
import { teamDaySettingsService } from '../services/teamDaySettingsService';
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
import { type SchedulerConfig, mapSystemSettingsToSchedulerConfig, DEFAULT_CONFIG } from '../domain/plannerV2/schedulerSettings';

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
  createdOn?: string;
  plannedStartTime?: number | null;
  plannedEndTime?: number | null;
  plannedDurationMinutes?: number | null;
  breakAdjustmentMinutes?: number | null;
  wipId?: string;
  dayStartMinutes?: number;
  dayEndMinutes?: number;
  overtimeEnabled?: boolean;
  totalJobDuration?: number | null;
  segmentIndex?: number | null;
  totalSegments?: number | null;
  segmentEfinks?: number;
}

interface StagedJobSegment {
  jobId: string;
  teamId: string;
  workDate: string;
  plannedStartMinutes: number;
  plannedEndMinutes: number;
  plannedDurationMinutes: number;
  breakAdjustmentMinutes: number;
  segmentIndex: number;
  totalSegments: number;
  totalJobDuration: number;
  estimatedEfinks: number;
  totalEstimatedEfinks: number; // The TOTAL E-Finks for the entire job (not just this segment)
  orderNumber: string;
  customer: string;
  name: string;
}

interface StagedJob {
  jobId: string;
  originalJob: Job;
  segments: StagedJobSegment[];
  teamId: string;
  primaryDate: string;
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
  const [schedulerConfig, setSchedulerConfig] = useState<SchedulerConfig>(DEFAULT_CONFIG);
  
  // Staged jobs - jobs in edit mode (not yet persisted)
  const [stagedJobs, setStagedJobs] = useState<StagedJob[]>([]);
  
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
      
      const settingsPromise = systemSettingsService.getSettings().then(r => {
        console.log('[PLANNER] settings loaded in', Date.now() - startTime, 'ms');
        return r;
      }).catch(e => {
        console.error('[PLANNER] ✗ settings FAILED:', e);
        return null; // Don't fail if settings can't be loaded, use defaults
      });
      
      // Fetch TeamDaySettings for overtime persistence (especially for weekends with no jobs)
      const teamDaySettingsPromise = teamDaySettingsService.getRange({
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo
      }).then(r => {
        console.log('[PLANNER] team day settings loaded in', Date.now() - startTime, 'ms, count:', r.length);
        return r;
      }).catch(e => {
        console.error('[PLANNER] ✗ team day settings FAILED:', e);
        return []; // Don't fail if settings can't be loaded
      });
      
      const [productions, wipItems, jigs, unallocated, blocks, settings, teamDaySettings] = await Promise.all([
        productionsPromise,
        wipItemsPromise,
        jigsPromise,
        unallocatedPromise,
        blocksPromise,
        settingsPromise,
        teamDaySettingsPromise
      ]);
      
      // Convert SystemSettings to SchedulerConfig
      if (settings) {
        const config = mapSystemSettingsToSchedulerConfig(settings);
        setSchedulerConfig(config);
        console.log('[PLANNER] ✓ SchedulerConfig loaded:', config.weekdayShift.startTime, '-', config.weekdayShift.endTime);
      } else {
        console.log('[PLANNER] Using DEFAULT_CONFIG for scheduling');
      }
      
      console.log(`[PLANNER] ✓ All data loaded in ${Date.now() - startTime}ms`);
      console.log(`[PLANNER] ✓ ${productions.length} productions, ${wipItems.length} WIP items, ${jigs.length} jig teams, ${unallocated.length} unallocated orders, ${blocks.length} blocks`);
      
      // Store ALL WIP records per production (for multi-day jobs there can be multiple)
      const wipByProductionId = new Map<string, (typeof wipItems[0])[]>();
      for (const wip of wipItems) {
        if (wip.productionId) {
          const existing = wipByProductionId.get(wip.productionId) || [];
          existing.push(wip);
          wipByProductionId.set(wip.productionId, existing);
        }
      }
      // Count unique productions with WIP
      const uniqueProductionsWithWip = wipByProductionId.size;
      const totalWipRecords = wipItems.filter(w => w.productionId).length;
      console.log(`[PLANNER] ✓ Built WIP lookup map with ${uniqueProductionsWithWip} productions (${totalWipRecords} total WIP records)`);
      
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
      
      // MERGE TeamDaySettings into restoredOTState (TeamDaySettings take priority for persisted weekend settings)
      // This ensures weekend work toggles persist even when there are no WIP records
      for (const tds of teamDaySettings) {
        if (!tds.workDate || !tds.teamId) continue;
        
        const dayStr = formatIsoDateLocal(tds.workDate);
        if (!dayStr) continue;
        
        if (!restoredOTState[dayStr]) {
          restoredOTState[dayStr] = {};
        }
        
        // TeamDaySettings takes priority - it's the authoritative source for day-level settings
        // Always apply TeamDaySettings to ensure persisted state (including "off" state) is restored
        restoredOTState[dayStr][tds.teamId] = {
          enabled: tds.lateOtEnabled,
          closeTime: tds.lateOtEndMinutes ?? 1140,
          earlyEnabled: tds.earlyOtEnabled,
          earlyStartTime: tds.earlyOtStartMinutes ?? 360
        };
      }
      console.log(`[PLANNER] ✓ Merged ${teamDaySettings.length} TeamDaySettings into OT state`);
      
      // Count how many team/days have OT enabled for logging
      let lateOTCount = 0;
      let earlyOTCount = 0;
      const lateOTDetails: string[] = [];
      const earlyOTDetails: string[] = [];
      for (const dayStr of Object.keys(restoredOTState)) {
        for (const teamId of Object.keys(restoredOTState[dayStr])) {
          const settings = restoredOTState[dayStr][teamId];
          if (settings.enabled) {
            lateOTCount++;
            lateOTDetails.push(`${dayStr}/${teamId.substring(0, 8)}(end=${settings.closeTime})`);
          }
          if (settings.earlyEnabled) {
            earlyOTCount++;
            earlyOTDetails.push(`${dayStr}/${teamId.substring(0, 8)}(start=${settings.earlyStartTime})`);
          }
        }
      }
      console.log(`[PLANNER] ✓ Restored OT state: ${lateOTCount} late OT, ${earlyOTCount} early OT settings across ${Object.keys(restoredOTState).length} days`);
      if (lateOTDetails.length > 0) console.log(`[PLANNER] Late OT details: ${lateOTDetails.join(', ')}`);
      if (earlyOTDetails.length > 0) console.log(`[PLANNER] Early OT details: ${earlyOTDetails.join(', ')}`);
      
      let jobList: Job[];
      try {
        console.log('[PLANNER] Starting job mapping with WIP overlay...');
        jobList = productions.flatMap((p: any): Job[] => {
          const wipRecords = wipByProductionId.get(p.id);
          
          if (wipRecords && wipRecords.length > 0) {
            // Sort by workDate to ensure proper segment ordering
            const sortedWip = [...wipRecords].sort((a, b) => {
              const dateA = a.workDate ? new Date(a.workDate).getTime() : 0;
              const dateB = b.workDate ? new Date(b.workDate).getTime() : 0;
              return dateA - dateB;
            });
            
            const totalSegments = sortedWip.length;
            const totalEfinks = p.newEstimateDefinks || 0;
            
            // Create a job entry for each WIP segment (for multi-day jobs)
            return sortedWip.map((wipData, segmentIndex) => ({
              id: p.id,
              name: p.name || '',
              orderNumber: wipData.orderNumber || p.orderNumber || p.name || 'N/A',
              customer: wipData.customerName || p.customerName || 'Unknown',
              estimatedEFinks: wipData.estimatedEfinks || totalEfinks,
              customDurationMinutes: p.customDurationMinutes || undefined,
              plannedDateStr: formatIsoDateLocal(wipData.workDate),
              jigId: wipData.teamId || null,
              productionComplete: p.productionComplete === true,
              createdOn: p.createdOn || undefined,
              plannedStartTime: wipData.plannedStartMinutes !== undefined ? wipData.plannedStartMinutes : null,
              plannedEndTime: wipData.plannedEndMinutes !== undefined ? wipData.plannedEndMinutes : null,
              plannedDurationMinutes: wipData.plannedDurationMinutes !== undefined ? wipData.plannedDurationMinutes : null,
              breakAdjustmentMinutes: wipData.breakAdjustmentMinutes !== undefined ? wipData.breakAdjustmentMinutes : null,
              wipId: wipData.id,
              dayStartMinutes: wipData.dayStartMinutes !== undefined ? wipData.dayStartMinutes : undefined,
              dayEndMinutes: wipData.dayEndMinutes !== undefined ? wipData.dayEndMinutes : undefined,
              overtimeEnabled: wipData.overtimeEnabled !== undefined ? wipData.overtimeEnabled : undefined,
              // Multi-day segment info from actual WIP data
              segmentIndex: segmentIndex,
              totalSegments: totalSegments,
              segmentEfinks: wipData.estimatedEfinks || (totalEfinks / totalSegments)
            }));
          }
          
          // No WIP records - show as unallocated (single entry, no segment info)
          return [{
            id: p.id,
            name: p.name || '',
            orderNumber: p.orderNumber || p.name || 'N/A',
            customer: p.customerName || 'Unknown',
            estimatedEFinks: p.newEstimateDefinks || 0,
            customDurationMinutes: undefined,
            plannedDateStr: p.productionPlannedDate ? formatIsoDateLocal(p.productionPlannedDate) : null,
            jigId: null,
            productionComplete: p.productionComplete === true,
            createdOn: p.createdOn || undefined,
            plannedStartTime: null,
            plannedEndTime: null,
            plannedDurationMinutes: null,
            breakAdjustmentMinutes: null,
            wipId: undefined,
            dayStartMinutes: undefined,
            dayEndMinutes: undefined,
            overtimeEnabled: undefined,
            segmentIndex: undefined,
            totalSegments: undefined,
            segmentEfinks: undefined
          }];
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

  // All jobs is simply the combination of jobs and unallocated orders
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
      estimatedEfinks?: number;
    }>
  ): Promise<boolean> => {
    try {
      setOperationInProgress(true); setOperationMessage('Saving changes...');
      
      const wipUpdates: { id: string; data: UpdateTeamWorkItemDto }[] = [];
      const wipCreates: CreateTeamWorkItemDto[] = [];

      for (const update of updates) {
        if (update.wipId) {
          const updateData: UpdateTeamWorkItemDto = {
            teamId: update.teamId,
            workDate: update.workDate,
            plannedStartMinutes: update.plannedStartMinutes,
            plannedEndMinutes: update.plannedEndMinutes,
            plannedDurationMinutes: update.plannedDurationMinutes,
            breakAdjustmentMinutes: update.breakAdjustmentMinutes
          };
          // Include estimatedEfinks if provided (for resize/rollover operations)
          if (update.estimatedEfinks !== undefined) {
            (updateData as any).estimatedEfinks = update.estimatedEfinks;
          }
          if (update.customDurationMinutes !== undefined) {
            (updateData as any).customDurationMinutes = update.customDurationMinutes;
          }
          wipUpdates.push({ id: update.wipId, data: updateData });
        } else {
          const createData: CreateTeamWorkItemDto = {
            productionId: update.jobId,
            teamId: update.teamId,
            workDate: update.workDate,
            sequence: 0,
            plannedStartMinutes: update.plannedStartMinutes,
            plannedEndMinutes: update.plannedEndMinutes,
            plannedDurationMinutes: update.plannedDurationMinutes,
            breakAdjustmentMinutes: update.breakAdjustmentMinutes,
            status: 'scheduled'
          };
          // Include estimatedEfinks if provided
          if (update.estimatedEfinks !== undefined) {
            (createData as any).estimatedEfinks = update.estimatedEfinks;
          }
          if (update.customDurationMinutes !== undefined) {
            (createData as any).customDurationMinutes = update.customDurationMinutes;
          }
          wipCreates.push(createData);
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
              customDurationMinutes: update.customDurationMinutes ?? j.customDurationMinutes,
              estimatedEFinks: update.estimatedEfinks ?? j.estimatedEFinks
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
  // CONTINUOUS FLOW: Jobs automatically span multiple days when duration exceeds daily capacity
  // Immediately saves to database (no staging)
  const handleDrop = async (dateStr: string, jigId?: string | null, dropTimeMinutes?: number) => {
    console.log('[PLANNER] handleDrop START:', { dateStr, jigId, draggedJobId, dropTimeMinutes });
    
    if (!draggedJobId) return;
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;
    
    console.log('[PLANNER] Found job to drop:', job.id, job.name);

    // Determine total E-Finks for the job:
    // 1. Check if this is a staged job - use totalEstimatedEfinks from staged segment
    // 2. Check if this is a persisted multi-day job - sum all segments' E-Finks
    // 3. Otherwise use the job's estimatedEFinks directly
    const existingStagedJob = stagedJobs.find(sj => sj.jobId === draggedJobId);
    let totalEFinksForJob: number;
    let efinkSource: string;
    
    if (existingStagedJob?.segments[0]?.totalEstimatedEfinks) {
      // Staged job - use stored total
      totalEFinksForJob = existingStagedJob.segments[0].totalEstimatedEfinks;
      efinkSource = 'staged job totalEstimatedEfinks';
    } else if (job.totalSegments && job.totalSegments > 1) {
      // Persisted multi-day job - sum all segments' E-Finks from allJobs
      const allSegmentsForJob = allJobs.filter(j => j.id === draggedJobId);
      totalEFinksForJob = allSegmentsForJob.reduce((sum, seg) => sum + (seg.estimatedEFinks || 0), 0);
      efinkSource = `summed from ${allSegmentsForJob.length} persisted segments`;
    } else {
      // Single-day job - use directly
      totalEFinksForJob = job.estimatedEFinks;
      efinkSource = 'job estimatedEFinks';
    }
    
    console.log('[PLANNER] E-Finks for calculation:', totalEFinksForJob, `(${efinkSource})`);

    const isSalesOrder = job.id.startsWith('order-');
    const updatedJigId = jigId !== undefined ? jigId : job.jigId;

    try {
      if (updatedJigId) {
        const team = jigTeams.find(t => t.id === updatedJigId);
        const teamAverageEfinks = team?.averageEfinks ?? 80;
        
        const teamSpecificDuration = PlannerV2.calculateEfinksDuration(totalEFinksForJob, teamAverageEfinks, schedulerConfig);
        console.log('[PLANNER] Team-specific duration:', teamSpecificDuration, 'min (team avg efinks:', teamAverageEfinks, ', rounding:', schedulerConfig.durationRoundingIncrement, 'min)');
        console.log('[PLANNER] Duration in hours:', PlannerV2.formatDurationHoursMinutes(teamSpecificDuration));
        
        const teamOvertimeSettings = overtimeByTeamDay[dateStr]?.[updatedJigId];
        // Use date-aware shift config to handle Friday/weekend correctly
        const shift = PlannerV2.getShiftConfigForDate(
          dateStr,
          teamOvertimeSettings?.enabled ?? false, 
          teamOvertimeSettings?.closeTime,
          teamOvertimeSettings?.earlyEnabled ?? false,
          teamOvertimeSettings?.earlyStartTime,
          schedulerConfig
        );
        
        console.log('[PLANNER] Shift config for drop:', {
          date: dateStr,
          start: PlannerV2.formatMinutesToTime(shift.startTime),
          end: PlannerV2.formatMinutesToTime(shift.endTime),
          otEnabled: teamOvertimeSettings?.enabled,
          otCloseTime: teamOvertimeSettings?.closeTime
        });
        
        // Use continuous-flow allocation for multi-day spanning
        const droppedJob: PlannerV2.ScheduledJob = {
          ...toScheduledJob(job),
          plannedDateStr: dateStr,
          jigId: updatedJigId,
          plannedDurationMinutes: teamSpecificDuration
        };
        
        // Calculate drop position - default to shift start if not specified
        const dropPosition = dropTimeMinutes ?? shift.startTime;
        
        // Allocate using continuous-flow model - job spans multiple days if needed
        const allocation = PlannerV2.allocateJobContinuousFlow(
          droppedJob,
          updatedJigId,
          dateStr,
          dropPosition,
          overtimeByTeamDay,
          teamAverageEfinks,
          schedulerConfig
        );
        
        console.log('[PLANNER] Continuous-flow allocation:', {
          totalDuration: PlannerV2.formatDurationHoursMinutes(allocation.totalDurationMinutes),
          segments: allocation.segments.length,
          spanDays: `${allocation.primaryDate} to ${allocation.endDate}`
        });
        
        // Calculate segment E-Finks based on work minutes proportion
        const totalWorkMinutes = allocation.segments.reduce((sum, seg) => sum + seg.workMinutes, 0);
        
        // Build staged segments for edit mode (not persisted yet)
        const stagedSegments: StagedJobSegment[] = allocation.segments.map((segment, idx) => {
          const segmentEfinks = totalWorkMinutes > 0 
            ? (segment.workMinutes / totalWorkMinutes) * totalEFinksForJob 
            : totalEFinksForJob / allocation.segments.length;
          
          console.log(`[PLANNER] Staged segment ${idx + 1}/${allocation.segments.length}:`, {
            date: segment.dateStr,
            start: PlannerV2.formatMinutesToTime(segment.startTimeMinutes),
            end: PlannerV2.formatMinutesToTime(segment.endTimeMinutes),
            work: PlannerV2.formatDurationHoursMinutes(segment.workMinutes),
            efinks: Math.round(segmentEfinks * 100) / 100
          });
          
          return {
            jobId: job.id,
            teamId: updatedJigId,
            workDate: segment.dateStr,
            plannedStartMinutes: segment.startTimeMinutes,
            plannedEndMinutes: segment.endTimeMinutes,
            plannedDurationMinutes: segment.workMinutes,
            breakAdjustmentMinutes: segment.breakMinutes,
            segmentIndex: idx,
            totalSegments: allocation.segments.length,
            totalJobDuration: allocation.totalDurationMinutes,
            estimatedEfinks: Math.round(segmentEfinks * 100) / 100,
            totalEstimatedEfinks: totalEFinksForJob, // Store total E-Finks for recalculation
            orderNumber: job.orderNumber,
            customer: job.customer,
            name: job.name
          };
        });
        
        // If job was previously persisted, delete its WIP records first
        if (job.wipId) {
          await teamWorkItemService.deleteByProductionId(job.id);
          console.log('[PLANNER] Deleted existing WIP records - job is now in staged/edit mode');
          
          // Update job state to remove wipId
          setJobs(prevJobs => prevJobs.map(j => 
            j.id === job.id ? { ...j, wipId: undefined, jigId: null, plannedDateStr: null } : j
          ));
        }
        
        // Remove any existing staged job for this jobId (prevents duplicates)
        setStagedJobs(prev => prev.filter(sj => sj.jobId !== job.id));
        
        // Add to staged jobs - NOT persisted until user clicks Save
        const stagedJob: StagedJob = {
          jobId: job.id,
          originalJob: job,
          segments: stagedSegments,
          teamId: updatedJigId,
          primaryDate: dateStr
        };
        
        setStagedJobs(prev => [...prev, stagedJob]);
        console.log('[PLANNER] ✓ Job added to staged/edit mode - awaiting Save');
        
        if (viewMode !== 'day') {
          setViewMode('day');
          setCurrentDateStr(dateStr);
        }
      } else {
        console.log('[PLANNER] Dropping to unallocated - removing from team');
        
        // Also remove from staged if it was there
        setStagedJobs(prev => prev.filter(sj => sj.jobId !== job.id));
        
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

  // Save a staged job - persist to WIP database
  const handleSaveStagedJob = async (jobId: string) => {
    const stagedJob = stagedJobs.find(sj => sj.jobId === jobId);
    if (!stagedJob) {
      console.error('[PLANNER] Staged job not found:', jobId);
      return;
    }
    
    console.log('[PLANNER] Saving staged job:', jobId, 'with', stagedJob.segments.length, 'segments');
    
    setOperationInProgress(true);
    setOperationMessage('Saving job...');
    
    try {
      // Build WIP updates for all segments
      const allSegmentUpdates = stagedJob.segments.map(segment => ({
        jobId: segment.jobId,
        wipId: undefined,
        teamId: segment.teamId,
        workDate: segment.workDate,
        plannedStartMinutes: segment.plannedStartMinutes,
        plannedEndMinutes: segment.plannedEndMinutes,
        plannedDurationMinutes: segment.plannedDurationMinutes,
        breakAdjustmentMinutes: segment.breakAdjustmentMinutes,
        estimatedEfinks: segment.estimatedEfinks,
        segmentIndex: segment.segmentIndex,
        totalSegments: segment.totalSegments
      }));
      
      const success = await saveMultipleJobUpdates(allSegmentUpdates);
      
      if (success) {
        // Remove from staged jobs
        setStagedJobs(prev => prev.filter(sj => sj.jobId !== jobId));
        console.log('[PLANNER] ✓ Staged job saved successfully');
        
        // Reload data to get the new WIP records
        await loadData();
      } else {
        console.error('[PLANNER] ✗ Failed to save staged job');
        setError('Failed to save job');
      }
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to save staged job:', err);
      setError(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(false);
      setOperationMessage('');
    }
  };
  
  // Cancel a staged job - remove from staging without persisting
  const handleCancelStagedJob = (jobId: string) => {
    console.log('[PLANNER] Canceling staged job:', jobId);
    setStagedJobs(prev => prev.filter(sj => sj.jobId !== jobId));
  };
  
  // Edit a persisted job - recalculate from first segment's position using TOTAL E-Finks
  const handleEditPersistedJob = async (productionId: string, teamId: string, _dateStr: string) => {
    console.log('[PLANNER] Editing persisted job:', productionId, 'for team:', teamId);
    
    // Find ALL job segments with this production ID (for multi-day jobs)
    const jobSegments = jobs.filter(j => j.id === productionId && j.jigId === teamId);
    if (jobSegments.length === 0) {
      console.error('[PLANNER] No job segments found for editing:', productionId);
      return;
    }
    
    // Sort segments by date and start time to get correct order
    jobSegments.sort((a, b) => {
      const dateCompare = (a.plannedDateStr || '').localeCompare(b.plannedDateStr || '');
      if (dateCompare !== 0) return dateCompare;
      return (a.plannedStartTime || 0) - (b.plannedStartTime || 0);
    });
    
    // Use the FIRST segment for starting position
    const firstSegment = jobSegments[0];
    const firstDate = firstSegment.plannedDateStr || _dateStr;
    const firstStartTime = firstSegment.plannedStartTime || 420;
    
    // Get the TOTAL E-Finks by summing all segments (WIP segments have proportional E-Finks)
    // Or use segmentEfinks if available (from WIP), otherwise use estimatedEFinks
    const totalEFinks = jobSegments.reduce((sum, seg) => {
      // WIP segments store their portion in segmentEfinks or estimatedEFinks
      const segEfinks = seg.segmentEfinks ?? seg.estimatedEFinks ?? 0;
      return sum + segEfinks;
    }, 0);
    
    console.log('[PLANNER] Found', jobSegments.length, 'segments. Will recalculate from:', {
      date: firstDate,
      startTime: PlannerV2.formatDurationHoursMinutes(firstStartTime),
      totalEFinks: totalEFinks
    });
    
    setOperationInProgress(true);
    setOperationMessage('Preparing for edit...');
    
    try {
      // Delete existing WIP records
      await teamWorkItemService.deleteByProductionId(productionId);
      console.log('[PLANNER] Deleted existing WIP records for edit mode');
      
      // Find the team for efficiency calculations
      const team = jigTeams.find(t => t.id === teamId);
      const teamAverageEfinks = team?.averageEfinks ?? 80;
      
      // Calculate duration using team efficiency and TOTAL E-Finks
      const teamSpecificDuration = PlannerV2.calculateEfinksDuration(totalEFinks, teamAverageEfinks, schedulerConfig);
      
      console.log('[PLANNER] Recalculating with total E-Finks:', totalEFinks, 'duration:', PlannerV2.formatDurationHoursMinutes(teamSpecificDuration));
      
      // Create job with TOTAL E-Finks for allocation
      const droppedJob: PlannerV2.ScheduledJob = {
        ...toScheduledJob(firstSegment),
        estimatedEFinks: totalEFinks, // Use TOTAL E-Finks, not segment E-Finks
        plannedDateStr: firstDate,
        jigId: teamId,
        plannedDurationMinutes: teamSpecificDuration
      };
      
      // Recalculate allocation from first segment's position
      const allocation = PlannerV2.allocateJobContinuousFlow(
        droppedJob,
        teamId,
        firstDate,
        firstStartTime, // Start from original first position
        overtimeByTeamDay,
        teamAverageEfinks,
        schedulerConfig
      );
      
      console.log('[PLANNER] Recalculated allocation:', {
        totalDuration: PlannerV2.formatDurationHoursMinutes(allocation.totalDurationMinutes),
        segments: allocation.segments.length
      });
      
      // Calculate segment E-Finks proportionally
      const totalWorkMinutes = allocation.segments.reduce((sum, seg) => sum + seg.workMinutes, 0);
      
      // Build staged segments from recalculated allocation
      const stagedSegments: StagedJobSegment[] = allocation.segments.map((segment, idx) => {
        const segmentEfinks = totalWorkMinutes > 0 
          ? (segment.workMinutes / totalWorkMinutes) * totalEFinks 
          : totalEFinks / allocation.segments.length;
        
        return {
          jobId: productionId,
          teamId: teamId,
          workDate: segment.dateStr,
          plannedStartMinutes: segment.startTimeMinutes,
          plannedEndMinutes: segment.endTimeMinutes,
          plannedDurationMinutes: segment.workMinutes,
          breakAdjustmentMinutes: segment.breakMinutes,
          segmentIndex: idx,
          totalSegments: allocation.segments.length,
          totalJobDuration: allocation.totalDurationMinutes,
          estimatedEfinks: Math.round(segmentEfinks * 100) / 100,
          totalEstimatedEfinks: totalEFinks, // Store total E-Finks for recalculation
          orderNumber: firstSegment.orderNumber,
          customer: firstSegment.customer,
          name: firstSegment.name
        };
      });
      
      console.log('[PLANNER] Created', stagedSegments.length, 'recalculated segments');
      stagedSegments.forEach((seg, idx) => {
        console.log(`[PLANNER] Segment ${idx + 1}/${stagedSegments.length}: ${seg.workDate} ${PlannerV2.formatDurationHoursMinutes(seg.plannedStartMinutes)}-${PlannerV2.formatDurationHoursMinutes(seg.plannedEndMinutes)} (${seg.estimatedEfinks} E-Finks)`);
      });
      
      // Update job state to remove wipId for all segments
      setJobs(prevJobs => prevJobs.map(j => 
        j.id === productionId ? { ...j, wipId: undefined, jigId: null, plannedDateStr: null } : j
      ));
      
      // Add to staged jobs
      const stagedJob: StagedJob = {
        jobId: productionId,
        originalJob: firstSegment,
        segments: stagedSegments,
        teamId: teamId,
        primaryDate: firstDate
      };
      
      setStagedJobs(prev => [...prev.filter(sj => sj.jobId !== productionId), stagedJob]);
      console.log('[PLANNER] ✓ Job moved to staged/edit mode with', stagedSegments.length, 'segments');
      
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to edit job:', err);
      setError(`Failed to edit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setOperationInProgress(false);
      setOperationMessage('');
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
      setOperationInProgress(true);
      setOperationMessage('Resizing job...');
      
      try {
        const teamOvertime = overtimeByTeamDay[dateStr]?.[jigId];
        const shift = PlannerV2.getShiftConfig(
          teamOvertime?.enabled, 
          teamOvertime?.closeTime,
          teamOvertime?.earlyEnabled,
          teamOvertime?.earlyStartTime
        );
        
        console.log(`[RESIZE] Job ${job.orderNumber} resize to ${roundedDuration}m - CONTINUOUS FLOW (no rollovers)`);
        
        // CONTINUOUS FLOW: Simply resize the job - no rollover handling
        const timing = PlannerV2.calculateEndTime(job.plannedStartTime, roundedDuration, shift);
        
        // Standard resize with cascade - CONTINUOUS FLOW model allows jobs to extend past shift end
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
            estimatedEfinks?: number;
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
            let nextStartTime = PlannerV2.getNextAvailableTime(timing.endTime, shift) ?? shift.endTime;
            
            for (const subsequentJob of subsequentJobs) {
              const origJob = allJobs.find(j => j.id === subsequentJob.id);
              if (!origJob) continue;
              
              const jobDuration = subsequentJob.plannedDurationMinutes ?? 
                PlannerV2.calculateEfinksDuration(subsequentJob.estimatedEFinks, undefined, schedulerConfig);
              
              // Check if subsequent job would overflow
              const availableForSub = PlannerV2.getAvailableMinutes(nextStartTime, shift);
              
              if (jobDuration <= availableForSub) {
                // Job fits on this day
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
                
                nextStartTime = PlannerV2.getNextAvailableTime(subTiming.endTime, shift) ?? shift.endTime;
              } else {
                // CONTINUOUS FLOW: Job extends past shift end - just schedule it with full duration
                console.log(`[RESIZE] Subsequent job ${origJob.orderNumber} extends past shift end - CONTINUOUS FLOW allows this`);
                
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
                
                nextStartTime = PlannerV2.getNextAvailableTime(subTiming.endTime, shift) ?? shift.endTime;
              }
            }
          }
          
        const success = await saveMultipleJobUpdates(updates);
        if (success) {
          console.log('[PLANNER] ✓ Saved resize with', updates.length, 'affected jobs');
        }
      } catch (err) {
        console.error('[RESIZE] Error:', err);
        setError(`Failed to resize: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setOperationInProgress(false);
        setOperationMessage('');
      }
    } else {
      console.log('[PLANNER] Resize for unallocated job - skipping save');
    }
  };

  const handleJobDurationReset = async (jobId: string) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    
    const calculatedDuration = PlannerV2.calculateEfinksDuration(job.estimatedEFinks, undefined, schedulerConfig);
    console.log(`[PLANNER] Resetting job ${jobId} from custom duration to calculated: ${calculatedDuration}m`);
    
    setJobs(prevJobs => prevJobs.map(j => 
      j.id === jobId ? { ...j, customDurationMinutes: undefined } : j
    ));
    
    const dateStr = job.plannedDateStr;
    const jigId = job.jigId;
    
    if (job.plannedStartTime != null && jigId && dateStr) {
      const teamOvertime = overtimeByTeamDay[dateStr]?.[jigId];
      const shift = PlannerV2.getShiftConfig(
        teamOvertime?.enabled, 
        teamOvertime?.closeTime,
        teamOvertime?.earlyEnabled,
        teamOvertime?.earlyStartTime
      );
      const timing = PlannerV2.calculateEndTime(job.plannedStartTime, calculatedDuration, shift);
      
      // Get all other jobs on the same day for cascading
      const existingJobsOnDay = allJobs.filter(
        j => j.plannedDateStr === dateStr && 
             j.jigId === jigId && 
             j.id !== job.id &&
             !j.productionComplete
      ).sort((a, b) => (a.plannedStartTime ?? shift.startTime) - (b.plannedStartTime ?? shift.startTime))
       .map(j => toScheduledJob(j));
      
      // Find jobs that come AFTER this one (need to cascade)
      const subsequentJobs = existingJobsOnDay.filter(
        j => (j.plannedStartTime ?? 0) > (job.plannedStartTime ?? 0)
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
      
      // Add the reset job itself
      updates.push({
        jobId: job.id,
        wipId: job.wipId,
        teamId: jigId,
        workDate: dateStr,
        plannedStartMinutes: job.plannedStartTime,
        plannedEndMinutes: timing.endTime,
        plannedDurationMinutes: calculatedDuration,
        breakAdjustmentMinutes: timing.breakMinutes,
        customDurationMinutes: undefined
      });
      
      // CASCADE: Reschedule subsequent jobs (they should move up if reset job is now smaller)
      if (subsequentJobs.length > 0) {
        let nextStartTime = PlannerV2.getNextAvailableTime(timing.endTime, shift) ?? shift.endTime;
        
        for (const subsequentJob of subsequentJobs) {
          const origJob = allJobs.find(j => j.id === subsequentJob.id);
          if (!origJob) continue;
          
          const jobDuration = subsequentJob.plannedDurationMinutes ?? 
            PlannerV2.calculateEfinksDuration(subsequentJob.estimatedEFinks, undefined, schedulerConfig);
          
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
          
          nextStartTime = PlannerV2.getNextAvailableTime(subTiming.endTime, shift) ?? shift.endTime;
        }
        
        console.log(`[PLANNER] Reset cascading to ${subsequentJobs.length} subsequent jobs`);
      }
      
      await saveMultipleJobUpdates(updates);
      console.log('[PLANNER] ✓ Reset job duration to calculated value with cascade');
    }
  };

  // Recalculate multi-day job segments when OT settings change
  // This ensures segments are redistributed across days based on new working hours
  const recalculateMultiDaySegments = async (
    teamId: string,
    affectedDateStr: string,
    newOvertimeSettings: Record<string, Record<string, { enabled: boolean; closeTime: number; earlyEnabled?: boolean; earlyStartTime?: number }>>
  ) => {
    console.log(`[PLANNER] Recalculating multi-day segments for team ${teamId.substring(0, 8)} around ${affectedDateStr}`);
    
    // Get extended date range to find all multi-day jobs that might be affected
    const startDate = new Date(affectedDateStr);
    startDate.setDate(startDate.getDate() - 7); // Look back 7 days
    const endDate = new Date(affectedDateStr);
    endDate.setDate(endDate.getDate() + 14); // Look forward 14 days
    
    const wipItems = await teamWorkItemService.getForPlanner({
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0],
      teamId: teamId
    });
    
    if (wipItems.length === 0) {
      console.log('[PLANNER] No WIP items to recalculate');
      return;
    }
    
    // Group WIP items by production_id to find multi-day jobs
    const wipByProduction = new Map<string, typeof wipItems>();
    for (const wip of wipItems) {
      const prodId = wip.productionId;
      if (!prodId) continue;
      
      if (!wipByProduction.has(prodId)) {
        wipByProduction.set(prodId, []);
      }
      wipByProduction.get(prodId)!.push(wip);
    }
    
    // Find multi-day jobs (jobs with more than one WIP segment)
    const multiDayJobs = Array.from(wipByProduction.entries())
      .filter(([_, wips]) => wips.length > 1);
    
    if (multiDayJobs.length === 0) {
      console.log('[PLANNER] No multi-day jobs to recalculate');
      return;
    }
    
    console.log(`[PLANNER] Found ${multiDayJobs.length} multi-day jobs to recalculate`);
    
    const team = jigTeams.find(t => t.id === teamId);
    const teamAverageEfinks = team?.averageEfinks ?? 80;
    
    for (const [productionId, wips] of multiDayJobs) {
      // Sort by work_date to find the first segment
      const sortedWips = [...wips].sort((a, b) => 
        new Date(a.workDate).getTime() - new Date(b.workDate).getTime()
      );
      
      const firstWip = sortedWips[0];
      const firstDateStr = new Date(firstWip.workDate).toISOString().split('T')[0];
      
      // Calculate total E-Finks from all segments
      const totalEfinks = sortedWips.reduce((sum, w) => sum + (w.estimatedEfinks ?? 0), 0);
      
      // Get team-specific duration
      const teamSpecificDuration = PlannerV2.calculateEfinksDuration(totalEfinks, teamAverageEfinks, schedulerConfig);
      
      console.log(`[PLANNER] Recalculating ${firstWip.orderNumber || firstWip.productionName}: ${totalEfinks} E-Finks, ${teamSpecificDuration} min`);
      
      // Build a job object for allocation
      const job: PlannerV2.ScheduledJob = {
        id: productionId,
        orderNumber: firstWip.orderNumber ?? '',
        customer: firstWip.customerName ?? '',
        estimatedEFinks: totalEfinks,
        plannedDateStr: firstDateStr,
        jigId: teamId,
        plannedStartTime: firstWip.plannedStartMinutes ?? 420,
        plannedEndTime: null,
        plannedDurationMinutes: teamSpecificDuration,
        customDurationMinutes: null,
        breakAdjustmentMinutes: null,
        productionComplete: false
      };
      
      // Recalculate allocation using the new OT settings
      const allocation = PlannerV2.allocateJobContinuousFlow(
        job,
        teamId,
        firstDateStr,
        firstWip.plannedStartMinutes ?? 420,
        newOvertimeSettings,
        teamAverageEfinks
      );
      
      console.log(`[PLANNER] New allocation: ${allocation.segments.length} segments spanning ${allocation.primaryDate} to ${allocation.endDate}`);
      
      // Delete existing WIP records for this job
      await teamWorkItemService.deleteByProductionId(productionId);
      
      // Calculate segment E-Finks based on work minutes proportion
      const totalWorkMinutes = allocation.segments.reduce((sum, seg) => sum + seg.workMinutes, 0);
      
      // Create new WIP records for each segment
      const segmentUpdates = allocation.segments.map((segment, idx) => {
        const segmentEfinks = totalWorkMinutes > 0 
          ? (segment.workMinutes / totalWorkMinutes) * totalEfinks 
          : totalEfinks / allocation.segments.length;
        
        return {
          jobId: productionId,
          wipId: undefined,
          teamId: teamId,
          workDate: segment.dateStr,
          plannedStartMinutes: segment.startTimeMinutes,
          plannedEndMinutes: segment.endTimeMinutes,
          plannedDurationMinutes: segment.workMinutes,
          breakAdjustmentMinutes: segment.breakMinutes,
          estimatedEfinks: segmentEfinks,
          segmentIndex: idx,
          totalSegments: allocation.segments.length
        };
      });
      
      await saveMultipleJobUpdates(segmentUpdates);
      console.log(`[PLANNER] ✓ Saved ${segmentUpdates.length} recalculated segments for ${firstWip.orderNumber || productionId.substring(0, 8)}`);
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
    
    // Show loading overlay
    setOperationInProgress(true);
    setOperationMessage(enabled ? 'Enabling overtime...' : 'Disabling overtime...');
    
    try {
      // ALWAYS persist to TeamDaySettings (even if no WIP items) for weekend work persistence
      const existingEarlySettings = overtimeByTeamDay[dayStr]?.[teamId];
      await teamDaySettingsService.upsert({
        teamId: teamId,
        workDate: dayStr,
        lateOtEnabled: enabled,
        lateOtEndMinutes: enabled ? closeTime : undefined,
        earlyOtEnabled: existingEarlySettings?.earlyEnabled ?? false,
        earlyOtStartMinutes: existingEarlySettings?.earlyStartTime,
        isWorkingDay: enabled || (existingEarlySettings?.earlyEnabled ?? false)
      });
      console.log(`[PLANNER] ✓ Persisted late OT to TeamDaySettings: ${dayStr}/${teamId.substring(0, 8)} enabled=${enabled}`);
      
      // Fetch ALL WIP records for this team-day directly from the service
      // This ensures we update ALL records, not just ones mapped via production lookup
      const wipItems = await teamWorkItemService.getForPlanner({
        dateFrom: dayStr,
        dateTo: dayStr,
        teamId: teamId
      });
      
      if (wipItems.length === 0) {
        console.log(`[PLANNER] No WIP records to update for ${dayStr}/${teamId} (settings persisted)`);
        setOperationInProgress(false);
        return;
      }
      
      console.log(`[PLANNER] Fetched ${wipItems.length} WIP records for ${dayStr}/${teamId}`);
      
      // IMPORTANT: When OT is toggled, we ONLY update the OT flags on WIP records
      // We do NOT redistribute jobs - jobs stay in their current positions
      // This allows the user to manually control job positions via Edit/Drag/Drop
      console.log(`[LATE-OT] Updating OT settings for ${wipItems.length} jobs - positions unchanged`);
      
      // Log current job positions BEFORE update for debugging
      for (const wip of wipItems) {
        console.log(`[LATE-OT] Job ${wip.productionName?.substring(0, 20) || wip.id}: start=${wip.plannedStartMinutes}, end=${wip.plannedEndMinutes}, duration=${wip.plannedDurationMinutes}`);
      }
      
      const newEndTime = enabled ? closeTime : 1020; // WORKING_END when OT disabled
      
      const updates: { id: string; data: UpdateTeamWorkItemDto }[] = [];
      
      for (const wip of wipItems) {
        updates.push({
          id: wip.id,
          data: {
            overtimeEnabled: enabled,
            dayEndMinutes: newEndTime
            // DO NOT update plannedStartMinutes, plannedEndMinutes, etc.
            // Jobs stay in their current positions
          }
        });
      }
      
      // Persist all updates
      if (updates.length > 0) {
        await teamWorkItemService.batchUpdate(updates);
        console.log(`[PLANNER] ✓ Updated ${updates.length} WIP items with late OT = ${enabled}`);
      }
      
      // Reload data to reflect all changes (no automatic recalculation - user controls via Edit button)
      console.log(`[LATE-OT] Reloading data after OT update...`);
      await loadData();
      console.log(`[LATE-OT] ✓ Data reloaded - job positions should be unchanged`);
      
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
    
    // Show loading overlay
    setOperationInProgress(true);
    setOperationMessage(earlyEnabled ? 'Enabling early overtime...' : 'Disabling early overtime...');
    
    try {
      // ALWAYS persist to TeamDaySettings (even if no WIP items) for weekend work persistence
      const existingLateSettings = overtimeByTeamDay[dayStr]?.[teamId];
      await teamDaySettingsService.upsert({
        teamId: teamId,
        workDate: dayStr,
        earlyOtEnabled: earlyEnabled,
        earlyOtStartMinutes: earlyEnabled ? earlyStartTime : undefined,
        lateOtEnabled: existingLateSettings?.enabled ?? false,
        lateOtEndMinutes: existingLateSettings?.closeTime,
        isWorkingDay: earlyEnabled || (existingLateSettings?.enabled ?? false)
      });
      console.log(`[PLANNER] ✓ Persisted early OT to TeamDaySettings: ${dayStr}/${teamId.substring(0, 8)} enabled=${earlyEnabled}`);
      
      // Fetch ALL WIP records for this team-day directly from the service
      // This ensures we update ALL records, not just ones mapped via production lookup
      const wipItems = await teamWorkItemService.getForPlanner({
        dateFrom: dayStr,
        dateTo: dayStr,
        teamId: teamId
      });
      
      if (wipItems.length === 0) {
        console.log(`[PLANNER] No WIP records to update for ${dayStr}/${teamId} (settings persisted)`);
        setOperationInProgress(false);
        return;
      }
      
      console.log(`[PLANNER] Fetched ${wipItems.length} WIP records for ${dayStr}/${teamId}`);
      
      // IMPORTANT: When OT is toggled, we ONLY update the OT flags on WIP records
      // We do NOT redistribute jobs - jobs stay in their current positions
      // This allows the user to manually control job positions via Edit/Drag/Drop
      console.log(`[EARLY-OT] Updating OT settings for ${wipItems.length} jobs - positions unchanged`);
      
      const updates: { id: string; data: UpdateTeamWorkItemDto }[] = [];
      
      for (const wip of wipItems) {
        updates.push({
          id: wip.id,
          data: {
            earlyOvertimeEnabled: earlyEnabled,
            dayStartMinutes: earlyEnabled ? earlyStartTime : undefined
            // DO NOT update plannedStartMinutes, plannedEndMinutes, etc.
            // Jobs stay in their current positions
          }
        });
      }
      
      // Persist all updates
      if (updates.length > 0) {
        await teamWorkItemService.batchUpdate(updates);
        console.log(`[PLANNER] ✓ Updated ${updates.length} WIP items with early OT = ${earlyEnabled}`);
      }
      
      // Reload data to reflect all changes (no automatic recalculation - user controls via Edit button)
      await loadData();
      
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
    <Stack styles={{ root: { height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' } }}>
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

      <Stack horizontal styles={{ root: { flex: 1, marginTop: 20, gap: 15, overflow: 'hidden' } }}>
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

        <Stack styles={{ root: { flex: 1, minWidth: 0, overflow: 'auto' } }}>
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
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={(dateStr, jigId, dropTimeMinutes) => handleDrop(dateStr, jigId, dropTimeMinutes)}
              onJobDoubleClick={handleJobDoubleClick}
              onJobDurationChange={handleJobDurationChange}
              onJobDurationReset={handleJobDurationReset}
              onTeamDoubleClick={handleTeamDoubleClick}
              overtimeByTeam={getTeamOvertimeForDay(currentDateStr)}
              allOvertimeSettings={overtimeByTeamDay}
              onTeamOvertimeChange={handleTeamOvertimeChange}
              onTeamEarlyOvertimeChange={handleTeamEarlyOvertimeChange}
              onDropToTeamUnallocated={handleDropToTeamUnallocated}
              isDragging={!!draggedJobId}
              scheduleBlocks={scheduleBlocks.filter(block => block.dateStr === currentDateStr)}
              onBlockClick={(block) => {
                setEditingBlock(block);
                setBlockPanelOpen(true);
              }}
              schedulerConfig={schedulerConfig}
              stagedJobs={stagedJobs}
              onSaveStagedJob={handleSaveStagedJob}
              onCancelStagedJob={handleCancelStagedJob}
              onEditPersistedJob={handleEditPersistedJob}
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
