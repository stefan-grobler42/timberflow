import { Stack, Text } from '@fluentui/react';
import { useMemo, memo } from 'react';
import * as PlannerV2 from '../../domain/plannerV2';

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
}

interface ExpandedJob extends Job {
  segmentEfinks?: number;
  segmentIndex?: number;
  totalSegments?: number;
  isLastSegment?: boolean;
}

interface Jig {
  id: string;
  name: string;
  averageEfinks?: number;
}

interface MonthViewProps {
  daysInView: string[];
  jobs: Job[];
  jigTeams: Jig[];
  currentMonth: string;
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string) => void;
  onJobDoubleClick: (jobId: string) => void;
  onWeekClick: (weekStartDate: string) => void;
  onDayClick: (dateStr: string) => void;
}

const MonthViewComponent: React.FC<MonthViewProps> = ({
  daysInView,
  jobs,
  jigTeams,
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
  
  const expandedJobsByDate = useMemo(() => {
    return PlannerV2.expandJobsForDateRange(
      jobs as PlannerV2.JobForSegmentExpansion[],
      daysInView,
      jigTeams,
      {}
    );
  }, [jobs, daysInView, jigTeams]);

  const jobsByDate = useMemo(() => {
    const map = new Map<string, ExpandedJob[]>();
    
    for (const [dateStr, segments] of expandedJobsByDate) {
      const expandedJobs: ExpandedJob[] = segments.map(segment => ({
        ...segment,
        segmentEfinks: segment.segmentEfinks,
        segmentIndex: segment.segmentIndex,
        totalSegments: segment.totalSegments,
        isLastSegment: segment.isLastSegment
      } as ExpandedJob));
      map.set(dateStr, expandedJobs);
    }
    
    return map;
  }, [expandedJobsByDate]);

  const efinksByDate = useMemo(() => {
    const map = new Map<string, number>();
    
    for (const [dateStr, segments] of expandedJobsByDate) {
      let total = 0;
      for (const segment of segments) {
        total += segment.segmentEfinks;
      }
      map.set(dateStr, Math.round(total * 100) / 100);
    }
    
    return map;
  }, [expandedJobsByDate]);

  const getJobsForDate = (dateStr: string) => {
    return jobsByDate.get(dateStr) || [];
  };

  const getTotalEFinksForDate = (dateStr: string): number => {
    return efinksByDate.get(dateStr) || 0;
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
    <Stack>
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
                const capacity = jigTeams.reduce((sum, team) => sum + (team.averageEfinks || 80), 0);
                const utilizationPercent = capacity > 0 ? (totalEFinks / capacity) * 100 : 0;
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

                    <Stack styles={{ root: { padding: 8, gap: 6, maxHeight: 306, overflowY: 'auto' } }}>
                      {dayJobs.map(job => (
                        <div
                          key={job.id}
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
                            <Text variant="tiny" styles={{ root: { fontWeight: 600, color: 'white' } }}>
                              {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (Rollover)' : ''}{job.productionComplete ? ' (Complete)' : ''}
                            </Text>
                            {job.totalSegments && job.totalSegments > 1 && (
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
                          <Text variant="tiny" block styles={{ root: { color: 'rgba(255,255,255,0.9)' } }}>
                            {job.customer}
                          </Text>
                          <Text variant="tiny" block styles={{ root: { color: 'rgba(255,255,255,0.8)' } }}>
                            {job.segmentEfinks !== undefined 
                              ? `${job.segmentEfinks.toFixed(1)} E-Finks${job.totalSegments && job.totalSegments > 1 ? ` (${job.estimatedEFinks} total)` : ''}`
                              : `${job.estimatedEFinks} E-Finks`
                            }
                          </Text>
                        </div>
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

export const MonthView = memo(MonthViewComponent);
