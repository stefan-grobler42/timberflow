import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stack, Text, CommandBar, Spinner, MessageBar, MessageBarType, Dropdown
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
  calculateGapAdjustedStartTime
} from '../utils/scheduleUtils';
import {
  type PendingJobChange,
  type PendingChangesState,
  createEmptyPendingState,
  addPendingChange,
  buildUpdatePayload
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
  const [pendingChanges, setPendingChanges] = useState<PendingChangesState>(createEmptyPendingState());
  const [stagedJobs, setStagedJobs] = useState<Map<string, Partial<Job>>>(new Map());

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

  // Merge unallocated orders into jobs array for display in all views
  // Apply staged (pending) changes on top of persisted data
  const allJobs = useMemo(() => {
    const merged = [...jobs, ...unallocatedOrders].map(job => {
      const staged = stagedJobs.get(job.id);
      if (staged) {
        return { ...job, ...staged };
      }
      return job;
    });
    return merged;
  }, [jobs, unallocatedOrders, stagedJobs]);
  
  // Stage a job change locally (does not persist to DB until confirmed)
  const stageJobChange = (jobId: string, changes: Partial<Job>, changeType: PendingJobChange['changeType']) => {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;
    
    // Create pending change record
    const pendingChange: PendingJobChange = {
      id: jobId,
      originalData: {
        jigId: job.jigId,
        plannedDateStr: job.plannedDateStr,
        plannedStartTime: job.plannedStartTime ?? null,
        plannedEndTime: job.plannedEndTime ?? null,
        plannedDurationMinutes: job.plannedDurationMinutes ?? null,
        customDurationMinutes: job.customDurationMinutes
      },
      pendingData: {
        jigId: changes.jigId,
        plannedDateStr: changes.plannedDateStr,
        plannedStartTime: changes.plannedStartTime,
        plannedEndTime: changes.plannedEndTime,
        plannedDurationMinutes: changes.plannedDurationMinutes,
        customDurationMinutes: changes.customDurationMinutes
      },
      changeType
    };
    
    setPendingChanges(prev => addPendingChange(prev, pendingChange));
    setStagedJobs(prev => {
      const next = new Map(prev);
      const existing = next.get(jobId) || {};
      next.set(jobId, { ...existing, ...changes });
      return next;
    });
    
    console.log('[PLANNER] Staged change:', changeType, 'for job:', jobId, changes);
  };

  // Confirm and persist a single job's pending changes
  const confirmJobChange = async (jobId: string) => {
    const change = pendingChanges.changes.get(jobId);
    if (!change) return;
    
    console.log('[PLANNER] Confirming change for job:', jobId);
    
    try {
      const payload = buildUpdatePayload(change);
      await productionService.update(jobId, payload);
      console.log('[PLANNER] ✓ Job change persisted to database');
      
      // Merge staged change into jobs state
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.id === jobId) {
          const staged = stagedJobs.get(jobId);
          if (staged) {
            return { ...job, ...staged };
          }
        }
        return job;
      }));
      
      // Clear pending state
      setPendingChanges(createEmptyPendingState());
      setStagedJobs(new Map());
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to persist job change:', err);
      setError('Failed to save changes. Please try again.');
    }
  };

  // Discard a single job's pending changes  
  const discardJobChange = (jobId: string) => {
    console.log('[PLANNER] Discarding change for job:', jobId);
    setPendingChanges(createEmptyPendingState());
    setStagedJobs(new Map());
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

  const handleDrop = async (dateStr: string, jigId?: string | null) => {
    if (!draggedJobId) return;
    
    // Block drops for OTHER jobs when there's a pending change that needs confirmation
    // The active job itself can still be repositioned before confirmation
    if (pendingChanges.activeJobId !== null && pendingChanges.activeJobId !== draggedJobId) {
      console.log('[PLANNER] Drop blocked - confirm pending changes for active job first');
      setDraggedJobId(null);
      return;
    }
    
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
      
      if (updatedJigId) {
        const dayKey = dateStr;
        const overtime = overtimeByDay[dayKey];
        const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
        
        // Get duration for this job
        const jobDuration = getJobDurationMinutes(job);
        
        // Find next available start time on this team/day
        // Use allJobs to include staged changes so multiple pending drops don't collide
        const otherJobsOnTeamDay = allJobs.filter(
          j => j.id !== job.id && j.plannedDateStr === dateStr && j.jigId === updatedJigId
        );
        
        plannedStartTime = calculateNextAvailableStartTime(dateStr, updatedJigId, otherJobsOnTeamDay, shift);
        
        // Calculate end time accounting for breaks
        const timing = calculatePlannedTimes(plannedStartTime, jobDuration, shift);
        plannedEndTime = timing.plannedEndTime;
        plannedDurationMinutes = jobDuration;
        
        console.log(`[PLANNER] Calculated timing: start=${plannedStartTime}, end=${plannedEndTime}, duration=${plannedDurationMinutes}min`);
      }
      
      if (isSalesOrder && actualOrderId) {
        // Create a new production record for this sales order
        // Sales orders need immediate creation since they don't exist yet
        const createData: any = {
          name: job.name || job.orderNumber || 'Production',
          orderNo: actualOrderId,
          productionPlannedDate: date.toISOString(),
          newEstimateDefinks: job.estimatedEFinks || 0,
          productionComplete: false,
          jigId: updatedJigId,
          plannedStartTime,
          plannedEndTime,
          plannedDurationMinutes
        };
        
        console.log('[PLANNER] Creating production for sales order:', actualOrderId);
        await productionService.create(createData);
        console.log('[PLANNER] ✓ Production created, reloading data...');
        
        await loadData();
      } else {
        // Stage the change - don't persist until user confirms
        stageJobChange(job.id, {
          plannedDateStr: dateStr,
          jigId: updatedJigId,
          plannedStartTime,
          plannedEndTime,
          plannedDurationMinutes
        }, 'allocate');
        
        // Switch to day view to show the confirmation bar
        if (viewMode !== 'day') {
          setViewMode('day');
          setCurrentDateStr(dateStr);
        }
      }
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to schedule job:', err);
      setError(`Failed to schedule job: ${err instanceof Error ? err.message : 'Unknown error'}`);
      await loadData(); // Reload to recover consistent state
    } finally {
      setDraggedJobId(null);
    }
  };

  const handleDropToUnallocated = async () => {
    if (!draggedJobId) return;
    
    // Block unallocate for OTHER jobs when there's a pending change that needs confirmation
    if (pendingChanges.activeJobId !== null && pendingChanges.activeJobId !== draggedJobId) {
      console.log('[PLANNER] Unallocate blocked - confirm pending changes for active job first');
      setDraggedJobId(null);
      return;
    }
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;

    // Can't unallocate a sales order that doesn't have a production record yet
    const isSalesOrder = job.id.startsWith('order-');
    if (isSalesOrder) {
      setDraggedJobId(null);
      return;
    }

    // Unallocate persists immediately - no confirmation needed since the job is 
    // leaving the schedule and poses no collision risk with other jobs
    try {
      console.log(`[PLANNER] Unallocating job ${job.id} - persisting immediately`);
      
      await productionService.update(job.id, {
        jigId: undefined,
        plannedStartDate: undefined,
        plannedStartTime: undefined,
        plannedEndTime: undefined,
        plannedDurationMinutes: undefined,
        customDurationMinutes: undefined
      });
      
      console.log('[PLANNER] ✓ Job unallocated successfully');
      
      // Reload data to reflect the change
      await loadData();
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to unallocate job:', err);
      setError(`Failed to unallocate job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDraggedJobId(null);
    }
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
    let plannedEndTime: number | null = null;
    
    if (job.plannedStartTime != null && jigId && dateStr) {
      const overtime = overtimeByDay[dateStr];
      const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
      
      // Calculate new end time using the rounded duration
      const timing = calculatePlannedTimes(job.plannedStartTime, roundedDuration, shift);
      plannedEndTime = timing.plannedEndTime;
      
      // Stage the resize change
      stageJobChange(jobId, {
        customDurationMinutes: roundedDuration,
        plannedDurationMinutes: roundedDuration,
        plannedEndTime
      }, 'resize');
      
      // Check for overlaps with downstream jobs and cascade if needed
      const jobsOnTeamDay = allJobs
        .filter(j => j.plannedDateStr === dateStr && j.jigId === jigId && !j.productionComplete)
        .sort((a, b) => (a.plannedStartTime || 0) - (b.plannedStartTime || 0));
      
      const jobIndex = jobsOnTeamDay.findIndex(j => j.id === jobId);
      if (jobIndex !== -1) {
        let currentEndTime = plannedEndTime;
        
        // Apply 30-min gap with break proximity
        currentEndTime = calculateGapAdjustedStartTime(currentEndTime, shift);
        
        // Cascade to downstream jobs only if overlap would occur
        for (let i = jobIndex + 1; i < jobsOnTeamDay.length; i++) {
          const downstreamJob = jobsOnTeamDay[i];
          const existingStart = downstreamJob.plannedStartTime ?? shift.startTime;
          
          if (currentEndTime > existingStart) {
            // Overlap would occur - need to push this job forward
            const downstreamDuration = getJobDurationMinutes(downstreamJob);
            const downstreamTiming = calculatePlannedTimes(currentEndTime, downstreamDuration, shift);
            
            stageJobChange(downstreamJob.id, {
              plannedStartTime: downstreamTiming.plannedStartTime,
              plannedEndTime: downstreamTiming.plannedEndTime,
              plannedDurationMinutes: downstreamDuration
            }, 'reorder');
            
            currentEndTime = downstreamTiming.plannedEndTime;
            // Apply 30-min gap with break proximity
            currentEndTime = calculateGapAdjustedStartTime(currentEndTime, shift);
          } else {
            // No overlap - stop cascading, preserve gap
            break;
          }
        }
      }
      
      console.log('[PLANNER] Staged resize for job:', jobId, 'duration:', roundedDuration, 'minutes');
    } else {
      // Just stage the duration change
      stageJobChange(jobId, {
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
    
    // Calculate default duration from EFinks (this will be rounded to 15min)
    const defaultDuration = getJobDurationMinutes({ estimatedEFinks: job.estimatedEFinks });
    
    // Calculate new end time based on the default duration
    let plannedEndTime: number | null = null;
    
    if (job.plannedStartTime != null && jigId && dateStr) {
      const overtime = overtimeByDay[dateStr];
      const shift = getShiftConfig(overtime?.enabled, overtime?.closeTime);
      
      // Calculate end time using default duration
      const timing = calculatePlannedTimes(job.plannedStartTime, defaultDuration, shift);
      plannedEndTime = timing.plannedEndTime;
      
      // Stage the reset change
      stageJobChange(jobId, {
        customDurationMinutes: undefined,
        plannedDurationMinutes: defaultDuration,
        plannedEndTime
      }, 'resize');
      
      // Check for overlaps with downstream jobs and cascade if needed
      const jobsOnTeamDay = allJobs
        .filter(j => j.plannedDateStr === dateStr && j.jigId === jigId && !j.productionComplete)
        .sort((a, b) => (a.plannedStartTime || 0) - (b.plannedStartTime || 0));
      
      const jobIndex = jobsOnTeamDay.findIndex(j => j.id === jobId);
      if (jobIndex !== -1) {
        let currentEndTime = plannedEndTime;
        
        // Apply 30-min gap with break proximity
        currentEndTime = calculateGapAdjustedStartTime(currentEndTime, shift);
        
        // Cascade to downstream jobs only if overlap would occur
        for (let i = jobIndex + 1; i < jobsOnTeamDay.length; i++) {
          const downstreamJob = jobsOnTeamDay[i];
          const existingStart = downstreamJob.plannedStartTime ?? shift.startTime;
          
          if (currentEndTime > existingStart) {
            // Overlap would occur - need to push this job forward
            const downstreamDuration = getJobDurationMinutes(downstreamJob);
            const downstreamTiming = calculatePlannedTimes(currentEndTime, downstreamDuration, shift);
            
            stageJobChange(downstreamJob.id, {
              plannedStartTime: downstreamTiming.plannedStartTime,
              plannedEndTime: downstreamTiming.plannedEndTime,
              plannedDurationMinutes: downstreamDuration
            }, 'reorder');
            
            currentEndTime = downstreamTiming.plannedEndTime;
            // Apply 30-min gap with break proximity
            currentEndTime = calculateGapAdjustedStartTime(currentEndTime, shift);
          } else {
            // No overlap - stop cascading, preserve gap
            break;
          }
        }
      }
      
      console.log('[PLANNER] Staged reset for job:', jobId, 'duration:', defaultDuration, 'minutes');
    } else {
      // Just stage the reset
      stageJobChange(jobId, {
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
              onJobDurationChange={handleJobDurationChange}
              onJobDurationReset={handleJobDurationReset}
              onTeamDoubleClick={handleTeamDoubleClick}
              onJobRollover={handleJobRollover}
              overtimeSettings={overtimeByDay[currentDateStr]}
              onOvertimeChange={handleOvertimeChange}
              activeJobId={pendingChanges.activeJobId}
              onConfirmJobChange={confirmJobChange}
              onDiscardJobChange={discardJobChange}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};
