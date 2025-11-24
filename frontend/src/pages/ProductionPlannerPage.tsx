import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stack, Text, CommandBar, IconButton, Spinner, MessageBar, MessageBarType, Dropdown
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { productionService } from '../services/d365Services';
import { jigService } from '../services/millenniumServices';
import type { Jig } from '../types/millennium';
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
  plannedDateStr: string | null;
  jigId: string | null;
}

export const ProductionPlannerPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jigTeams, setJigTeams] = useState<Jig[]>([]);
  const [selectedJigIds, setSelectedJigIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [currentDateStr, setCurrentDateStr] = useState(() => startOfMonthUtc(new Date()));
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [_selectedDayStr, _setSelectedDayStr] = useState<string | null>(null);
  const [basketCollapsed, setBasketCollapsed] = useState(false);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);

  const loadData = async () => {
    console.log('[PLANNER] Starting to load data...');
    setLoading(true);
    setError(null);
    try {
      const [productions, jigs] = await Promise.all([
        productionService.getAll(),
        jigService.getAll()
      ]);
      
      console.log(`[PLANNER] ✓ Loaded ${productions.length} total productions`);
      console.log(`[PLANNER] ✓ Loaded ${jigs.length} jig teams`);
      
      const jobList: Job[] = productions
        .filter((p: any) => p.productionComplete !== true)
        .map((p: any) => ({
          id: p.id,
          name: p.name || '',
          orderNumber: p.orderNumber || p.name || 'N/A',
          customer: p.customerName || 'Unknown',
          estimatedEFinks: p.newEstimateDefinks || 0,
          plannedDateStr: formatIsoDateLocal(p.productionPlannedDate),
          jigId: p.jigId || null
        }));
      
      console.log(`[PLANNER] ✓ Filtered to ${jobList.length} incomplete jobs`);
      setJobs(jobList);
      setJigTeams(jigs);
      if (selectedJigIds.length === 0) {
        setSelectedJigIds(jigs.map(j => j.id));
      }
      setLoading(false);
      console.log(`[PLANNER] ✓ State updated: loading=false, jobs.length=${jobList.length}`);
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

  const unallocated = useMemo(() => jobs.filter(j => !j.plannedDateStr), [jobs]);

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

  const handleDrop = async (dateStr: string, jigId?: string) => {
    if (!draggedJobId) return;
    
    const job = jobs.find(j => j.id === draggedJobId);
    if (!job) return;

    // For month view, don't assign jig (keep existing or null)
    const updatedJigId = jigId !== undefined ? jigId : job.jigId;

    setJobs(jobs.map(j => 
      j.id === draggedJobId 
        ? { ...j, plannedDateStr: dateStr, jigId: updatedJigId }
        : j
    ));

    try {
      const date = new Date(dateStr);
      const updateData: any = {
        productionPlannedDate: date.toISOString()
      };
      if (updatedJigId) {
        updateData.jigId = updatedJigId;
      }
      await productionService.update(job.id, updateData);
    } catch (err) {
      setError('Failed to update job schedule');
      await loadData();
    } finally {
      setDraggedJobId(null);
    }
  };

  const handleJobDoubleClick = (jobId: string) => {
    navigate(`/production-planner/${jobId}`);
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
    <Stack styles={{ root: { height: '100%', overflow: 'hidden' } }}>
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

      <Stack horizontal styles={{ root: { flex: 1, marginTop: 20, gap: 10, overflow: 'hidden' } }}>
        <Stack
          styles={{
            root: {
              width: basketCollapsed ? 50 : 300,
              minWidth: basketCollapsed ? 50 : 300,
              flexShrink: 0,
              backgroundColor: '#f3f2f1',
              borderRadius: 4,
              padding: basketCollapsed ? 10 : 15,
              transition: 'all 0.3s ease'
            }
          }}
        >
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            {!basketCollapsed && (
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                Unallocated ({unallocated.length})
              </Text>
            )}
            <IconButton
              iconProps={{ iconName: basketCollapsed ? 'DoubleChevronRight' : 'DoubleChevronLeft' }}
              onClick={() => setBasketCollapsed(!basketCollapsed)}
            />
          </Stack>

          {!basketCollapsed && (
            <Stack styles={{ root: { marginTop: 15, gap: 8, overflowY: 'auto', maxHeight: 'calc(100vh - 250px)' } }}>
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
                      border: '1px solid #ddd'
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
          )}
        </Stack>

        <Stack styles={{ root: { flex: 1, overflowY: 'auto', overflowX: 'auto', minWidth: 0 } }}>
          {viewMode === 'month' && (
            <MonthView
              daysInView={getDaysInView}
              jobs={jobs}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={(dateStr) => handleDrop(dateStr)}
              onJobDoubleClick={handleJobDoubleClick}
              onWeekClick={handleWeekClick}
            />
          )}
          {viewMode === 'week' && (
            <WeekView
              daysInView={getDaysInView}
              jobs={jobs}
              jigTeams={filteredJigTeams}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={(dateStr, jigId) => handleDrop(dateStr, jigId)}
              onJobDoubleClick={handleJobDoubleClick}
              onDayClick={handleDayClick}
            />
          )}
          {viewMode === 'day' && (
            <DayView
              dayStr={currentDateStr}
              jobs={jobs}
              jigTeams={filteredJigTeams}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={(dateStr, jigId) => handleDrop(dateStr, jigId)}
              onJobDoubleClick={handleJobDoubleClick}
            />
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};
