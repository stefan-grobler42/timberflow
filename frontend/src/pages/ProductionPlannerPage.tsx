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
}

interface OvertimeSettings {
  enabled: boolean;
  closeTime: string;
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
  const [overtimeByDay, setOvertimeByDay] = useState<Record<string, OvertimeSettings>>({});

  const loadData = async () => {
    console.log('[PLANNER] Starting to load data...');
    setLoading(true);
    setError(null);
    try {
      const [productions, jigs, orders] = await Promise.all([
        productionService.getAll(),
        jigService.getAll(),
        d365OrderService.getAll()
      ]);
      
      console.log(`[PLANNER] ✓ Loaded ${productions.length} total productions`);
      console.log(`[PLANNER] ✓ Loaded ${jigs.length} jig teams`);
      console.log(`[PLANNER] ✓ Loaded ${orders.length} sales orders`);
      
      const jobList: Job[] = productions
        .map((p: any) => ({
          id: p.id,
          name: p.name || '',
          orderNumber: p.orderNumber || p.name || 'N/A',
          customer: p.customerName || 'Unknown',
          estimatedEFinks: p.newEstimateDefinks || 0,
          customDurationMinutes: p.customDurationMinutes || undefined,
          plannedDateStr: formatIsoDateLocal(p.productionPlannedDate),
          jigId: p.jigId || null,
          productionComplete: p.productionComplete === true,
          parentProductionId: p.parentProductionId || undefined,
          rolloverSequence: p.rolloverSequence || undefined,
          createdOn: p.createdOn || undefined
        }));
      
      console.log(`[PLANNER] ✓ Mapped ${jobList.length} production jobs (${jobList.filter(j => j.productionComplete).length} completed)`);
      
      // Find sales orders that require production but don't have production records yet
      const productionOrderIds = new Set(productions.map((p: any) => p.orderNo).filter(Boolean));
      const ordersNeedingProduction = orders
        .filter((o: D365Order) => o.productionRequired === true && !productionOrderIds.has(o.id))
        .map((o: D365Order) => ({
          id: `order-${o.id}`, // Prefix to distinguish from production records
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
  const allJobs = useMemo(() => {
    return [...jobs, ...unallocatedOrders];
  }, [jobs, unallocatedOrders]);

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
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;

    // Check if this is a sales order needing production (prefixed with 'order-')
    const isSalesOrder = job.id.startsWith('order-');
    const actualOrderId = isSalesOrder ? job.id.substring(6) : null; // Remove 'order-' prefix to get Guid

    // For month view, don't assign jig (keep existing or null)
    const updatedJigId = jigId !== undefined ? jigId : job.jigId;

    try {
      const date = new Date(dateStr);
      
      if (isSalesOrder && actualOrderId) {
        // Create a new production record for this sales order
        const createData: any = {
          name: job.name || job.orderNumber || 'Production',
          orderNo: actualOrderId, // This is a Guid string
          productionPlannedDate: date.toISOString(),
          newEstimateDefinks: job.estimatedEFinks || 0,
          productionComplete: false,
          jigId: updatedJigId
        };
        
        console.log('[PLANNER] Creating production for sales order:', actualOrderId);
        await productionService.create(createData);
        console.log('[PLANNER] ✓ Production created, reloading data...');
        
        // Reload data to get the new production record and remove sales order from unallocated
        await loadData();
      } else {
        // Update existing production record
        const updateData: any = {
          productionPlannedDate: date.toISOString()
        };
        if (updatedJigId !== undefined) {
          updateData.jigId = updatedJigId;
        }
        
        // Optimistically update UI - move job to END of array to maintain user-driven order
        // First job dragged in stays first, second stays second, etc.
        setJobs(prevJobs => {
          // Remove the job from its current position
          const otherJobs = prevJobs.filter(j => j.id !== draggedJobId);
          // Update the job and add it to the end
          const updatedJob = { ...job, plannedDateStr: dateStr, jigId: updatedJigId };
          return [...otherJobs, updatedJob];
        });
        
        await productionService.update(job.id, updateData);
      }
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to schedule job:', err);
      setError(`Failed to schedule job: ${err instanceof Error ? err.message : 'Unknown error'}`);
      await loadData();
    } finally {
      setDraggedJobId(null);
    }
  };

  const handleDropToUnallocated = async () => {
    if (!draggedJobId) return;
    
    const job = allJobs.find(j => j.id === draggedJobId);
    if (!job) return;

    // Can't unallocate a sales order that doesn't have a production record yet
    const isSalesOrder = job.id.startsWith('order-');
    if (isSalesOrder) {
      setDraggedJobId(null);
      return;
    }

    try {
      // Clear the planned date
      const updateData: any = {
        productionPlannedDate: null
      };
      
      // Optimistically update UI - move job to END of array to maintain user-driven order
      setJobs(prevJobs => {
        const otherJobs = prevJobs.filter(j => j.id !== draggedJobId);
        const updatedJob = { ...job, plannedDateStr: null, jigId: null };
        return [...otherJobs, updatedJob];
      });
      
      await productionService.update(job.id, updateData);
      console.log('[PLANNER] ✓ Job moved to unallocated');
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to unallocate job:', err);
      setError(`Failed to unallocate job: ${err instanceof Error ? err.message : 'Unknown error'}`);
      await loadData();
    } finally {
      setDraggedJobId(null);
    }
  };

  const handleJobDoubleClick = (jobId: string) => {
    navigate(`/production-planner/${jobId}`);
  };

  const handleJobDurationChange = async (jobId: string, durationMinutes: number) => {
    try {
      await productionService.update(jobId, {
        customDurationMinutes: durationMinutes
      });
      console.log('[PLANNER] ✓ Job duration updated:', durationMinutes, 'minutes');
      
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === jobId 
            ? { ...j, customDurationMinutes: durationMinutes }
            : j
        )
      );
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to update job duration:', err);
    }
  };

  const handleJobDurationReset = async (jobId: string) => {
    try {
      await productionService.update(jobId, {
        customDurationMinutes: undefined
      });
      console.log('[PLANNER] ✓ Job duration reset to calculated value');
      
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === jobId 
            ? { ...j, customDurationMinutes: undefined }
            : j
        )
      );
    } catch (err) {
      console.error('[PLANNER] ✗ Failed to reset job duration:', err);
    }
  };

  const handleOvertimeChange = async (dayStr: string, enabled: boolean, closeTime: string, additionalMinutes?: number) => {
    // Update overtime settings first
    setOvertimeByDay(prev => ({
      ...prev,
      [dayStr]: { enabled, closeTime }
    }));
    
    // If overtime is being enabled and we have additional minutes info, redistribute linked jobs
    // This ONLY runs when user explicitly toggles overtime, not on every render
    if (enabled && additionalMinutes && additionalMinutes > 0) {
      const MINUTES_PER_EFINK = 6.5625;
      const MIN_BLOCK_HEIGHT = 20;
      
      const jobsOnThisDay = allJobs.filter(j => j.plannedDateStr === dayStr);
      const updates: { jobId: string; durationMinutes: number }[] = [];
      
      jobsOnThisDay.forEach(job => {
        const rootId = job.parentProductionId || job.id;
        
        const chainJobs = allJobs.filter(j => 
          j.id === rootId || j.parentProductionId === rootId
        );
        
        if (chainJobs.length <= 1) return;
        
        const isThisJobRoot = job.id === rootId || !job.parentProductionId;
        if (!isThisJobRoot) return;
        
        const rolloverJobs = chainJobs
          .filter(j => j.id !== job.id && j.plannedDateStr !== dayStr)
          .sort((a, b) => (a.rolloverSequence || 0) - (b.rolloverSequence || 0));
        
        if (rolloverJobs.length === 0) return;
        
        const currentDuration = job.customDurationMinutes || Math.round(job.estimatedEFinks * MINUTES_PER_EFINK);
        const totalChainDuration = chainJobs.reduce((sum, j) => 
          sum + (j.customDurationMinutes || Math.round(j.estimatedEFinks * MINUTES_PER_EFINK)), 0
        );
        
        const newCurrentDuration = Math.min(
          currentDuration + additionalMinutes,
          totalChainDuration - (rolloverJobs.length * MIN_BLOCK_HEIGHT)
        );
        const increase = newCurrentDuration - currentDuration;
        
        if (increase > 0) {
          const firstRollover = rolloverJobs[0];
          const rolloverDuration = firstRollover.customDurationMinutes || Math.round(firstRollover.estimatedEFinks * MINUTES_PER_EFINK);
          
          if (rolloverDuration <= MIN_BLOCK_HEIGHT) {
            console.log('[PLANNER] Skipping redistribution - rollover already at minimum');
            return;
          }
          
          updates.push({ jobId: job.id, durationMinutes: newCurrentDuration });
          
          let remainingDecrease = increase;
          rolloverJobs.forEach(rollover => {
            const rolloverDur = rollover.customDurationMinutes || Math.round(rollover.estimatedEFinks * MINUTES_PER_EFINK);
            const decrease = Math.min(remainingDecrease, rolloverDur - MIN_BLOCK_HEIGHT);
            if (decrease > 0) {
              updates.push({ jobId: rollover.id, durationMinutes: rolloverDur - decrease });
              remainingDecrease -= decrease;
            }
          });
        }
      });
      
      if (updates.length > 0) {
        console.log('[PLANNER] Redistributing linked jobs on overtime toggle:', updates);
        try {
          await Promise.all(updates.map(update => 
            productionService.update(update.jobId, {
              customDurationMinutes: update.durationMinutes
            })
          ));
          
          setJobs(prevJobs => 
            prevJobs.map(job => {
              const update = updates.find(u => u.jobId === job.id);
              if (update) {
                return { ...job, customDurationMinutes: update.durationMinutes };
              }
              return job;
            })
          );
          
          console.log('[PLANNER] ✓ Linked jobs redistributed on overtime toggle');
        } catch (err) {
          console.error('[PLANNER] ✗ Failed to redistribute linked jobs:', err);
        }
      }
    }
  };

  const handleJobRollover = async (jobId: string, overflowMinutes: number, nextDateStr: string, jigId: string | null) => {
    try {
      const job = allJobs.find(j => j.id === jobId);
      if (!job) return;

      // Fetch the full production record to get all fields for cloning
      const fullProduction = await productionService.getById(jobId);
      if (!fullProduction) {
        console.error('[PLANNER] Could not fetch full production data for rollover');
        return;
      }

      const currentDuration = job.customDurationMinutes || Math.round(job.estimatedEFinks * 6.5625);
      const remainingDuration = currentDuration - overflowMinutes;

      // Determine the root parent ID for this job chain
      const rootParentId = job.parentProductionId || jobId;
      const currentSequence = job.rolloverSequence || 0;

      // BUG FIX 1: Preserve jigId - use nullish coalescing to handle edge cases
      // jigId parameter from overflow detection takes priority, fallback to job's existing jigId
      // Using ?? instead of || to correctly handle falsy-but-valid values
      const preservedJigId = jigId ?? job.jigId;

      // BUG FIX 2: Check if a rollover child already exists for this job
      // Look for jobs where parentProductionId matches rootParentId and rolloverSequence > currentSequence
      const existingRollover = allJobs.find(j => 
        j.parentProductionId === rootParentId && 
        (j.rolloverSequence || 0) === currentSequence + 1
      );

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
      
      await productionService.update(jobId, updateData);

      // If existing rollover child exists, DELETE it first - then create fresh one
      // This ensures the rollover always has the correct duration after overtime changes
      if (existingRollover) {
        console.log('[PLANNER] Deleting existing rollover to recreate with correct duration:', existingRollover.id);
        await productionService.delete(existingRollover.id);
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

      await productionService.create(rolloverData);
      console.log('[PLANNER] ✓ Job rolled over to next day with all fields cloned, linked parent:', rootParentId);

      await loadData();
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
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};
