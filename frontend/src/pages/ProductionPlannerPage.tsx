import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stack, Text, CommandBar, Spinner, MessageBar, MessageBarType, Dropdown,
  PrimaryButton, DefaultButton, Icon
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { productionService, d365OrderService } from '../services/d365Services';
import { jigService } from '../services/millenniumServices';
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
import {
  getShiftConfig,
  calculatePlannedTimes,
  calculateNextAvailableStartTime,
  getJobDurationMinutes,
  roundUpToQuarterHour,
  getDefaultEfinksDuration,
  snapToQuarterHour
} from '../utils/scheduleUtils';
import {
  type GlobalStagingState,
  type StagedJob,
  createEmptyStagingState,
  stageJob,
  stageMultipleJobs,
  updateStagedJob,
  hasStagedChanges,
  getStagedJobCount,
  isJobStaged,
  buildBatchUpdatePayloads,
  findAffectedJobs,
  getEffectiveValue
} from '../utils/pendingChangesUtils';

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
  const [globalStaging, setGlobalStaging] = useState<GlobalStagingState>(createEmptyStagingState());
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

  // Track staged job IDs for efficient lookup
  const stagedJobIds = useMemo(() => {
    return new Set(globalStaging.stagedJobs.keys());
  }, [globalStaging.stagedJobs]);

  // Cache for merged job objects - only recreate when staging changes for that job
  const stagedJobCache = useRef<Map<string, Job>>(new Map());

  // Merge unallocated orders into jobs array - preserve object references for non-staged jobs
  const allJobs = useMemo(() => {
    const baseJobs = [...jobs, ...unallocatedOrders];
    
    // If no staging, return base jobs directly (preserves references)
    if (stagedJobIds.size === 0) {
      stagedJobCache.current.clear();
      return baseJobs;
    }
    
    // Only create new objects for staged jobs
    return baseJobs.map(job => {
      if (!stagedJobIds.has(job.id)) {
        return job; // Preserve original reference
      }
      
      const staged = globalStaging.stagedJobs.get(job.id);
      if (!staged) return job;
      
      // Create merged object for staged job
      return { 
        ...job,
        jigId: getEffectiveValue(staged, 'jigId') ?? job.jigId,
        plannedDateStr: getEffectiveValue(staged, 'plannedDateStr') ?? job.plannedDateStr,
        plannedStartTime: getEffectiveValue(staged, 'plannedStartTime') ?? job.plannedStartTime,
        plannedEndTime: getEffectiveValue(staged, 'plannedEndTime') ?? job.plannedEndTime,
        plannedDurationMinutes: getEffectiveValue(staged, 'plannedDurationMinutes') ?? job.plannedDurationMinutes,
        customDurationMinutes: getEffectiveValue(staged, 'customDurationMinutes') ?? job.customDurationMinutes,
        breakAdjustmentMinutes: getEffectiveValue(staged, 'breakAdjustmentMinutes') ?? job.breakAdjustmentMinutes
      };
    });
  }, [jobs, unallocatedOrders, globalStaging, stagedJobIds]);
  
  // Stage a job click - adds job + affected jobs to global staging
  const handleJobClick = (jobId: string) => {
    const job = [...jobs, ...unallocatedOrders].find(j => j.id === jobId);
    if (!job) return;
    
    // If already staged, do nothing (user can continue editing)
    if (isJobStaged(globalStaging, jobId)) {
      console.log('[PLANNER] Job already staged:', jobId);
      return;
    }
    
    // Find affected jobs (those that would be impacted by this job's changes)
    const affectedJobIds = job.plannedEndTime && job.jigId && job.plannedDateStr
      ? findAffectedJobs(jobId, job.plannedEndTime, job.jigId, job.plannedDateStr, [...jobs, ...unallocatedOrders])
      : [];
    
    const affectedJobs = affectedJobIds
      .map(id => [...jobs, ...unallocatedOrders].find(j => j.id === id))
      .filter((j): j is Job => j !== undefined);
    
    console.log('[PLANNER] Staging job:', jobId, 'with', affectedJobs.length, 'affected jobs');
    
    setGlobalStaging(prev => stageMultipleJobs(prev, job, affectedJobs, 'move'));
  };

  // Stage a change to a job (for resize, move, etc.)
  const stageJobUpdate = (jobId: string, updates: Partial<Job>, changeType: StagedJob['changeType'] = 'move') => {
    const job = [...jobs, ...unallocatedOrders].find(j => j.id === jobId);
    if (!job) return;
    
    // If not staged yet, stage it first
    if (!isJobStaged(globalStaging, jobId)) {
      setGlobalStaging(prev => {
        const withJob = stageJob(prev, job, true, changeType);
        return updateStagedJob(withJob, jobId, updates, changeType);
      });
    } else {
      setGlobalStaging(prev => updateStagedJob(prev, jobId, updates, changeType));
    }
    
    console.log('[PLANNER] Updated staged job:', jobId, updates);
  };

  // Global Accept - persist ALL staged changes
  const acceptAllChanges = async () => {
    if (!hasStagedChanges(globalStaging)) return;
    
    setIsSaving(true);
    console.log('[PLANNER] Accepting all staged changes:', getStagedJobCount(globalStaging), 'jobs');
    
    try {
      const updates = buildBatchUpdatePayloads(globalStaging);
      
      // Persist all changes
      for (const { id, payload } of updates) {
        console.log('[PLANNER] Persisting job:', id, payload);
        await productionService.update(id, payload);
      }
      
      console.log('[PLANNER] ✓ All changes persisted');
      
      // Clear staging and reload data
      setGlobalStaging(createEmptyStagingState());
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
    setGlobalStaging(createEmptyStagingState());
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

  const handleDragStart = (jobId: string) => {
    setDraggedJobId(jobId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Drop to a team/day column - assign jig, date, and calculate time
  const handleDrop = async (dateStr: string, jigId?: string | null, dropTimeMinutes?: number) => {
    if (!draggedJobId) return;
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;

    // Check if this is a sales order needing production (prefixed with 'order-')
    const isSalesOrder = job.id.startsWith('order-');
    const actualOrderId = isSalesOrder ? job.id.substring(6) : null;

    // For month view, don't assign jig (keep existing or null)
    const updatedJigId = jigId !== undefined ? jigId : job.jigId;

    try {
      const date = new Date(dateStr);
      
      // Calculate planned times if we have a jig assignment
      let plannedStartTime: number | null = null;
      let plannedEndTime: number | null = null;
      let plannedDurationMinutes: number | null = null;
      let breakAdjustmentMinutes: number | null = null;
      
      if (updatedJigId) {
        const overtime = overtimeByDay[dateStr];
        const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
        
        // Get BASE duration for this job (without breaks)
        const jobDuration = getJobDurationMinutes(job);
        
        // Use drop position or find next available slot
        if (dropTimeMinutes !== undefined) {
          // Soft snap to 15-min intervals
          plannedStartTime = snapToQuarterHour(dropTimeMinutes);
        } else {
          // Find next available start time on this team/day
          const otherJobsOnTeamDay = allJobs.filter(
            j => j.id !== job.id && j.plannedDateStr === dateStr && j.jigId === updatedJigId
          );
          plannedStartTime = calculateNextAvailableStartTime(dateStr, updatedJigId, otherJobsOnTeamDay, shift);
        }
        
        // Calculate end time accounting for breaks
        const timing = calculatePlannedTimes(plannedStartTime, jobDuration, shift);
        plannedEndTime = timing.plannedEndTime;
        plannedDurationMinutes = jobDuration;
        breakAdjustmentMinutes = timing.breakAdjustmentMinutes;
        
        console.log(`[PLANNER] Calculated timing: start=${plannedStartTime}, end=${plannedEndTime}, duration=${plannedDurationMinutes}min`);
      }
      
      if (isSalesOrder && actualOrderId) {
        // Create a new production record for this sales order
        const createData: any = {
          name: job.name || job.orderNumber || 'Production',
          orderNo: actualOrderId,
          productionPlannedDate: date.toISOString(),
          newEstimateDefinks: job.estimatedEFinks || 0,
          productionComplete: false,
          jigId: updatedJigId,
          plannedStartTime,
          plannedEndTime,
          plannedDurationMinutes,
          breakAdjustmentMinutes
        };
        
        console.log('[PLANNER] Creating production for sales order:', actualOrderId);
        await productionService.create(createData);
        await loadData();
      } else {
        // Stage the change - don't persist until global accept
        stageJobUpdate(job.id, {
          plannedDateStr: dateStr,
          jigId: updatedJigId,
          plannedStartTime,
          plannedEndTime,
          plannedDurationMinutes,
          breakAdjustmentMinutes
        }, 'allocate');
        
        // Switch to day view if not already
        if (viewMode !== 'day') {
          setViewMode('day');
          setCurrentDateStr(dateStr);
        }
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
    const defaultDuration = getDefaultEfinksDuration(job.estimatedEFinks);
    
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
    const defaultDuration = getDefaultEfinksDuration(job.estimatedEFinks);
    
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
    const roundedDuration = roundUpToQuarterHour(durationMinutes);
    
    // Calculate new end time based on the resized duration
    if (job.plannedStartTime != null && jigId && dateStr) {
      const overtime = overtimeByDay[dateStr];
      const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
      
      // Calculate new end time and break adjustments
      const timing = calculatePlannedTimes(job.plannedStartTime, roundedDuration, shift);
      
      // Stage the resize - no cascading, overlaps allowed during staging
      stageJobUpdate(jobId, {
        customDurationMinutes: roundedDuration,
        plannedDurationMinutes: roundedDuration,
        plannedEndTime: timing.plannedEndTime,
        breakAdjustmentMinutes: timing.breakAdjustmentMinutes
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
    const defaultDuration = getDefaultEfinksDuration(job.estimatedEFinks);
    
    if (job.plannedStartTime != null && jigId && dateStr) {
      const overtime = overtimeByDay[dateStr];
      const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
      
      // Calculate end time using default duration
      const timing = calculatePlannedTimes(job.plannedStartTime, defaultDuration, shift);
      
      // Stage the reset - clears customDurationMinutes
      stageJobUpdate(jobId, {
        customDurationMinutes: undefined,
        plannedDurationMinutes: defaultDuration,
        plannedEndTime: timing.plannedEndTime,
        breakAdjustmentMinutes: timing.breakAdjustmentMinutes
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

      {hasStagedChanges(globalStaging) && (
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
            {getStagedJobCount(globalStaging)} job{getStagedJobCount(globalStaging) !== 1 ? 's' : ''} staged for changes
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
              onDrop={(dateStr, jigId) => handleDrop(dateStr, jigId)}
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
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};
