import { Stack, Text } from '@fluentui/react';
import { startOfWeekUtc } from '../../utils/dateUtils';

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

interface MonthViewProps {
  daysInView: string[];
  jobs: Job[];
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string) => void;
  onJobDoubleClick: (jobId: string) => void;
  onWeekClick: (weekStartDate: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  daysInView,
  jobs,
  onDragStart,
  onDragOver,
  onDrop,
  onJobDoubleClick,
  onWeekClick
}) => {
  const getJobsForDate = (dateStr: string) => {
    return jobs.filter(j => j.plannedDateStr === dateStr);
  };

  const getTotalEFinksForDate = (dateStr: string): number => {
    return jobs
      .filter(j => j.plannedDateStr === dateStr)
      .reduce((sum, j) => sum + j.estimatedEFinks, 0);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00Z');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getUTCDay()]} ${date.getUTCDate()}`;
  };

  const getWeekNumber = (dateStr: string): number => {
    const date = new Date(dateStr + 'T00:00:00Z');
    const firstDayOfMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    const dayOfMonth = date.getUTCDate();
    const dayOfWeek = firstDayOfMonth.getUTCDay();
    return Math.ceil((dayOfMonth + dayOfWeek) / 7);
  };

  const getWeekStartDate = (dateStr: string): string => {
    return startOfWeekUtc(dateStr);
  };

  const groupDaysByWeek = () => {
    const weeks: { [key: number]: string[] } = {};
    daysInView.forEach(dateStr => {
      const weekNum = getWeekNumber(dateStr);
      if (!weeks[weekNum]) {
        weeks[weekNum] = [];
      }
      weeks[weekNum].push(dateStr);
    });
    return weeks;
  };

  const weeks = groupDaysByWeek();

  return (
    <Stack styles={{ root: { overflowY: 'auto', overflowX: 'hidden' } }}>
      {Object.keys(weeks).map(weekNum => {
        const weekDays = weeks[parseInt(weekNum)];
        // Use the first day shown in this week group for navigation
        // Don't use startOfWeekUtc as it can go back to previous month
        const firstDayInWeek = weekDays[0];
        const weekTotalEFinks = weekDays.reduce((sum, dateStr) => sum + getTotalEFinksForDate(dateStr), 0);

        return (
          <Stack key={`week-${weekNum}`} styles={{ root: { marginBottom: 20 } }}>
            <Stack
              horizontal
              horizontalAlign="space-between"
              verticalAlign="center"
              styles={{
                root: {
                  padding: '10px 15px',
                  backgroundColor: '#0078d4',
                  color: 'white',
                  cursor: 'pointer',
                  borderRadius: '4px 4px 0 0',
                  ':hover': {
                    backgroundColor: '#106ebe'
                  }
                }
              }}
              onClick={() => onWeekClick(firstDayInWeek)}
            >
              <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                Week {weekNum}
              </Text>
              <Text variant="small" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                {weekTotalEFinks} E-Finks
              </Text>
            </Stack>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 10,
                padding: 15,
                backgroundColor: '#f3f2f1',
                borderRadius: '0 0 4px 4px'
              }}
            >
              {weekDays.map(dateStr => {
                const dayJobs = getJobsForDate(dateStr);
                const totalEFinks = getTotalEFinksForDate(dateStr);
                const capacity = 90 * 3; // 3 teams
                const utilizationPercent = (totalEFinks / capacity) * 100;
                const isFullyBooked = utilizationPercent >= 90;
                const isNearlyFull = utilizationPercent >= 75;
                
                // Check if weekend (Saturday = 6, Sunday = 0)
                const date = new Date(dateStr + 'T00:00:00Z');
                const dayOfWeek = date.getUTCDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                return (
                  <Stack
                    key={dateStr}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(dateStr)}
                    styles={{
                      root: {
                        border: '2px solid #ddd',
                        borderRadius: 4,
                        backgroundColor: isWeekend ? '#e8e8e8' : (isFullyBooked ? '#fff4ce' : isNearlyFull ? '#fff9e6' : 'white'),
                        overflow: 'hidden',
                        minHeight: 150,
                        opacity: isWeekend ? 0.7 : 1
                      }
                    }}
                  >
                    <Stack
                      styles={{
                        root: {
                          padding: '8px 10px',
                          backgroundColor: isWeekend ? '#999' : (isFullyBooked ? '#f3a32a' : isNearlyFull ? '#ffaa44' : '#0078d4'),
                          color: 'white'
                        }
                      }}
                    >
                      <Text variant="small" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                        {formatDate(dateStr)}
                      </Text>
                      <Text variant="tiny" styles={{ root: { color: 'white' } }}>
                        {totalEFinks} E-Finks
                      </Text>
                    </Stack>

                    <Stack styles={{ root: { padding: 8, gap: 6, overflowY: 'auto', maxHeight: 200 } }}>
                      {dayJobs.map(job => (
                        <Stack
                          key={job.id}
                          draggable
                          onDragStart={() => onDragStart(job.id)}
                          onDoubleClick={() => onJobDoubleClick(job.id)}
                          styles={{
                            root: {
                              padding: 6,
                              backgroundColor: job.productionComplete ? '#e0e0e0' : '#f8f8f8',
                              borderRadius: 3,
                              border: job.productionComplete ? '1px solid #c0c0c0' : '1px solid #e1dfdd',
                              cursor: 'grab',
                              opacity: job.productionComplete ? 0.6 : 1,
                              ':hover': {
                                backgroundColor: job.productionComplete ? '#d0d0d0' : '#f0f0f0'
                              }
                            }
                          }}
                        >
                          <Text variant="tiny" block styles={{ root: { fontWeight: 600, color: job.productionComplete ? '#666' : '#000' } }}>
                            {job.orderNumber}
                          </Text>
                          <Text variant="tiny" block styles={{ root: { color: '#666' } }}>
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
      })}
    </Stack>
  );
};
