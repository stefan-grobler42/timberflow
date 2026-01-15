import { Stack, Text, Toggle, Dropdown, IconButton, Spinner } from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { useState, useCallback, useRef, useMemo, memo } from 'react';
import { useDayShiftConfig, type BreakSlot } from '../../contexts/ShiftConfigContext';
import type { ScheduleBlock, ScheduleBlockType } from '../../services/millenniumServices';
import * as PlannerV2 from '../../domain/plannerV2';

const SCHEDULE_BLOCK_COLORS: Record<ScheduleBlockType, string> = {
  PublicHoliday: '#B3E5FC',
  Breakdown: '#F28B82',
  Maintenance: '#C58AF9',
  MaterialShortage: '#FDD663',
  GeneralDelay: '#9AA0A6'
};

const SCHEDULE_BLOCK_LABELS: Record<ScheduleBlockType, string> = {
  PublicHoliday: 'Public Holiday',
  Breakdown: 'Breakdown',
  Maintenance: 'Maintenance',
  MaterialShortage: 'Material Shortage',
  GeneralDelay: 'General Delay'
};

const minutesToTimeString = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const timeStringToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
};

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
  createdOn?: string;
  plannedStartTime?: number | null;
  plannedEndTime?: number | null;
  plannedDurationMinutes?: number | null;
  breakAdjustmentMinutes?: number | null;
}

interface Jig {
  id: string;
  name: string;
  averageEfinks?: number;
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

interface TeamOvertimeSettings {
  enabled: boolean;
  closeTime: number;
}

interface DaySectionProps {
  dateStr: string;
  jobs: Job[];
  allJobs: Job[];
  jigTeams: Jig[];
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string, jigId: string | null, dropTimeMinutes?: number) => void;
  onJobDoubleClick: (jobId: string) => void;
  onJobClick?: (jobId: string) => void;
  onJobDurationChange?: (jobId: string, durationMinutes: number) => void;
  onJobDurationReset?: (jobId: string) => void;
  onTeamDoubleClick: (teamId: string) => void;
  globalStaging?: PlannerV2.StagingState;
  scheduleBlocks?: ScheduleBlock[];
  onBlockClick?: (block: ScheduleBlock) => void;
  isDragging?: boolean;
  earlyOtEnabled: boolean;
  lateOtEnabled: boolean;
  overtimeByTeam: Record<string, TeamOvertimeSettings>;
  onEarlyOtToggle: (enabled: boolean) => void;
  onLateOtToggle: (enabled: boolean) => void;
  onTeamOvertimeChange: (teamId: string, enabled: boolean, closeTime: number) => void;
}

const MIN_BLOCK_HEIGHT = 20;

const DaySectionComponent: React.FC<DaySectionProps> = ({
  dateStr,
  jobs,
  allJobs: _allJobs,
  jigTeams,
  onDragStart,
  onDragOver,
  onDrop,
  onJobDoubleClick,
  onJobClick,
  onJobDurationChange,
  onJobDurationReset,
  onTeamDoubleClick,
  globalStaging,
  scheduleBlocks = [],
  onBlockClick,
  isDragging = false,
  earlyOtEnabled,
  lateOtEnabled,
  overtimeByTeam = {},
  onEarlyOtToggle,
  onLateOtToggle,
  onTeamOvertimeChange
}) => {
  const shiftConfig = useDayShiftConfig(dateStr);
  
  const [customDurations, setCustomDurations] = useState<Record<string, number>>({});
  const [resizingJob, setResizingJob] = useState<string | null>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const currentResizeDuration = useRef<number>(0);
  const [dropHoverJigId, setDropHoverJigId] = useState<string | null>(null);
  const [dropHoverPosition, setDropHoverPosition] = useState<number | null>(null);

  const anyTeamHasOvertime = useMemo(() => {
    return lateOtEnabled || Object.values(overtimeByTeam).some(settings => settings.enabled);
  }, [lateOtEnabled, overtimeByTeam]);

  const isJobStaged = (jobId: string) => globalStaging ? PlannerV2.hasJobChanges(globalStaging, jobId) : false;
  const isPrimaryStaged = (jobId: string) => globalStaging?.primaryJobId === jobId;

  const baseWorkingHours = shiftConfig.workingHours;
  const workingHours = baseWorkingHours;
  const baseBreakSlots = shiftConfig.baseBreakSlots;
  const dinnerBreakSlot = shiftConfig.dinnerBreakSlot;
  const loading = shiftConfig.loading;

  const breakSlots = useMemo(() => {
    if (anyTeamHasOvertime && dinnerBreakSlot) {
      return [...baseBreakSlots, dinnerBreakSlot];
    }
    return baseBreakSlots;
  }, [anyTeamHasOvertime, baseBreakSlots, dinnerBreakSlot]);

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

  const hasManualResize = useCallback((job: Job): boolean => {
    // Check for staged changes first (e.g., Reset button clicked sets customDurationMinutes to null)
    if (globalStaging) {
      const stagedChange = globalStaging.stagedChanges.get(job.id);
      if (stagedChange && stagedChange.newValues.customDurationMinutes !== undefined) {
        // If staged customDurationMinutes is null, job is no longer manually resized
        return PlannerV2.isManuallyAltered({
          customDurationMinutes: stagedChange.newValues.customDurationMinutes,
          estimatedEFinks: job.estimatedEFinks
        });
      }
    }
    
    return PlannerV2.isManuallyAltered({
      customDurationMinutes: customDurations[job.id] ?? job.customDurationMinutes,
      estimatedEFinks: job.estimatedEFinks
    });
  }, [customDurations, globalStaging]);

  const getBaseDuration = useCallback((job: Job): number => {
    // First check local resize state (during active drag)
    if (customDurations[job.id]) {
      return PlannerV2.roundToQuarterHour(customDurations[job.id]);
    }
    
    // Check for staged changes (e.g., Reset button clicked but not yet saved)
    if (globalStaging) {
      const stagedChange = globalStaging.stagedChanges.get(job.id);
      if (stagedChange) {
        // If customDurationMinutes was staged (even as null), use staged plannedDurationMinutes
        if (stagedChange.newValues.customDurationMinutes !== undefined || 
            stagedChange.newValues.plannedDurationMinutes !== undefined) {
          const stagedDuration = stagedChange.newValues.plannedDurationMinutes;
          if (stagedDuration != null && stagedDuration > 0) {
            const breakAdjustment = stagedChange.newValues.breakAdjustmentMinutes ?? job.breakAdjustmentMinutes ?? 0;
            return stagedDuration - breakAdjustment;
          }
        }
      }
    }
    
    if (job.plannedDurationMinutes != null && job.plannedDurationMinutes > 0) {
      const breakAdjustment = job.breakAdjustmentMinutes || 0;
      return job.plannedDurationMinutes - breakAdjustment;
    }
    
    return PlannerV2.getJobDuration({
      customDurationMinutes: job.customDurationMinutes,
      estimatedEFinks: job.estimatedEFinks
    });
  }, [customDurations, globalStaging]);

  const jobsByJig = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs) {
      if (job.plannedDateStr === dateStr && job.jigId) {
        const existing = map.get(job.jigId) || [];
        existing.push(job);
        map.set(job.jigId, existing);
      }
    }
    return map;
  }, [jobs, dateStr]);

  const unallocatedJobs = useMemo(() => {
    return jobs.filter(j => j.plannedDateStr === dateStr && !j.jigId);
  }, [jobs, dateStr]);

  const isLastInChain = useCallback((_job: Job): boolean => {
    return true;
  }, []);

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
    currentResizeDuration.current = Math.round(currentHeight / PlannerV2.PIXELS_PER_MINUTE);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - resizeStartY.current;
      const newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartHeight.current + delta);
      const newDuration = PlannerV2.pixelsToDuration(newHeight);
      currentResizeDuration.current = newDuration;
      setCustomDurations(prev => ({ ...prev, [jobId]: newDuration }));
    };

    const handleMouseUp = () => {
      setResizingJob(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const finalDuration = currentResizeDuration.current;
      if (finalDuration > 0 && onJobDurationChange) {
        setCustomDurations(prev => {
          const next = { ...prev };
          delete next[jobId];
          return next;
        });
        onJobDurationChange(jobId, finalDuration);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const getWorkingHoursOffset = (): number => {
    if (!workingHours) return 7 * 60;
    let start = workingHours.start;
    if (earlyOtEnabled) start -= 1;
    return start * 60;
  };

  const getBaseDurationMinutes = (job: Job): number => {
    return getBaseDuration(job);
  };

  const calculateJobPositions = (jigJobs: Job[], includeBreaks: boolean = true): JobPositionInfo[] => {
    const positions: JobPositionInfo[] = [];
    const workingHoursOffset = includeBreaks ? getWorkingHoursOffset() : 0;
    
    for (const job of jigJobs) {
      const baseDuration = getBaseDurationMinutes(job);
      const baseHeight = Math.max(MIN_BLOCK_HEIGHT, PlannerV2.calculateJobHeight(baseDuration));
      
      const jobTop = job.plannedStartTime != null ? job.plannedStartTime : workingHoursOffset;
      
      let breakAdditions: BreakAddition[] = [];
      let totalBreakMinutes = 0;
      
      if (includeBreaks) {
        breakAdditions = calculateBreaksSpanned(jobTop, baseDuration);
        totalBreakMinutes = breakAdditions.reduce((sum, b) => sum + b.minutes, 0);
      }
      
      const totalHeight = baseHeight + PlannerV2.calculateJobHeight(totalBreakMinutes);
      
      positions.push({ 
        job, 
        top: jobTop, 
        height: totalHeight,
        baseHeight,
        breakAdditions,
        totalBreakMinutes
      });
    }

    positions.sort((a, b) => a.top - b.top);

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

  const handleTimelineDragOver = useCallback((e: React.DragEvent, jigId: string) => {
    e.preventDefault();
    setDropHoverJigId(jigId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minutes = Math.round(y / PlannerV2.PIXELS_PER_MINUTE);
    setDropHoverPosition(minutes);
  }, []);

  const handleTimelineDragLeave = useCallback(() => {
    setDropHoverJigId(null);
    setDropHoverPosition(null);
  }, []);

  const handleTimelineDrop = useCallback((e: React.DragEvent, jigId: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const rawMinutes = Math.round(y / PlannerV2.PIXELS_PER_MINUTE);
    const snappedMinutes = Math.round(rawMinutes / 15) * 15;
    
    setDropHoverJigId(null);
    setDropHoverPosition(null);
    onDrop(dateStr, jigId, snappedMinutes);
  }, [dateStr, onDrop]);

  if (loading) {
    return (
      <Stack 
        horizontalAlign="center" 
        verticalAlign="center" 
        styles={{ root: { height: 200, backgroundColor: '#f9f9f9', borderBottom: '1px solid #ddd' } }}
      >
        <Spinner label="Loading day settings..." />
      </Stack>
    );
  }

  if (!workingHours) {
    return null;
  }

  const dayOfWeek = new Date(dateStr).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isToday = dateStr === new Date().toISOString().split('T')[0];

  const visibleStart = (earlyOtEnabled ? workingHours.start - 1 : workingHours.start) - 1;
  const visibleEnd = (lateOtEnabled ? workingHours.end + 2 : workingHours.end) + 1;
  const totalTimelineHeight = (visibleEnd - visibleStart) * 60 * PlannerV2.PIXELS_PER_MINUTE;

  const totalEFinks = jobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);
  const totalMinutes = jobs.reduce((sum, j) => sum + getBaseDurationMinutes(j), 0);

  const overtimeOptions: IDropdownOption[] = [
    { key: '17:00', text: '5:00 PM' },
    { key: '17:30', text: '5:30 PM' },
    { key: '18:00', text: '6:00 PM' },
    { key: '18:30', text: '6:30 PM' },
    { key: '19:00', text: '7:00 PM' },
    { key: '19:30', text: '7:30 PM' },
    { key: '20:00', text: '8:00 PM' }
  ];

  return (
    <Stack styles={{ root: { borderBottom: '2px solid #ddd', backgroundColor: isWeekend ? '#f5f5f5' : 'white' } }}>
      <Stack 
        horizontal 
        horizontalAlign="space-between" 
        verticalAlign="center"
        styles={{ 
          root: { 
            height: 60,
            padding: '0 16px',
            backgroundColor: isToday ? '#e3f2fd' : (isWeekend ? '#e0e0e0' : '#0078d4'),
            borderBottom: '1px solid #ddd'
          } 
        }}
      >
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 16 }}>
          <Text 
            variant="large" 
            styles={{ 
              root: { 
                fontWeight: 600, 
                color: isToday ? '#0078d4' : (isWeekend ? '#333' : 'white')
              } 
            }}
          >
            {formatDate(dateStr)}
          </Text>
          {isToday && (
            <Text 
              variant="small" 
              styles={{ 
                root: { 
                  backgroundColor: '#0078d4', 
                  color: 'white', 
                  padding: '2px 8px', 
                  borderRadius: 4,
                  fontWeight: 600
                } 
              }}
            >
              TODAY
            </Text>
          )}
          <Text 
            variant="small" 
            styles={{ 
              root: { 
                color: isToday ? '#666' : (isWeekend ? '#666' : 'rgba(255,255,255,0.8)')
              } 
            }}
          >
            {jobs.length} jobs | {totalEFinks} E-Finks | {formatDuration(totalMinutes)}
          </Text>
        </Stack>
        
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 16 }}>
          <Toggle
            label="Early OT"
            inlineLabel
            checked={earlyOtEnabled}
            onChange={(_, checked) => onEarlyOtToggle(!!checked)}
            styles={{
              root: { marginBottom: 0 },
              label: { 
                color: isToday ? '#333' : (isWeekend ? '#333' : 'white'),
                fontSize: 12
              }
            }}
          />
          <Toggle
            label="Late OT"
            inlineLabel
            checked={lateOtEnabled}
            onChange={(_, checked) => onLateOtToggle(!!checked)}
            styles={{
              root: { marginBottom: 0 },
              label: { 
                color: isToday ? '#333' : (isWeekend ? '#333' : 'white'),
                fontSize: 12
              }
            }}
          />
        </Stack>
      </Stack>

      <Stack horizontal styles={{ root: { overflowX: 'auto' } }}>
        <Stack styles={{ root: { width: 50, flexShrink: 0, borderRight: '1px solid #ddd' } }}>
          <div style={{ height: 26 }}></div>
          <div style={{ height: 50 }}></div>
          <div style={{ position: 'relative', height: totalTimelineHeight }}>
            {Array.from({ length: visibleEnd - visibleStart + 1 }, (_, idx) => {
              const hour = visibleStart + idx;
              const minutes = hour * 60;
              return (
                <Text
                  key={`time-${hour}`}
                  variant="tiny"
                  styles={{
                    root: {
                      position: 'absolute',
                      top: (minutes - visibleStart * 60) * PlannerV2.PIXELS_PER_MINUTE - 6,
                      right: 4,
                      color: '#666',
                      fontSize: 10
                    }
                  }}
                >
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              );
            })}
          </div>
        </Stack>

        <div style={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
          {jigTeams.map(jig => {
            const jigJobs = jobsByJig.get(jig.id) || [];
            const teamOvertime = overtimeByTeam[jig.id] ?? { enabled: false, closeTime: 1140 };
            const jigEFinks = jigJobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);
            const teamTotalMinutes = jigJobs.reduce((sum, j) => sum + getBaseDurationMinutes(j), 0);

            return (
              <Stack
                key={jig.id}
                styles={{
                  root: {
                    width: 200,
                    flexShrink: 0,
                    borderRight: '1px solid #ddd'
                  }
                }}
              >
                <Stack 
                  horizontal 
                  horizontalAlign="space-between" 
                  verticalAlign="center"
                  styles={{ 
                    root: { 
                      height: 26, 
                      padding: '0 8px', 
                      backgroundColor: teamOvertime.enabled ? '#e8f5e9' : '#f5f5f5',
                      borderBottom: '1px solid #ccc'
                    } 
                  }}
                >
                  <Toggle
                    checked={teamOvertime.enabled}
                    onChange={(_, checked) => onTeamOvertimeChange(jig.id, !!checked, teamOvertime.closeTime)}
                    styles={{
                      root: { marginBottom: 0 },
                      pill: { width: 32, height: 14 },
                      thumb: { width: 10, height: 10 }
                    }}
                  />
                  {teamOvertime.enabled && (
                    <Dropdown
                      selectedKey={minutesToTimeString(teamOvertime.closeTime)}
                      options={overtimeOptions}
                      onChange={(_, option) => option && onTeamOvertimeChange(jig.id, true, timeStringToMinutes(option.key as string))}
                      styles={{
                        root: { width: 80 },
                        title: { fontSize: 10, padding: '1px 4px', height: 20, lineHeight: '18px' },
                        caretDown: { color: '#333', fontSize: 10 },
                        dropdown: { minWidth: 60 }
                      }}
                    />
                  )}
                </Stack>

                <Stack
                  onClick={() => onTeamDoubleClick(jig.id)}
                  styles={{
                    root: {
                      height: 50,
                      padding: '8px 12px',
                      backgroundColor: teamOvertime.enabled ? '#005a9e' : '#0078d4',
                      color: 'white',
                      borderBottom: '1px solid #ddd',
                      cursor: 'pointer'
                    }
                  }}
                >
                  <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                    {jig.name}
                  </Text>
                  <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.8)' } }}>
                    {jigEFinks} E-Finks | {formatDuration(teamTotalMinutes)}
                  </Text>
                </Stack>

                <div
                  onDragOver={(e) => handleTimelineDragOver(e, jig.id)}
                  onDragLeave={handleTimelineDragLeave}
                  onDrop={(e) => handleTimelineDrop(e, jig.id)}
                  style={{
                    position: 'relative',
                    height: totalTimelineHeight,
                    backgroundColor: isDragging && dropHoverJigId === jig.id ? 'rgba(0, 120, 212, 0.05)' : undefined
                  }}
                >
                  {Array.from({ length: visibleEnd - visibleStart + 1 }, (_, idx) => {
                    const hour = visibleStart + idx;
                    const minutes = hour * 60;
                    return (
                      <div
                        key={`${jig.id}-hour-${hour}`}
                        style={{
                          position: 'absolute',
                          top: (minutes - visibleStart * 60) * PlannerV2.PIXELS_PER_MINUTE,
                          left: 0,
                          right: 0,
                          height: 1,
                          backgroundColor: '#ccc',
                          zIndex: 1,
                          pointerEvents: 'none'
                        }}
                      />
                    );
                  })}

                  {breakSlots.map((breakSlot, idx) => {
                    const breakStartMinutes = breakSlot.startHour * 60 + breakSlot.startMinute;
                    const breakEndMinutes = breakSlot.endHour * 60 + breakSlot.endMinute;
                    const top = (breakStartMinutes - visibleStart * 60) * PlannerV2.PIXELS_PER_MINUTE;
                    const height = (breakEndMinutes - breakStartMinutes) * PlannerV2.PIXELS_PER_MINUTE;

                    return (
                      <div
                        key={`${jig.id}-break-${idx}`}
                        style={{
                          position: 'absolute',
                          top,
                          left: 0,
                          right: 0,
                          height,
                          backgroundColor: breakSlot.color,
                          zIndex: 0,
                          opacity: 0.5
                        }}
                      />
                    );
                  })}

                  {isDragging && dropHoverJigId === jig.id && dropHoverPosition !== null && (
                    <div
                      style={{
                        position: 'absolute',
                        top: dropHoverPosition * PlannerV2.PIXELS_PER_MINUTE - 2,
                        left: 4,
                        right: 4,
                        height: 4,
                        backgroundColor: '#0078d4',
                        borderRadius: 2,
                        zIndex: 500,
                        boxShadow: '0 0 8px rgba(0, 120, 212, 0.5)'
                      }}
                    />
                  )}

                  {scheduleBlocks
                    .filter(block => block.teamId === null || block.teamId === jig.id)
                    .map(block => {
                      const blockTop = (block.startTimeMinutes - visibleStart * 60) * PlannerV2.PIXELS_PER_MINUTE;
                      const blockHeight = (block.endTimeMinutes - block.startTimeMinutes) * PlannerV2.PIXELS_PER_MINUTE;
                      const blockColor = SCHEDULE_BLOCK_COLORS[block.blockType];
                      const blockLabel = SCHEDULE_BLOCK_LABELS[block.blockType];

                      return (
                        <div
                          key={`block-${block.id}`}
                          onClick={() => onBlockClick?.(block)}
                          style={{
                            position: 'absolute',
                            top: blockTop,
                            left: 2,
                            right: 2,
                            height: Math.max(blockHeight, 20),
                            backgroundColor: blockColor,
                            opacity: 0.85,
                            borderRadius: 4,
                            border: `1px solid ${blockColor}`,
                            cursor: onBlockClick ? 'pointer' : 'default',
                            zIndex: 5,
                            padding: '4px 6px',
                            overflow: 'hidden'
                          }}
                          title={`${blockLabel}${block.description ? `: ${block.description}` : ''}`}
                        >
                          <Text variant="tiny" styles={{ root: { fontWeight: 600, color: '#333' } }}>
                            {blockLabel}
                          </Text>
                        </div>
                      );
                    })}

                  {(() => {
                    return calculateJobPositions(jigJobs, true).map(({ job, top, height, baseHeight, breakAdditions }) => {
                      const adjustedTop = (top - visibleStart * 60) * PlannerV2.PIXELS_PER_MINUTE + 4;
                      const jobIsStaged = isJobStaged(job.id);
                      const jobIsPrimary = isPrimaryStaged(job.id);
                      
                      const getBackground = () => {
                        if (jobIsStaged) return 'linear-gradient(135deg, rgba(255, 185, 0, 0.95), rgba(200, 140, 0, 0.85))';
                        if (job.productionComplete) return 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))';
                        return 'linear-gradient(135deg, rgba(0, 120, 212, 0.85), rgba(0, 90, 180, 0.75))';
                      };

                      const getBorder = () => {
                        if (jobIsPrimary) return '3px solid #ffb900';
                        if (jobIsStaged) return '2px dashed #ffb900';
                        if (job.productionComplete) return '1px solid rgba(180, 180, 180, 0.6)';
                        return '1px solid rgba(255, 255, 255, 0.3)';
                      };

                      return (
                        <div
                          key={job.id}
                          draggable={!resizingJob}
                          onDragStart={() => !resizingJob && onDragStart(job.id)}
                          onDoubleClick={() => onJobDoubleClick(job.id)}
                          onClick={() => {
                            if (onJobClick && !job.productionComplete) {
                              onJobClick(job.id);
                            }
                          }}
                          style={{
                            position: 'absolute',
                            top: adjustedTop,
                            left: 4,
                            right: 4,
                            height: height,
                            padding: 8,
                            background: getBackground(),
                            color: jobIsStaged ? '#333' : (job.productionComplete ? '#555' : 'white'),
                            borderRadius: 6,
                            border: getBorder(),
                            cursor: resizingJob ? 'ns-resize' : 'grab',
                            zIndex: jobIsStaged ? 200 : (resizingJob === job.id ? 100 : 10),
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            opacity: job.productionComplete ? 0.7 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                          }}
                        >
                          {jobIsStaged && (
                            <div style={{
                              position: 'absolute',
                              top: 2,
                              left: 2,
                              backgroundColor: '#fff4ce',
                              color: '#996600',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 9,
                              fontWeight: 600,
                              zIndex: 300
                            }}>
                              {jobIsPrimary ? 'PRIMARY' : 'STAGED'}
                            </div>
                          )}
                          
                          {hasManualResize(job) && onJobDurationReset && !job.productionComplete && (
                            <IconButton
                              iconProps={{ iconName: 'Refresh' }}
                              title="Reset to calculated size"
                              ariaLabel="Reset to calculated size"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCustomDurations(prev => {
                                  const next = { ...prev };
                                  delete next[job.id];
                                  return next;
                                });
                                onJobDurationReset(job.id);
                              }}
                              styles={{
                                root: {
                                  position: 'absolute',
                                  top: 2,
                                  right: 2,
                                  width: 20,
                                  height: 20,
                                  minWidth: 20,
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  borderRadius: 4
                                },
                                icon: { fontSize: 10, color: 'white' },
                                rootHovered: { backgroundColor: 'rgba(255,255,255,0.4)' }
                              }}
                            />
                          )}

                          <Stack horizontal horizontalAlign="space-between" verticalAlign="start">
                            <Stack>
                              <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600 } }}>
                                {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (R)' : ''}{job.productionComplete ? ' ✓' : ''}
                              </Text>
                              <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'white' } }}>
                                {job.customer}
                              </Text>
                            </Stack>
                          </Stack>

                          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }} wrap>
                            <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.8)', fontWeight: 600 } }}>
                              {job.estimatedEFinks} EF
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

                          {isLastInChain(job) && !job.productionComplete && (
                            <div
                              onMouseDown={(e) => handleResizeStart(e, job.id, baseHeight)}
                              style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                height: 10,
                                cursor: 'ns-resize',
                                backgroundColor: resizingJob === job.id ? 'rgba(255,255,255,0.3)' : 'transparent'
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
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>
              </Stack>
            );
          })}
        </div>

        {unallocatedJobs.length > 0 && (
          <Stack styles={{ root: { width: 200, flexShrink: 0, marginLeft: 8, borderLeft: '2px solid #c62828' } }}>
            <div style={{ height: 26, backgroundColor: '#ffcdd2', borderBottom: '1px solid #ccc' }}></div>
            
            <Stack
              styles={{
                root: {
                  height: 50,
                  padding: '8px 12px',
                  backgroundColor: '#c62828',
                  color: 'white',
                  borderBottom: '1px solid #ddd'
                }
              }}
            >
              <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                Unallocated
              </Text>
              <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.8)' } }}>
                {unallocatedJobs.length} jobs
              </Text>
            </Stack>

            <div
              onDragOver={onDragOver}
              onDrop={() => onDrop(dateStr, null)}
              style={{
                height: totalTimelineHeight,
                overflowY: 'auto',
                backgroundColor: '#ffebee',
                padding: 6
              }}
            >
              <Stack tokens={{ childrenGap: 4 }}>
                {unallocatedJobs.map(job => (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={() => onDragStart(job.id)}
                    onDoubleClick={() => onJobDoubleClick(job.id)}
                    style={{
                      padding: '6px 8px',
                      background: job.productionComplete 
                        ? 'linear-gradient(135deg, rgba(180, 180, 180, 0.9), rgba(200, 200, 200, 0.85))' 
                        : 'linear-gradient(135deg, rgba(198, 40, 40, 0.9), rgba(160, 30, 30, 0.85))',
                      color: job.productionComplete ? '#555' : 'white',
                      borderRadius: 4,
                      cursor: 'grab',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      opacity: job.productionComplete ? 0.7 : 1
                    }}
                  >
                    <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600, fontSize: 11 } }}>
                      {job.orderNumber}{job.productionComplete ? ' ✓' : ''}
                    </Text>
                    <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#888' : 'rgba(255,255,255,0.8)', fontSize: 10 } }}>
                      {job.customer}
                    </Text>
                    <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.7)', fontSize: 10 } }}>
                      {job.estimatedEFinks} EF | {formatDuration(getBaseDurationMinutes(job))}
                    </Text>
                  </div>
                ))}
              </Stack>
            </div>
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};

export const DaySection = memo(DaySectionComponent);
