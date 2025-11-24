import { Stack, Text } from '@fluentui/react';

interface Job {
  id: string;
  name: string;
  orderNumber: string;
  customer: string;
  estimatedEFinks: number;
  plannedDateStr: string | null;
  jigId: string | null;
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
}

export const WeekView: React.FC<WeekViewProps> = ({
  daysInView,
  jobs,
  jigTeams,
  onDragStart,
  onDragOver,
  onDrop,
  onJobDoubleClick,
  onDayClick
}) => {
  const getJobsForDateAndJig = (dateStr: string, jigId: string) => {
    return jobs.filter(j => j.plannedDateStr === dateStr && j.jigId === jigId);
  };

  const getUnallocatedJobsForDate = (dateStr: string) => {
    return jobs.filter(j => j.plannedDateStr === dateStr && !j.jigId);
  };

  const hasUnallocatedJobs = (dateStr: string): boolean => {
    return getUnallocatedJobsForDate(dateStr).length > 0;
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

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, minmax(250px, 1fr))',
        gap: 15,
        overflowX: 'auto'
      }}
    >
      {daysInView.map((dateStr) => {
        const totalEFinks = getTotalEFinksForDate(dateStr);
        const capacity = 90 * jigTeams.length;
        const utilizationPercent = (totalEFinks / capacity) * 100;
        const isFullyBooked = utilizationPercent >= 90;
        const isNearlyFull = utilizationPercent >= 75;

        return (
          <Stack
            key={`day-${dateStr}`}
            styles={{
              root: {
                border: '2px solid #ddd',
                borderRadius: 4,
                backgroundColor: 'white',
                overflow: 'hidden'
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
                  backgroundColor: isFullyBooked ? '#f3a32a' : isNearlyFull ? '#ffaa44' : '#0078d4',
                  color: 'white',
                  cursor: 'pointer',
                  ':hover': {
                    opacity: 0.9
                  }
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

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: hasUnallocatedJobs(dateStr) 
                ? `140px repeat(${jigTeams.length}, 1fr)` 
                : `repeat(${jigTeams.length}, 1fr)`, 
              gap: 1, 
              backgroundColor: '#ddd',
              padding: 1
            }}>
              {hasUnallocatedJobs(dateStr) && (
                <Stack
                  key="unallocated"
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(dateStr, null)}
                  styles={{
                    root: {
                      backgroundColor: '#fff0f0',
                      padding: 8,
                      minHeight: 150,
                      overflow: 'hidden',
                      borderLeft: '3px solid #d13438'
                    }
                  }}
                >
                  <Text variant="small" block styles={{ root: { fontWeight: 600, color: '#d13438', marginBottom: 8 } }}>
                    Unallocated ({getUnallocatedJobsForDate(dateStr).reduce((sum, j) => sum + j.estimatedEFinks, 0)})
                  </Text>
                  <Stack tokens={{ childrenGap: 6 }}>
                    {getUnallocatedJobsForDate(dateStr).map(job => (
                      <Stack
                        key={job.id}
                        draggable
                        onDragStart={() => onDragStart(job.id)}
                        onDoubleClick={() => onJobDoubleClick(job.id)}
                        styles={{
                          root: {
                            padding: 6,
                            backgroundColor: 'white',
                            borderRadius: 3,
                            border: '1px solid #ffc7ce',
                            cursor: 'grab',
                            boxSizing: 'border-box'
                          }
                        }}
                      >
                        <Text variant="tiny" block styles={{ root: { fontWeight: 600, wordBreak: 'break-word' } }}>
                          {job.orderNumber}
                        </Text>
                        <Text variant="tiny" block styles={{ root: { wordBreak: 'break-word' } }}>
                          {job.customer}
                        </Text>
                        <Text variant="tiny" block styles={{ root: { color: '#d13438' } }}>
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
                    onDrop={() => onDrop(dateStr, jigInfo.id)}
                    styles={{
                      root: {
                        backgroundColor: jigFullyBooked ? '#fff4ce' : jigNearlyFull ? '#fff9e6' : '#faf9f8',
                        padding: 8,
                        minHeight: 150,
                        overflow: 'hidden'
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
                          onDragStart={() => onDragStart(job.id)}
                          onDoubleClick={() => onJobDoubleClick(job.id)}
                          styles={{
                            root: {
                              padding: 6,
                              backgroundColor: 'white',
                              borderRadius: 3,
                              border: '1px solid #e1dfdd',
                              cursor: 'grab',
                              boxSizing: 'border-box'
                            }
                          }}
                        >
                          <Text variant="tiny" block styles={{ root: { fontWeight: 600, wordBreak: 'break-word' } }}>
                            {job.orderNumber}
                          </Text>
                          <Text variant="tiny" block styles={{ root: { wordBreak: 'break-word' } }}>
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
  );
};
