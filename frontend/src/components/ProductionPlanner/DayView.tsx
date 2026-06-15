import { Stack, Text, Spinner, Toggle, Dropdown, IconButton } from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { systemSettingsService, type SystemSettings } from '../../services/systemSettingsService';
import type { ScheduleBlock, ScheduleBlockType } from '../../services/millenniumServices';
import type { JobTimingSummaryDto } from '../../services/jobTimeTrackingService';
import * as PlannerV2 from '../../domain/plannerV2';
import { isTypeABlock, isTypeBBlock } from '../../domain/plannerV2/shiftCalendar';
import type { SchedulerConfig } from '../../domain/plannerV2/schedulerSettings';

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

interface Job {
  id: string;
  name: string;
  orderNumber: string;
  customer: string;
  estimatedEFinks: number;
  plannedDateStr: string | null;
  jigId: string | null;
  productionComplete: boolean;
  customDurationMinutes?: number | null;
  createdOn?: string;
  plannedStartTime?: number | null;
  plannedEndTime?: number | null;
  plannedDurationMinutes?: number | null;
  breakAdjustmentMinutes?: number | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  actualDurationMinutes?: number | null;
  timingSummary?: JobTimingSummaryDto | null;
  stageDurations?: {
    pickingMinutes: number;
    sawingMinutes: number;
    productionMinutes: number;
    totalLabourMinutes: number;
  } | null;
  wipId?: string;
  totalJobDuration?: number | null;
  segmentIndex?: number | null;
  totalSegments?: number | null;
  segmentEfinks?: number | null;
  segmentDuration?: number | null;
  segmentBreakMinutes?: number | null;
  isLastSegment?: boolean;
  isBatchedJob?: boolean;
  sourceProductionIds?: string;
}

interface Jig {
  id: string;
  name: string;
  averageEfinks?: number;
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

const formatClockTime = (value?: string | null): string => {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
};

const formatEfficiency = (plannedMinutes?: number | null, actualMinutes?: number | null): string => {
  if (!plannedMinutes || !actualMinutes) return '-';
  return `${Math.round((plannedMinutes / actualMinutes) * 100)}%`;
};

const formatElapsedSeconds = (seconds: number): string => {
  const safeSeconds = Math.max(0, seconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const LiveElapsedText = ({
  startedAt,
  completedMinutes = 0
}: {
  startedAt: string;
  completedMinutes?: number;
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  const startedMs = new Date(startedAt).getTime();
  const activeSeconds = Number.isNaN(startedMs) ? 0 : Math.floor((now - startedMs) / 1000);
  return <>{formatElapsedSeconds((completedMinutes * 60) + activeSeconds)}</>;
};

interface TeamOvertimeSettings {
  enabled: boolean;
  closeTime: number;
  earlyEnabled?: boolean;
  earlyStartTime?: number;
}

interface StagedJobSegment {
  jobId: string;
  teamId: string;
  workDate: string;
  plannedStartMinutes: number;
  plannedEndMinutes: number;
  plannedDurationMinutes: number;
  breakAdjustmentMinutes: number;
  segmentIndex: number;
  totalSegments: number;
  totalJobDuration: number;
  estimatedEfinks: number;
  totalEstimatedEfinks: number; // The TOTAL E-Finks for the entire job (not just this segment)
  orderNumber: string;
  customer: string;
  name: string;
}

interface StagedJob {
  jobId: string;
  originalJob: Job;
  segments: StagedJobSegment[];
  teamId: string;
  primaryDate: string;
}

export interface DropZoneMetadata {
  position: number;
  afterJobId: string | null;
  beforeJobId: string | null;
  insertIndex: number;
  targetJobId?: string;
}

interface DayViewProps {
  dayStr: string;
  jobs: Job[];
  allJobs: Job[];
  jigTeams: Jig[];
  onDragStart: (jobId: string) => void;
  onDragEnd?: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string, jigId: string | null, dropTimeMinutes?: number, zoneMetadata?: DropZoneMetadata) => void;
  onJobDoubleClick: (jobId: string) => void;
  onJobDurationChange?: (jobId: string, durationMinutes: number) => void;
  onJobDurationReset?: (jobId: string) => void;
  onTeamDoubleClick: (teamId: string) => void;
  overtimeByTeam?: Record<string, TeamOvertimeSettings>;
  allOvertimeSettings?: Record<string, Record<string, TeamOvertimeSettings>>;
  onTeamOvertimeChange?: (dayStr: string, teamId: string, enabled: boolean, closeTime: number, additionalMinutes?: number) => void;
  onTeamEarlyOvertimeChange?: (dayStr: string, teamId: string, earlyEnabled: boolean, earlyStartTime: number) => void;
  onDropToTeamUnallocated?: (jigId: string) => void;
  isDragging?: boolean;
  draggedJobId?: string | null;
  scheduleBlocks?: ScheduleBlock[];
  onBlockClick?: (block: ScheduleBlock) => void;
  schedulerConfig?: SchedulerConfig;
  stagedJobs?: StagedJob[];
  onSaveStagedJob?: (jobId: string) => void;
  onCancelStagedJob?: (jobId: string) => void;
  onEditPersistedJob?: (productionId: string, teamId: string, dateStr: string) => void;
  onManageBatch?: (batchId: string) => void;
}

const MIN_BLOCK_HEIGHT = 20;
const MIN_WEEKDAY_WORK_START_MINUTES = 7 * 60;
const MIN_WEEKDAY_WORK_END_MINUTES = 17 * 60;

const DayViewComponent: React.FC<DayViewProps> = ({
  dayStr,
  jobs,
  allJobs: _allJobs,
  jigTeams,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onJobDoubleClick,
  onJobDurationChange,
  onJobDurationReset,
  onTeamDoubleClick,
  overtimeByTeam = {},
  allOvertimeSettings = {},
  onTeamOvertimeChange,
  onTeamEarlyOvertimeChange,
  onDropToTeamUnallocated: _onDropToTeamUnallocated,
  isDragging = false,
  draggedJobId = null,
  scheduleBlocks = [],
  onBlockClick,
  schedulerConfig,
  stagedJobs = [],
  onSaveStagedJob,
  onCancelStagedJob,
  onEditPersistedJob,
  onManageBatch
}) => {
  const [workingHours, setWorkingHours] = useState<{ start: number; end: number } | null>(null);
  const [baseWorkingHours, setBaseWorkingHours] = useState<{ start: number; end: number } | null>(null);
  const [breakSlots, setBreakSlots] = useState<BreakSlot[]>([]);
  const [baseBreakSlots, setBaseBreakSlots] = useState<BreakSlot[]>([]);
  const [dinnerBreakSlot, setDinnerBreakSlot] = useState<BreakSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [customDurations, setCustomDurations] = useState<Record<string, number>>({});
  const [resizingJob, setResizingJob] = useState<string | null>(null);
  const [activeEditingJobId, setActiveEditingJobId] = useState<string | null>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const currentResizeDuration = useRef<number>(0);
  const [dropHoverJigId, setDropHoverJigId] = useState<string | null>(null);
  const [dropHoverPosition, setDropHoverPosition] = useState<number | null>(null);
  const [dragOverJobId, setDragOverJobId] = useState<string | null>(null);

  const clearDragPreview = useCallback(() => {
    setDropHoverJigId(null);
    setDropHoverPosition(null);
    setDragOverJobId(null);
  }, []);

  useEffect(() => {
    if (!isDragging) {
      clearDragPreview();
    }
  }, [clearDragPreview, isDragging]);

  const getJobInteractionKey = useCallback((job: Job): string => {
    return job.wipId ?? job.id;
  }, []);

  const getJobRenderKey = useCallback((job: Job): string => {
    return job.wipId ?? `${job.id}-${job.plannedDateStr ?? 'unscheduled'}-${job.jigId ?? 'no-team'}-${job.segmentIndex ?? 0}-${job.plannedStartTime ?? 'none'}`;
  }, []);

  // Helper to convert minutes to HH:MM format
  const minutesToTimeString = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  // Helper to convert HH:MM format to minutes
  const timeStringToMinutes = (timeStr: string): number => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  // Get default overtime values from schedulerConfig
  const defaultLateEndTime = schedulerConfig?.weekdayOvertimeDefaults.lateEndTime ?? 1260; // 21:00
  const defaultEarlyStartTime = schedulerConfig?.weekdayOvertimeDefaults.earlyStartTime ?? 360; // 06:00
  
  // Helper to get overtime settings for a specific team
  const getTeamOvertime = useCallback((teamId: string): TeamOvertimeSettings => {
    return overtimeByTeam[teamId] ?? { enabled: false, closeTime: defaultLateEndTime, earlyEnabled: false, earlyStartTime: defaultEarlyStartTime };
  }, [overtimeByTeam, defaultLateEndTime, defaultEarlyStartTime]);

  // Check if current day is a weekend (Saturday or Sunday)
  const isWeekendDay = useMemo(() => {
    return PlannerV2.isWeekend(dayStr);
  }, [dayStr]);
  
  // Check if current day is Friday
  const isFridayDay = useMemo(() => {
    return PlannerV2.isFriday(dayStr);
  }, [dayStr]);
  
  // Check if ANY team has overtime enabled (for timeline rendering)
  const anyTeamHasOvertime = useMemo(() => {
    return Object.values(overtimeByTeam).some(settings => settings.enabled);
  }, [overtimeByTeam]);
  
  // Calculate the max/min team working minutes across all teams with overtime enabled
  // This is used for the left time column to show breaks and working hours correctly
  const teamWorkingBounds = useMemo(() => {
    if (!isWeekendDay) return null;
    const weekendDefaultEnd = schedulerConfig?.weekendOvertimeDefaults?.endTime ?? 900;
    const weekendDefaultStart = schedulerConfig?.weekendOvertimeDefaults?.startTime ?? 420;
    
    let minStart = Infinity;
    let maxEnd = 0;
    
    for (const [, settings] of Object.entries(overtimeByTeam)) {
      if (settings.enabled) {
        const teamStart = settings.earlyStartTime ?? weekendDefaultStart;
        const teamEnd = settings.closeTime ?? weekendDefaultEnd;
        if (teamStart < minStart) minStart = teamStart;
        if (teamEnd > maxEnd) maxEnd = teamEnd;
      }
    }
    
    if (!anyTeamHasOvertime) return null;
    
    return {
      startMinutes: minStart === Infinity ? weekendDefaultStart : minStart,
      endMinutes: maxEnd === 0 ? weekendDefaultEnd : maxEnd
    };
  }, [isWeekendDay, schedulerConfig, overtimeByTeam, anyTeamHasOvertime]);

  // Calculate additional working minutes for overtime
  const calculateOvertimeDelta = useCallback((closeTimeMinutes: number) => {
    if (!baseWorkingHours) return 0;
    
    const hour = Math.floor(closeTimeMinutes / 60);
    const minutes = closeTimeMinutes % 60;
    const overtimeEndHour = minutes > 0 ? hour + 1 : hour;
    
    const baseMinutes = (baseWorkingHours.end - baseWorkingHours.start) * 60;
    const overtimeMinutes = (overtimeEndHour - baseWorkingHours.start) * 60;
    
    // Calculate dinner break from config - sum overtime breaks that start after base working hours
    const baseEndMinutes = baseWorkingHours.end * 60;
    const overtimeBreaks = schedulerConfig?.weekdayOvertimeBreaks ?? [];
    let dinnerBreakMinutes = 0;
    for (const brk of overtimeBreaks) {
      if (brk.start >= baseEndMinutes && brk.start < closeTimeMinutes) {
        dinnerBreakMinutes += brk.duration;
      }
    }
    
    return (overtimeMinutes - dinnerBreakMinutes) - baseMinutes;
  }, [baseWorkingHours, schedulerConfig]);
  
  const handleTeamOvertimeToggle = (teamId: string, checked: boolean) => {
    if (onTeamOvertimeChange) {
      const currentSettings = getTeamOvertime(teamId);
      const deltaMinutes = checked ? calculateOvertimeDelta(currentSettings.closeTime) : 0;
      onTeamOvertimeChange(dayStr, teamId, checked, currentSettings.closeTime, deltaMinutes);
    }
  };

  const handleTeamOvertimeCloseTimeChange = (teamId: string, newTimeStr: string) => {
    if (onTeamOvertimeChange) {
      const currentSettings = getTeamOvertime(teamId);
      const newTimeMinutes = timeStringToMinutes(newTimeStr);
      const deltaMinutes = currentSettings.enabled ? calculateOvertimeDelta(newTimeMinutes) : 0;
      onTeamOvertimeChange(dayStr, teamId, currentSettings.enabled, newTimeMinutes, deltaMinutes);
    }
  };

  const handleTeamEarlyOvertimeToggle = (teamId: string, checked: boolean) => {
    if (onTeamEarlyOvertimeChange) {
      const currentSettings = getTeamOvertime(teamId);
      onTeamEarlyOvertimeChange(dayStr, teamId, checked, currentSettings.earlyStartTime ?? defaultEarlyStartTime);
    }
  };

  const handleTeamEarlyOvertimeStartTimeChange = (teamId: string, newTimeStr: string) => {
    if (onTeamEarlyOvertimeChange) {
      const currentSettings = getTeamOvertime(teamId);
      const newTimeMinutes = timeStringToMinutes(newTimeStr);
      onTeamEarlyOvertimeChange(dayStr, teamId, currentSettings.earlyEnabled ?? false, newTimeMinutes);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [dayStr, schedulerConfig]);

  // Keep workingHours at base level - each team column will independently extend based on its overtime
  useEffect(() => {
    if (!baseWorkingHours) return;
    setWorkingHours(baseWorkingHours);
  }, [baseWorkingHours]);

  // Dynamically add/remove dinner break based on overtime state (any team)
  useEffect(() => {
    if (anyTeamHasOvertime && dinnerBreakSlot) {
      // Add dinner break when any team has overtime enabled
      setBreakSlots([...baseBreakSlots, dinnerBreakSlot]);
    } else {
      // Remove dinner break when no team has overtime
      setBreakSlots(baseBreakSlots);
    }
  }, [anyTeamHasOvertime, baseBreakSlots, dinnerBreakSlot]);

  // NOTE: The automatic redistribution effect was removed as it caused an infinite loop
  // Redistribution is now ONLY triggered when the user explicitly toggles overtime
  // This is handled via the onOvertimeChange callback in ProductionPlannerPage

  const parseTime = (timeStr: string): { hour: number; minute: number } => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute: minute || 0 };
  };

  const loadSettings = async () => {
    try {
      // Use schedulerConfig if provided, otherwise fetch from API
      let settings: SystemSettings | null = null;
      
      if (!schedulerConfig) {
        try {
          settings = await systemSettingsService.getSettings();
        } catch (apiErr) {
          // API call failed - continue with default values
          console.warn('[DayView] Failed to fetch settings from API, using defaults');
        }
      }
      
      const date = new Date(dayStr);
      const dayOfWeek = date.getDay();
      
      let hours = { start: 7, end: 17 };
      
      if (schedulerConfig) {
        // Use schedulerConfig values (in minutes from midnight) converted to hours
        // Weekends use overtime defaults (they're non-working by default)
        const startMinutes = isWeekendDay 
          ? schedulerConfig.weekendOvertimeDefaults.startTime 
          : schedulerConfig.weekdayShift.startTime;
        const endMinutes = isWeekendDay 
          ? schedulerConfig.weekendOvertimeDefaults.endTime 
          : (isFridayDay ? schedulerConfig.weekdayShift.fridayEndTime : schedulerConfig.weekdayShift.endTime);
        
        hours = {
          start: Math.floor(startMinutes / 60),
          end: Math.ceil(endMinutes / 60)
        };
      } else if (settings) {
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek] as 
          'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
        
        const factoryHours = settings.workingHours?.factoryStaff?.[dayName];
        
        if (factoryHours) {
          const [start, end] = factoryHours.split('-');
          const startHour = parseInt(start.split(':')[0]);
          const endHour = parseInt(end.split(':')[0]);
          hours = { start: startHour, end: endHour };
        }
      }
      
      setBaseWorkingHours(hours);
      setWorkingHours(hours);

      const breaks: BreakSlot[] = [];

      if (schedulerConfig) {
        // Use schedulerConfig breaks (Break type uses: start, end, duration, name)
        const configBreaks = isWeekendDay 
          ? (schedulerConfig.weekendBreaks || [])
          : (schedulerConfig.weekdayBreaks || []);
        
        for (const brk of configBreaks) {
          breaks.push({
            startHour: Math.floor(brk.start / 60),
            startMinute: brk.start % 60,
            endHour: Math.floor(brk.end / 60),
            endMinute: brk.end % 60,
            label: brk.name,
            color: brk.name.toLowerCase().includes('lunch') ? '#fff3cd' : '#d4edda'
          });
        }
        
        // Store dinner/overtime break separately
        const overtimeBreaks = isWeekendDay 
          ? (schedulerConfig.weekendBreaks || [])
          : (schedulerConfig.weekdayOvertimeBreaks || []);
        
        const dinnerBreak = overtimeBreaks.find(b => 
          b?.name?.toLowerCase().includes('dinner') || b?.name?.toLowerCase().includes('supper')
        );
        
        if (dinnerBreak) {
          setDinnerBreakSlot({
            startHour: Math.floor(dinnerBreak.start / 60),
            startMinute: dinnerBreak.start % 60,
            endHour: Math.floor(dinnerBreak.end / 60),
            endMinute: dinnerBreak.end % 60,
            label: dinnerBreak.name,
            color: '#f8d7da'
          });
        }
      } else if (settings) {
        const breakTimes = settings.breakTimes;

        // Add tea morning break (light green)
        if (breakTimes?.teaMorning) {
          const teaStart = parseTime(breakTimes.teaMorning.start);
          const teaEnd = parseTime(breakTimes.teaMorning.end);
          breaks.push({
            startHour: teaStart.hour,
            startMinute: teaStart.minute,
            endHour: teaEnd.hour,
            endMinute: teaEnd.minute,
            label: 'Tea',
            color: '#d4edda'
          });
        }

        // Add lunch break (light yellow)
        if (breakTimes?.lunch) {
          const lunchStart = parseTime(breakTimes.lunch.start);
          const lunchEnd = parseTime(breakTimes.lunch.end);
          breaks.push({
            startHour: lunchStart.hour,
            startMinute: lunchStart.minute,
            endHour: lunchEnd.hour,
            endMinute: lunchEnd.minute,
            label: 'Lunch',
            color: '#fff3cd'
          });
        }

        // Store dinner break separately - it's added dynamically based on overtime state (light pink)
        if (breakTimes?.dinnerOvertime) {
          const dinnerStart = parseTime(breakTimes.dinnerOvertime.start);
          const dinnerEnd = parseTime(breakTimes.dinnerOvertime.end);
          setDinnerBreakSlot({
            startHour: dinnerStart.hour,
            startMinute: dinnerStart.minute,
            endHour: dinnerEnd.hour,
            endMinute: dinnerEnd.minute,
            label: 'Dinner (OT)',
            color: '#f8d7da'
          });
        }
      }

      setBaseBreakSlots(breaks);
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

  const calculateBreaksSpanned = (jobStartMinutes: number, baseDurationMinutes: number, teamWorkingEndMinutes?: number, jigId?: string): BreakAddition[] => {
    const additions: BreakAddition[] = [];
    let currentTime = jobStartMinutes;
    let remainingWork = baseDurationMinutes;

    // CRITICAL: Use a STABLE set of all possible breaks for job height calculations
    // This includes ALL breaks (base breaks + dinner break) regardless of current OT state
    // This ensures job rendering is consistent when OT is toggled - the job height is based on
    // which breaks the job actually SPANS, not on the current OT configuration
    const allPossibleBreaks = dinnerBreakSlot 
      ? [...baseBreakSlots, dinnerBreakSlot] 
      : baseBreakSlots;
    
    // Calculate the job's actual end time (start + work duration)
    // This is used to determine which breaks the job ACTUALLY spans
    const jobWorkEndTime = jobStartMinutes + baseDurationMinutes;
    
    // Include Type A schedule blocks as non-working intervals (similar to breaks)
    // Type A blocks: PublicHoliday, Maintenance, GeneralDelay
    const typeABlocks = scheduleBlocks
      .filter(block => {
        if (!block.dateStr || block.dateStr !== dayStr) return false;
        if (!isTypeABlock(block.blockType)) return false;
        if (jigId && block.teamId && block.teamId !== jigId) return false;
        return true;
      })
      .map(block => ({
        startHour: Math.floor((block.startTimeMinutes ?? 0) / 60),
        startMinute: (block.startTimeMinutes ?? 0) % 60,
        endHour: Math.floor((block.endTimeMinutes ?? 0) / 60),
        endMinute: (block.endTimeMinutes ?? 0) % 60,
        label: block.blockType,
        color: SCHEDULE_BLOCK_COLORS[block.blockType as ScheduleBlockType] || '#9AA0A6'
      }));
    
    // Include Type B schedule blocks (Breakdown, MaterialShortage) as job-extending intervals
    // Type B blocks act like breaks - they extend job duration when the job intersects with them
    // Unlike Type A blocks, Type B blocks only extend the FIRST intersecting job
    const typeBBlocks = scheduleBlocks
      .filter(block => {
        if (!block.dateStr || block.dateStr !== dayStr) return false;
        if (!isTypeBBlock(block.blockType)) return false;
        if (jigId && block.teamId && block.teamId !== jigId) return false;
        
        // Type B block must intersect with this job's working time
        const blockStart = block.startTimeMinutes ?? 0;
        const blockEnd = block.endTimeMinutes ?? blockStart;
        // Job intersects if block starts before job ends AND block ends after job starts
        const jobIntersects = blockStart < jobWorkEndTime && blockEnd > jobStartMinutes;
        return jobIntersects;
      })
      .map(block => ({
        startHour: Math.floor((block.startTimeMinutes ?? 0) / 60),
        startMinute: (block.startTimeMinutes ?? 0) % 60,
        endHour: Math.floor((block.endTimeMinutes ?? 0) / 60),
        endMinute: (block.endTimeMinutes ?? 0) % 60,
        label: SCHEDULE_BLOCK_LABELS[block.blockType as ScheduleBlockType] || block.blockType,
        color: SCHEDULE_BLOCK_COLORS[block.blockType as ScheduleBlockType] || '#F28B82'
      }));
    
    // Combine regular breaks with Type A blocks and Type B blocks
    const allNonWorkingIntervals = [...allPossibleBreaks, ...typeABlocks, ...typeBBlocks];
    
    // Sort breaks by start time and filter based on what the job actually spans
    // For weekends, apply special filtering logic
    const sortedBreaks = allNonWorkingIntervals
      .filter(b => {
        const breakStart = b.startHour * 60 + b.startMinute;
        const breakEnd = b.endHour * 60 + b.endMinute;
        
        // WEEKDAY LOGIC: Include all breaks that the job might span
        // The for-loop below will only add breaks if the job actually reaches them
        // We DON'T filter by teamWorkingEndMinutes here to ensure consistent rendering
        // when OT is toggled - a job that spans 17:00 will always show dinner break
        if (!isWeekendDay) {
          // Only include breaks that the job could potentially span
          // (i.e., the job's work extends past the break start)
          return breakStart < jobWorkEndTime;
        }
        
        // WEEKEND LOGIC: Apply working hours filtering
        if (teamWorkingEndMinutes !== undefined) {
          // Break must end before or at working hours end
          if (breakEnd > teamWorkingEndMinutes) {
            return false;
          }
          // Break must start at or after working hours start
          if (breakStart < jobStartMinutes) {
            return false;
          }
        }
        
        // Weekend-specific rule: Lunch only taken if working PAST 15:00
        // Morning tea is always taken, but lunch only if end time > 15:00 (900 minutes)
        if (b.label.toLowerCase().includes('lunch')) {
          return teamWorkingEndMinutes !== undefined && teamWorkingEndMinutes > 900;
        }
        
        return true;
      })
      .sort((a, b) => getBreakStartMinutes(a) - getBreakStartMinutes(b));

    for (const breakSlot of sortedBreaks) {
      if (remainingWork <= 0) break;
      
      const breakStart = getBreakStartMinutes(breakSlot);
      const breakEnd = breakSlot.endHour * 60 + breakSlot.endMinute;
      const breakDuration = breakEnd - breakStart;
      
      // Skip breaks that are before our current time
      if (breakEnd <= currentTime) continue;
      
      // If current time is within a break, skip to end of break
      // Jobs should not start in breaks, but handle it gracefully
      if (currentTime >= breakStart && currentTime < breakEnd) {
        const remainingBreakTime = breakEnd - currentTime;
        additions.push({
          label: breakSlot.label.replace(' (OT)', ''),
          minutes: remainingBreakTime
        });
        currentTime = breakEnd;
        continue;
      }
      
      // Work until we hit the break or finish
      if (currentTime < breakStart) {
        const workBeforeBreak = breakStart - currentTime;
        
        if (remainingWork <= workBeforeBreak) {
          // Job ends before this break
          break;
        }
        
        // Work up to the break, then skip over it
        remainingWork -= workBeforeBreak;
        additions.push({
          label: breakSlot.label.replace(' (OT)', ''),
          minutes: breakDuration
        });
        currentTime = breakEnd;
      }
    }

    return additions;
  };

  const getBaseDuration = useCallback((job: Job): number => {
    // Priority 1: Local resize in progress
    const customDuration = customDurations[getJobInteractionKey(job)] ?? customDurations[job.id];
    if (customDuration) {
      return PlannerV2.roundToQuarterHour(customDuration);
    }
    
    // Priority 2: WIP plannedDurationMinutes (authoritative for allocated jobs - includes truncated rollovers)
    if (job.plannedDurationMinutes != null && job.plannedDurationMinutes > 0) {
      return job.plannedDurationMinutes;
    }
    
    // Priority 3: Production customDurationMinutes or calculate from E-Finks
    return PlannerV2.getJobDuration({
      customDurationMinutes: job.customDurationMinutes,
      estimatedEFinks: job.estimatedEFinks
    });
  }, [customDurations, getJobInteractionKey]);

  const getJobDurationMinutes = useCallback((job: Job): number => {
    const baseDuration = getBaseDuration(job);
    const breakAdjustment = job.breakAdjustmentMinutes || 0;
    return baseDuration + breakAdjustment;
  }, [getBaseDuration]);

  const hasManualResize = useCallback((job: Job): boolean => {
    if (customDurations[getJobInteractionKey(job)] ?? customDurations[job.id]) return true;
    return PlannerV2.isManuallyAltered({
      customDurationMinutes: job.customDurationMinutes,
      estimatedEFinks: job.estimatedEFinks
    });
  }, [customDurations, getJobInteractionKey]);

  const jobsByJig = useMemo(() => {
    const map = new Map<string, Job[]>();
    
    const overtimeMap: PlannerV2.OvertimeSettingsMap = {};
    for (const [dateKey, teamSettings] of Object.entries(allOvertimeSettings)) {
      overtimeMap[dateKey] = teamSettings;
    }
    if (overtimeByTeam && !overtimeMap[dayStr]) {
      overtimeMap[dayStr] = overtimeByTeam;
    }
    
    for (const jig of jigTeams) {
      const teamAverageEfinks = jig.averageEfinks ?? 80;
      const persistedSegments = jobs
        .filter(job =>
          job.jigId === jig.id &&
          job.plannedDateStr === dayStr &&
          (job.wipId || job.segmentIndex != null || (job.totalSegments ?? 1) > 1)
        )
        .map(job => ({
          ...job,
          segmentIndex: job.segmentIndex ?? 0,
          totalSegments: job.totalSegments ?? 1,
          totalJobDuration: job.totalJobDuration ?? job.plannedDurationMinutes ?? undefined,
          segmentEfinks: job.segmentEfinks ?? job.estimatedEFinks,
          segmentDuration: job.segmentDuration ?? job.plannedDurationMinutes ?? undefined,
          segmentBreakMinutes: job.segmentBreakMinutes ?? job.breakAdjustmentMinutes ?? undefined,
          isLastSegment: job.isLastSegment ?? ((job.segmentIndex ?? 0) >= ((job.totalSegments ?? 1) - 1))
        }));

      const jobsNeedingExpansion = jobs.filter(job =>
        job.jigId === jig.id &&
        !job.wipId &&
        job.segmentIndex == null &&
        (job.totalSegments == null || job.totalSegments <= 1)
      );
      
      const expandedJobs = PlannerV2.expandJobsForDay(
        jobsNeedingExpansion as PlannerV2.JobForSegmentExpansion[],
        dayStr,
        jig.id,
        overtimeMap,
        teamAverageEfinks,
        schedulerConfig
      );
      
      const mappedExpandedJobs: Job[] = expandedJobs.map(segment => ({
        ...segment,
        plannedStartTime: segment.segmentStartTime,
        plannedEndTime: segment.segmentEndTime,
        plannedDurationMinutes: segment.segmentDuration,
        totalJobDuration: segment.totalJobDuration,
        segmentIndex: segment.segmentIndex,
        totalSegments: segment.totalSegments,
        segmentEfinks: segment.segmentEfinks,
        segmentDuration: segment.segmentDuration,
        segmentBreakMinutes: segment.segmentBreakMinutes,
        isLastSegment: segment.isLastSegment
      }));

      const mappedJobs = [...persistedSegments, ...mappedExpandedJobs]
        .sort((a, b) => (a.plannedStartTime ?? 0) - (b.plannedStartTime ?? 0));
      
      if (mappedJobs.length > 0) {
        map.set(jig.id, mappedJobs);
      }
    }
    
    return map;
  }, [jobs, dayStr, jigTeams, overtimeByTeam, allOvertimeSettings, schedulerConfig]);

  const unallocatedJobs = useMemo(() => {
    return jobs.filter(j => j.plannedDateStr === dayStr && !j.jigId && !j.productionComplete);
  }, [jobs, dayStr]);

  // Map staged jobs by team for this day - with isStaged flag
  const stagedJobsByJig = useMemo(() => {
    const map = new Map<string, Array<Job & { isStaged: boolean }>>();
    
    for (const stagedJob of stagedJobs) {
      // Find segments for this day
      const todaySegments = stagedJob.segments.filter(seg => seg.workDate === dayStr);
      
      for (const segment of todaySegments) {
        const teamId = segment.teamId;
        
        // Create a Job-compatible object from the staged segment
        const stagedJobItem: Job & { isStaged: boolean } = {
          id: segment.jobId,
          name: segment.name,
          orderNumber: segment.orderNumber,
          customer: segment.customer,
          estimatedEFinks: stagedJob.originalJob.estimatedEFinks,
          plannedDateStr: segment.workDate,
          jigId: segment.teamId,
          productionComplete: false,
          plannedStartTime: segment.plannedStartMinutes,
          plannedEndTime: segment.plannedEndMinutes,
          plannedDurationMinutes: segment.plannedDurationMinutes,
          breakAdjustmentMinutes: segment.breakAdjustmentMinutes,
          totalJobDuration: segment.totalJobDuration,
          segmentIndex: segment.segmentIndex,
          totalSegments: segment.totalSegments,
          segmentEfinks: segment.estimatedEfinks,
          isStaged: true
        };
        
        const existing = map.get(teamId) || [];
        existing.push(stagedJobItem);
        map.set(teamId, existing);
      }
    }
    
    return map;
  }, [stagedJobs, dayStr]);
  
  // Get job IDs that are staged (to exclude from persisted jobs rendering)
  const stagedJobIds = useMemo(() => {
    return new Set(stagedJobs.map(sj => sj.jobId));
  }, [stagedJobs]);

  const getJobsForDateAndJig = (_dateStr: string, jigId: string) => {
    // Get persisted jobs (excluding ones currently staged)
    const persistedJobs = (jobsByJig.get(jigId) || []).filter(j => !stagedJobIds.has(j.id));
    // Get staged jobs for this team
    const staged = stagedJobsByJig.get(jigId) || [];
    // Combine and sort by start time
    const combined = [...persistedJobs.map(j => ({ ...j, isStaged: false })), ...staged];
    return combined.sort((a, b) => (a.plannedStartTime ?? 0) - (b.plannedStartTime ?? 0));
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

  const handleResizeStart = (e: React.MouseEvent, job: Job, currentHeight: number) => {
    e.preventDefault();
    e.stopPropagation();
    const interactionKey = getJobInteractionKey(job);
    setResizingJob(interactionKey);
    setActiveEditingJobId(interactionKey);
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = currentHeight;
    currentResizeDuration.current = Math.round(currentHeight / PlannerV2.PIXELS_PER_MINUTE);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - resizeStartY.current;
      const newHeight = Math.max(MIN_BLOCK_HEIGHT, resizeStartHeight.current + delta);
      const newDuration = PlannerV2.pixelsToDuration(newHeight);
      currentResizeDuration.current = newDuration;
      setCustomDurations(prev => ({ ...prev, [interactionKey]: newDuration }));
    };

    const handleMouseUp = () => {
      setResizingJob(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      const finalDuration = currentResizeDuration.current;
      if (finalDuration > 0 && onJobDurationChange) {
        setCustomDurations(prev => {
          const next = { ...prev };
          delete next[interactionKey];
          return next;
        });
        onJobDurationChange(job.id, finalDuration);
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
    // Delegate to getBaseDuration for consistent planned sizing logic.
    return getBaseDuration(job);
  };

  const calculateJobPositions = (jigJobs: Job[], includeBreaks: boolean = true, teamWorkingEndMinutes?: number): JobPositionInfo[] => {
    const positions: JobPositionInfo[] = [];
    const workingHoursOffset = includeBreaks ? getWorkingHoursOffset() : 0;
    
    for (const job of jigJobs) {
      // Planner block geometry is based on planned schedule data only.
      // Actual mobile timing is reporting text and must not feed into top/height.
      const baseDuration = getBaseDurationMinutes(job);
      const jobTop = job.plannedStartTime != null ? job.plannedStartTime : workingHoursOffset;
      if (!Number.isFinite(jobTop) || !Number.isFinite(baseDuration) || baseDuration <= 0) {
        continue;
      }
      
      let breakAdditions: BreakAddition[] = [];
      let totalBreakMinutes = 0;
      
      if (includeBreaks) {
        // Pass team working end minutes for proper break calculation on weekends
        // Also pass jigId for Type A schedule block filtering
        breakAdditions = calculateBreaksSpanned(jobTop, baseDuration, teamWorkingEndMinutes, job.jigId ?? undefined);
        totalBreakMinutes = breakAdditions.reduce((sum, b) => sum + b.minutes, 0);
      }
      
      const calculatedEnd = jobTop + baseDuration + totalBreakMinutes;
      const renderEndLimit = Math.min(visibleEndMinutes, teamWorkingEndMinutes ?? visibleEndMinutes);
      const scheduledEnd = Math.max(job.plannedEndTime ?? calculatedEnd, calculatedEnd);
      const clippedTop = Math.max(jobTop, visibleStartMinutes);
      const clippedEnd = Math.min(scheduledEnd, renderEndLimit);

      if (!Number.isFinite(clippedTop) || !Number.isFinite(clippedEnd) || clippedEnd <= clippedTop) {
        continue;
      }

      const clippedDuration = clippedEnd - clippedTop;
      const visibleWorkMinutes = Math.max(0, Math.min(baseDuration, clippedDuration));
      const baseHeight = Math.max(MIN_BLOCK_HEIGHT, PlannerV2.calculateJobHeight(visibleWorkMinutes));
      const totalHeight = Math.min(
        PlannerV2.calculateJobHeight(visibleEndMinutes - visibleStartMinutes),
        Math.max(MIN_BLOCK_HEIGHT, PlannerV2.calculateJobHeight(clippedDuration))
      );
      
      positions.push({ 
        job, 
        top: clippedTop, 
        height: totalHeight,
        baseHeight: Math.min(baseHeight, totalHeight),
        breakAdditions,
        totalBreakMinutes
      });
    }

    positions.sort((a, b) => a.top - b.top);
    return positions;
  };

  const handleTimelineDragOver = (e: React.DragEvent, jigId: string, visibleStart: number, maxDropMinutes?: number) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(e);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const snapMinutes = Math.max(1, schedulerConfig?.durationRoundingIncrement ?? PlannerV2.QUARTER_HOUR);
    const rawDropMinutes = y / PlannerV2.PIXELS_PER_MINUTE + visibleStart;
    const dropMinutes = Math.min(
      Math.round(rawDropMinutes / snapMinutes) * snapMinutes,
      maxDropMinutes ?? visibleEndMinutes
    );
    
    setDropHoverJigId(jigId);
    setDropHoverPosition(dropMinutes);
  };

  const handleTimelineDragLeave = () => {
    clearDragPreview();
  };

  const handleTimelineDrop = (e: React.DragEvent, jigId: string | null, visibleStart: number, maxDropMinutes?: number) => {
    e.preventDefault();
    clearDragPreview();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const snapMinutes = Math.max(1, schedulerConfig?.durationRoundingIncrement ?? PlannerV2.QUARTER_HOUR);
    const rawDropMinutes = y / PlannerV2.PIXELS_PER_MINUTE + visibleStart;
    
    let snappedPosition = Math.min(
      Math.round(rawDropMinutes / snapMinutes) * snapMinutes,
      maxDropMinutes ?? visibleEndMinutes
    );
    
    if (jigId && workingHours) {
      // Get team-specific working hours (accounts for early/late OT)
      const teamOvertime = getTeamOvertime(jigId);
      const configuredStartMinutes = Math.min(workingHours.start * 60, MIN_WEEKDAY_WORK_START_MINUTES);
      const teamStartMinutes = teamOvertime.earlyEnabled && teamOvertime.earlyStartTime !== undefined
        ? teamOvertime.earlyStartTime
        : configuredStartMinutes;
      
      // Use team-specific start time for clamping (respects early OT)
      if (snappedPosition < teamStartMinutes) {
        snappedPosition = teamStartMinutes;
      }
    }
    
    onDrop(dayStr, jigId, snappedPosition);
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

  // Calculate the visible time range based on working hours and all teams' overtime settings
  // Default: 1 hour before working hours start, 1 hour after working hours end
  // With OT: extends to accommodate team overtime + 1 hour padding
  const calculateVisibleTimeRange = (): { startHour: number; endHour: number; startMinutes: number; endMinutes: number } => {
    let earliestStartMinutes = workingHours.start * 60; // e.g., 420 for 07:00
    let latestEndMinutes = workingHours.end * 60; // e.g., 1020 for 17:00

    if (!isWeekendDay) {
      earliestStartMinutes = Math.min(earliestStartMinutes, MIN_WEEKDAY_WORK_START_MINUTES);
      latestEndMinutes = Math.max(latestEndMinutes, MIN_WEEKDAY_WORK_END_MINUTES);
    }

    // Check all teams' overtime settings - use minute precision
    for (const teamId of Object.keys(overtimeByTeam)) {
      const settings = overtimeByTeam[teamId];
      
      // Early OT - check for earlier start times (in minutes)
      if (settings?.earlyEnabled && settings.earlyStartTime !== undefined) {
        if (settings.earlyStartTime < earliestStartMinutes) {
          earliestStartMinutes = settings.earlyStartTime;
        }
      }
      
      // Late OT - check for later end times (in minutes)
      if (settings?.enabled && settings.closeTime !== undefined) {
        if (settings.closeTime > latestEndMinutes) {
          latestEndMinutes = settings.closeTime;
        }
      }
    }

    // Add 1 hour padding on each side, clamped to 0-24 hours (in minutes)
    const visibleStartMinutes = Math.max(0, earliestStartMinutes - 60);
    const visibleEndMinutes = Math.min(24 * 60, latestEndMinutes + 60);

    // Convert to hours for backwards compatibility (floored/ceiled to nearest hour for display)
    const visibleStart = Math.floor(visibleStartMinutes / 60);
    const visibleEnd = Math.ceil(visibleEndMinutes / 60);

    return { startHour: visibleStart, endHour: visibleEnd, startMinutes: visibleStartMinutes, endMinutes: visibleEndMinutes };
  };

  const visibleTimeRange = calculateVisibleTimeRange();
  const visibleStartMinutes = visibleTimeRange.startMinutes;
  const visibleEndMinutes = visibleTimeRange.endMinutes;
  const visibleDurationMinutes = visibleEndMinutes - visibleStartMinutes;

  // Generate timeline segments only for the visible range
  const generateVisibleTimelineSegments = (forWorkingHours?: { start: number; end: number }, isNonWorkingDay?: boolean): TimelineSegment[] => {
    const segments: TimelineSegment[] = [];
    
    // For weekends with team overtime, use the team working bounds for working hours display
    // This ensures the left column reflects the max working hours across all teams
    const effectiveWorkingHours = isWeekendDay && teamWorkingBounds
      ? { start: Math.floor(teamWorkingBounds.startMinutes / 60), end: Math.ceil(teamWorkingBounds.endMinutes / 60) }
      : (forWorkingHours || workingHours);
    
    // For non-working days (weekends without overtime), skip all break rendering
    // For weekends, filter breaks based on max team working end time (not just defaults)
    const effectiveEndMinutes = isWeekendDay && teamWorkingBounds 
      ? teamWorkingBounds.endMinutes 
      : (schedulerConfig?.weekendOvertimeDefaults?.endTime ?? 900);
    
    const filteredBreaks = isNonWorkingDay ? [] : breakSlots.filter(b => {
      const breakStart = b.startHour * 60 + b.startMinute;
      const breakEnd = breakStart + getBreakDurationMinutes(b);
      
      // Only include breaks that are fully within the working hours
      // For weekends, break must end before or at working hours end
      if (isWeekendDay && breakEnd > effectiveEndMinutes) {
        return false;
      }
      
      // Weekend-specific rule: Lunch only taken if working PAST 15:00
      // Morning tea is always taken, but lunch only if end time > 15:00 (900 minutes)
      if (isWeekendDay && b.label.toLowerCase().includes('lunch')) {
        return effectiveEndMinutes > 900;
      }
      return true;
    });
    
    const sortedBreaks = [...filteredBreaks].sort((a, b) => 
      (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute)
    );
    
    let currentMinute = visibleStartMinutes;
    
    while (currentMinute < visibleEndMinutes) {
      const breakAtThisPoint = sortedBreaks.find(b => {
        const breakStart = b.startHour * 60 + b.startMinute;
        return currentMinute === breakStart;
      });
      
      if (breakAtThisPoint) {
        const breakDuration = getBreakDurationMinutes(breakAtThisPoint);
        const hour = Math.floor(currentMinute / 60);
        const minute = currentMinute % 60;
        
        // Only add if break ends within visible range
        const breakEnd = Math.min(currentMinute + breakDuration, visibleEndMinutes);
        const visibleBreakDuration = breakEnd - currentMinute;
        
        if (visibleBreakDuration > 0) {
          segments.push({
            startMinutes: currentMinute,
            durationMinutes: visibleBreakDuration,
            label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${breakAtThisPoint.label}`,
            isBreak: true,
            isWorking: true,
            backgroundColor: breakAtThisPoint.color,
            breakSlot: breakAtThisPoint
          });
        }
        
        currentMinute += breakDuration;
        continue;
      }
      
      let segmentEnd = visibleEndMinutes;
      
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
      // Non-working days override all working hour logic
      const isWorking = isNonWorkingDay ? false : (effectiveWorkingHours ? (hour >= effectiveWorkingHours.start && hour < effectiveWorkingHours.end) : false);
      
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

  // Generate timeline segments using MINUTE precision for working hours (for team-specific overtime)
  const generateVisibleTimelineSegmentsMinutes = (forWorkingMinutes: { startMinutes: number; endMinutes: number }): TimelineSegment[] => {
    const segments: TimelineSegment[] = [];
    
    // Check if this is a zero-capacity day (e.g., weekend without overtime)
    const isZeroCapacityDay = forWorkingMinutes.startMinutes >= forWorkingMinutes.endMinutes;
    
    // For zero-capacity days, skip break handling entirely
    // For weekends, filter breaks based on working hours:
    // - Only show breaks that END before the working hours end
    // - Lunch on weekends only shown if working past 15:00 (900 minutes)
    const filteredBreaks = isZeroCapacityDay ? [] : breakSlots.filter(b => {
      const breakStart = b.startHour * 60 + b.startMinute;
      const breakEnd = breakStart + getBreakDurationMinutes(b);
      
      // Break must end before or at working hours end
      if (breakEnd > forWorkingMinutes.endMinutes) {
        return false;
      }
      
      // Break must start after or at working hours start
      if (breakStart < forWorkingMinutes.startMinutes) {
        return false;
      }
      
      // Weekend-specific rule: Lunch only taken if working PAST 15:00
      // Morning tea is always taken, but lunch only if end time > 15:00 (900 minutes)
      if (isWeekendDay && b.label.toLowerCase().includes('lunch')) {
        return forWorkingMinutes.endMinutes > 900;
      }
      
      return true;
    });
    
    const sortedBreaks = [...filteredBreaks].sort((a, b) => 
      (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute)
    );
    
    let currentMinute = visibleStartMinutes;
    
    while (currentMinute < visibleEndMinutes) {
      const breakAtThisPoint = sortedBreaks.find(b => {
        const breakStart = b.startHour * 60 + b.startMinute;
        return currentMinute === breakStart;
      });
      
      if (breakAtThisPoint) {
        const breakDuration = getBreakDurationMinutes(breakAtThisPoint);
        const hour = Math.floor(currentMinute / 60);
        const minute = currentMinute % 60;
        
        // Only add if break ends within visible range
        const breakEnd = Math.min(currentMinute + breakDuration, visibleEndMinutes);
        const visibleBreakDuration = breakEnd - currentMinute;
        
        // Break is only "working" if it falls within the team's working minutes
        const isWithinWorkingMinutes = currentMinute >= forWorkingMinutes.startMinutes && currentMinute < forWorkingMinutes.endMinutes;
        
        if (visibleBreakDuration > 0) {
          segments.push({
            startMinutes: currentMinute,
            durationMinutes: visibleBreakDuration,
            label: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${breakAtThisPoint.label}`,
            isBreak: true,
            isWorking: isWithinWorkingMinutes,
            backgroundColor: isWithinWorkingMinutes ? breakAtThisPoint.color : 'rgba(0, 0, 0, 0.06)',
            breakSlot: breakAtThisPoint
          });
        }
        
        currentMinute += breakDuration;
        continue;
      }
      
      let segmentEnd = visibleEndMinutes;
      
      for (const b of sortedBreaks) {
        const breakStart = b.startHour * 60 + b.startMinute;
        if (breakStart > currentMinute && breakStart < segmentEnd) {
          segmentEnd = breakStart;
        }
      }
      
      // Also break at working hour boundaries for proper coloring
      if (forWorkingMinutes.startMinutes > currentMinute && forWorkingMinutes.startMinutes < segmentEnd) {
        segmentEnd = forWorkingMinutes.startMinutes;
      }
      if (forWorkingMinutes.endMinutes > currentMinute && forWorkingMinutes.endMinutes < segmentEnd) {
        segmentEnd = forWorkingMinutes.endMinutes;
      }
      
      const nextHourBoundary = (Math.floor(currentMinute / 60) + 1) * 60;
      if (nextHourBoundary < segmentEnd) {
        segmentEnd = nextHourBoundary;
      }
      
      const segmentDuration = segmentEnd - currentMinute;
      const hour = Math.floor(currentMinute / 60);
      const minute = currentMinute % 60;
      
      // Use minute-precision comparison for working status
      const isWorking = currentMinute >= forWorkingMinutes.startMinutes && currentMinute < forWorkingMinutes.endMinutes;
      
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

  // For weekends without any team having overtime, show all hours as non-working
  const isNonWorkingWeekend = isWeekendDay && !anyTeamHasOvertime;
  const timelineSegments = generateVisibleTimelineSegments(undefined, isNonWorkingWeekend);
  const totalTimelineHeight = visibleDurationMinutes * PlannerV2.PIXELS_PER_MINUTE;

  // Calculate unallocated job totals for the separate panel
  const unallocatedEFinks = unallocatedJobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);

  return (
    <Stack styles={{ root: { padding: '20px 20px 20px 0', height: '100%', overflow: 'hidden' } }}>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 20 }} styles={{ root: { marginBottom: 20, flexShrink: 0 } }}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          {formatDate(dayStr)}
        </Text>
        <Text variant="small" styles={{ root: { color: '#666', backgroundColor: '#f3f2f1', padding: '4px 8px', borderRadius: 4 } }}>
          80 E-Finks = 8h 45m (standard day) | Drag bottom edge to resize blocks | Toggle overtime per team
        </Text>
      </Stack>

      {/* Main layout: Planner grid + Unallocated column attached on right */}
      <div style={{ display: 'flex', flex: 1, overflow: 'auto' }}>
        {/* Planner grid (time column + team columns) */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Time header column */}
          <Stack styles={{ root: { width: 100, flexShrink: 0, borderRight: '1px solid #ddd' } }}>
            {/* Merged blank cell spanning OT toggles + team header height (24 Early OT + 24 Late OT + 50 Team header = 98px, all border-box) */}
            <div style={{ 
              height: 98,
              minHeight: 98,
              flexShrink: 0,
              backgroundColor: '#f5f5f5', 
              borderBottom: '1px solid #ddd',
              boxSizing: 'border-box'
            }}></div>
            <div style={{ position: 'relative', height: totalTimelineHeight, minHeight: totalTimelineHeight, flexShrink: 0 }}>
              {/* Background segments without borders */}
              {timelineSegments.map((segment, idx) => (
                <Stack
                  key={`time-${idx}-${segment.startMinutes}`}
                  styles={{
                    root: {
                      position: 'absolute',
                      top: (segment.startMinutes - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE,
                      left: 0,
                      right: 0,
                      height: segment.durationMinutes * PlannerV2.PIXELS_PER_MINUTE,
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
              {/* Hour lines - matching the grid columns exactly */}
              {Array.from({ length: visibleTimeRange.endHour - visibleTimeRange.startHour + 1 }, (_, idx) => {
                const hour = visibleTimeRange.startHour + idx;
                const minutes = hour * 60;
                if (minutes < visibleStartMinutes || minutes > visibleEndMinutes) return null;
                const isWorkingHour = workingHours && hour >= workingHours.start && hour < workingHours.end;
                return (
                  <div
                    key={`time-hour-${hour}`}
                    style={{
                      position: 'absolute',
                      top: (minutes - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE,
                      left: 0,
                      right: 0,
                      height: 1,
                      backgroundColor: isWorkingHour ? '#ddd' : 'rgba(0,0,0,0.08)'
                    }}
                  />
                );
              })}
            </div>
          </Stack>

          {/* Jig team columns */}
        {jigTeams.map(jig => {
          const jigJobs = getJobsForDateAndJig(dayStr, jig.id);
          const jigEFinks = jigJobs.reduce((sum, j) => sum + (j.segmentEfinks ?? j.estimatedEFinks), 0);
          const totalMinutes = jigJobs.reduce((sum, j) => sum + getJobDurationMinutes(j), 0);
          const teamOvertime = getTeamOvertime(jig.id);
          
          // Calculate per-team working hours in MINUTES for 30-minute precision
          // Weekend handling: if weekend and no overtime, zero capacity
          // Get weekend defaults from schedulerConfig
          const weekendDefaultStart = schedulerConfig?.weekendOvertimeDefaults?.startTime ?? 420;
          const weekendDefaultEnd = schedulerConfig?.weekendOvertimeDefaults?.endTime ?? 900;
          
          const teamWorkingMinutes = (() => {
            if (isWeekendDay) {
              if (!teamOvertime.enabled) {
                // Weekend with no overtime = zero capacity (completely non-working)
                return { startMinutes: weekendDefaultStart, endMinutes: weekendDefaultStart }; // Same value = no working hours
              }
              // Weekend with overtime: use team-specific times or fall back to settings defaults
              return {
                startMinutes: teamOvertime.earlyStartTime ?? weekendDefaultStart,
                endMinutes: teamOvertime.closeTime ?? weekendDefaultEnd
              };
            }
            // Weekday: normal calculation
            return baseWorkingHours ? {
              startMinutes: teamOvertime.earlyEnabled && teamOvertime.earlyStartTime !== undefined
                ? teamOvertime.earlyStartTime
                : Math.min(baseWorkingHours.start * 60, MIN_WEEKDAY_WORK_START_MINUTES),
              endMinutes: teamOvertime.enabled && teamOvertime.closeTime !== undefined
                ? teamOvertime.closeTime
                : Math.max(baseWorkingHours.end * 60, MIN_WEEKDAY_WORK_END_MINUTES)
            } : {
              startMinutes: Math.min(workingHours.start * 60, MIN_WEEKDAY_WORK_START_MINUTES),
              endMinutes: Math.max(workingHours.end * 60, MIN_WEEKDAY_WORK_END_MINUTES)
            };
          })();
          const teamTimelineHeight = visibleDurationMinutes * PlannerV2.PIXELS_PER_MINUTE;
          
          // Generate team-specific timeline segments with overtime using minute precision
          const teamTimelineSegments = generateVisibleTimelineSegmentsMinutes(teamWorkingMinutes);

          return (
            <Stack key={jig.id} styles={{ root: { flex: '1 1 0', minWidth: 120, borderRight: '1px solid #ddd' } }}>
              {/* Fixed-height header container to match time column (98px) */}
              <div style={{ height: 98, minHeight: 98, flexShrink: 0, boxSizing: 'border-box' }}>
                {isWeekendDay ? (
                  <>
                    {/* Weekend Work toggle - single row with start/end time */}
                    <Stack
                      horizontal
                      verticalAlign="center"
                      horizontalAlign="center"
                      tokens={{ childrenGap: 4 }}
                      styles={{
                        root: {
                          height: 24,
                          padding: '2px 8px',
                          backgroundColor: teamOvertime.enabled ? '#9c27b0' : '#bdbdbd',
                          borderBottom: '1px solid rgba(0,0,0,0.1)',
                          boxSizing: 'border-box'
                        }
                      }}
                    >
                      <Toggle
                        checked={teamOvertime.enabled}
                        onChange={(_, checked) => {
                          if (checked) {
                            // Use weekend defaults from settings
                            onTeamOvertimeChange?.(dayStr, jig.id, true, weekendDefaultEnd);
                            onTeamEarlyOvertimeChange?.(dayStr, jig.id, true, weekendDefaultStart);
                          } else {
                            onTeamOvertimeChange?.(dayStr, jig.id, false, weekendDefaultEnd);
                            onTeamEarlyOvertimeChange?.(dayStr, jig.id, false, weekendDefaultStart);
                          }
                        }}
                        styles={{
                          root: { marginBottom: 0 },
                          pill: { 
                            backgroundColor: teamOvertime.enabled ? '#7b1fa2' : '#999',
                            border: 'none',
                            width: 28,
                            height: 12
                          },
                          thumb: { backgroundColor: 'white', width: 8, height: 8 }
                        }}
                      />
                      <Text variant="tiny" styles={{ root: { color: teamOvertime.enabled ? 'white' : '#666', fontWeight: 600, fontSize: 9 } }}>
                        Weekend Work
                      </Text>
                    </Stack>
                    {/* Weekend time selection row */}
                    <Stack
                      horizontal
                      verticalAlign="center"
                      horizontalAlign="center"
                      tokens={{ childrenGap: 4 }}
                      styles={{
                        root: {
                          height: 24,
                          padding: '2px 8px',
                          backgroundColor: teamOvertime.enabled ? '#e1bee7' : '#e0e0e0',
                          borderBottom: '1px solid #ccc',
                          boxSizing: 'border-box'
                        }
                      }}
                    >
                      {teamOvertime.enabled ? (
                        <>
                          <Dropdown
                            selectedKey={minutesToTimeString(teamOvertime.earlyStartTime ?? weekendDefaultStart)}
                            onChange={(_, option) => option && handleTeamEarlyOvertimeStartTimeChange(jig.id, option.key as string)}
                            options={(() => {
                              const options: IDropdownOption[] = [];
                              for (let hour = 5; hour <= 12; hour++) {
                                options.push({ key: `${hour.toString().padStart(2, '0')}:00`, text: `${hour.toString().padStart(2, '0')}:00` });
                                options.push({ key: `${hour.toString().padStart(2, '0')}:30`, text: `${hour.toString().padStart(2, '0')}:30` });
                              }
                              return options;
                            })()}
                            styles={{
                              root: { minWidth: 50 },
                              title: { backgroundColor: 'rgba(0,0,0,0.1)', color: '#4a148c', border: 'none', fontSize: 9, padding: '1px 4px', height: 18, lineHeight: '16px' },
                              caretDown: { color: '#4a148c', fontSize: 9 },
                              dropdown: { minWidth: 50 }
                            }}
                          />
                          <Text variant="tiny" styles={{ root: { color: '#4a148c', fontSize: 9 } }}>to</Text>
                          <Dropdown
                            selectedKey={minutesToTimeString(teamOvertime.closeTime ?? weekendDefaultEnd)}
                            onChange={(_, option) => option && handleTeamOvertimeCloseTimeChange(jig.id, option.key as string)}
                            options={(() => {
                              const options: IDropdownOption[] = [];
                              for (let hour = 12; hour <= 20; hour++) {
                                options.push({ key: `${hour.toString().padStart(2, '0')}:00`, text: `${hour.toString().padStart(2, '0')}:00` });
                                options.push({ key: `${hour.toString().padStart(2, '0')}:30`, text: `${hour.toString().padStart(2, '0')}:30` });
                              }
                              return options;
                            })()}
                            styles={{
                              root: { minWidth: 50 },
                              title: { backgroundColor: 'rgba(0,0,0,0.1)', color: '#4a148c', border: 'none', fontSize: 9, padding: '1px 4px', height: 18, lineHeight: '16px' },
                              caretDown: { color: '#4a148c', fontSize: 9 },
                              dropdown: { minWidth: 50 }
                            }}
                          />
                        </>
                      ) : (
                        <Text variant="tiny" styles={{ root: { color: '#999', fontStyle: 'italic', fontSize: 9 } }}>
                          Non-working day
                        </Text>
                      )}
                    </Stack>
                  </>
                ) : (
                  <>
                    {/* Weekday Early OT row - 24px height */}
                    <Stack
                      horizontal
                      verticalAlign="center"
                      horizontalAlign="center"
                      tokens={{ childrenGap: 4 }}
                      styles={{
                        root: {
                          height: 24,
                          padding: '2px 8px',
                          backgroundColor: teamOvertime.earlyEnabled ? '#81c784' : '#e0e0e0',
                          borderBottom: '1px solid rgba(0,0,0,0.1)',
                          boxSizing: 'border-box'
                        }
                      }}
                    >
                      <Toggle
                        checked={teamOvertime.earlyEnabled ?? false}
                        onChange={(_, checked) => handleTeamEarlyOvertimeToggle(jig.id, !!checked)}
                        styles={{
                          root: { marginBottom: 0 },
                          pill: { 
                            backgroundColor: teamOvertime.earlyEnabled ? '#4caf50' : '#999',
                            border: 'none',
                            width: 28,
                            height: 12
                          },
                          thumb: { backgroundColor: 'white', width: 8, height: 8 }
                        }}
                      />
                      <Text variant="tiny" styles={{ root: { color: teamOvertime.earlyEnabled ? '#1b5e20' : '#666', fontWeight: 500, fontSize: 9 } }}>
                        Early
                      </Text>
                      {teamOvertime.earlyEnabled && baseWorkingHours && (
                        <Dropdown
                          selectedKey={minutesToTimeString(teamOvertime.earlyStartTime ?? defaultEarlyStartTime)}
                          onChange={(_, option) => option && handleTeamEarlyOvertimeStartTimeChange(jig.id, option.key as string)}
                          options={(() => {
                            const options: IDropdownOption[] = [];
                            for (let hour = 4; hour < baseWorkingHours.start; hour++) {
                              options.push({ key: `${hour.toString().padStart(2, '0')}:00`, text: `${hour.toString().padStart(2, '0')}:00` });
                              options.push({ key: `${hour.toString().padStart(2, '0')}:30`, text: `${hour.toString().padStart(2, '0')}:30` });
                            }
                            return options;
                          })()}
                          styles={{
                            root: { minWidth: 55 },
                            title: { 
                              backgroundColor: 'rgba(0,0,0,0.1)', 
                              color: '#1b5e20', 
                              border: 'none',
                              fontSize: 9,
                              padding: '1px 4px',
                              height: 18,
                              lineHeight: '16px'
                            },
                            caretDown: { color: '#1b5e20', fontSize: 9 },
                            dropdown: { minWidth: 55 }
                          }}
                        />
                      )}
                    </Stack>
                    {/* Weekday Late OT row - 24px height + 1px border = 25px total */}
                    <Stack
                      horizontal
                      verticalAlign="center"
                      horizontalAlign="center"
                      tokens={{ childrenGap: 4 }}
                      styles={{
                        root: {
                          height: 24,
                          padding: '2px 8px',
                          backgroundColor: teamOvertime.enabled ? '#ffc107' : '#e0e0e0',
                          borderBottom: '1px solid #ccc',
                          boxSizing: 'border-box'
                        }
                      }}
                    >
                      <Toggle
                        checked={teamOvertime.enabled}
                        onChange={(_, checked) => handleTeamOvertimeToggle(jig.id, !!checked)}
                        styles={{
                          root: { marginBottom: 0 },
                          pill: { 
                            backgroundColor: teamOvertime.enabled ? '#ff9800' : '#999',
                            border: 'none',
                            width: 28,
                            height: 12
                          },
                          thumb: { backgroundColor: 'white', width: 8, height: 8 }
                        }}
                      />
                      <Text variant="tiny" styles={{ root: { color: teamOvertime.enabled ? '#333' : '#666', fontWeight: 500, fontSize: 9 } }}>
                        Late
                      </Text>
                      {teamOvertime.enabled && baseWorkingHours && (
                        <Dropdown
                          selectedKey={minutesToTimeString(teamOvertime.closeTime)}
                          onChange={(_, option) => option && handleTeamOvertimeCloseTimeChange(jig.id, option.key as string)}
                          options={(() => {
                            const options: IDropdownOption[] = [];
                            for (let hour = isFridayDay ? 16 : baseWorkingHours.end; hour <= 23; hour++) {
                              if (hour === (isFridayDay ? 16 : baseWorkingHours.end)) {
                                options.push({ key: `${hour.toString().padStart(2, '0')}:30`, text: `${hour.toString().padStart(2, '0')}:30` });
                              } else {
                                options.push({ key: `${hour.toString().padStart(2, '0')}:00`, text: `${hour.toString().padStart(2, '0')}:00` });
                                options.push({ key: `${hour.toString().padStart(2, '0')}:30`, text: `${hour.toString().padStart(2, '0')}:30` });
                              }
                            }
                            options.push({ key: '00:00', text: '00:00' });
                            return options;
                          })()}
                          styles={{
                            root: { minWidth: 55 },
                            title: { 
                              backgroundColor: 'rgba(0,0,0,0.1)', 
                              color: '#333', 
                              border: 'none',
                              fontSize: 9,
                              padding: '1px 4px',
                              height: 18,
                              lineHeight: '16px'
                            },
                            caretDown: { color: '#333', fontSize: 9 },
                            dropdown: { minWidth: 55 }
                          }}
                        />
                      )}
                    </Stack>
                  </>
                )}
              
              {/* Jig header - fixed height with border-box */}
              <Stack
                onClick={() => onTeamDoubleClick(jig.id)}
                styles={{
                  root: {
                    height: 50,
                    padding: '8px 12px',
                    backgroundColor: teamOvertime.enabled ? '#005a9e' : '#0078d4',
                    color: 'white',
                    borderBottom: '1px solid #ddd',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
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
              </div>

              {/* Timeline background with break slots */}
              <div
                onDragOver={(e) => handleTimelineDragOver(e, jig.id, visibleStartMinutes, teamWorkingMinutes.endMinutes)}
                onDragLeave={handleTimelineDragLeave}
                onDrop={(e) => handleTimelineDrop(e, jig.id, visibleStartMinutes, teamWorkingMinutes.endMinutes)}
                style={{
                  position: 'relative',
                  height: teamTimelineHeight,
                  minHeight: teamTimelineHeight,
                  flexShrink: 0,
                  borderBottom: '1px solid #ddd',
                  overflow: 'hidden',
                  backgroundColor: isDragging && dropHoverJigId === jig.id ? 'rgba(0, 120, 212, 0.05)' : undefined
                }}
              >
                {/* Timeline segments background - uses team-specific segments for overtime */}
                {teamTimelineSegments.map((segment, idx) => (
                  <div
                    key={`${jig.id}-bg-${idx}-${segment.startMinutes}`}
                    style={{
                      position: 'absolute',
                      top: (segment.startMinutes - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE,
                      left: 0,
                      right: 0,
                      height: segment.durationMinutes * PlannerV2.PIXELS_PER_MINUTE,
                      borderBottom: segment.isWorking || segment.isBreak ? '1px solid #ddd' : '1px solid rgba(0,0,0,0.08)',
                      backgroundColor: segment.backgroundColor,
                      boxSizing: 'border-box'
                    }}
                  />
                ))}

                {/* Hour lines - solid lines at each hour within visible range */}
                {Array.from({ length: visibleTimeRange.endHour - visibleTimeRange.startHour + 1 }, (_, idx) => {
                  const hour = visibleTimeRange.startHour + idx;
                  const minutes = hour * 60;
                  if (minutes < visibleStartMinutes || minutes > visibleEndMinutes) return null;
                  return (
                    <div
                      key={`${jig.id}-hour-${hour}`}
                      style={{
                        position: 'absolute',
                        top: (minutes - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE,
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

                {/* 10-minute interval lines - dotted lines within visible range */}
                {Array.from({ length: (visibleTimeRange.endHour - visibleTimeRange.startHour) * 6 }, (_, idx) => {
                  const minutes = visibleTimeRange.startHour * 60 + (idx + 1) * 10;
                  if (minutes % 60 === 0) return null;
                  if (minutes > visibleEndMinutes || minutes < visibleStartMinutes) return null;
                  return (
                    <div
                      key={`${jig.id}-10min-${idx}`}
                      style={{
                        position: 'absolute',
                        top: (minutes - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE,
                        left: 0,
                        right: 0,
                        height: 1,
                        borderTop: '1px dotted rgba(0, 0, 0, 0.12)',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }}
                    />
                  );
                })}

                {/* Drop indicator - follows the cursor-derived grid time */}
                {isDragging && dropHoverJigId === jig.id && (() => {
                  if (dropHoverPosition === null) return null;
                  
                  return (
                    <div
                      key="drop-indicator"
                      style={{
                        position: 'absolute',
                        top: (dropHoverPosition - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE - 2,
                        left: 4,
                        right: 4,
                        height: 4,
                        backgroundColor: '#0078d4',
                        borderRadius: 2,
                        zIndex: 500,
                        boxShadow: '0 0 8px rgba(0, 120, 212, 0.5)',
                        transition: 'top 0.1s ease-out'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        left: -6,
                        top: -4,
                        width: 12,
                        height: 12,
                        backgroundColor: '#0078d4',
                        borderRadius: '50%'
                      }} />
                      <div style={{
                        position: 'absolute',
                        right: -6,
                        top: -4,
                        width: 12,
                        height: 12,
                        backgroundColor: '#0078d4',
                        borderRadius: '50%'
                      }} />
                    </div>
                  );
                })()}

                {/* Schedule blocks - rendered below jobs */}
                {teamWorkingMinutes && scheduleBlocks
                  .filter(block => block.teamId === null || block.teamId === jig.id)
                  .map(block => {
                    const blockTop = (block.startTimeMinutes - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE;
                    const blockHeight = (block.endTimeMinutes - block.startTimeMinutes) * PlannerV2.PIXELS_PER_MINUTE;
                    const blockColor = SCHEDULE_BLOCK_COLORS[block.blockType];
                    const blockLabel = SCHEDULE_BLOCK_LABELS[block.blockType];
                    
                    const formatBlockTime = (minutes: number): string => {
                      const hours = Math.floor(minutes / 60);
                      const mins = minutes % 60;
                      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                    };
                    
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
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '4px 6px',
                          overflow: 'hidden',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                        }}
                        title={`${blockLabel}${block.description ? `: ${block.description}` : ''}\n${formatBlockTime(block.startTimeMinutes)} - ${formatBlockTime(block.endTimeMinutes)}`}
                      >
                        <Text variant="tiny" styles={{ root: { fontWeight: 600, color: '#333', lineHeight: 1.2 } }}>
                          {blockLabel}
                        </Text>
                        {blockHeight > 30 && (
                          <Text variant="tiny" styles={{ root: { color: '#555', fontSize: 10 } }}>
                            {formatBlockTime(block.startTimeMinutes)} - {formatBlockTime(block.endTimeMinutes)}
                          </Text>
                        )}
                        {blockHeight > 50 && block.description && (
                          <Text variant="tiny" styles={{ root: { color: '#666', fontSize: 10, marginTop: 2 } }}>
                            {block.description}
                          </Text>
                        )}
                      </div>
                    );
                  })}

                {/* Job blocks */}
                {calculateJobPositions(jigJobs, true, teamWorkingMinutes.endMinutes).map(({ job, top, height, baseHeight, breakAdditions }) => {
                    const isStaged = (job as Job & { isStaged?: boolean }).isStaged === true;
                    const isBatchedJob = !!(job.isBatchedJob);
                    const interactionKey = getJobInteractionKey(job);
                    const renderKey = getJobRenderKey(job);
                    
                    // Separate Type B blocks (Breakdown, Material Shortage) from regular breaks
                    const typeBBlockLabels = ['Breakdown', 'Material Shortage'];
                    const typeBAdditions = breakAdditions.filter(b => typeBBlockLabels.includes(b.label));
                    const regularBreakAdditions = breakAdditions.filter(b => !typeBBlockLabels.includes(b.label));
                    const hasTypeBBlocks = typeBAdditions.length > 0;
                    
                    const getBackground = () => {
                      if (job.productionComplete) return 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))';
                      if (isBatchedJob) return 'linear-gradient(135deg, rgba(16, 124, 16, 0.9), rgba(0, 100, 0, 0.8))';
                      if (isStaged) return 'linear-gradient(135deg, rgba(0, 120, 212, 0.25), rgba(0, 90, 180, 0.15))';
                      return 'linear-gradient(135deg, rgba(0, 120, 212, 0.85), rgba(0, 90, 180, 0.75))';
                    };
                    
                    const getBorder = () => {
                      if (job.productionComplete) return '1px solid rgba(180, 180, 180, 0.6)';
                      if (isBatchedJob) return '2px solid rgba(34, 177, 76, 0.8)';
                      if (isStaged) return '2px dashed rgba(0, 120, 212, 0.7)';
                      return '1px solid rgba(255, 255, 255, 0.3)';
                    };
                    
                    const getBoxShadow = () => {
                      if (dragOverJobId === interactionKey) return '0 0 0 3px #107c10, 0 4px 16px rgba(16, 124, 16, 0.5)';
                      if (isBatchedJob && !job.productionComplete) return '0 4px 12px rgba(16, 124, 16, 0.4), inset 0 1px 0 rgba(255,255,255,0.25), 4px 4px 0 -2px rgba(16, 124, 16, 0.3), 6px 6px 0 -4px rgba(16, 124, 16, 0.2)';
                      if (job.productionComplete) return '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)';
                      if (isStaged) return '0 2px 8px rgba(0, 120, 212, 0.2)';
                      return '0 4px 12px rgba(0, 120, 212, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)';
                    };
                    
                    const getTextColor = () => {
                      if (job.productionComplete) return '#555';
                      if (isStaged) return '#0078D4';
                      return 'white';
                    };
                    
                    const canInteract = !resizingJob;
                    const isActiveEditingJob = activeEditingJobId === interactionKey || resizingJob === interactionKey;
                    const jobZIndex = isActiveEditingJob ? 1200 : (isStaged ? 800 : 10);
                    const blockTopPx = Math.max(0, (top - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE);
                    const blockHeightPx = Math.max(0, Math.min(height, teamTimelineHeight - blockTopPx));
                    const controlPosition = blockHeightPx > 140
                      ? { top: 16, bottom: 'auto' as const }
                      : { top: 'auto' as const, bottom: 16 };

                    if (!Number.isFinite(blockTopPx) || !Number.isFinite(blockHeightPx) || blockHeightPx <= 0) {
                      return null;
                    }
                    
                    return (
                      <div
                        key={renderKey}
                        data-planner-job-card="true"
                        data-job-id={job.id}
                        data-schedule-key={interactionKey}
                        data-jig-id={jig.id}
                        data-date={dayStr}
                        draggable={canInteract}
                        onMouseDown={() => {
                          if (isStaged && !job.productionComplete) {
                            setActiveEditingJobId(interactionKey);
                          }
                        }}
                        onDragStart={() => {
                          if (!canInteract) return;
                          clearDragPreview();
                          onDragStart(interactionKey);
                        }}
                        onDragEnd={() => {
                          clearDragPreview();
                          onDragEnd?.();
                        }}
                        onDoubleClick={() => {
                          if (isBatchedJob && onManageBatch) {
                            onManageBatch(job.id);
                          } else {
                            onJobDoubleClick(job.id);
                          }
                        }}
                        onDragOver={(e) => {
                          if (!job.productionComplete && !isStaged) {
                            e.preventDefault();
                            e.stopPropagation();
                            const timelineElement = e.currentTarget.parentElement;
                            if (timelineElement) {
                              const rect = timelineElement.getBoundingClientRect();
                              const y = e.clientY - rect.top;
                              const snapMinutes = Math.max(1, schedulerConfig?.durationRoundingIncrement ?? PlannerV2.QUARTER_HOUR);
                              const rawDropMinutes = y / PlannerV2.PIXELS_PER_MINUTE + visibleStartMinutes;
                              const dropMinutes = Math.round(rawDropMinutes / snapMinutes) * snapMinutes;
                              setDropHoverJigId(jig.id);
                              setDropHoverPosition(dropMinutes);
                            }
                          }
                        }}
                        onDragLeave={(e) => {
                          e.stopPropagation();
                          setDragOverJobId(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!job.productionComplete && !isStaged && draggedJobId && draggedJobId !== interactionKey) {
                            clearDragPreview();

                            const timelineElement = e.currentTarget.parentElement;
                            if (timelineElement) {
                              const rect = timelineElement.getBoundingClientRect();
                              const y = e.clientY - rect.top;
                              const snapMinutes = Math.max(1, schedulerConfig?.durationRoundingIncrement ?? PlannerV2.QUARTER_HOUR);
                              const rawDropMinutes = y / PlannerV2.PIXELS_PER_MINUTE + visibleStartMinutes;
                              const snappedPosition = Math.round(rawDropMinutes / snapMinutes) * snapMinutes;
                              onDrop(dayStr, jig.id, snappedPosition);
                            } else {
                              onDrop(dayStr, jig.id, job.plannedStartTime ?? visibleStartMinutes);
                            }
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: blockTopPx,
                          left: hasTypeBBlocks ? 20 : 4,
                          right: 4,
                          height: blockHeightPx,
                          padding: 8,
                          boxSizing: 'border-box',
                          background: getBackground(),
                          color: getTextColor(),
                          borderRadius: 6,
                          border: getBorder(),
                          cursor: resizingJob ? 'ns-resize' : 'grab',
                          zIndex: jobZIndex,
                          boxShadow: isActiveEditingJob
                            ? '0 0 0 3px rgba(0, 120, 212, 0.35), 0 10px 28px rgba(0, 0, 0, 0.28)'
                            : getBoxShadow(),
                          opacity: job.productionComplete ? 0.7 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: isActiveEditingJob ? 'visible' : 'hidden',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        {dragOverJobId === interactionKey && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: '#107c10',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: 8,
                            fontSize: 14,
                            fontWeight: 700,
                            zIndex: 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                          }}>
                            + COMBINE
                          </div>
                        )}
                        {/* BATCH badge for batched jobs */}
                        {isBatchedJob && !job.productionComplete && (
                          <div style={{
                            position: 'absolute',
                            top: 2,
                            left: 2,
                            backgroundColor: 'rgba(34, 177, 76, 0.9)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 9,
                            fontWeight: 600,
                            zIndex: 300,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            pointerEvents: 'none'
                          }}>
                            📦 BATCH
                          </div>
                        )}
                        {/* Reset icon for manually resized jobs */}
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
                              onJobDurationReset(interactionKey);
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
                            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 6 }}>
                              <Text variant="small" styles={{ root: { color: getTextColor(), fontWeight: 600 } }}>
                                {job.orderNumber}{job.productionComplete ? ' (Complete)' : ''}{isStaged ? ' (Edit Mode)' : ''}
                              </Text>
                              {job.totalSegments && job.totalSegments > 1 && (
                                <Text variant="tiny" styles={{ 
                                  root: { 
                                    backgroundColor: isStaged ? 'rgba(255, 140, 0, 0.6)' : 'rgba(255, 140, 0, 0.9)',
                                    color: 'white',
                                    padding: '1px 4px',
                                    borderRadius: 3,
                                    fontSize: 9,
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap'
                                  } 
                                }}>
                                  Day {(job.segmentIndex ?? 0) + 1}/{job.totalSegments}
                                </Text>
                              )}
                            </Stack>
                            <Text variant="tiny" styles={{ root: { color: isStaged ? 'rgba(0, 120, 212, 0.8)' : (job.productionComplete ? '#666' : 'white') } }}>
                              {job.customer}
                            </Text>
                            {job.name && !job.name.includes('(Rollover)') && !job.name.includes('(Roll Over)') && (
                              <Text variant="tiny" styles={{ root: { color: isStaged ? 'rgba(0, 120, 212, 0.7)' : (job.productionComplete ? '#888' : 'rgba(255,255,255,0.85)'), fontSize: 11, fontStyle: 'italic' } }}>
                                {job.name}
                              </Text>
                            )}
                          </Stack>
                        </Stack>
                        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }} wrap>
                          <Text variant="tiny" styles={{ root: { color: isStaged ? 'rgba(0, 120, 212, 0.9)' : (job.productionComplete ? '#999' : 'rgba(255,255,255,0.8)'), fontWeight: 600 } }}>
                            {job.totalSegments && job.totalSegments > 1 
                              ? `${Math.round((job.segmentEfinks ?? 0) * 100) / 100} E-Finks (of ${job.estimatedEFinks})`
                              : `${job.estimatedEFinks} E-Finks`
                            }
                          </Text>
                          <Text variant="tiny" styles={{ root: { color: isStaged ? 'rgba(0, 120, 212, 0.7)' : (job.productionComplete ? '#999' : 'rgba(255,255,255,0.7)') } }}>
                            {(() => {
                              const totalAdditions = breakAdditions.reduce((sum, b) => sum + b.minutes, 0);
                              if (totalAdditions === 0) {
                                return `(${formatDuration(getBaseDurationMinutes(job))})`;
                              }
                              
                              // Build description parts
                              const parts: string[] = [];
                              const regularBreakMins = regularBreakAdditions.reduce((sum, b) => sum + b.minutes, 0);
                              if (regularBreakMins > 0) {
                                parts.push(`${regularBreakMins}m breaks`);
                              }
                              
                              // Add Type B blocks with their specific labels
                              typeBAdditions.forEach(b => {
                                parts.push(`${b.minutes}m ${b.label}`);
                              });
                              
                              return `(${formatDuration(getBaseDurationMinutes(job) + totalAdditions)} total: ${formatDuration(getBaseDurationMinutes(job))} work + ${parts.join(' + ')})`;
                            })()}
                          </Text>
                        </Stack>

                        {(() => {
                          const summary = job.timingSummary;
                          const actualDurationMinutes = summary?.actualDurationMinutes ?? job.actualDurationMinutes;
                          const activeStartedAt = summary?.activeEntry?.startedAt;
                          const actualStartTime = activeStartedAt ?? summary?.latestEntry?.startedAt ?? summary?.actualStartTime ?? job.actualStartTime;
                          const actualEndTime = activeStartedAt ? null : summary?.latestEntry?.endedAt ?? summary?.actualEndTime ?? job.actualEndTime;
                          const hasOverallTiming = Boolean(summary?.hasOverallTiming || actualStartTime || actualDurationMinutes != null);

                          if (!hasOverallTiming) return null;

                          const plannedMinutes = job.plannedDurationMinutes ?? getBaseDurationMinutes(job);
                          const activeStartedMs = activeStartedAt ? new Date(activeStartedAt).getTime() : NaN;
                          const activeElapsedMinutes = Number.isNaN(activeStartedMs)
                            ? 0
                            : Math.max(0, Math.round((Date.now() - activeStartedMs) / 60_000));
                          const completedMinutesBeforeActive = activeStartedAt && actualDurationMinutes != null
                            ? Math.max(0, actualDurationMinutes - activeElapsedMinutes)
                            : 0;

                          return (
                            <Stack tokens={{ childrenGap: 1 }} styles={{ root: { marginTop: 4 } }}>
                              <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#555' : 'rgba(255,255,255,0.95)', fontSize: 10, fontWeight: 700 } }}>
                                Actual {formatClockTime(actualStartTime)} - {activeStartedAt ? 'running' : formatClockTime(actualEndTime)}
                                {!activeStartedAt && actualDurationMinutes != null ? ` (${formatDuration(actualDurationMinutes)})` : ''}
                              </Text>
                              {activeStartedAt && (
                                <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#555' : 'rgba(255,255,255,0.95)', fontSize: 10, fontWeight: 700 } }}>
                                  Live elapsed <LiveElapsedText startedAt={activeStartedAt} completedMinutes={completedMinutesBeforeActive} />
                                </Text>
                              )}
                              <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'rgba(255,255,255,0.85)', fontSize: 10 } }}>
                                Planned {formatDuration(plannedMinutes)} · Efficiency {formatEfficiency(plannedMinutes, actualDurationMinutes)}
                              </Text>
                            </Stack>
                          );
                        })()}

                        {(() => {
                          const stageDurations = job.timingSummary?.stageDurations ?? job.stageDurations;
                          if (!stageDurations || stageDurations.totalLabourMinutes <= 0) return null;

                          return (
                            <Stack tokens={{ childrenGap: 1 }} styles={{ root: { marginTop: 4 } }}>
                              <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#555' : 'rgba(255,255,255,0.95)', fontSize: 10, fontWeight: 700 } }}>
                                Picking {formatDuration(stageDurations.pickingMinutes)} · Sawing {formatDuration(stageDurations.sawingMinutes)}
                              </Text>
                              <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'rgba(255,255,255,0.85)', fontSize: 10 } }}>
                                Production {formatDuration(stageDurations.productionMinutes)} · Total labour {formatDuration(stageDurations.totalLabourMinutes)}
                              </Text>
                            </Stack>
                          );
                        })()}
                        
                        {/* Save/Cancel buttons for staged jobs */}
                        {isStaged && (
                          <Stack horizontal tokens={{ childrenGap: 4 }} styles={{ root: { position: 'absolute', ...controlPosition, right: 8, zIndex: 5000, pointerEvents: 'auto' } }}>
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveEditingJobId(null);
                                onSaveStagedJob?.(job.id);
                              }}
                              style={{
                                position: 'relative',
                                padding: '2px 10px',
                                fontSize: 10,
                                fontWeight: 600,
                                backgroundColor: '#107C10',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                zIndex: 5001,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                              }}
                              title="Save this job allocation"
                            >
                              Save
                            </button>
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveEditingJobId(null);
                                onCancelStagedJob?.(job.id);
                              }}
                              style={{
                                position: 'relative',
                                padding: '2px 8px',
                                fontSize: 10,
                                fontWeight: 600,
                                backgroundColor: 'white',
                                color: '#0078D4',
                                border: '1px solid rgba(0, 120, 212, 0.5)',
                                borderRadius: 4,
                                cursor: 'pointer',
                                zIndex: 5001,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
                              }}
                              title="Cancel and remove from schedule"
                            >
                              Cancel
                            </button>
                          </Stack>
                        )}
                        
                        {/* Edit button for persisted jobs */}
                        {!isStaged && !job.productionComplete && onEditPersistedJob && job.jigId && (
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPersistedJob(job.id, job.jigId!, dayStr);
                            }}
                            style={{
                              position: 'absolute',
                              ...controlPosition,
                              right: 8,
                              padding: '2px 8px',
                              fontSize: 10,
                              fontWeight: 600,
                              backgroundColor: 'rgba(255, 255, 255, 0.25)',
                              color: 'white',
                              border: '1px solid rgba(255, 255, 255, 0.5)',
                              borderRadius: 4,
                              cursor: 'pointer',
                              zIndex: 50
                            }}
                            title="Edit: Clear WIP and recalculate segments based on current settings"
                          >
                            Edit
                          </button>
                        )}
                        {/* Resize handle - only in edit mode, on last segment of multi-day jobs, not completed */}
                        {isStaged && !job.productionComplete && (job.isLastSegment !== false) && (job.segmentIndex === undefined || job.segmentIndex === (job.totalSegments ?? 1) - 1) && (
                          <div
                            onMouseDown={(e) => handleResizeStart(e, job, baseHeight)}
                            style={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4,
                              right: 4,
                              height: 8,
                              cursor: 'ns-resize',
                              backgroundColor: resizingJob === interactionKey ? 'rgba(0,120,212,0.3)' : 'rgba(0,120,212,0.15)',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 5000,
                              pointerEvents: 'auto'
                            }}
                            title="Drag to resize"
                          >
                            <div style={{
                              width: 30,
                              height: 3,
                              backgroundColor: 'rgba(0,120,212,0.6)',
                              borderRadius: 2
                            }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </Stack>
          );
        })}
        </div>

        {/* Unallocated column - always visible on the right */}
        <Stack styles={{ root: { width: 200, flexShrink: 0, marginLeft: 8, borderLeft: '2px solid #c62828' } }}>
          {/* Unallocated header */}
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
              {unallocatedJobs.length} | {unallocatedEFinks} E-Finks
            </Text>
          </Stack>

          {/* Unallocated jobs - stacked compact cards with same timeline height */}
          <div
            onDragOver={onDragOver}
            onDrop={() => {
              clearDragPreview();
              onDrop(dayStr, null);
            }}
            style={{
              height: totalTimelineHeight,
              minHeight: totalTimelineHeight,
              flexShrink: 0,
              overflowY: 'auto',
              backgroundColor: '#ffebee',
              padding: 6,
              borderBottom: '1px solid #ddd'
            }}
          >
            {unallocatedJobs.length === 0 ? (
              <Text variant="small" styles={{ root: { color: '#999', fontStyle: 'italic', padding: 8 } }}>
                No unallocated jobs
              </Text>
            ) : (
              <Stack tokens={{ childrenGap: 4 }}>
                {unallocatedJobs.map(job => {
                  const isUnallocBatched = !!(job.isBatchedJob);
                  const getUnallocBackground = () => {
                    if (job.productionComplete) return 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))';
                    if (isUnallocBatched) return 'linear-gradient(135deg, rgba(16, 124, 16, 0.9), rgba(0, 100, 0, 0.8))';
                    return 'linear-gradient(135deg, rgba(198, 40, 40, 0.85), rgba(160, 30, 30, 0.75))';
                  };
                  const getUnallocBorder = () => {
                    if (job.productionComplete) return '1px solid rgba(180, 180, 180, 0.6)';
                    if (isUnallocBatched) return '2px solid rgba(34, 177, 76, 0.8)';
                    return '1px solid rgba(255, 255, 255, 0.3)';
                  };
                  const getUnallocShadow = () => {
                    if (job.productionComplete) return '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)';
                    if (isUnallocBatched) return '0 4px 12px rgba(16, 124, 16, 0.4), inset 0 1px 0 rgba(255,255,255,0.25), 4px 4px 0 -2px rgba(16, 124, 16, 0.3)';
                    return '0 4px 12px rgba(198, 40, 40, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)';
                  };
                  return (
                  <div
                    key={job.id}
                    draggable
                    onDragStart={() => {
                      clearDragPreview();
                      onDragStart(job.id);
                    }}
                    onDragEnd={() => {
                      clearDragPreview();
                      onDragEnd?.();
                    }}
                    onDoubleClick={() => {
                      if (isUnallocBatched && onManageBatch) {
                        onManageBatch(job.id);
                      } else {
                        onJobDoubleClick(job.id);
                      }
                    }}
                    style={{
                      padding: 8,
                      position: 'relative',
                      background: getUnallocBackground(),
                      color: job.productionComplete ? '#555' : 'white',
                      borderRadius: 6,
                      border: getUnallocBorder(),
                      cursor: 'grab',
                      boxShadow: getUnallocShadow(),
                      opacity: job.productionComplete ? 0.7 : 1
                    }}
                  >
                    {isUnallocBatched && !job.productionComplete && (
                      <div style={{
                        position: 'absolute',
                        top: 2,
                        left: 2,
                        backgroundColor: 'rgba(34, 177, 76, 0.9)',
                        color: 'white',
                        padding: '1px 4px',
                        borderRadius: 3,
                        fontSize: 8,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        pointerEvents: 'none'
                      }}>
                        📦 BATCH
                      </div>
                    )}
                    <Stack horizontal horizontalAlign="space-between" verticalAlign="start" style={{ marginTop: isUnallocBatched ? 14 : 0 }}>
                      <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600 } }}>
                        {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (R)' : ''}{job.productionComplete ? ' (Complete)' : ''}
                      </Text>
                    </Stack>
                    <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#777' : 'rgba(255,255,255,0.9)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                      {job.customer}
                    </Text>
                    {job.name && !job.name.includes('(Rollover)') && !job.name.includes('(Roll Over)') && (
                      <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#888' : 'rgba(255,255,255,0.85)', fontSize: 11, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                        {job.name}
                      </Text>
                    )}
                    <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.8)', fontWeight: 600 } }}>
                      {job.estimatedEFinks} E-Finks
                    </Text>
                  </div>
                  );
                })}
              </Stack>
            )}
          </div>
        </Stack>
      </div>

    </Stack>
  );
};

export const DayView = memo(DayViewComponent);
