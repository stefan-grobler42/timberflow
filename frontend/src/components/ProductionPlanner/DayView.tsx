import { Stack, Text, Spinner, Toggle, Dropdown, Dialog, DialogType, DialogFooter, PrimaryButton, DefaultButton, IconButton } from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
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
  parentProductionId?: string | null;
  rolloverSequence?: number;
  createdOn?: string;
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

interface OverflowInfo {
  jobId: string;
  jobName: string;
  orderNumber: string;
  overflowMinutes: number;
  jigId: string | null;
  jigName: string;
}

interface DayViewProps {
  dayStr: string;
  jobs: Job[];
  allJobs: Job[];
  jigTeams: Jig[];
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string, jigId: string | null) => void;
  onJobDoubleClick: (jobId: string) => void;
  onJobDurationChange?: (jobId: string, durationMinutes: number) => void;
  onJobDurationReset?: (jobId: string) => void;
  onTeamDoubleClick: (teamId: string) => void;
  onJobRollover?: (jobId: string, overflowMinutes: number, nextDateStr: string, jigId: string | null) => void;
  onLinkedJobsResize?: (updates: { jobId: string; durationMinutes: number }[]) => void;
  overtimeSettings?: { enabled: boolean; closeTime: string };
  onOvertimeChange?: (dayStr: string, enabled: boolean, closeTime: string) => void;
}

const MINUTES_PER_EFINK = 6.5625;
const PIXELS_PER_MINUTE = 1;
const HOURS_IN_DAY = 24;
const MIN_BLOCK_HEIGHT = 20;

export const DayView: React.FC<DayViewProps> = ({
  dayStr,
  jobs,
  allJobs,
  jigTeams,
  onDragStart,
  onDragOver,
  onDrop,
  onJobDoubleClick,
  onJobDurationChange,
  onJobDurationReset,
  onTeamDoubleClick,
  onJobRollover,
  onLinkedJobsResize,
  overtimeSettings,
  onOvertimeChange
}) => {
  const [workingHours, setWorkingHours] = useState<{ start: number; end: number } | null>(null);
  const [baseWorkingHours, setBaseWorkingHours] = useState<{ start: number; end: number } | null>(null);
  const [breakSlots, setBreakSlots] = useState<BreakSlot[]>([]);
  const [baseBreakSlots, setBaseBreakSlots] = useState<BreakSlot[]>([]);
  const [dinnerBreakSlot, setDinnerBreakSlot] = useState<BreakSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [customDurations, setCustomDurations] = useState<Record<string, number>>({});
  const [resizingJob, setResizingJob] = useState<string | null>(null);
  const [overflowDialogOpen, setOverflowDialogOpen] = useState(false);
  const [currentOverflow, setCurrentOverflow] = useState<OverflowInfo | null>(null);
  const [overflowingJobs, setOverflowingJobs] = useState<Set<string>>(new Set());
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const currentResizeDuration = useRef<number>(0);

  // Use parent-provided overtime settings if available, otherwise default
  const overtimeEnabled = overtimeSettings?.enabled ?? false;
  const overtimeCloseTime = overtimeSettings?.closeTime ?? '21:00';

  const handleOvertimeToggle = (checked: boolean) => {
    if (onOvertimeChange) {
      onOvertimeChange(dayStr, checked, overtimeCloseTime);
    }
  };

  const handleOvertimeCloseTimeChange = (newTime: string) => {
    if (onOvertimeChange) {
      onOvertimeChange(dayStr, overtimeEnabled, newTime);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [dayStr]);

  useEffect(() => {
    if (!baseWorkingHours) return;
    
    if (overtimeEnabled) {
      const [hourStr, minStr] = overtimeCloseTime.split(':');
      const hour = parseInt(hourStr) || baseWorkingHours.end;
      const minutes = parseInt(minStr) || 0;
      const overtimeEndHour = minutes > 0 ? hour + 1 : hour;
      setWorkingHours({ start: baseWorkingHours.start, end: overtimeEndHour });
    } else {
      setWorkingHours(baseWorkingHours);
    }
  }, [overtimeEnabled, overtimeCloseTime, baseWorkingHours]);

  // Dynamically add/remove dinner break based on overtime state
  useEffect(() => {
    if (overtimeEnabled && dinnerBreakSlot) {
      // Add dinner break when overtime is enabled
      setBreakSlots([...baseBreakSlots, dinnerBreakSlot]);
    } else {
      // Remove dinner break when overtime is disabled
      setBreakSlots(baseBreakSlots);
    }
  }, [overtimeEnabled, baseBreakSlots, dinnerBreakSlot]);

  const calculateAvailableWorkingMinutes = useCallback((hours: { start: number; end: number }) => {
    const totalMinutes = (hours.end - hours.start) * 60;
    const breakMinutes = breakSlots.reduce((sum, b) => {
      const breakStart = b.startHour * 60 + b.startMinute;
      const breakEnd = b.endHour * 60 + b.endMinute;
      const dayStart = hours.start * 60;
      const dayEnd = hours.end * 60;
      if (breakEnd > dayStart && breakStart < dayEnd) {
        const effectiveStart = Math.max(breakStart, dayStart);
        const effectiveEnd = Math.min(breakEnd, dayEnd);
        return sum + (effectiveEnd - effectiveStart);
      }
      return sum;
    }, 0);
    return totalMinutes - breakMinutes;
  }, [breakSlots]);

  // Track last working hours end to only run redistribution when working hours ACTUALLY change
  const lastWorkingEndRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!workingHours || !baseWorkingHours || !onLinkedJobsResize) return;
    
    const baseAvailable = calculateAvailableWorkingMinutes(baseWorkingHours);
    const currentAvailable = calculateAvailableWorkingMinutes(workingHours);
    
    // Skip if no difference in available minutes
    if (baseAvailable === currentAvailable) {
      lastWorkingEndRef.current = workingHours.end;
      return;
    }
    
    // Only run when working hours end ACTUALLY changes, not on every jobs refresh
    if (lastWorkingEndRef.current === workingHours.end) return;
    
    // Update ref AFTER checking, so redistribution runs once when hours change
    lastWorkingEndRef.current = workingHours.end;
    
    const additionalMinutes = currentAvailable - baseAvailable;
    
    const jobsOnThisDay = jobs.filter(j => j.plannedDateStr === dayStr);
    
    const updates: { jobId: string; durationMinutes: number }[] = [];
    
    jobsOnThisDay.forEach(job => {
      const rootId = job.parentProductionId || job.id;
      
      const chainJobs = allJobs.filter(j => 
        j.id === rootId || j.parentProductionId === rootId
      );
      
      if (chainJobs.length <= 1) return;
      
      const isThisJobRoot = job.id === rootId || !job.parentProductionId;
      if (!isThisJobRoot) return;
      
      const rolloverJobs = chainJobs
        .filter(j => j.id !== job.id && j.plannedDateStr !== dayStr)
        .sort((a, b) => (a.rolloverSequence || 0) - (b.rolloverSequence || 0));
      
      if (rolloverJobs.length === 0) return;
      
      const currentDuration = job.customDurationMinutes || Math.round(job.estimatedEFinks * MINUTES_PER_EFINK);
      const totalChainDuration = chainJobs.reduce((sum, j) => 
        sum + (j.customDurationMinutes || Math.round(j.estimatedEFinks * MINUTES_PER_EFINK)), 0
      );
      
      const newCurrentDuration = Math.min(
        currentDuration + additionalMinutes,
        totalChainDuration - (rolloverJobs.length * MIN_BLOCK_HEIGHT)
      );
      const increase = newCurrentDuration - currentDuration;
      
      if (increase > 0) {
        updates.push({ jobId: job.id, durationMinutes: newCurrentDuration });
        
        let remainingDecrease = increase;
        rolloverJobs.forEach(rollover => {
          const rolloverDuration = rollover.customDurationMinutes || Math.round(rollover.estimatedEFinks * MINUTES_PER_EFINK);
          const decrease = Math.min(remainingDecrease, rolloverDuration - MIN_BLOCK_HEIGHT);
          if (decrease > 0) {
            updates.push({ jobId: rollover.id, durationMinutes: rolloverDuration - decrease });
            remainingDecrease -= decrease;
          }
        });
      }
    });
    
    if (updates.length > 0) {
      onLinkedJobsResize(updates);
    }
  }, [workingHours, baseWorkingHours, jobs, allJobs, dayStr, calculateAvailableWorkingMinutes, onLinkedJobsResize]);

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
      
      let hours = { start: 7, end: 17 };
      if (factoryHours) {
        const [start, end] = factoryHours.split('-');
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        hours = { start: startHour, end: endHour };
      } else if (weekend && settings.breakTimes?.weekendOvertime) {
        const startTime = parseTime(settings.breakTimes.weekendOvertime.workingHoursStart);
        const endTime = parseTime(settings.breakTimes.weekendOvertime.workingHoursEnd);
        hours = { start: startTime.hour, end: endTime.hour };
      }
      setBaseWorkingHours(hours);
      setWorkingHours(hours);

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

        // Store dinner break separately - it's added dynamically based on overtime state
        if (breakTimes.weekdayOvertime) {
          const dinnerStart = parseTime(breakTimes.weekdayOvertime.dinnerStart);
          const dinnerEnd = parseTime(breakTimes.weekdayOvertime.dinnerEnd);
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

  const getCalculatedDuration = useCallback((job: Job): number => {
    return Math.max(MIN_BLOCK_HEIGHT, Math.round(job.estimatedEFinks * MINUTES_PER_EFINK));
  }, []);

  const hasManualResize = useCallback((job: Job): boolean => {
    const calculatedDuration = getCalculatedDuration(job);
    const currentDuration = customDurations[job.id] || job.customDurationMinutes;
    if (currentDuration && currentDuration !== calculatedDuration) {
      return true;
    }
    return false;
  }, [customDurations, getCalculatedDuration]);

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
    // No automatic sorting - job order is user-driven
    // Jobs maintain the order they were assigned/booked by the user
    return jobs.filter(j => j.plannedDateStr === dateStr && j.jigId === jigId);
  };

  const getUnallocatedJobsForDate = (dateStr: string) => {
    // No automatic sorting - job order is user-driven
    return jobs.filter(j => j.plannedDateStr === dateStr && !j.jigId);
  };

  const isLastInChain = useCallback((job: Job): boolean => {
    const rootId = job.parentProductionId || job.id;
    const chainJobs = allJobs.filter(j => 
      j.id === rootId || j.parentProductionId === rootId
    );
    
    if (chainJobs.length <= 1) return true;
    
    const maxSequence = Math.max(...chainJobs.map(j => j.rolloverSequence || 0));
    const jobSequence = job.rolloverSequence || 0;
    
    return jobSequence === maxSequence;
  }, [allJobs]);

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
        
        const job = jobs.find(j => j.id === jobId);
        if (job && isLastInChain(job)) {
          const jigJobs = job.jigId 
            ? getJobsForDateAndJig(dayStr, job.jigId)
            : getUnallocatedJobsForDate(dayStr);
          
          const jobsWithUpdatedDuration = jigJobs.map(j => 
            j.id === jobId ? { ...j, customDurationMinutes: finalDuration } : j
          );
          
          const { overflowing, overflowDetails } = checkJobOverflow(jobsWithUpdatedDuration, job.jigId);
          
          if (overflowing.has(jobId) && overflowDetails.get(jobId)) {
            const overflowAmount = overflowDetails.get(jobId) || 0;
            const jigName = job.jigId ? (jigTeams.find(j => j.id === job.jigId)?.name || 'Unknown Team') : 'Unallocated';
            setCurrentOverflow({
              jobId: job.id,
              jobName: job.name,
              orderNumber: job.orderNumber,
              overflowMinutes: overflowAmount,
              jigId: job.jigId,
              jigName
            });
            setOverflowDialogOpen(true);
          }
        }
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
    
    // Sort breaks chronologically to ensure consistent processing
    const sortedBreaks = [...breakSlots].sort((a, b) => {
      const aStart = a.startHour * 60 + a.startMinute;
      const bStart = b.startHour * 60 + b.startMinute;
      return aStart - bStart;
    });
    
    // Check each break and adjust if needed
    for (const breakSlot of sortedBreaks) {
      const breakStart = getBreakStartMinutes(breakSlot);
      const breakEnd = breakSlot.endHour * 60 + breakSlot.endMinute;
      
      // If the rounded start time falls within or at the start of a break,
      // push to the next hour after the break
      if (nextStart >= breakStart && nextStart < breakEnd) {
        nextStart = roundUpToNextHour(breakEnd);
      }
      
      // Also check: if rounding would land exactly at break start, push past break
      // This handles the case where job ends at 8:30, rounds to 9:00 (break start)
      if (nextStart === breakStart) {
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

  const getNextDateStr = (dateStr: string): string => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  };

  const getWorkingEndMinutes = (): number => {
    if (!workingHours) return 17 * 60;
    return workingHours.end * 60;
  };

  const checkJobOverflow = useCallback((jigJobs: Job[], jigId: string | null): { overflowing: Set<string>; overflowDetails: Map<string, number> } => {
    const overflowing = new Set<string>();
    const overflowDetails = new Map<string, number>();
    const workingEnd = getWorkingEndMinutes();
    const workingHoursOffset = getWorkingHoursOffset();
    let currentTop = workingHoursOffset;

    for (let i = 0; i < jigJobs.length; i++) {
      const job = jigJobs[i];
      const baseDuration = getBaseDurationMinutes(job);
      const breakAdditions = calculateBreaksSpanned(currentTop, baseDuration);
      const totalBreakMinutes = breakAdditions.reduce((sum, b) => sum + b.minutes, 0);
      
      const jobEndMinutes = currentTop + baseDuration + totalBreakMinutes;
      
      if (jobEndMinutes > workingEnd) {
        // Always mark as overflowing - even if rollover child exists, we need to recalculate
        // because overtime extension may have changed the overflow amount
        overflowing.add(job.id);
        const overflowAmount = jobEndMinutes - workingEnd;
        overflowDetails.set(job.id, overflowAmount);
      }
      
      currentTop = getNextAvailableStartTime(jobEndMinutes);
    }

    return { overflowing, overflowDetails };
  }, [workingHours, breakSlots, customDurations, allJobs]);

  useEffect(() => {
    if (!workingHours) return;
    
    const allOverflowing = new Set<string>();
    
    jigTeams.forEach(jig => {
      const jigJobs = getJobsForDateAndJig(dayStr, jig.id);
      const { overflowing } = checkJobOverflow(jigJobs, jig.id);
      overflowing.forEach(id => allOverflowing.add(id));
    });
    
    const unallocatedJobs = getUnallocatedJobsForDate(dayStr);
    const { overflowing: unallocOverflow } = checkJobOverflow(unallocatedJobs, null);
    unallocOverflow.forEach(id => allOverflowing.add(id));
    
    setOverflowingJobs(allOverflowing);
  }, [jobs, workingHours, breakSlots, customDurations, dayStr, jigTeams, checkJobOverflow]);

  const handleOverflowClick = (job: Job, jigId: string | null, overflowMinutes: number) => {
    const jigName = jigId ? (jigTeams.find(j => j.id === jigId)?.name || 'Unknown Team') : 'Unallocated';
    setCurrentOverflow({
      jobId: job.id,
      jobName: job.name,
      orderNumber: job.orderNumber,
      overflowMinutes,
      jigId,
      jigName
    });
    setOverflowDialogOpen(true);
  };

  const handleRollover = () => {
    if (currentOverflow && onJobRollover) {
      const nextDateStr = getNextDateStr(dayStr);
      onJobRollover(currentOverflow.jobId, currentOverflow.overflowMinutes, nextDateStr, currentOverflow.jigId);
    }
    setOverflowDialogOpen(false);
    setCurrentOverflow(null);
  };

  const handleReduceTime = () => {
    if (currentOverflow) {
      const job = jobs.find(j => j.id === currentOverflow.jobId);
      if (job && onJobDurationChange) {
        const currentDuration = getBaseDurationMinutes(job);
        const reducedDuration = Math.max(MIN_BLOCK_HEIGHT, currentDuration - currentOverflow.overflowMinutes);
        onJobDurationChange(currentOverflow.jobId, reducedDuration);
      }
    }
    setOverflowDialogOpen(false);
    setCurrentOverflow(null);
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
    <Stack styles={{ root: { padding: '20px 20px 20px 0' } }}>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 20 }} styles={{ root: { marginBottom: 20 } }}>
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          {formatDate(dayStr)}
        </Text>
        <Text variant="small" styles={{ root: { color: '#666', backgroundColor: '#f3f2f1', padding: '4px 8px', borderRadius: 4 } }}>
          80 E-Finks = 8h 45m (standard day) | Drag bottom edge to resize blocks
        </Text>
        
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }} styles={{ root: { marginLeft: 'auto' } }}>
          <Toggle
            label="Plan for overtime"
            inlineLabel
            checked={overtimeEnabled}
            onChange={(_, checked) => handleOvertimeToggle(!!checked)}
            styles={{ 
              root: { marginBottom: 0 },
              label: { fontWeight: 600, color: '#333' }
            }}
          />
          {overtimeEnabled && baseWorkingHours && (
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
              <Text variant="small" styles={{ root: { fontWeight: 500 } }}>Close time:</Text>
              <Dropdown
                selectedKey={overtimeCloseTime}
                onChange={(_, option) => option && handleOvertimeCloseTimeChange(option.key as string)}
                options={(() => {
                  const options: IDropdownOption[] = [];
                  for (let hour = baseWorkingHours.end; hour <= 23; hour++) {
                    if (hour === baseWorkingHours.end) {
                      options.push({ key: `${hour.toString().padStart(2, '0')}:30`, text: `${hour.toString().padStart(2, '0')}:30` });
                    } else {
                      options.push({ key: `${hour.toString().padStart(2, '0')}:00`, text: `${hour.toString().padStart(2, '0')}:00` });
                      options.push({ key: `${hour.toString().padStart(2, '0')}:30`, text: `${hour.toString().padStart(2, '0')}:30` });
                    }
                  }
                  options.push({ key: '00:00', text: '00:00 (midnight)' });
                  return options;
                })()}
                styles={{ 
                  root: { width: 120 },
                  dropdown: { minWidth: 120 }
                }}
              />
            </Stack>
          )}
        </Stack>
      </Stack>

      <div style={{ display: 'flex' }}>
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

        {/* Unallocated column - only shown if there are unallocated jobs for this day */}
        {(() => {
          const unallocatedJobs = getUnallocatedJobsForDate(dayStr);
          if (unallocatedJobs.length === 0) return null;
          
          const unallocatedEFinks = unallocatedJobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);
          const unallocatedMinutes = unallocatedJobs.reduce((sum, j) => sum + getJobDurationMinutes(j), 0);

          return (
            <Stack styles={{ root: { minWidth: 220, borderRight: '1px solid #ddd' } }}>
              {/* Unallocated header */}
              <Stack
                styles={{
                  root: {
                    height: 50,
                    padding: '8px 15px',
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
                  {unallocatedEFinks} E-Finks | {formatDuration(unallocatedMinutes)}
                </Text>
              </Stack>

              {/* Unallocated timeline */}
              <div
                onDragOver={onDragOver}
                onDrop={() => onDrop(dayStr, null)}
                style={{
                  position: 'relative',
                  height: totalTimelineHeight,
                  borderBottom: '1px solid #ddd',
                  backgroundColor: '#ffebee'
                }}
              >
                {/* Job blocks */}
                {calculateJobPositions(unallocatedJobs, false).map(({ job, top, height, baseHeight, breakAdditions }) => (
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
                      background: job.productionComplete 
                        ? 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))' 
                        : 'linear-gradient(135deg, rgba(198, 40, 40, 0.85), rgba(160, 30, 30, 0.75))',
                      color: job.productionComplete ? '#555' : 'white',
                      borderRadius: 6,
                      border: job.productionComplete ? '1px solid rgba(180, 180, 180, 0.6)' : '1px solid rgba(255, 255, 255, 0.3)',
                      cursor: resizingJob ? 'ns-resize' : 'grab',
                      zIndex: resizingJob === job.id ? 100 : 10,
                      boxShadow: job.productionComplete 
                        ? '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)' 
                        : '0 4px 12px rgba(198, 40, 40, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
                      opacity: job.productionComplete ? 0.7 : 1,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {/* Refresh button - only show when manually resized */}
                    {hasManualResize(job) && onJobDurationReset && (
                      <IconButton
                        iconProps={{ iconName: 'Refresh' }}
                        title="Reset to calculated size"
                        ariaLabel="Reset to calculated size"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Clear local custom duration state first
                          setCustomDurations(prev => {
                            const next = { ...prev };
                            delete next[job.id];
                            return next;
                          });
                          // Then call parent handler to persist the reset
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
                    <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600 } }}>
                      {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (Rollover)' : ''}{job.productionComplete ? ' (Complete)' : ''}
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
                    </Stack>
                    {/* Resize handle - only show if job is last in chain or not part of a chain */}
                    {isLastInChain(job) && (
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
                    )}
                  </div>
                ))}
              </div>
            </Stack>
          );
        })()}

        {/* Jig team columns */}
        {jigTeams.map(jig => {
          const jigJobs = getJobsForDateAndJig(dayStr, jig.id);
          const jigEFinks = jigJobs.reduce((sum, j) => sum + j.estimatedEFinks, 0);
          const totalMinutes = jigJobs.reduce((sum, j) => sum + getJobDurationMinutes(j), 0);

          return (
            <Stack key={jig.id} styles={{ root: { minWidth: 220, borderRight: '1px solid #ddd' } }}>
              {/* Jig header */}
              <Stack
                onDoubleClick={() => onTeamDoubleClick(jig.id)}
                styles={{
                  root: {
                    height: 50,
                    padding: '8px 15px',
                    backgroundColor: '#0078d4',
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
                {(() => {
                  const { overflowDetails } = checkJobOverflow(jigJobs, jig.id);
                  const workingEnd = getWorkingEndMinutes();
                  
                  return calculateJobPositions(jigJobs, true).map(({ job, top, height, baseHeight, breakAdditions }) => {
                    const isOverflowing = overflowingJobs.has(job.id);
                    const overflowMinutes = overflowDetails.get(job.id) || 0;
                    const maxHeight = Math.max(0, workingEnd * PIXELS_PER_MINUTE - top - 4);
                    const clampedHeight = isOverflowing ? Math.min(height, maxHeight) : height;
                    
                    const getBackground = () => {
                      if (isOverflowing) return 'linear-gradient(135deg, rgba(198, 40, 40, 0.95), rgba(160, 30, 30, 0.85))';
                      if (job.productionComplete) return 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))';
                      return 'linear-gradient(135deg, rgba(0, 120, 212, 0.85), rgba(0, 90, 180, 0.75))';
                    };
                    
                    const getBorder = () => {
                      if (isOverflowing) return '2px solid #ff4444';
                      if (job.productionComplete) return '1px solid rgba(180, 180, 180, 0.6)';
                      return '1px solid rgba(255, 255, 255, 0.3)';
                    };
                    
                    const getBoxShadow = () => {
                      if (isOverflowing) return '0 4px 12px rgba(198, 40, 40, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
                      if (job.productionComplete) return '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)';
                      return '0 4px 12px rgba(0, 120, 212, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)';
                    };
                    
                    return (
                      <div
                        key={job.id}
                        draggable={!resizingJob}
                        onDragStart={() => !resizingJob && onDragStart(job.id)}
                        onDoubleClick={() => onJobDoubleClick(job.id)}
                        onClick={() => isOverflowing && handleOverflowClick(job, jig.id, overflowMinutes)}
                        style={{
                          position: 'absolute',
                          top: top + 4,
                          left: 4,
                          right: 4,
                          height: clampedHeight,
                          padding: 8,
                          background: getBackground(),
                          color: job.productionComplete ? '#555' : 'white',
                          borderRadius: 6,
                          border: getBorder(),
                          cursor: isOverflowing ? 'pointer' : (resizingJob ? 'ns-resize' : 'grab'),
                          zIndex: resizingJob === job.id ? 100 : 10,
                          boxShadow: getBoxShadow(),
                          opacity: job.productionComplete ? 0.7 : 1,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        {/* Refresh button - only show when manually resized */}
                        {hasManualResize(job) && onJobDurationReset && (
                          <IconButton
                            iconProps={{ iconName: 'Refresh' }}
                            title="Reset to calculated size"
                            ariaLabel="Reset to calculated size"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Clear local custom duration state first
                              setCustomDurations(prev => {
                                const next = { ...prev };
                                delete next[job.id];
                                return next;
                              });
                              // Then call parent handler to persist the reset
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
                        {/* Overflow indicator - positioned to avoid reset button overlap */}
                        {isOverflowing && (
                          <Text styles={{ 
                            root: { 
                              position: 'absolute',
                              top: 2,
                              right: hasManualResize(job) && onJobDurationReset ? 26 : 4,
                              color: '#ffff00', 
                              fontWeight: 700, 
                              fontSize: 18, 
                              lineHeight: 1 
                            } 
                          }}>!</Text>
                        )}
                        <Stack horizontal horizontalAlign="space-between" verticalAlign="start">
                          <Stack>
                            <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600 } }}>
                              {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (Rollover)' : ''}{job.productionComplete ? ' (Complete)' : ''}
                            </Text>
                            <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'white' } }}>
                              {job.customer}
                            </Text>
                          </Stack>
                        </Stack>
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
                          {isOverflowing && (
                            <Text variant="tiny" styles={{ root: { color: '#ffff00', fontWeight: 600 } }}>
                              Overflow: {formatDuration(overflowMinutes)}
                            </Text>
                          )}
                        </Stack>
                        {/* Resize handle - only show if job is last in chain or not part of a chain */}
                        {isLastInChain(job) && (
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

      {/* Overflow Dialog */}
      <Dialog
        hidden={!overflowDialogOpen}
        onDismiss={() => setOverflowDialogOpen(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Job Exceeds Available Time',
          subText: currentOverflow 
            ? `Order "${currentOverflow.orderNumber}" on ${currentOverflow.jigName} exceeds the available time by ${formatDuration(currentOverflow.overflowMinutes)}. How would you like to handle this?`
            : ''
        }}
        modalProps={{ isBlocking: true }}
      >
        <DialogFooter>
          <PrimaryButton onClick={handleRollover} text="Roll Over to Next Day" />
          <DefaultButton onClick={handleReduceTime} text="Reduce Time to Fit" />
          <DefaultButton onClick={() => setOverflowDialogOpen(false)} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};
