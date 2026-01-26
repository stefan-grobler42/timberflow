import { Stack, Text, Spinner, Toggle, Dropdown, IconButton } from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { systemSettingsService, type SystemSettings } from '../../services/systemSettingsService';
import type { ScheduleBlock, ScheduleBlockType } from '../../services/millenniumServices';
import * as PlannerV2 from '../../domain/plannerV2';
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
  totalJobDuration?: number | null;
  segmentIndex?: number | null;
  totalSegments?: number | null;
  segmentEfinks?: number | null;
  segmentDuration?: number | null;
  segmentBreakMinutes?: number | null;
  isLastSegment?: boolean;
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

interface DayViewProps {
  dayStr: string;
  jobs: Job[];
  allJobs: Job[];
  jigTeams: Jig[];
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string, jigId: string | null, dropTimeMinutes?: number) => void;
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
  scheduleBlocks?: ScheduleBlock[];
  onBlockClick?: (block: ScheduleBlock) => void;
  schedulerConfig?: SchedulerConfig;
  stagedJobs?: StagedJob[];
  onSaveStagedJob?: (jobId: string) => void;
  onCancelStagedJob?: (jobId: string) => void;
  onEditPersistedJob?: (productionId: string, teamId: string, dateStr: string) => void;
}

const MIN_BLOCK_HEIGHT = 20;

const DayViewComponent: React.FC<DayViewProps> = ({
  dayStr,
  jobs,
  allJobs: _allJobs,
  jigTeams,
  onDragStart,
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
  scheduleBlocks = [],
  onBlockClick,
  schedulerConfig,
  stagedJobs = [],
  onSaveStagedJob,
  onCancelStagedJob,
  onEditPersistedJob
}) => {
  const [workingHours, setWorkingHours] = useState<{ start: number; end: number } | null>(null);
  const [baseWorkingHours, setBaseWorkingHours] = useState<{ start: number; end: number } | null>(null);
  const [breakSlots, setBreakSlots] = useState<BreakSlot[]>([]);
  const [baseBreakSlots, setBaseBreakSlots] = useState<BreakSlot[]>([]);
  const [dinnerBreakSlot, setDinnerBreakSlot] = useState<BreakSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [customDurations, setCustomDurations] = useState<Record<string, number>>({});
  const [resizingJob, setResizingJob] = useState<string | null>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const currentResizeDuration = useRef<number>(0);
  const [dropHoverJigId, setDropHoverJigId] = useState<string | null>(null);
  const [dropHoverPosition, setDropHoverPosition] = useState<number | null>(null);

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

  const calculateBreaksSpanned = (jobStartMinutes: number, baseDurationMinutes: number, teamWorkingEndMinutes?: number): BreakAddition[] => {
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
    
    // Sort breaks by start time and filter based on what the job actually spans
    // For weekends, apply special filtering logic
    const sortedBreaks = [...allPossibleBreaks]
      .filter(b => {
        const breakStart = b.startHour * 60 + b.startMinute;
        const breakEnd = breakStart + getBreakDurationMinutes(b);
        
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
      const breakEnd = breakStart + getBreakDurationMinutes(breakSlot);
      const breakDuration = getBreakDurationMinutes(breakSlot);
      
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
    if (customDurations[job.id]) {
      return PlannerV2.roundToQuarterHour(customDurations[job.id]);
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
  }, [customDurations]);

  const getJobDurationMinutes = useCallback((job: Job): number => {
    const baseDuration = getBaseDuration(job);
    const breakAdjustment = job.breakAdjustmentMinutes || 0;
    return baseDuration + breakAdjustment;
  }, [getBaseDuration]);

  const hasManualResize = useCallback((job: Job): boolean => {
    if (customDurations[job.id]) return true;
    return PlannerV2.isManuallyAltered({
      customDurationMinutes: job.customDurationMinutes,
      estimatedEFinks: job.estimatedEFinks
    });
  }, [customDurations]);

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
      
      const expandedJobs = PlannerV2.expandJobsForDay(
        jobs as PlannerV2.JobForSegmentExpansion[],
        dayStr,
        jig.id,
        overtimeMap,
        teamAverageEfinks
      );
      
      const mappedJobs: Job[] = expandedJobs.map(segment => ({
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
      
      if (mappedJobs.length > 0) {
        map.set(jig.id, mappedJobs);
      }
    }
    
    return map;
  }, [jobs, dayStr, jigTeams, overtimeByTeam, allOvertimeSettings]);

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
    return workingHours.start * 60;
  };

  const getBaseDurationMinutes = (job: Job): number => {
    // Delegate to getBaseDuration for consistent logic
    return getBaseDuration(job);
  };

  const calculateJobPositions = (jigJobs: Job[], includeBreaks: boolean = true, teamWorkingEndMinutes?: number): JobPositionInfo[] => {
    const positions: JobPositionInfo[] = [];
    const workingHoursOffset = includeBreaks ? getWorkingHoursOffset() : 0;
    
    for (const job of jigJobs) {
      const baseDuration = getBaseDurationMinutes(job);
      const baseHeight = Math.max(MIN_BLOCK_HEIGHT, PlannerV2.calculateJobHeight(baseDuration));
      
      const jobTop = job.plannedStartTime != null ? job.plannedStartTime : workingHoursOffset;
      
      let breakAdditions: BreakAddition[] = [];
      let totalBreakMinutes = 0;
      
      if (includeBreaks) {
        // Pass team working end minutes for proper break calculation on weekends
        breakAdditions = calculateBreaksSpanned(jobTop, baseDuration, teamWorkingEndMinutes);
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



  const calculateDropZones = useCallback((jigId: string, teamWorkingEndMinutes?: number): { position: number; afterJobId: string | null }[] => {
    if (!workingHours) return [];
    
    const workingStart = workingHours.start * 60;
    const jigJobs = getJobsForDateAndJig(dayStr, jigId)
      .filter(j => !j.productionComplete)
      .sort((a, b) => (a.plannedStartTime ?? workingStart) - (b.plannedStartTime ?? workingStart));
    
    const dropZones: { position: number; afterJobId: string | null }[] = [];
    
    // Get buffer from config (default 15 if not configured)
    const bufferMinutes = schedulerConfig?.bufferMinutes ?? PlannerV2.BUFFER_MINUTES;
    
    // Calculate job time ranges to prevent overlapping drop zones
    // IMPORTANT: Use the VISUAL height to determine job end, not just calculated duration
    // This accounts for MIN_BLOCK_HEIGHT which can make short jobs visually taller
    const jobRanges: Array<{ start: number; end: number; name: string }> = [];
    for (const job of jigJobs) {
      const baseDuration = getBaseDurationMinutes(job);
      const jobStart = job.plannedStartTime ?? workingStart;
      const breakAdditions = calculateBreaksSpanned(jobStart, baseDuration, teamWorkingEndMinutes);
      const totalBreakMinutes = breakAdditions.reduce((sum, b) => sum + b.minutes, 0);
      
      // Calculate the VISUAL height in pixels, then convert back to minutes
      const baseHeight = Math.max(MIN_BLOCK_HEIGHT, PlannerV2.calculateJobHeight(baseDuration));
      const totalHeight = baseHeight + PlannerV2.calculateJobHeight(totalBreakMinutes);
      // Convert visual height back to minutes for consistent drop zone calculation
      const visualDurationMinutes = totalHeight / PlannerV2.PIXELS_PER_MINUTE;
      const jobEnd = jobStart + visualDurationMinutes;
      
      jobRanges.push({ start: jobStart, end: jobEnd, name: job.productionName?.substring(0, 20) || job.id });
    }
    
    // Debug: log job ranges for this team
    if (jigJobs.length > 0) {
      console.log('[DROP_ZONES] Team jobs:', jobRanges.map(r => 
        `${r.name}: ${PlannerV2.formatMinutesToTime(r.start)}-${PlannerV2.formatMinutesToTime(r.end)}`
      ), 'buffer:', bufferMinutes);
    }
    
    // Helper: check if a position falls within any existing job's time range
    const overlapsWithJob = (position: number): boolean => {
      for (const range of jobRanges) {
        // Position overlaps if it's within the job's time range (exclusive of end)
        if (position >= range.start && position < range.end) {
          return true;
        }
      }
      return false;
    };
    
    // Only add workingStart zone if it doesn't overlap with an existing job
    if (!overlapsWithJob(workingStart)) {
      dropZones.push({ position: workingStart, afterJobId: null });
    }
    
    // Add drop zones after each job (at job end + buffer)
    for (let i = 0; i < jigJobs.length; i++) {
      const job = jigJobs[i];
      const jobEnd = jobRanges[i].end;
      const zonePosition = jobEnd + bufferMinutes;
      
      // Only add if this zone doesn't overlap with another job
      if (!overlapsWithJob(zonePosition)) {
        dropZones.push({ position: zonePosition, afterJobId: job.id });
      }
    }
    
    // Debug: log calculated drop zones
    if (jigJobs.length > 0) {
      console.log('[DROP_ZONES] Valid zones:', dropZones.map(z => PlannerV2.formatMinutesToTime(z.position)));
    }
    
    return dropZones;
  }, [workingHours, dayStr, jobs, schedulerConfig]);

  const handleTimelineDragOver = (e: React.DragEvent, jigId: string, visibleStart: number) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(e);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // Convert screen position to absolute time by adding visible start offset
    const dropMinutes = Math.round(y / PlannerV2.PIXELS_PER_MINUTE) + visibleStart;
    
    setDropHoverJigId(jigId);
    setDropHoverPosition(dropMinutes);
  };

  const handleTimelineDragLeave = () => {
    setDropHoverJigId(null);
    setDropHoverPosition(null);
  };

  const handleTimelineDrop = (e: React.DragEvent, jigId: string | null, visibleStart: number) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // Convert screen position to absolute time by adding visible start offset
    const rawDropMinutes = Math.round(y / PlannerV2.PIXELS_PER_MINUTE) + visibleStart;
    
    let snappedPosition = rawDropMinutes;
    
    if (jigId && workingHours) {
      const dropZones = calculateDropZones(jigId);
      if (dropZones.length > 0) {
        let nearestZone = dropZones[0];
        let minDistance = Math.abs(rawDropMinutes - nearestZone.position);
        
        for (const zone of dropZones) {
          const distance = Math.abs(rawDropMinutes - zone.position);
          if (distance < minDistance) {
            minDistance = distance;
            nearestZone = zone;
          }
        }
        
        snappedPosition = nearestZone.position;
      }
      
      const workingStart = workingHours.start * 60;
      if (snappedPosition < workingStart) {
        snappedPosition = workingStart;
      }
    }
    
    setDropHoverJigId(null);
    setDropHoverPosition(null);
    
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
            <div style={{ position: 'relative', height: totalTimelineHeight }}>
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
                : baseWorkingHours.start * 60,
              endMinutes: teamOvertime.enabled && teamOvertime.closeTime !== undefined
                ? teamOvertime.closeTime
                : (isFridayDay ? 960 : baseWorkingHours.end * 60) // Friday: 16:00 = 960 min
            } : { startMinutes: workingHours.start * 60, endMinutes: workingHours.end * 60 };
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
                onDragOver={(e) => handleTimelineDragOver(e, jig.id, visibleStartMinutes)}
                onDragLeave={handleTimelineDragLeave}
                onDrop={(e) => handleTimelineDrop(e, jig.id, visibleStartMinutes)}
                style={{
                  position: 'relative',
                  height: teamTimelineHeight,
                  borderBottom: '1px solid #ddd',
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

                {/* Drop zone indicators - shown when dragging */}
                {isDragging && dropHoverJigId === jig.id && (() => {
                  const dropZones = calculateDropZones(jig.id, teamWorkingMinutes.endMinutes);
                  if (!dropHoverPosition || dropZones.length === 0) return null;
                  
                  let nearestZone = dropZones[0];
                  let minDistance = Math.abs(dropHoverPosition - nearestZone.position);
                  
                  for (const zone of dropZones) {
                    const distance = Math.abs(dropHoverPosition - zone.position);
                    if (distance < minDistance) {
                      minDistance = distance;
                      nearestZone = zone;
                    }
                  }
                  
                  // Debug: log the drop zone position
                  console.log('[DROP] Indicator position:', PlannerV2.formatMinutesToTime(nearestZone.position), 
                    'dropZones:', dropZones.map(z => PlannerV2.formatMinutesToTime(z.position)));
                  
                  return (
                    <div
                      key="drop-indicator"
                      style={{
                        position: 'absolute',
                        top: (nearestZone.position - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE - 2,
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
                    
                    const getBackground = () => {
                      if (job.productionComplete) return 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))';
                      if (isStaged) return 'linear-gradient(135deg, rgba(0, 120, 212, 0.25), rgba(0, 90, 180, 0.15))';
                      return 'linear-gradient(135deg, rgba(0, 120, 212, 0.85), rgba(0, 90, 180, 0.75))';
                    };
                    
                    const getBorder = () => {
                      if (job.productionComplete) return '1px solid rgba(180, 180, 180, 0.6)';
                      if (isStaged) return '2px dashed rgba(0, 120, 212, 0.7)';
                      return '1px solid rgba(255, 255, 255, 0.3)';
                    };
                    
                    const getBoxShadow = () => {
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
                    
                    return (
                      <div
                        key={job.id}
                        draggable={canInteract}
                        onDragStart={() => canInteract && onDragStart(job.id)}
                        onDoubleClick={() => onJobDoubleClick(job.id)}
                        style={{
                          position: 'absolute',
                          top: (top - visibleStartMinutes) * PlannerV2.PIXELS_PER_MINUTE,
                          left: 4,
                          right: 4,
                          height: height,
                          padding: 8,
                          boxSizing: 'border-box',
                          background: getBackground(),
                          color: getTextColor(),
                          borderRadius: 6,
                          border: getBorder(),
                          cursor: resizingJob ? 'ns-resize' : 'grab',
                          zIndex: resizingJob === job.id ? 100 : 10,
                          boxShadow: getBoxShadow(),
                          opacity: job.productionComplete ? 0.7 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
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
                            {breakAdditions.length > 0 
                              ? `(${formatDuration(getBaseDurationMinutes(job) + breakAdditions.reduce((sum, b) => sum + b.minutes, 0))} total: ${formatDuration(getBaseDurationMinutes(job))} work + ${breakAdditions.reduce((sum, b) => sum + b.minutes, 0)}m breaks)`
                              : `(${formatDuration(getBaseDurationMinutes(job))})`
                            }
                          </Text>
                        </Stack>
                        
                        {/* Save/Cancel buttons for staged jobs - show on first segment */}
                        {isStaged && job.segmentIndex === 0 && (
                          <Stack horizontal tokens={{ childrenGap: 4 }} styles={{ root: { position: 'absolute', bottom: 16, right: 8 } }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSaveStagedJob?.(job.id);
                              }}
                              style={{
                                padding: '2px 10px',
                                fontSize: 10,
                                fontWeight: 600,
                                backgroundColor: '#107C10',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer',
                                zIndex: 50
                              }}
                              title="Save this job allocation"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelStagedJob?.(job.id);
                              }}
                              style={{
                                padding: '2px 8px',
                                fontSize: 10,
                                fontWeight: 600,
                                backgroundColor: 'transparent',
                                color: '#0078D4',
                                border: '1px solid rgba(0, 120, 212, 0.5)',
                                borderRadius: 4,
                                cursor: 'pointer',
                                zIndex: 50
                              }}
                              title="Cancel and remove from schedule"
                            >
                              Cancel
                            </button>
                          </Stack>
                        )}
                        
                        {/* Edit button for all persisted jobs - show on first segment (or single-day jobs) */}
                        {!isStaged && !job.productionComplete && onEditPersistedJob && job.jigId && (job.segmentIndex === 0 || job.segmentIndex === undefined) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPersistedJob(job.id, job.jigId!, dayStr);
                            }}
                            style={{
                              position: 'absolute',
                              bottom: 16,
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
                            onMouseDown={(e) => handleResizeStart(e, job.id, baseHeight)}
                            style={{
                              position: 'absolute',
                              bottom: 4,
                              left: 4,
                              right: 4,
                              height: 8,
                              cursor: 'ns-resize',
                              backgroundColor: resizingJob === job.id ? 'rgba(0,120,212,0.3)' : 'rgba(0,120,212,0.15)',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
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
            onDrop={() => onDrop(dayStr, null)}
            style={{
              height: totalTimelineHeight,
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
                      border: job.productionComplete ? '1px solid rgba(180, 180, 180, 0.6)' : '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: 'grab',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      opacity: job.productionComplete ? 0.7 : 1
                    }}
                  >
                    <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600, fontSize: 11 } }}>
                      {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (R)' : ''}{job.productionComplete ? ' ✓' : ''}
                    </Text>
                    <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#777' : 'rgba(255,255,255,0.9)', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                      {job.customer}
                    </Text>
                    <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: 500 } }}>
                      {job.estimatedEFinks} E-Finks
                    </Text>
                  </div>
                ))}
              </Stack>
            )}
          </div>
        </Stack>
      </div>

    </Stack>
  );
};

export const DayView = memo(DayViewComponent);
