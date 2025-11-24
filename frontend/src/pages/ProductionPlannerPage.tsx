import { useState, useEffect } from 'react';
import { Stack, Text, Pivot, PivotItem, Spinner, MessageBar, MessageBarType, CommandBar } from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { d365OrderService, productionService } from '../services/d365Services';
import type { Production } from '../types/millennium';

interface UnallocatedJob {
  orderId: string;
  orderNumber: string;
  customerName: string;
  description: string;
  estimatedEFinks: number;
  status: 'not_created' | 'awaiting_planning';
  productionId?: string;
  productionComplete?: boolean;
}

interface PlannedJob extends UnallocatedJob {
  plannedDate: Date;
  jigNumber: 1 | 2 | 3;
}

interface DayCapacity {
  date: Date;
  jig1: number;
  jig2: number;
  jig3: number;
}

export const ProductionPlannerPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unallocatedJobs, setUnallocatedJobs] = useState<UnallocatedJob[]>([]);
  const [plannedJobs, setPlannedJobs] = useState<PlannedJob[]>([]);
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedJob, setDraggedJob] = useState<UnallocatedJob | null>(null);

  const CAPACITY_PER_JIG_PER_DAY = 80;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all orders and production records
      const [orders, productions] = await Promise.all([
        d365OrderService.getAll(),
        productionService.getAll()
      ]);

      // Filter orders that require production
      const ordersRequiringProduction = orders.filter(order => order.productionRequired === true);

      // Create a map of production records by order number
      const productionMap = new Map<string, Production>();
      productions.forEach(prod => {
        if (prod.orderNo) {
          productionMap.set(prod.orderNo, prod);
        }
      });

      const unallocated: UnallocatedJob[] = [];
      const planned: PlannedJob[] = [];

      // Process each order requiring production
      ordersRequiringProduction.forEach(order => {
        const production = productionMap.get(order.orderNumber || '');

        if (!production) {
          // Order has no production record - mark as "not created"
          unallocated.push({
            orderId: order.id,
            orderNumber: order.orderNumber || '',
            customerName: order.customerName || 'Unknown',
            description: order.description || '',
            estimatedEFinks: order.estimatedEFinks || 0,
            status: 'not_created'
          });
        } else if (!production.productionPlannedDate) {
          // Production record exists but no planned date - mark as "awaiting planning"
          unallocated.push({
            orderId: order.id,
            orderNumber: order.orderNumber || '',
            customerName: order.customerName || 'Unknown',
            description: order.description || '',
            estimatedEFinks: order.estimatedEFinks || 0,
            status: 'awaiting_planning',
            productionId: production.id,
            productionComplete: production.productionComplete || false
          });
        } else {
          // Has planned date - add to planned jobs
          planned.push({
            orderId: order.id,
            orderNumber: order.orderNumber || '',
            customerName: order.customerName || 'Unknown',
            description: order.description || '',
            estimatedEFinks: order.estimatedEFinks || 0,
            status: production.productionComplete ? 'not_created' : 'awaiting_planning',
            productionId: production.id,
            productionComplete: production.productionComplete || false,
            plannedDate: new Date(production.productionPlannedDate),
            jigNumber: (production.jigNumber || 1) as 1 | 2 | 3
          });
        }
      });

      setUnallocatedJobs(unallocated);
      setPlannedJobs(planned);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production planning data');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInView = (): Date[] => {
    const days: Date[] = [];
    const start = new Date(currentDate);
    
    if (viewMode === 'day') {
      days.push(new Date(start));
    } else if (viewMode === 'week') {
      start.setDate(start.getDate() - start.getDay()); // Start from Sunday
      for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
      }
    } else { // month
      start.setDate(1);
      const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      for (let i = 0; i < daysInMonth; i++) {
        const day = new Date(start);
        day.setDate(i + 1);
        days.push(day);
      }
    }
    
    return days;
  };

  const getCapacityForDay = (date: Date, jig: 1 | 2 | 3): number => {
    const dateStr = date.toDateString();
    const jobsOnDay = plannedJobs.filter(job => 
      job.plannedDate.toDateString() === dateStr && job.jigNumber === jig
    );
    return jobsOnDay.reduce((sum, job) => sum + job.estimatedEFinks, 0);
  };

  const getCapacityPercentage = (used: number): number => {
    return (used / CAPACITY_PER_JIG_PER_DAY) * 100;
  };

  const handleDragStart = (job: UnallocatedJob) => {
    setDraggedJob(job);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (date: Date, jig: 1 | 2 | 3) => {
    if (!draggedJob) return;

    try {
      // Calculate if there's overflow
      const currentCapacity = getCapacityForDay(date, jig);
      const remainingCapacity = CAPACITY_PER_JIG_PER_DAY - currentCapacity;
      
      if (draggedJob.estimatedEFinks <= remainingCapacity) {
        // Fits in this day
        await assignJobToDate(draggedJob, date, jig);
      } else {
        // Need to split across multiple days
        let remainingEFinks = draggedJob.estimatedEFinks;
        let currentPlannedDate = new Date(date);
        
        while (remainingEFinks > 0) {
          const capacityOnDay = CAPACITY_PER_JIG_PER_DAY - getCapacityForDay(currentPlannedDate, jig);
          const eFinksForDay = Math.min(remainingEFinks, capacityOnDay);
          
          if (eFinksForDay > 0) {
            await assignJobToDate(draggedJob, currentPlannedDate, jig);
            remainingEFinks -= eFinksForDay;
          }
          
          // Move to next day
          currentPlannedDate.setDate(currentPlannedDate.getDate() + 1);
        }
      }

      setDraggedJob(null);
      await loadData(); // Reload data
    } catch (err) {
      setError('Failed to assign job to date');
    }
  };

  const assignJobToDate = async (job: UnallocatedJob, date: Date, jig: 1 | 2 | 3) => {
    if (job.status === 'not_created') {
      // Create new production record
      await productionService.create({
        orderNo: job.orderNumber,
        productionPlannedDate: date.toISOString(),
        jigNumber: jig,
        estimatedEFinks: job.estimatedEFinks,
        productionComplete: false
      });
    } else if (job.productionId) {
      // Update existing production record
      await productionService.update(job.productionId, {
        productionPlannedDate: date.toISOString(),
        jigNumber: jig
      });
    }
  };

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'previous',
      text: 'Previous',
      iconProps: { iconName: 'ChevronLeft' },
      onClick: () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() - 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
        else newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
      }
    },
    {
      key: 'today',
      text: 'Today',
      iconProps: { iconName: 'Calendar' },
      onClick: () => setCurrentDate(new Date())
    },
    {
      key: 'next',
      text: 'Next',
      iconProps: { iconName: 'ChevronRight' },
      onClick: () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'day') newDate.setDate(newDate.getDate() + 1);
        else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
        else newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
      }
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadData
    }
  ];

  if (loading) {
    return (
      <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { height: '100vh' } }}>
        <Spinner label="Loading production planner..." size={3} />
      </Stack>
    );
  }

  const days = getDaysInView();

  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Stack.Item>
        <Text variant="xxLarge" styles={{ root: { fontWeight: 600 } }}>
          Production Planner
        </Text>
        <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
          Plan and schedule production across jigs
        </Text>
      </Stack.Item>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { height: 'calc(100vh - 200px)' } }}>
        {/* Unallocated Jobs Basket */}
        <Stack styles={{ root: { width: 300, borderRight: '1px solid #edebe9', paddingRight: 20, overflowY: 'auto' } }}>
          <Text variant="large" styles={{ root: { fontWeight: 600, marginBottom: 16 } }}>
            Unallocated Jobs ({unallocatedJobs.length})
          </Text>
          
          <Stack tokens={{ childrenGap: 8 }}>
            {unallocatedJobs.map(job => (
              <Stack
                key={job.orderId}
                draggable
                onDragStart={() => handleDragStart(job)}
                styles={{
                  root: {
                    padding: 12,
                    border: '1px solid #edebe9',
                    borderRadius: 4,
                    backgroundColor: 'white',
                    cursor: 'grab',
                    selectors: {
                      ':hover': {
                        backgroundColor: '#f3f2f1',
                        borderColor: '#59AAD5'
                      }
                    }
                  }
                }}
              >
                <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>{job.orderNumber}</Text>
                <Text variant="small">{job.customerName}</Text>
                <Text variant="xSmall" styles={{ root: { color: '#605e5c' } }}>
                  {job.description}
                </Text>
                <Stack horizontal horizontalAlign="space-between" styles={{ root: { marginTop: 4 } }}>
                  <Text variant="small" styles={{ root: { fontWeight: 600, color: '#0078d4' } }}>
                    {job.estimatedEFinks} E-Finks
                  </Text>
                  <Text 
                    variant="xSmall" 
                    styles={{ 
                      root: { 
                        backgroundColor: job.status === 'not_created' ? '#fde7e9' : '#fff4ce',
                        color: job.status === 'not_created' ? '#a4262c' : '#8a6d3b',
                        padding: '2px 6px',
                        borderRadius: 3
                      } 
                    }}
                  >
                    {job.status === 'not_created' ? 'Not Created' : 'Awaiting Planning'}
                  </Text>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>

        {/* Calendar View */}
        <Stack styles={{ root: { flex: 1 } }}>
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { marginBottom: 16 } }}>
            <CommandBar items={commandBarItems} styles={{ root: { padding: 0 } }} />
            
            <Pivot
              selectedKey={viewMode}
              onLinkClick={(item) => item && setViewMode(item.props.itemKey as 'day' | 'week' | 'month')}
            >
              <PivotItem headerText="Day" itemKey="day" />
              <PivotItem headerText="Week" itemKey="week" />
              <PivotItem headerText="Month" itemKey="month" />
            </Pivot>
          </Stack>

          <Stack styles={{ root: { overflowX: 'auto' } }}>
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <Stack styles={{ root: { width: 100, flexShrink: 0 } }}>
                <Stack styles={{ root: { height: 50, borderBottom: '2px solid #edebe9' } }} />
                {viewMode === 'day' && (
                  <>
                    {Array.from({ length: 20 }).map((_, i) => {
                      const hour = 7 + Math.floor(i / 2);
                      const minute = i % 2 === 0 ? '00' : '30';
                      return (
                        <Stack 
                          key={i}
                          styles={{ 
                            root: { 
                              height: 30, 
                              paddingRight: 8,
                              borderBottom: '1px solid #f3f2f1',
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center'
                            } 
                          }}
                        >
                          <Text variant="small">{hour}:{minute}</Text>
                        </Stack>
                      );
                    })}
                  </>
                )}
              </Stack>

              {days.map(day => {
                const jig1Capacity = getCapacityForDay(day, 1);
                const jig2Capacity = getCapacityForDay(day, 2);
                const jig3Capacity = getCapacityForDay(day, 3);
                const totalCapacity = jig1Capacity + jig2Capacity + jig3Capacity;

                return (
                  <Stack key={day.toISOString()} tokens={{ childrenGap: 0 }}>
                    {/* Day Header */}
                    <Stack 
                      styles={{ 
                        root: { 
                          height: 50, 
                          padding: 8,
                          borderBottom: '2px solid #edebe9',
                          backgroundColor: day.toDateString() === new Date().toDateString() ? '#e3f2fd' : '#faf9f8'
                        } 
                      }}
                    >
                      <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text variant="small">{day.getDate()}/{day.getMonth() + 1}</Text>
                      <Text variant="xSmall" styles={{ root: { color: '#605e5c' } }}>
                        Total: {totalCapacity}/{CAPACITY_PER_JIG_PER_DAY * 3} E-Finks
                      </Text>
                    </Stack>

                    {/* Jig Columns */}
                    <Stack horizontal tokens={{ childrenGap: 4 }}>
                      {[1, 2, 3].map(jigNum => {
                        const jig = jigNum as 1 | 2 | 3;
                        const capacity = jigNum === 1 ? jig1Capacity : jigNum === 2 ? jig2Capacity : jig3Capacity;
                        const percentage = getCapacityPercentage(capacity);
                        const jobsOnJig = plannedJobs.filter(
                          job => job.plannedDate.toDateString() === day.toDateString() && job.jigNumber === jig
                        );

                        return (
                          <Stack
                            key={jig}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(day, jig)}
                            styles={{
                              root: {
                                width: viewMode === 'month' ? 80 : 150,
                                minHeight: viewMode === 'day' ? 600 : 150,
                                padding: 4,
                                border: '1px solid #edebe9',
                                borderRadius: 4,
                                backgroundColor: percentage > 100 ? '#fde7e9' : percentage > 80 ? '#fff4ce' : 'white',
                                position: 'relative'
                              }
                            }}
                          >
                            <Text 
                              variant="xSmall" 
                              styles={{ 
                                root: { 
                                  fontWeight: 600, 
                                  marginBottom: 4,
                                  textAlign: 'center',
                                  color: '#605e5c'
                                } 
                              }}
                            >
                              Jig {jig}
                            </Text>
                            <Text 
                              variant="xSmall" 
                              styles={{ 
                                root: { 
                                  textAlign: 'center',
                                  color: percentage > 100 ? '#a4262c' : '#0078d4',
                                  fontWeight: 600,
                                  marginBottom: 4
                                } 
                              }}
                            >
                              {capacity}/{CAPACITY_PER_JIG_PER_DAY}
                            </Text>
                            <Text 
                              variant="xSmall" 
                              styles={{ 
                                root: { 
                                  textAlign: 'center',
                                  marginBottom: 8
                                } 
                              }}
                            >
                              {percentage.toFixed(1)}%
                            </Text>

                            {/* Jobs on this jig */}
                            <Stack tokens={{ childrenGap: 4 }}>
                              {jobsOnJig.map(job => (
                                <Stack
                                  key={job.productionId}
                                  styles={{
                                    root: {
                                      padding: 4,
                                      backgroundColor: job.productionComplete ? '#c8e6c9' : '#e3f2fd',
                                      borderRadius: 3,
                                      border: '1px solid #d1d1d1'
                                    }
                                  }}
                                >
                                  <Text variant="xSmall" styles={{ root: { fontWeight: 600 } }}>
                                    {job.orderNumber}
                                  </Text>
                                  {viewMode !== 'month' && (
                                    <>
                                      <Text variant="xSmall">{job.customerName}</Text>
                                      <Text variant="xSmall">{job.estimatedEFinks} E-Finks</Text>
                                    </>
                                  )}
                                </Stack>
                              ))}
                            </Stack>
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
