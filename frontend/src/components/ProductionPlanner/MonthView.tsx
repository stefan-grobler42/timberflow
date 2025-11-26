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

interface MonthViewProps {
  daysInView: string[];
  jobs: Job[];
  currentMonth: string;
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string) => void;
  onJobDoubleClick: (jobId: string) => void;
  onWeekClick: (weekStartDate: string) => void;
  onDayClick: (dateStr: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  daysInView,
  jobs,
  currentMonth,
  onDragStart,
  onDragOver,
  onDrop,
  onJobDoubleClick,
  onWeekClick,
  onDayClick
}) => {
  const currentMonthDate = new Date(currentMonth + 'T00:00:00Z');
  const currentMonthNum = currentMonthDate.getUTCMonth();
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

  const isCurrentMonth = (dateStr: string): boolean => {
    const date = new Date(dateStr + 'T00:00:00Z');
    return date.getUTCMonth() === currentMonthNum;
  };

  const getISOWeekNumber = (dateStr: string): number => {
    const date = new Date(dateStr + 'T00:00:00Z');
    const tempDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNum = tempDate.getUTCDay() || 7;
    tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNum;
  };

  const getMondayOfWeek = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00Z');
    const dayOfWeek = date.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setUTCDate(date.getUTCDate() + daysToMonday);
    return monday.toISOString().split('T')[0];
  };

  const groupDaysByWeek = () => {
    const weeks: string[][] = [];
    for (let i = 0; i < daysInView.length; i += 7) {
      weeks.push(daysInView.slice(i, i + 7));
    }
    return weeks;
  };

  const weeks = groupDaysByWeek();

  return (
    <Stack styles={{ root: { overflowY: 'auto', overflowX: 'hidden' } }}>
      {weeks.map((weekDays, weekIndex) => {
        const midWeekDay = weekDays[3] || weekDays[0];
        const weekNumber = getISOWeekNumber(midWeekDay);
        const weekMonday = getMondayOfWeek(midWeekDay);
        const weekTotalEFinks = weekDays.reduce((sum, dateStr) => sum + getTotalEFinksForDate(dateStr), 0);

        return (
          <Stack key={`week-${weekIndex}`} styles={{ root: { marginBottom: 20 } }}>
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
              onClick={() => onWeekClick(weekMonday)}
            >
              <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                Week {weekNumber}
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
                
                const date = new Date(dateStr + 'T00:00:00Z');
                const dayOfWeek = date.getUTCDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isOtherMonth = !isCurrentMonth(dateStr);

                return (
                  <Stack
                    key={dateStr}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(dateStr)}
                    styles={{
                      root: {
                        border: '2px solid #ddd',
                        borderRadius: 4,
                        backgroundColor: isOtherMonth ? '#f5f5f5' : (isWeekend ? '#e8e8e8' : 'white'),
                        overflow: 'hidden',
                        minHeight: 150,
                        opacity: isOtherMonth ? 0.5 : (isWeekend ? 0.7 : 1)
                      }
                    }}
                  >
                    <Stack
                      horizontal
                      horizontalAlign="space-between"
                      verticalAlign="center"
                      onClick={() => onDayClick(dateStr)}
                      styles={{
                        root: {
                          padding: '8px 10px',
                          backgroundColor: isOtherMonth ? '#bbb' : (isWeekend ? '#999' : '#0078d4'),
                          color: 'white',
                          cursor: 'pointer',
                          ':hover': {
                            backgroundColor: isOtherMonth ? '#999' : (isWeekend ? '#777' : '#106ebe')
                          }
                        }
                      }}
                    >
                      <Stack>
                        <Text variant="small" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                          {formatDate(dateStr)}
                        </Text>
                        <Text variant="tiny" styles={{ root: { color: 'white' } }}>
                          {totalEFinks} E-Finks
                        </Text>
                      </Stack>
                      {isFullyBooked && (
                        <Text styles={{ root: { color: '#ff4444', fontWeight: 700, fontSize: 16 } }}>!</Text>
                      )}
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
