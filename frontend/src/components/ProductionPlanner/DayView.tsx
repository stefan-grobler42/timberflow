import { Stack, Text, Spinner } from '@fluentui/react';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  customDurationMinutes?: number;
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

interface BreakAddition {
  label: string;
  minutes: number;
}

interface JobPositionInfo {
  job: Job;
  top: number;
  height: number;
  baseHeight: number;
  breakAdditions: BreakAddition[];
  totalBreakMinutes: number;
}

interface DayViewProps {
  dayStr: string;
  jobs: Job[];
  jigTeams: Jig[];
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string, jigId: string | null) => void;
  onJobDoubleClick: (jobId: string) => void;
  onJobDurationChange?: (jobId: string, durationMinutes: number) => void;
}

const MINUTES_PER_EFINK = 6.5625;
const PIXELS_PER_MINUTE = 1;
const HOURS_IN_DAY = 24;
const MIN_BLOCK_HEIGHT = 20;

export const DayView: React.FC<DayViewProps> = ({
  dayStr,
  jobs,
  jigTeams,
  onDragStart,
  onDragOver,
  onDrop,
  onJobDoubleClick,
  onJobDurationChange
}) => {
  const [workingHours, setWorkingHours] = useState<{ start: number; end: number } | null>(null);
  const [breakSlots, setBreakSlots] = useState<BreakSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [customDurations, setCustomDurations] = useState<Record<string, number>>({});
  const [resizingJob, setResizingJob] = useState<string | null>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const currentResizeDuration = useRef<number>(0);

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
      
      const factoryHours = settings.workingHours?.factoryStaff?.[dayName];
      
      if (factoryHours) {
        const [start, end] = factoryHours.split('-');
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        setWorkingHours({ start: startHour, end: endHour });
      } else if (weekend && settings.breakTimes?.weekendOvertime) {
        const startTime = parseTime(settings.breakTimes.weekendOvertime.workingHoursStart);
        const endTime = parseTime(settings.breakTimes.weekendOvertime.workingHoursEnd);
        setWorkingHours({ start: startTime.hour, end: endTime.hour });
      } else {
        setWorkingHours({ start: 7, end: 17 });
      }

      const breaks: BreakSlot[] = [];
      const breakTimes = settings.breakTimes;

      if (weekend && breakTimes?.weekendOvertime) {
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

  const getBreakDurationMinutes = (breakSlot: BreakSlot): number => {
    const startMinutes = breakSlot.startHour * 60 + breakSlot.startMinute;
    const endMinutes = breakSlot.endHour * 60 + breakSlot.endMinute;
    return endMinutes - startMinutes;
  };

  const getBreakStartMinutes = (breakSlot: BreakSlot): number => {
    return breakSlot.startHour * 60 + breakSlot.startMinute;
  };

  const calculateBreaksSpanned = (jobStartMinutes: number, baseDurationMinutes: number): BreakAddition[] => {
    const additions: BreakAddition[] = [];
    let currentTime = jobStartMinutes;
    let remainingWork = baseDurationMinutes;

    while (remainingWork > 0) {
      let nextBreak: BreakSlot | null = null;
      let nextBreakStart = Infinity;

      for (const breakSlot of breakSlots) {
        const breakStart = getBreakStartMinutes(breakSlot);
        if (breakStart > currentTime && breakStart < nextBreakStart) {
          nextBreak = breakSlot;
          nextBreakStart = breakStart;
        }
      }

      if (nextBreak && nextBreakStart < currentTime + remainingWork) {
        const workBeforeBreak = nextBreakStart - currentTime;
        remainingWork -= workBeforeBreak;
        const breakDuration = getBreakDurationMinutes(nextBreak);
        additions.push({
          label: nextBreak.label.replace(' (OT)', ''),
          minutes: breakDuration
        });
        currentTime = nextBreakStart + breakDuration;
      } else {
        remainingWork = 0;
      }
    }

    return additions;
  };

  const getJobDurationMinutes = useCallback((job: Job): number => {
    if (customDurations[job.id]) {
      return customDurations[job.id];
    }
    if (job.customDurationMinutes) {
      return job.customDurationMinutes;
    }
    return Math.max(MIN_BLOCK_HEIGHT, Math.round(job.estimatedEFinks * MINUTES_PER_EFINK));
  }, [customDurations]);

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

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const handleResizeStart = (e: React.MouseEvent, jobId: string, currentHeight: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingJob(jobId);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = currentHeight;
    currentResizeDuration.current = Math.round(currentHeight / PIXELS_PER_MINUTE);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - resizeStartY.current;
      const newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartHeight.current + delta);
      const newDuration = Math.round(newHeight / PIXELS_PER_MINUTE);
      currentResizeDuration.current = newDuration;
      setCustomDurations(prev => ({ ...prev, [jobId]: newDuration }));
    };

    const handleMouseUp = () => {
      setResizingJob(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const finalDuration = currentResizeDuration.current;
      if (finalDuration > 0 && onJobDurationChange) {
        onJobDurationChange(jobId, finalDuration);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getWorkingHoursOffset = (): number => {
    if (!workingHours) return 7 * 60;
    return workingHours.start * 60;
  };

  const getBaseDurationMinutes = (job: Job): number => {
    if (customDurations[job.id]) {
      return customDurations[job.id];
    }
    if (job.customDurationMinutes) {
      return job.customDurationMinutes;
    }
    return Math.max(MIN_BLOCK_HEIGHT, Math.round(job.estimatedEFinks * MINUTES_PER_EFINK));
  };

  const roundUpToNextHour = (minutes: number): number => {
    return Math.ceil(minutes / 60) * 60;
  };

  const getNextAvailableStartTime = (jobEndMinutes: number): number => {
    let nextStart = roundUpToNextHour(jobEndMinutes);
    
    for (const breakSlot of breakSlots) {
      const breakStart = getBreakStartMinutes(breakSlot);
      const breakEnd = breakSlot.endHour * 60 + breakSlot.endMinute;
      
      if (nextStart >= breakStart && nextStart < breakEnd) {
        nextStart = roundUpToNextHour(breakEnd);
      }
    }
    
    return nextStart;
  };

  const calculateJobPositions = (jigJobs: Job[], includeBreaks: boolean = true): JobPositionInfo[] => {
    const positions: JobPositionInfo[] = [];
    const workingHoursOffset = includeBreaks ? getWorkingHoursOffset() : 0;
    let currentTop = workingHoursOffset;

    for (let i = 0; i < jigJobs.length; i++) {
      const job = jigJobs[i];
      const baseDuration = getBaseDurationMinutes(job);
      const baseHeight = Math.max(MIN_BLOCK_HEIGHT, baseDuration * PIXELS_PER_MINUTE);
      
      let breakAdditions: BreakAddition[] = [];
      let totalBreakMinutes = 0;
      
      if (includeBreaks) {
        breakAdditions = calculateBreaksSpanned(currentTop, baseDuration);
        totalBreakMinutes = breakAdditions.reduce((sum, b) => sum + b.minutes, 0);
      }
      
      const totalHeight = baseHeight + (totalBreakMinutes * PIXELS_PER_MINUTE);
      
      positions.push({ 
        job, 
        top: currentTop, 
        height: totalHeight,
        baseHeight,
        breakAdditions,
        totalBreakMinutes
      });
      
      if (includeBreaks) {
        const jobEndMinutes = currentTop + baseDuration + totalBreakMinutes;
        currentTop = getNextAvailableStartTime(jobEndMinutes);
      } else {
        currentTop += baseHeight + 4;
      }
    }

    return positions;
  };

  const formatBreakAdditions = (breakAdditions: BreakAddition[]): string => {
    if (breakAdditions.length === 0) return '';
    
    const totalMinutes = breakAdditions.reduce((sum, b) => sum + b.minutes, 0);
    const labels = breakAdditions.map(b => b.label);
    
    if (labels.length === 1) {
      return `+${totalMinutes}m (${labels[0]})`;
    } else {
      return `+${totalMinutes}m (${labels.join(' + ')})`;
    }
  };

  interface TimelineSegment {
    startMinutes: number;
    durationMinutes: number;
    label: string;
    isBreak: boolean;
    isWorking: boolean;
    backgroundColor: string;
    breakSlot?: BreakSlot;
  }

  const generateTimelineSegments = (): TimelineSegment[] => {
    const segments: TimelineSegment[] = [];
    const sortedBreaks = [...breakSlots].sort((a, b) => 
      (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute)
    );
    
    const totalMinutes = HOURS_IN_DAY * 60;
    let currentMinute = 0;
    
    while (currentMinute < totalMinutes) {
      const breakAtThisPoint = sortedBreaks.find(b => {
        const breakStart = b.startHour * 60 + b.startMinute;
        return currentMinute === breakStart;
      });
      
      if (breakAtThisPoint) {
        const breakDuration = getBreakDurationMinutes(breakAtThisPoint);
        const hour = Math.floor(currentMinute / 60);
        const minute = currentMinute % 60;
        
        segments.push({
          startMinutes: currentMinute,
          durationMinutes: breakDuration,
          label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${breakAtThisPoint.label}`,
          isBreak: true,
          isWorking: true,
          backgroundColor: breakAtThisPoint.color,
          breakSlot: breakAtThisPoint
        });
        
        currentMinute += breakDuration;
        continue;
      }
      
      let segmentEnd = totalMinutes;
      
      for (const b of sortedBreaks) {
        const breakStart = b.startHour * 60 + b.startMinute;
        if (breakStart > currentMinute && breakStart < segmentEnd) {
          segmentEnd = breakStart;
        }
      }
      
      const nextHourBoundary = (Math.floor(currentMinute / 60) + 1) * 60;
      if (nextHourBoundary < segmentEnd) {
        segmentEnd = nextHourBoundary;
      }
      
      const segmentDuration = segmentEnd - currentMinute;
      const hour = Math.floor(currentMinute / 60);
      const minute = currentMinute % 60;
      const isWorking = workingHours ? (hour >= workingHours.start && hour < workingHours.end) : false;
      
      segments.push({
        startMinutes: currentMinute,
        durationMinutes: segmentDuration,
        label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        isBreak: false,
        isWorking,
        backgroundColor: isWorking ? 'white' : 'rgba(0, 0, 0, 0.06)'
      });
      
      currentMinute = segmentEnd;
    }
    
    return segments;
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

  const timelineSegments = generateTimelineSegments();
  const totalTimelineHeight = HOURS_IN_DAY * 60 * PIXELS_PER_MINUTE;

  return (
    <Stack styles={{ root: { padding: 20 } }}>
      <Stack horizontal verticalAlign="center" styles={{ root: { marginBottom: 20 } }}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600, marginRight: 20 } }}>
          {formatDate(dayStr)}
        </Text>
        <Text variant="small" styles={{ root: { color: '#666', backgroundColor: '#f3f2f1', padding: '4px 8px', borderRadius: 4 } }}>
          80 E-Finks = 8h 45m (standard day) | Drag bottom edge to resize blocks
        </Text>
      </Stack>

      <div style={{ display: 'flex', overflowX: 'auto' }}>
        {/* Time header column */}
        <Stack styles={{ root: { width: 100, flexShrink: 0, borderRight: '1px solid #ddd' } }}>
          <div style={{ height: 50, borderBottom: '1px solid #ddd' }}></div>
          <div style={{ position: 'relative', height: totalTimelineHeight }}>
            {timelineSegments.map((segment, idx) => (
              <Stack
                key={`time-${idx}-${segment.startMinutes}`}
                styles={{
                  root: {
                    position: 'absolute',
                    top: segment.startMinutes * PIXELS_PER_MINUTE,
                    left: 0,
                    right: 0,
                    height: segment.durationMinutes * PIXELS_PER_MINUTE,
                    borderBottom: '1px solid #ddd',
                    padding: '4px 10px',
                    backgroundColor: segment.backgroundColor,
                    opacity: segment.isWorking || segment.isBreak ? 1 : 0.7,
                    boxSizing: 'border-box'
                  }
                }}
              >
                <Text variant="small" styles={{ root: { fontWeight: 600, color: segment.isWorking || segment.isBreak ? '#333' : '#888' } }}>
                  {segment.label}
                </Text>
                {segment.isBreak && segment.breakSlot && (
                  <Text variant="tiny" styles={{ root: { color: '#666', fontStyle: 'italic' } }}>
                    {segment.breakSlot.label} ({segment.durationMinutes}m)
                  </Text>
                )}
                {!segment.isWorking && !segment.isBreak && (
                  <Text variant="tiny" styles={{ root: { color: '#999', fontStyle: 'italic' } }}>
                    Non-working
                  </Text>
                )}
              </Stack>
            ))}
          </div>
        </Stack>

        {/* Unallocated column */}
        {hasUnallocatedJobs() && (
          <Stack styles={{ root: { minWidth: 200, borderRight: '1px solid #ddd' } }}>
            <Stack
              horizontal
              horizontalAlign="space-between"
              verticalAlign="center"
              styles={{
                root: {
                  height: 50,
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

            <div
              onDragOver={onDragOver}
              onDrop={() => onDrop(dayStr, null)}
              style={{
                height: totalTimelineHeight,
                backgroundColor: '#fff0f0',
                borderBottom: '1px solid #ddd',
                padding: 8,
                position: 'relative',
                overflowY: 'auto'
              }}
            >
              {calculateJobPositions(getUnallocatedJobsForDate(dayStr), false).map(({ job, top, baseHeight }) => (
                <div
                  key={job.id}
                  draggable
                  onDragStart={() => onDragStart(job.id)}
                  onDoubleClick={() => onJobDoubleClick(job.id)}
                  style={{
                    position: 'absolute',
                    top: top,
                    left: 4,
                    right: 4,
                    height: baseHeight,
                    padding: 8,
                    backgroundColor: job.productionComplete ? 'rgba(224, 224, 224, 0.9)' : '#d13438',
                    color: 'white',
                    borderRadius: 4,
                    border: '2px solid #a4262c',
                    cursor: 'grab',
                    zIndex: resizingJob === job.id ? 100 : 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    opacity: job.productionComplete ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}
                >
                  <Text variant="small" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                    {job.orderNumber}
                  </Text>
                  <Text variant="tiny" styles={{ root: { color: 'white' } }}>
                    {job.customer}
                  </Text>
                  <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.8)', fontWeight: 600 } }}>
                    {job.estimatedEFinks} E-Finks ({formatDuration(getBaseDurationMinutes(job))})
                  </Text>
                  {/* Resize handle */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, job.id, baseHeight)}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 8,
                      cursor: 'ns-resize',
                      backgroundColor: resizingJob === job.id ? 'rgba(255,255,255,0.5)' : 'transparent'
                    }}
                    title="Drag to resize"
                  />
                </div>
              ))}
            </div>
          </Stack>
        )}

        {/* Jig team columns */}
        {jigTeams.map(jig => {
          const jigJobs = getJobsForDateAndJig(dayStr, jig.id);
          const jigEFinks = jigJobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);
          const totalMinutes = jigJobs.reduce((sum, j) => sum + getJobDurationMinutes(j), 0);

          return (
            <Stack key={jig.id} styles={{ root: { minWidth: 220, borderRight: '1px solid #ddd' } }}>
              {/* Jig header */}
              <Stack
                styles={{
                  root: {
                    height: 50,
                    padding: '8px 15px',
                    backgroundColor: '#0078d4',
                    color: 'white',
                    borderBottom: '1px solid #ddd'
                  }
                }}
              >
                <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                  {jig.name}
                </Text>
                <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.8)' } }}>
                  {jigEFinks} E-Finks | {formatDuration(totalMinutes)}
                </Text>
              </Stack>

              {/* Timeline background with break slots */}
              <div
                onDragOver={onDragOver}
                onDrop={() => onDrop(dayStr, jig.id)}
                style={{
                  position: 'relative',
                  height: totalTimelineHeight,
                  borderBottom: '1px solid #ddd'
                }}
              >
                {/* Timeline segments background */}
                {timelineSegments.map((segment, idx) => (
                  <div
                    key={`${jig.id}-bg-${idx}-${segment.startMinutes}`}
                    style={{
                      position: 'absolute',
                      top: segment.startMinutes * PIXELS_PER_MINUTE,
                      left: 0,
                      right: 0,
                      height: segment.durationMinutes * PIXELS_PER_MINUTE,
                      borderBottom: segment.isWorking || segment.isBreak ? '1px solid #ddd' : '1px solid rgba(0,0,0,0.08)',
                      backgroundColor: segment.backgroundColor
                    }}
                  />
                ))}

                {/* Job blocks */}
                {calculateJobPositions(jigJobs, true).map(({ job, top, height, baseHeight, breakAdditions }) => (
                  <div
                    key={job.id}
                    draggable={!resizingJob}
                    onDragStart={() => !resizingJob && onDragStart(job.id)}
                    onDoubleClick={() => onJobDoubleClick(job.id)}
                    style={{
                      position: 'absolute',
                      top: top + 4,
                      left: 4,
                      right: 4,
                      height: height,
                      padding: 8,
                      backgroundColor: job.productionComplete ? 'rgba(224, 224, 224, 0.9)' : 'rgba(0, 120, 212, 0.95)',
                      color: job.productionComplete ? '#666' : 'white',
                      borderRadius: 4,
                      border: job.productionComplete ? '2px solid #c0c0c0' : '2px solid #0078d4',
                      cursor: resizingJob ? 'ns-resize' : 'grab',
                      zIndex: resizingJob === job.id ? 100 : 10,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      opacity: job.productionComplete ? 0.6 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600 } }}>
                      {job.orderNumber}
                    </Text>
                    <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'white' } }}>
                      {job.customer}
                    </Text>
                    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }} wrap>
                      <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.8)', fontWeight: 600 } }}>
                        {job.estimatedEFinks} E-Finks
                      </Text>
                      <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.7)' } }}>
                        ({formatDuration(getBaseDurationMinutes(job))})
                      </Text>
                      {breakAdditions.length > 0 && (
                        <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#b87333' : '#ffd700', fontWeight: 600 } }}>
                          {formatBreakAdditions(breakAdditions)}
                        </Text>
                      )}
                    </Stack>
                    {/* Resize handle */}
                    <div
                      onMouseDown={(e) => handleResizeStart(e, job.id, baseHeight)}
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 10,
                        cursor: 'ns-resize',
                        backgroundColor: resizingJob === job.id ? 'rgba(255,255,255,0.3)' : 'transparent',
                        borderTop: resizingJob === job.id ? '2px dashed rgba(255,255,255,0.5)' : 'none'
                      }}
                      title="Drag to resize"
                    >
                      <div style={{
                        position: 'absolute',
                        bottom: 2,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 30,
                        height: 3,
                        backgroundColor: 'rgba(255,255,255,0.4)',
                        borderRadius: 2
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </Stack>
          );
        })}
      </div>
    </Stack>
  );
};
