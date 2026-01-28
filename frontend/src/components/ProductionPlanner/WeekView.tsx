import { Stack, Text } from '@fluentui/react';
import { useMemo, memo } from 'react';

interface Job {
  id: string;
  name: string;
  orderNumber: string;
  customer: string;
  estimatedEFinks: number;
  plannedDateStr: string | null;
  jigId: string | null;
  productionComplete: boolean;
  plannedDurationMinutes?: number | null;
  customDurationMinutes?: number | null;
  plannedStartTime?: number | null;
  plannedEndTime?: number | null;
  breakAdjustmentMinutes?: number | null;
  wipId?: string;
  segmentIndex?: number | null;
  totalSegments?: number | null;
  segmentEfinks?: number;
}

interface Jig {
  id: string;
  name: string;
  averageEfinks?: number;
}

interface WeekViewProps {
  daysInView: string[];
  jobs: Job[];
  jigTeams: Jig[];
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string, jigId: string | null) => void;
  onJobDoubleClick: (jobId: string) => void;
  onDayClick: (dayStr: string) => void;
  onTeamDoubleClick: (teamId: string) => void;
}

const WeekViewComponent: React.FC<WeekViewProps> = ({
  daysInView,
  jobs,
  jigTeams,
  onDragStart,
  onDragOver,
  onDrop,
  onJobDoubleClick,
  onDayClick,
  onTeamDoubleClick
}) => {
  // Group jobs by date and team directly - uses actual WIP data from Day view allocations
  const { jobsByDateAndJig, unallocatedByDate, efinksByDate } = useMemo(() => {
    const byDateAndJig = new Map<string, Job[]>();
    const unallocated = new Map<string, Job[]>();
    const efinksMap = new Map<string, number>();
    
    for (const job of jobs) {
      if (!job.plannedDateStr) continue;
      
      const dateStr = job.plannedDateStr;
      const jobEfinks = job.segmentEfinks ?? job.estimatedEFinks;
      
      // Accumulate E-Finks for the date
      const currentTotal = efinksMap.get(dateStr) || 0;
      efinksMap.set(dateStr, currentTotal + jobEfinks);
      
      if (job.jigId) {
        // Allocated job - group by date and team
        const key = `${dateStr}|${job.jigId}`;
        const existing = byDateAndJig.get(key) || [];
        existing.push(job);
        byDateAndJig.set(key, existing);
      } else {
        // Unallocated job
        const existing = unallocated.get(dateStr) || [];
        existing.push(job);
        unallocated.set(dateStr, existing);
      }
    }
    
    return { 
      jobsByDateAndJig: byDateAndJig, 
      unallocatedByDate: unallocated,
      efinksByDate: efinksMap
    };
  }, [jobs]);

  const getJobsForDateAndJig = (dateStr: string, jigId: string): Job[] => {
    return jobsByDateAndJig.get(`${dateStr}|${jigId}`) || [];
  };

  const getUnallocatedJobsForDate = (dateStr: string): Job[] => {
    return unallocatedByDate.get(dateStr) || [];
  };

  const getTotalEFinksForDate = (dateStr: string): number => {
    return efinksByDate.get(dateStr) || 0;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}`;
  };

  const sortDaysForGrid = (days: string[]): string[] => {
    return [...days].sort((a, b) => {
      const dayA = new Date(a).getDay();
      const dayB = new Date(b).getDay();
      const orderA = dayA === 0 ? 7 : dayA;
      const orderB = dayB === 0 ? 7 : dayB;
      return orderA - orderB;
    });
  };

  const sortedDays = sortDaysForGrid(daysInView);

  const row1Days = sortedDays.slice(0, 3);
  const row2Days = sortedDays.slice(3, 6);
  const row3Days = sortedDays.slice(6, 7);

  const renderDayCard = (dateStr: string) => {
    const totalEFinks = getTotalEFinksForDate(dateStr);
    const capacity = jigTeams.reduce((sum, team) => sum + (team.averageEfinks || 80), 0);
    const utilizationPercent = capacity > 0 ? (totalEFinks / capacity) * 100 : 0;
    const isFullyBooked = utilizationPercent >= 90;
    const isNearlyFull = utilizationPercent >= 75;
    
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const unallocatedJobs = getUnallocatedJobsForDate(dateStr);
    const hasUnallocated = unallocatedJobs.length > 0;
    const unallocatedEFinks = unallocatedJobs.reduce((sum: number, j: Job) => sum + (j.segmentEfinks ?? j.estimatedEFinks), 0);

    return (
      <Stack
        key={`day-${dateStr}`}
        styles={{
          root: {
            border: '2px solid #ddd',
            borderRadius: 4,
            backgroundColor: isWeekend ? '#e8e8e8' : 'white',
            opacity: isWeekend ? 0.7 : 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0
          }
        }}
      >
        <Stack
          horizontal
          horizontalAlign="space-between"
          onClick={() => onDayClick(dateStr)}
          styles={{
            root: {
              padding: '10px 15px',
              backgroundColor: isWeekend ? '#999' : '#0078d4',
              color: 'white',
              cursor: 'pointer',
              flexShrink: 0,
              ':hover': {
                opacity: 0.9
              }
            }
          }}
        >
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 6 }}>
            <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
              {formatDate(dateStr)}
            </Text>
            {(isFullyBooked || isNearlyFull) && (
              <Text 
                variant="medium" 
                styles={{ 
                  root: { 
                    color: 'rgba(255,255,255,0.8)', 
                    fontWeight: 600
                  } 
                }}
                title={isFullyBooked ? 'Fully booked (≥90%)' : 'Nearly full (≥75%)'}
              >
                !
              </Text>
            )}
          </Stack>
          <Text variant="small" styles={{ root: { color: 'white', fontWeight: 600 } }}>
            {totalEFinks} E-Finks
          </Text>
        </Stack>

        <div 
          onDragOver={onDragOver}
          onDrop={() => onDrop(dateStr, null)}
          style={{ 
            display: 'flex', 
            gap: 1, 
            backgroundColor: '#ddd',
            padding: 1,
            flex: 1
          }}
        >
          {hasUnallocated && (
            <Stack
              onDragOver={onDragOver}
              onDrop={(e) => { e.stopPropagation(); onDrop(dateStr, null); }}
              styles={{
                root: {
                  backgroundColor: '#ffebee',
                  padding: 8,
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden'
                }
              }}
            >
              <Text variant="small" block styles={{ root: { fontWeight: 600, color: '#c62828', marginBottom: 8 } }}>
                Unallocated ({unallocatedEFinks})
              </Text>
              <Stack tokens={{ childrenGap: 6 }}>
                {unallocatedJobs.map(job => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={() => onDragStart(job.id)}
                    onDoubleClick={() => onJobDoubleClick(job.id)}
                    style={{
                      padding: 6,
                      background: job.productionComplete 
                        ? 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))' 
                        : 'linear-gradient(135deg, rgba(198, 40, 40, 0.85), rgba(160, 30, 30, 0.75))',
                      borderRadius: 6,
                      border: job.productionComplete ? '1px solid rgba(180, 180, 180, 0.6)' : '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'grab',
                      boxShadow: job.productionComplete 
                        ? '0 2px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3)' 
                        : '0 2px 8px rgba(198, 40, 40, 0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
                      opacity: job.productionComplete ? 0.8 : 1
                    }}
                  >
                    <Text variant="tiny" block styles={{ root: { fontWeight: 600, wordBreak: 'break-word', color: 'white' } }}>
                      {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (Rollover)' : ''}{job.productionComplete ? ' (Complete)' : ''}
                    </Text>
                    <Text variant="tiny" block styles={{ root: { wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)' } }}>
                      {job.customer}
                    </Text>
                    {job.name && !job.name.includes('(Rollover)') && !job.name.includes('(Roll Over)') && (
                      <Text variant="tiny" block styles={{ root: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontStyle: 'italic' } }}>
                        {job.name}
                      </Text>
                    )}
                    <Text variant="tiny" block styles={{ root: { color: 'rgba(255,255,255,0.8)' } }}>
                      {job.estimatedEFinks} E-Finks
                    </Text>
                  </div>
                ))}
              </Stack>
            </Stack>
          )}

          {jigTeams.map(jigInfo => {
            const jigJobs = getJobsForDateAndJig(dateStr, jigInfo.id);
            const jigEFinks = jigJobs.reduce((sum, j) => sum + (j.segmentEfinks ?? j.estimatedEFinks), 0);
            const jigUtilization = (jigEFinks / 90) * 100;
            const jigFullyBooked = jigUtilization >= 90;
            const jigNearlyFull = jigUtilization >= 75;

            return (
              <Stack
                key={jigInfo.id}
                onDragOver={onDragOver}
                onDrop={(e) => { e.stopPropagation(); onDrop(dateStr, jigInfo.id); }}
                styles={{
                  root: {
                    backgroundColor: '#faf9f8',
                    padding: 8,
                    flex: 1,
                    minWidth: 0,
                    overflow: 'hidden'
                  }
                }}
              >
                <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
                  <Text 
                    variant="small" 
                    block 
                    onDoubleClick={() => onTeamDoubleClick(jigInfo.id)}
                    styles={{ root: { fontWeight: 600, color: '#323130', marginBottom: 8, cursor: 'pointer' } }}
                  >
                    {jigInfo.name} ({jigEFinks})
                  </Text>
                  {(jigFullyBooked || jigNearlyFull) && (
                    <Text 
                      variant="small" 
                      styles={{ 
                        root: { 
                          color: '#666', 
                          fontWeight: 600,
                          marginBottom: 8
                        } 
                      }}
                      title={jigFullyBooked ? 'Fully booked (≥90%)' : 'Nearly full (≥75%)'}
                    >
                      !
                    </Text>
                  )}
                </Stack>
                <Stack tokens={{ childrenGap: 6 }}>
                  {jigJobs.map((job, idx) => {
                    // Only show Day X/Y for jobs with actual WIP multi-day allocation
                    const isMultiDay = job.wipId && job.totalSegments && job.totalSegments > 1;
                    const displayEfinks = job.segmentEfinks ?? job.estimatedEFinks;
                    
                    return (
                      <div
                        key={`${job.id}-${job.plannedDateStr}-${idx}`}
                        draggable
                        onDragStart={() => onDragStart(job.id)}
                        onDoubleClick={() => onJobDoubleClick(job.id)}
                        style={{
                          padding: 6,
                          background: job.productionComplete 
                            ? 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))' 
                            : 'linear-gradient(135deg, rgba(0, 120, 212, 0.85), rgba(0, 90, 180, 0.75))',
                          borderRadius: 6,
                          border: job.productionComplete ? '1px solid rgba(180, 180, 180, 0.6)' : '1px solid rgba(255, 255, 255, 0.3)',
                          cursor: 'grab',
                          boxShadow: job.productionComplete 
                            ? '0 2px 6px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.3)' 
                            : '0 2px 8px rgba(0, 120, 212, 0.3), inset 0 1px 0 rgba(255,255,255,0.25)',
                          opacity: job.productionComplete ? 0.8 : 1
                        }}
                      >
                        <Stack horizontal horizontalAlign="space-between" verticalAlign="start">
                          <Text variant="tiny" styles={{ root: { fontWeight: 600, wordBreak: 'break-word', color: 'white' } }}>
                            {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (Rollover)' : ''}{job.productionComplete ? ' (Complete)' : ''}
                          </Text>
                          {isMultiDay && (
                            <Text variant="tiny" styles={{ 
                              root: { 
                                backgroundColor: 'rgba(255, 140, 0, 0.9)',
                                color: 'white',
                                padding: '1px 4px',
                                borderRadius: 3,
                                fontSize: 9,
                                fontWeight: 600,
                                marginLeft: 4,
                                whiteSpace: 'nowrap'
                              } 
                            }}>
                              Day {(job.segmentIndex ?? 0) + 1}/{job.totalSegments}
                            </Text>
                          )}
                        </Stack>
                        <Text variant="tiny" block styles={{ root: { wordBreak: 'break-word', color: 'rgba(255,255,255,0.9)' } }}>
                          {job.customer}
                        </Text>
                        {job.name && !job.name.includes('(Rollover)') && !job.name.includes('(Roll Over)') && (
                          <Text variant="tiny" block styles={{ root: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontStyle: 'italic' } }}>
                            {job.name}
                          </Text>
                        )}
                        <Text variant="tiny" block styles={{ root: { color: 'rgba(255,255,255,0.8)' } }}>
                          {isMultiDay
                            ? `${displayEfinks.toFixed(1)} E-Finks (${job.estimatedEFinks} total)`
                            : `${displayEfinks} E-Finks`
                          }
                        </Text>
                      </div>
                    );
                  })}
                </Stack>
              </Stack>
            );
          })}
        </div>
      </Stack>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '0 12px 12px 0'
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12
        }}
      >
        {row1Days.map(dateStr => renderDayCard(dateStr))}
      </div>
      
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12
        }}
      >
        {row2Days.map(dateStr => renderDayCard(dateStr))}
      </div>

      {row3Days.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12
          }}
        >
          {row3Days.map(dateStr => renderDayCard(dateStr))}
        </div>
      )}
    </div>
  );
};

export const WeekView = memo(WeekViewComponent);
