import { Stack, Text, Spinner } from '@fluentui/react';
import { useState, useEffect } from 'react';
import { systemSettingsService, type SystemSettings } from '../../services/systemSettingsService';

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

interface BreakSlot {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  label: string;
  color: string;
}

interface DayViewProps {
  dayStr: string;
  jobs: Job[];
  jigTeams: Jig[];
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string, jigId: string | null) => void;
  onJobDoubleClick: (jobId: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  dayStr,
  jobs,
  jigTeams,
  onDragStart,
  onDragOver,
  onDrop,
  onJobDoubleClick
}) => {
  const [workingHours, setWorkingHours] = useState<{ start: number; end: number } | null>(null);
  const [breakSlots, setBreakSlots] = useState<BreakSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [dayStr]);

  const parseTime = (timeStr: string): { hour: number; minute: number } => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute: minute || 0 };
  };

  const loadSettings = async () => {
    try {
      const settings: SystemSettings = await systemSettingsService.getSettings();
      const date = new Date(dayStr);
      const dayOfWeek = date.getDay();
      const weekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek] as 
        'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
      
      // Use factory staff working hours as default
      const factoryHours = settings.workingHours?.factoryStaff?.[dayName];
      
      if (factoryHours) {
        const [start, end] = factoryHours.split('-');
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        setWorkingHours({ start: startHour, end: endHour });
      } else if (weekend && settings.breakTimes?.weekendOvertime) {
        // Weekend overtime hours
        const startTime = parseTime(settings.breakTimes.weekendOvertime.workingHoursStart);
        const endTime = parseTime(settings.breakTimes.weekendOvertime.workingHoursEnd);
        setWorkingHours({ start: startTime.hour, end: endTime.hour });
      } else {
        // Default to 07:00-17:00 if not set
        setWorkingHours({ start: 7, end: 17 });
      }

      // Build break slots based on day type
      const breaks: BreakSlot[] = [];
      const breakTimes = settings.breakTimes;

      if (weekend && breakTimes?.weekendOvertime) {
        // Weekend overtime: single lunch break
        const lunchStart = parseTime(breakTimes.weekendOvertime.lunchStart);
        const lunchEnd = parseTime(breakTimes.weekendOvertime.lunchEnd);
        breaks.push({
          startHour: lunchStart.hour,
          startMinute: lunchStart.minute,
          endHour: lunchEnd.hour,
          endMinute: lunchEnd.minute,
          label: 'Lunch',
          color: '#fff3cd'
        });
      } else if (breakTimes?.weekday) {
        // Weekday: tea and lunch breaks
        const teaStart = parseTime(breakTimes.weekday.teaStart);
        const teaEnd = parseTime(breakTimes.weekday.teaEnd);
        breaks.push({
          startHour: teaStart.hour,
          startMinute: teaStart.minute,
          endHour: teaEnd.hour,
          endMinute: teaEnd.minute,
          label: 'Tea',
          color: '#d4edda'
        });

        const lunchStart = parseTime(breakTimes.weekday.lunchStart);
        const lunchEnd = parseTime(breakTimes.weekday.lunchEnd);
        breaks.push({
          startHour: lunchStart.hour,
          startMinute: lunchStart.minute,
          endHour: lunchEnd.hour,
          endMinute: lunchEnd.minute,
          label: 'Lunch',
          color: '#fff3cd'
        });

        // Add dinner break for overtime (after 17:00)
        if (breakTimes.weekdayOvertime) {
          const dinnerStart = parseTime(breakTimes.weekdayOvertime.dinnerStart);
          const dinnerEnd = parseTime(breakTimes.weekdayOvertime.dinnerEnd);
          breaks.push({
            startHour: dinnerStart.hour,
            startMinute: dinnerStart.minute,
            endHour: dinnerEnd.hour,
            endMinute: dinnerEnd.minute,
            label: 'Dinner (OT)',
            color: '#f8d7da'
          });
        }
      }

      setBreakSlots(breaks);
      setLoading(false);
    } catch (err) {
      console.error('Error loading settings:', err);
      setWorkingHours({ start: 7, end: 17 });
      setBreakSlots([]);
      setLoading(false);
    }
  };

  const isBreakTime = (hour: number): BreakSlot | null => {
    for (const breakSlot of breakSlots) {
      if (hour >= breakSlot.startHour && hour < breakSlot.endHour) {
        return breakSlot;
      }
      // Handle partial hour (e.g., break starts at 9:00 and hour is 9)
      if (hour === breakSlot.startHour) {
        return breakSlot;
      }
    }
    return null;
  };

  const getJobsForDateAndJig = (dateStr: string, jigId: string) => {
    return jobs.filter(j => j.plannedDateStr === dateStr && j.jigId === jigId);
  };

  const getUnallocatedJobsForDate = (dateStr: string) => {
    return jobs.filter(j => j.plannedDateStr === dateStr && !j.jigId);
  };

  const hasUnallocatedJobs = (): boolean => {
    return getUnallocatedJobsForDate(dayStr).length > 0;
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <Stack verticalAlign="center" horizontalAlign="center" styles={{ root: { padding: 50 } }}>
        <Spinner label="Loading working hours..." />
      </Stack>
    );
  }

  if (!workingHours) {
    return <Text>Error loading working hours</Text>;
  }

  // Generate 12-hour timeline from 07:00 to 19:00
  const timelineHours = Array.from({ length: 12 }, (_, i) => i + 7);

  return (
    <Stack styles={{ root: { padding: 20 } }}>
      <Text variant="xLarge" styles={{ root: { marginBottom: 20, fontWeight: 600 } }}>
        {formatDate(dayStr)}
      </Text>

      <div style={{ display: 'flex', overflowX: 'auto' }}>
        {/* Time header column */}
        <Stack styles={{ root: { width: 100, flexShrink: 0, borderRight: '1px solid #ddd' } }}>
          <div style={{ height: 40, borderBottom: '1px solid #ddd' }}></div>
          {timelineHours.map(hour => {
            const breakSlot = isBreakTime(hour);
            return (
              <Stack
                key={`time-${hour}`}
                styles={{
                  root: {
                    height: 60,
                    borderBottom: '1px solid #ddd',
                    padding: '8px 10px',
                    backgroundColor: breakSlot ? breakSlot.color : '#faf9f8'
                  }
                }}
              >
                <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
                {breakSlot && (
                  <Text variant="tiny" styles={{ root: { color: '#666', fontStyle: 'italic' } }}>
                    {breakSlot.label}
                  </Text>
                )}
              </Stack>
            );
          })}
        </Stack>

        {/* Unallocated column (temporary - only shown when there are unallocated jobs) */}
        {hasUnallocatedJobs() && (
          <Stack styles={{ root: { minWidth: 200, borderRight: '1px solid #ddd' } }}>
            {/* Unallocated header */}
            <Stack
              horizontal
              horizontalAlign="space-between"
              verticalAlign="center"
              styles={{
                root: {
                  height: 40,
                  padding: '0 15px',
                  backgroundColor: '#d13438',
                  color: 'white',
                  borderBottom: '1px solid #ddd'
                }
              }}
            >
              <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                Unallocated
              </Text>
              <Text variant="small" styles={{ root: { color: 'white' } }}>
                {getUnallocatedJobsForDate(dayStr).reduce((sum, j) => sum + j.estimatedEFinks, 0)} E-Finks
              </Text>
            </Stack>

            {/* Timeline slots */}
            {timelineHours.map(hour => {
              const isWorkingHour = hour >= workingHours.start && hour < workingHours.end;
              const breakSlot = isBreakTime(hour);

              return (
                <Stack
                  key={`unallocated-${hour}`}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(dayStr, null)}
                  styles={{
                    root: {
                      height: 60,
                      borderBottom: '1px solid #ddd',
                      backgroundColor: breakSlot ? breakSlot.color : (isWorkingHour ? '#fff0f0' : '#e8d0d0'),
                      padding: 8,
                      position: 'relative'
                    }
                  }}
                >
                  {breakSlot && (
                    <Text variant="tiny" styles={{ root: { color: '#666', fontStyle: 'italic' } }}>
                      {breakSlot.label}
                    </Text>
                  )}
                  {!isWorkingHour && !breakSlot && (
                    <Text variant="tiny" styles={{ root: { color: '#999', fontStyle: 'italic' } }}>
                      Non-working
                    </Text>
                  )}
                </Stack>
              );
            })}

            {/* Overlay unallocated jobs on timeline */}
            <div style={{ position: 'relative', marginTop: -12 * 60 }}>
              {getUnallocatedJobsForDate(dayStr).map((job, index) => (
                <Stack
                  key={job.id}
                  draggable
                  onDragStart={() => onDragStart(job.id)}
                  onDoubleClick={() => onJobDoubleClick(job.id)}
                  styles={{
                    root: {
                      position: 'absolute',
                      top: workingHours.start * 60 + index * 80,
                      left: 8,
                      right: 8,
                      padding: 10,
                      backgroundColor: job.productionComplete ? 'rgba(224, 224, 224, 0.9)' : 'rgba(209, 52, 56, 0.9)',
                      color: job.productionComplete ? '#666' : 'white',
                      borderRadius: 4,
                      border: job.productionComplete ? '2px solid #c0c0c0' : '2px solid #d13438',
                      cursor: 'grab',
                      zIndex: 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      opacity: job.productionComplete ? 0.6 : 1
                    }
                  }}
                >
                  <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600 } }}>
                    {job.orderNumber}
                  </Text>
                  <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'white' } }}>
                    {job.customer}
                  </Text>
                  <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'white', fontWeight: 600 } }}>
                    {job.estimatedEFinks} E-Finks
                  </Text>
                </Stack>
              ))}
            </div>
          </Stack>
        )}

        {/* Jig team columns */}
        {jigTeams.map(jig => {
          const jigJobs = getJobsForDateAndJig(dayStr, jig.id);
          const jigEFinks = jigJobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);
          const jigUtilization = (jigEFinks / 90) * 100;
          const jigFullyBooked = jigUtilization >= 90;
          const jigNearlyFull = jigUtilization >= 75;

          return (
            <Stack key={jig.id} styles={{ root: { minWidth: 250, flex: 1, borderRight: '1px solid #ddd' } }}>
              {/* Team header */}
              <Stack
                horizontal
                horizontalAlign="space-between"
                verticalAlign="center"
                styles={{
                  root: {
                    height: 40,
                    padding: '0 15px',
                    backgroundColor: jigFullyBooked ? '#f3a32a' : jigNearlyFull ? '#ffaa44' : '#0078d4',
                    color: 'white',
                    borderBottom: '1px solid #ddd'
                  }
                }}
              >
                <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                  {jig.name}
                </Text>
                <Text variant="small" styles={{ root: { color: 'white' } }}>
                  {jigEFinks} / 90 E-Finks
                </Text>
              </Stack>

              {/* Timeline slots */}
              {timelineHours.map(hour => {
                const isWorkingHour = hour >= workingHours.start && hour < workingHours.end;
                const breakSlot = isBreakTime(hour);

                return (
                  <Stack
                    key={`${jig.id}-${hour}`}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(dayStr, jig.id)}
                    styles={{
                      root: {
                        height: 60,
                        borderBottom: '1px solid #ddd',
                        backgroundColor: breakSlot ? breakSlot.color : (isWorkingHour ? 'white' : '#e0e0e0'),
                        padding: 8,
                        position: 'relative'
                      }
                    }}
                  >
                    {breakSlot && (
                      <Text variant="tiny" styles={{ root: { color: '#666', fontStyle: 'italic' } }}>
                        {breakSlot.label}
                      </Text>
                    )}
                    {!isWorkingHour && !breakSlot && (
                      <Text variant="tiny" styles={{ root: { color: '#999', fontStyle: 'italic' } }}>
                        Non-working
                      </Text>
                    )}
                  </Stack>
                );
              })}

              {/* Overlay jobs on timeline */}
              <div style={{ position: 'relative', marginTop: -12 * 60 }}>
                {jigJobs.map((job, index) => (
                  <Stack
                    key={job.id}
                    draggable
                    onDragStart={() => onDragStart(job.id)}
                    onDoubleClick={() => onJobDoubleClick(job.id)}
                    styles={{
                      root: {
                        position: 'absolute',
                        top: workingHours.start * 60 + index * 80,
                        left: 8,
                        right: 8,
                        padding: 10,
                        backgroundColor: job.productionComplete ? 'rgba(224, 224, 224, 0.9)' : 'rgba(0, 120, 212, 0.9)',
                        color: job.productionComplete ? '#666' : 'white',
                        borderRadius: 4,
                        border: job.productionComplete ? '2px solid #c0c0c0' : '2px solid #0078d4',
                        cursor: 'grab',
                        zIndex: 10,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        opacity: job.productionComplete ? 0.6 : 1
                      }
                    }}
                  >
                    <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600 } }}>
                      {job.orderNumber}
                    </Text>
                    <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'white' } }}>
                      {job.customer}
                    </Text>
                    <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'white', fontWeight: 600 } }}>
                      {job.estimatedEFinks} E-Finks
                    </Text>
                  </Stack>
                ))}
              </div>
            </Stack>
          );
        })}
      </div>
    </Stack>
  );
};
