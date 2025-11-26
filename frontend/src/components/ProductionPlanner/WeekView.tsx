import { Stack, Text } from '@fluentui/react';

interface Job {
  id: string;
  name: string;
  orderNumber: string;
  customer: string;
  estimatedEFinks: number;
  plannedDateStr: string | null;
  jigId: string | null;
  productionComplete: boolean;
}

interface Jig {
  id: string;
  name: string;
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

export const WeekView: React.FC<WeekViewProps> = ({
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
  const getJobsForDateAndJig = (dateStr: string, jigId: string) => {
    return jobs.filter(j => j.plannedDateStr === dateStr && j.jigId === jigId);
  };

  const getUnallocatedJobsForDate = (dateStr: string) => {
    return jobs.filter(j => j.plannedDateStr === dateStr && !j.jigId);
  };

  const getTotalEFinksForDate = (dateStr: string): number => {
    return jobs
      .filter(j => j.plannedDateStr === dateStr)
      .reduce((sum, j) => sum + j.estimatedEFinks, 0);
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
    const capacity = 90 * jigTeams.length;
    const utilizationPercent = (totalEFinks / capacity) * 100;
    const isFullyBooked = utilizationPercent >= 90;
    const isNearlyFull = utilizationPercent >= 75;
    
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const unallocatedJobs = getUnallocatedJobsForDate(dateStr);
    const hasUnallocated = unallocatedJobs.length > 0;
    const unallocatedEFinks = unallocatedJobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);

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
                  <Stack
                    key={job.id}
                    draggable
                    onDragStart={() => onDragStart(job.id)}
                    onDoubleClick={() => onJobDoubleClick(job.id)}
                    styles={{
                      root: {
                        padding: 6,
                        backgroundColor: job.productionComplete ? '#e0e0e0' : 'white',
                        borderRadius: 3,
                        border: job.productionComplete ? '1px solid #c0c0c0' : '1px solid #e1dfdd',
                        cursor: 'grab',
                        boxSizing: 'border-box',
                        opacity: job.productionComplete ? 0.6 : 1
                      }
                    }}
                  >
                    <Text variant="tiny" block styles={{ root: { fontWeight: 600, wordBreak: 'break-word', color: job.productionComplete ? '#666' : '#000' } }}>
                      {job.orderNumber}
                    </Text>
                    <Text variant="tiny" block styles={{ root: { wordBreak: 'break-word', color: '#666' } }}>
                      {job.customer}
                    </Text>
                    <Text variant="tiny" block styles={{ root: { color: job.productionComplete ? '#999' : '#0078d4' } }}>
                      {job.estimatedEFinks} E-Finks
                    </Text>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )}

          {jigTeams.map(jigInfo => {
            const jigJobs = getJobsForDateAndJig(dateStr, jigInfo.id);
            const jigEFinks = jigJobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);
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
                  {jigJobs.map(job => (
                    <Stack
                      key={job.id}
                      draggable
                      onDragStart={() => onDragStart(job.id)}
                      onDoubleClick={() => onJobDoubleClick(job.id)}
                      styles={{
                        root: {
                          padding: 6,
                          backgroundColor: job.productionComplete ? '#e0e0e0' : 'white',
                          borderRadius: 3,
                          border: job.productionComplete ? '1px solid #c0c0c0' : '1px solid #e1dfdd',
                          cursor: 'grab',
                          boxSizing: 'border-box',
                          opacity: job.productionComplete ? 0.6 : 1
                        }
                      }}
                    >
                      <Text variant="tiny" block styles={{ root: { fontWeight: 600, wordBreak: 'break-word', color: job.productionComplete ? '#666' : '#000' } }}>
                        {job.orderNumber}
                      </Text>
                      <Text variant="tiny" block styles={{ root: { wordBreak: 'break-word', color: '#666' } }}>
                        {job.customer}
                      </Text>
                      <Text variant="tiny" block styles={{ root: { color: job.productionComplete ? '#999' : '#0078d4' } }}>
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
