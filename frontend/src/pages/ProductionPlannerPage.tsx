import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stack, Text, CommandBar, IconButton, Spinner, MessageBar, MessageBarType
} from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { productionService } from '../services/d365Services';

interface Job {
  id: string;
  name: string;
  orderNumber: string;
  customer: string;
  estimatedEFinks: number;
  plannedDateStr: string | null;
  jigId: string | null;
}

const JIG_TEAMS = [
  { id: '4d0a7a6e-0b75-4354-ab7c-712306da38f8', name: 'Jig 1' },
  { id: 'adb04b6a-bb72-4797-82f0-87e6c9df90da', name: 'Jig 2' },
  { id: 'cf39bb79-edae-41cb-9176-a9fbea1ecd38', name: 'Jig 3' }
];

export const ProductionPlannerPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDateStr, setCurrentDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [basketCollapsed, setBasketCollapsed] = useState(false);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);

  const loadData = async () => {
    console.log('[PLANNER] Starting to load data...');
    setLoading(true);
    setError(null);
    try {
      const productions = await productionService.getAll();
      console.log(`[PLANNER] ✓ Loaded ${productions.length} total productions`);
      
      const jobList: Job[] = productions
        .filter((p: any) => p.productionComplete !== true)
        .map((p: any) => ({
          id: p.id,
          name: p.name || '',
          orderNumber: p.orderNumber || p.name || 'N/A',
          customer: p.customerName || 'Unknown',
          estimatedEFinks: p.newEstimateDefinks || 0,
          plannedDateStr: p.productionPlannedDate ? new Date(p.productionPlannedDate).toISOString().split('T')[0] : null,
          jigId: p.jigId || null
        }));
      
      console.log(`[PLANNER] ✓ Filtered to ${jobList.length} incomplete jobs`);
      setJobs(jobList);
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
  
  const getJobsForDateAndJig = useCallback((dateStr: string, jigId: string) => {
    return jobs.filter(j => j.plannedDateStr === dateStr && j.jigId === jigId);
  }, [jobs]);

  const getDaysInView = useMemo(() => {
    const days: string[] = [];
    const start = new Date(currentDateStr);
    start.setHours(0, 0, 0, 0);
    
    if (viewMode === 'day') {
      days.push(start.toISOString().split('T')[0]);
    } else if (viewMode === 'week') {
      const dayOfWeek = start.getDay();
      start.setDate(start.getDate() - dayOfWeek);
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day.toISOString().split('T')[0]);
      }
    } else {
      const year = start.getFullYear();
      const month = start.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const day = new Date(year, month, i);
        days.push(day.toISOString().split('T')[0]);
      }
    }
    
    return days;
  }, [currentDateStr, viewMode]);

  const getTotalEFinksForDate = useCallback((dateStr: string): number => {
    return jobs
      .filter(j => j.plannedDateStr === dateStr)
      .reduce((sum, j) => sum + j.estimatedEFinks, 0);
  }, [jobs]);

  const handleDragStart = (jobId: string) => {
    setDraggedJobId(jobId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dateStr: string, jigId: string) => {
    if (!draggedJobId) return;
    
    const job = jobs.find(j => j.id === draggedJobId);
    if (!job) return;

    setJobs(jobs.map(j => 
      j.id === draggedJobId 
        ? { ...j, plannedDateStr: dateStr, jigId }
        : j
    ));

    try {
      const date = new Date(dateStr);
      await productionService.update(job.id, {
        productionPlannedDate: date.toISOString(),
        jigId: jigId
      });
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
    const newDate = new Date(currentDateStr);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDateStr(newDate.toISOString().split('T')[0]);
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
    },
    {
      key: 'day',
      text: 'Day',
      iconProps: { iconName: 'CalendarDay' },
      onClick: () => setViewMode('day'),
      checked: viewMode === 'day'
    },
    {
      key: 'week',
      text: 'Week',
      iconProps: { iconName: 'CalendarWeek' },
      onClick: () => setViewMode('week'),
      checked: viewMode === 'week'
    },
    {
      key: 'month',
      text: 'Month',
      iconProps: { iconName: 'Calendar' },
      onClick: () => setViewMode('month'),
      checked: viewMode === 'month'
    }
  ];

  if (loading && jobs.length === 0) {
    return (
      <Stack verticalAlign="center" horizontalAlign="center" styles={{ root: { height: '100vh' } }}>
        <Spinner label="Loading production planner..." size={3} />
        <Text variant="small" styles={{ root: { marginTop: 10, color: '#666' } }}>
          Loading {jobs.length} jobs...
        </Text>
      </Stack>
    );
  }

  return (
    <Stack styles={{ root: { height: '100%' } }}>
      <Text variant="xxLarge" styles={{ root: { marginBottom: 20 } }}>
        Production Planner ({jobs.length} jobs)
      </Text>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <CommandBar items={commandItems} />

      <Stack horizontal styles={{ root: { flex: 1, marginTop: 20, gap: 10 } }}>
        <Stack
          styles={{
            root: {
              width: basketCollapsed ? 50 : 300,
              backgroundColor: '#f3f2f1',
              borderRadius: 4,
              padding: basketCollapsed ? 10 : 15,
              transition: 'width 0.3s ease'
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

        <Stack styles={{ root: { flex: 1, overflowY: 'auto' } }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'month' ? 'repeat(auto-fill, minmax(250px, 1fr))' : `repeat(${viewMode === 'week' ? '7' : '1'}, minmax(250px, 1fr))`,
              gap: 15
            }}
          >
            {getDaysInView.map((dateStr) => {
              const totalEFinks = getTotalEFinksForDate(dateStr);
              return (
                <Stack
                  key={`day-${dateStr}`}
                  styles={{
                    root: {
                      border: '1px solid #ddd',
                      borderRadius: 4,
                      backgroundColor: 'white',
                      overflow: 'hidden'
                    }
                  }}
                >
                  <Stack
                    horizontal
                    horizontalAlign="space-between"
                    styles={{
                      root: {
                        padding: '10px 15px',
                        backgroundColor: '#0078d4',
                        color: 'white'
                      }
                    }}
                  >
                    <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                      {formatDate(dateStr)}
                    </Text>
                    <Text variant="small" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                      {totalEFinks} E-Finks
                    </Text>
                  </Stack>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, backgroundColor: '#ddd' }}>
                    {JIG_TEAMS.map(jigInfo => {
                      const jigJobs = getJobsForDateAndJig(dateStr, jigInfo.id);
                      const jigEFinks = jigJobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);

                      return (
                        <Stack
                          key={jigInfo.id}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(dateStr, jigInfo.id)}
                          styles={{
                            root: {
                              backgroundColor: '#faf9f8',
                              padding: 10,
                              minHeight: 150
                            }
                          }}
                        >
                          <Text variant="small" block styles={{ root: { fontWeight: 600, color: '#323130', marginBottom: 8 } }}>
                            {jigInfo.name} ({jigEFinks})
                          </Text>
                          <Stack tokens={{ childrenGap: 6 }}>
                            {jigJobs.map(job => (
                              <Stack
                                key={job.id}
                                draggable
                                onDragStart={() => handleDragStart(job.id)}
                                onDoubleClick={() => handleJobDoubleClick(job.id)}
                                styles={{
                                  root: {
                                    padding: 8,
                                    backgroundColor: 'white',
                                    borderRadius: 3,
                                    border: '1px solid #e1dfdd',
                                    cursor: 'grab'
                                  }
                                }}
                              >
                                <Text variant="tiny" block styles={{ root: { fontWeight: 600 } }}>
                                  {job.orderNumber}
                                </Text>
                                <Text variant="tiny" block>
                                  {job.customer}
                                </Text>
                                <Text variant="tiny" block styles={{ root: { color: '#0078d4' } }}>
                                  {job.estimatedEFinks} E-Finks
                                </Text>
                              </Stack>
                            ))}
                          </Stack>
                        </Stack>
                      );
                    })}
                  </div>
                </Stack>
              );
            })}
          </div>
        </Stack>
      </Stack>
    </Stack>
  );
};
