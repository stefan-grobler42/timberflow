/**
 * Continuous-Flow Allocation Engine for Production Planner.
 * 
 * CORE CONCEPT: When a job requiring more time than a single day has,
 * it automatically spans across multiple consecutive working days.
 * 
 * Example: A 17h 45min job dropped on a team with 8h 45min working days
 * will occupy Day 1 fully (8h 45min), Day 2 fully (8h 45min), and ~15min of Day 3.
 */

import type { ScheduledJob, ShiftConfig } from './types';
import { getJobDuration } from './durationCalculator';
import { 
  getShiftConfigForDate,
  getShiftConfigForDateWithBlocks,
  getNextWorkingDayWithOvertime,
  getNextValidStartTime,
  calculateEndTime,
  type OvertimeSettingsMap
} from './shiftCalendar';
import { type SchedulerConfig, DEFAULT_CONFIG } from './schedulerSettings';

/**
 * Schedule block type for Type A block filtering in continuous flow allocation.
 */
export interface ScheduleBlockForAllocation {
  blockType: string;
  startTimeMinutes: number;
  endTimeMinutes: number;
  dateStr: string;
  teamId?: string | null;
}

/**
 * Represents a single day segment of a multi-day job allocation.
 */
export interface DaySegment {
  dateStr: string;
  jigId: string;
  startTimeMinutes: number;
  endTimeMinutes: number;
  workMinutes: number;
  breakMinutes: number;
  isFirstDay: boolean;
  isLastDay: boolean;
}

/**
 * Result of allocating a job across multiple days.
 */
export interface ContinuousFlowAllocation {
  jobId: string;
  totalDurationMinutes: number;
  segments: DaySegment[];
  primaryDate: string;
  endDate: string;
}

/**
 * Gets the shift configuration for a specific team on a specific day.
 * Uses date-aware shift config that handles Friday (16:00) and weekends.
 * Includes Type A schedule blocks as non-working intervals when provided.
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param teamId - The team ID
 * @param overtimeMap - Overtime settings by date/team
 * @param config - Optional SchedulerConfig for dynamic configuration (defaults to DEFAULT_CONFIG)
 * @param scheduleBlocks - Optional schedule blocks to filter for Type A blocks
 */
function getTeamShiftForDay(
  dateStr: string,
  teamId: string,
  overtimeMap: OvertimeSettingsMap,
  config: SchedulerConfig = DEFAULT_CONFIG,
  scheduleBlocks: ScheduleBlockForAllocation[] = []
): ShiftConfig {
  const dayOT = overtimeMap[dateStr]?.[teamId];
  
  // Filter schedule blocks for this date and team (or blocks without team = all teams)
  const blocksForDay = scheduleBlocks.filter(b => 
    b.dateStr === dateStr && (!b.teamId || b.teamId === teamId)
  );
  
  if (blocksForDay.length > 0) {
    // Use the block-aware shift config which includes Type A blocks as breaks
    return getShiftConfigForDateWithBlocks(
      dateStr,
      dayOT?.enabled ?? false,
      dayOT?.closeTime,
      dayOT?.earlyEnabled ?? false,
      dayOT?.earlyStartTime,
      blocksForDay,
      config
    );
  }
  
  return getShiftConfigForDate(
    dateStr,
    dayOT?.enabled ?? false,
    dayOT?.closeTime,
    dayOT?.earlyEnabled ?? false,
    dayOT?.earlyStartTime,
    config
  );
}

/**
 * Calculates available work minutes on a day starting from a given time.
 * Accounts for breaks and shift boundaries.
 */
function getAvailableWorkMinutesOnDay(
  startTimeMinutes: number,
  shift: ShiftConfig
): number {
  if (startTimeMinutes >= shift.endTime) {
    return 0;
  }
  
  const effectiveStart = Math.max(startTimeMinutes, shift.startTime);
  let available = shift.endTime - effectiveStart;
  
  for (const brk of shift.breaks) {
    if (brk.end > effectiveStart && brk.start < shift.endTime) {
      const breakStart = Math.max(brk.start, effectiveStart);
      const breakEnd = Math.min(brk.end, shift.endTime);
      available -= (breakEnd - breakStart);
    }
  }
  
  return Math.max(0, available);
}

/**
 * Allocates a job across multiple consecutive days using continuous-flow model.
 * 
 * ALGORITHM:
 * 1. Calculate total work duration needed for the job
 * 2. Starting from drop position on first day, fill available hours
 * 3. If work remains, continue to next working day at shift start
 * 4. Repeat until all work is allocated
 * 
 * TYPE A BLOCKS (PublicHoliday, Maintenance, GeneralDelay):
 * - Treated as non-working intervals that jobs skip over
 * - Jobs cannot occupy time within Type A blocks
 * - When a job encounters a Type A block, remaining work continues after the block
 * 
 * @param job - The job to allocate
 * @param teamId - The team to allocate to
 * @param startDateStr - The date where allocation begins (drop day)
 * @param startTimeMinutes - Starting position in minutes from midnight (drop position)
 * @param overtimeMap - Overtime settings by date/team
 * @param teamAverageEfinks - Team efficiency for duration calculation
 * @param config - Optional SchedulerConfig for dynamic configuration (defaults to DEFAULT_CONFIG)
 * @param scheduleBlocks - Optional schedule blocks to filter for Type A blocks
 * @returns Allocation result with day segments
 */
export function allocateJobContinuousFlow(
  job: ScheduledJob,
  teamId: string,
  startDateStr: string,
  startTimeMinutes: number,
  overtimeMap: OvertimeSettingsMap,
  teamAverageEfinks: number = 80,
  config: SchedulerConfig = DEFAULT_CONFIG,
  scheduleBlocks: ScheduleBlockForAllocation[] = []
): ContinuousFlowAllocation {
  const totalDuration = getJobDuration(job, teamAverageEfinks);
  const segments: DaySegment[] = [];
  
  let remainingWork = totalDuration;
  let currentDate = startDateStr;
  let currentStartTime = startTimeMinutes;
  let isFirstDay = true;
  
  const MAX_DAYS = 30;
  let dayCount = 0;
  
  while (remainingWork > 0 && dayCount < MAX_DAYS) {
    const shift = getTeamShiftForDay(currentDate, teamId, overtimeMap, config, scheduleBlocks);
    
    const effectiveStart = isFirstDay 
      ? getNextValidStartTime(currentStartTime, shift)
      : shift.startTime;
    
    if (effectiveStart >= shift.endTime) {
      currentDate = getNextWorkingDayWithOvertime(currentDate, teamId, overtimeMap);
      isFirstDay = false;
      dayCount++;
      continue;
    }
    
    const availableOnDay = getAvailableWorkMinutesOnDay(effectiveStart, shift);
    
    if (availableOnDay <= 0) {
      currentDate = getNextWorkingDayWithOvertime(currentDate, teamId, overtimeMap);
      isFirstDay = false;
      dayCount++;
      continue;
    }
    
    const workToDoToday = Math.min(remainingWork, availableOnDay);
    
    const endTiming = calculateEndTime(effectiveStart, workToDoToday, shift);
    
    segments.push({
      dateStr: currentDate,
      jigId: teamId,
      startTimeMinutes: effectiveStart,
      endTimeMinutes: endTiming.endTime,
      workMinutes: workToDoToday,
      breakMinutes: endTiming.breakMinutes,
      isFirstDay,
      isLastDay: workToDoToday >= remainingWork
    });
    
    remainingWork -= workToDoToday;
    
    if (remainingWork > 0) {
      currentDate = getNextWorkingDayWithOvertime(currentDate, teamId, overtimeMap);
      currentStartTime = 0;
      isFirstDay = false;
    }
    
    dayCount++;
  }
  
  if (segments.length > 0) {
    segments[segments.length - 1].isLastDay = true;
  }
  
  return {
    jobId: job.id,
    totalDurationMinutes: totalDuration,
    segments,
    primaryDate: startDateStr,
    endDate: segments.length > 0 ? segments[segments.length - 1].dateStr : startDateStr
  };
}

/**
 * Checks if a job spans multiple days based on its allocation.
 */
export function isMultiDayJob(allocation: ContinuousFlowAllocation): boolean {
  return allocation.segments.length > 1;
}

/**
 * Gets the total span in days for an allocation.
 */
export function getAllocationSpanDays(allocation: ContinuousFlowAllocation): number {
  return allocation.segments.length;
}

/**
 * Formats a multi-day allocation for display.
 * Example: "Day 1 of 3" or "Spans 3 days"
 */
export function formatAllocationSpan(
  allocation: ContinuousFlowAllocation,
  segmentIndex: number
): string {
  const totalDays = allocation.segments.length;
  if (totalDays <= 1) {
    return '';
  }
  return `Day ${segmentIndex + 1} of ${totalDays}`;
}

/**
 * Calculates total work minutes remaining after a specific segment.
 */
export function getRemainingWorkAfterSegment(
  allocation: ContinuousFlowAllocation,
  segmentIndex: number
): number {
  let done = 0;
  for (let i = 0; i <= segmentIndex && i < allocation.segments.length; i++) {
    done += allocation.segments[i].workMinutes;
  }
  return allocation.totalDurationMinutes - done;
}

/**
 * Converts a continuous-flow allocation to WIP update records.
 * Returns an array of updates for batch saving.
 */
export interface WipUpdateRecord {
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
}

export function allocationToWipUpdates(
  allocation: ContinuousFlowAllocation,
  originalJobId: string,
  wipId?: string
): WipUpdateRecord[] {
  return allocation.segments.map((segment, index) => ({
    jobId: originalJobId,
    wipId,
    teamId: segment.jigId,
    workDate: segment.dateStr,
    plannedStartMinutes: segment.startTimeMinutes,
    plannedEndMinutes: segment.endTimeMinutes,
    plannedDurationMinutes: segment.workMinutes,
    breakAdjustmentMinutes: segment.breakMinutes,
    segmentIndex: index,
    totalSegments: allocation.segments.length,
    totalJobDuration: allocation.totalDurationMinutes
  }));
}

/**
 * Utility to format duration in hours and minutes for display.
 */
export function formatDurationHoursMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}min`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

/**
 * Represents a job with fields needed for segment expansion.
 */
export interface JobForSegmentExpansion {
  id: string;
  orderNumber: string;
  customer: string;
  name: string;
  estimatedEFinks: number;
  plannedDateStr: string | null;
  jigId: string | null;
  productionComplete: boolean;
  plannedStartTime?: number | null;
  plannedEndTime?: number | null;
  plannedDurationMinutes?: number | null;
  customDurationMinutes?: number | null;
  breakAdjustmentMinutes?: number | null;
  wipId?: string;
}

/**
 * A virtual job segment for display on a specific day.
 * Created by expanding a multi-day job into its per-day visual components.
 */
export interface JobDaySegment extends JobForSegmentExpansion {
  isSegment: boolean;
  segmentIndex: number;
  totalSegments: number;
  totalJobDuration: number;
  segmentStartTime: number;
  segmentEndTime: number;
  segmentDuration: number;
  segmentBreakMinutes: number;
  segmentEfinks: number;
  isLastSegment: boolean;
}

/**
 * Expands jobs for a specific day, creating segments for multi-day jobs.
 * This is the key function that makes multi-day spanning work visually.
 * 
 * For each job that starts on or before the viewing day:
 * - If the job fits within one day: return as-is
 * - If the job spans multiple days: calculate which segment applies to this day
 * 
 * @param jobs - All jobs in the system
 * @param viewingDate - The day we're rendering
 * @param teamId - The team column to check
 * @param overtimeMap - Overtime settings by date/team
 * @param teamAverageEfinks - Team efficiency
 * @param config - Optional SchedulerConfig for dynamic configuration (defaults to DEFAULT_CONFIG)
 * @returns Array of jobs and segments visible on this day for this team
 */
export function expandJobsForDay(
  jobs: JobForSegmentExpansion[],
  viewingDate: string,
  teamId: string,
  overtimeMap: OvertimeSettingsMap,
  teamAverageEfinks: number = 80,
  config: SchedulerConfig = DEFAULT_CONFIG
): JobDaySegment[] {
  const result: JobDaySegment[] = [];
  const defaultStartTime = config.weekdayShift.startTime;
  const defaultEndTime = config.weekdayShift.endTime;
  
  for (const job of jobs) {
    if (job.jigId !== teamId) continue;
    if (!job.plannedDateStr) continue;
    if (job.productionComplete) {
      if (job.plannedDateStr === viewingDate) {
        result.push({
          ...job,
          isSegment: false,
          segmentIndex: 0,
          totalSegments: 1,
          totalJobDuration: job.plannedDurationMinutes ?? 0,
          segmentStartTime: job.plannedStartTime ?? defaultStartTime,
          segmentEndTime: job.plannedEndTime ?? defaultEndTime,
          segmentDuration: job.plannedDurationMinutes ?? 0,
          segmentBreakMinutes: job.breakAdjustmentMinutes ?? 0,
          segmentEfinks: job.estimatedEFinks,
          isLastSegment: true
        });
      }
      continue;
    }
    
    const jobTotalDuration = job.plannedDurationMinutes ?? 
      (job.customDurationMinutes ?? 
        (job.estimatedEFinks * 6.5625 / (teamAverageEfinks / 80)));
    
    const scheduledJob: ScheduledJob = {
      id: job.id,
      orderNumber: job.orderNumber,
      customer: job.customer,
      estimatedEFinks: job.estimatedEFinks,
      plannedDateStr: job.plannedDateStr,
      jigId: job.jigId,
      productionComplete: job.productionComplete,
      plannedStartTime: job.plannedStartTime ?? null,
      plannedEndTime: job.plannedEndTime ?? null,
      plannedDurationMinutes: jobTotalDuration,
      customDurationMinutes: job.customDurationMinutes ?? null,
      breakAdjustmentMinutes: job.breakAdjustmentMinutes ?? null
    };
    
    const allocation = allocateJobContinuousFlow(
      scheduledJob,
      teamId,
      job.plannedDateStr,
      job.plannedStartTime ?? defaultStartTime,
      overtimeMap,
      teamAverageEfinks,
      config
    );
    
    for (let i = 0; i < allocation.segments.length; i++) {
      const segment = allocation.segments[i];
      
      if (segment.dateStr === viewingDate) {
        const segmentEfinks = allocation.totalDurationMinutes > 0
          ? (segment.workMinutes / allocation.totalDurationMinutes) * job.estimatedEFinks
          : job.estimatedEFinks;
        
        result.push({
          ...job,
          isSegment: allocation.segments.length > 1,
          segmentIndex: i,
          totalSegments: allocation.segments.length,
          totalJobDuration: allocation.totalDurationMinutes,
          segmentStartTime: segment.startTimeMinutes,
          segmentEndTime: segment.endTimeMinutes,
          segmentDuration: segment.workMinutes,
          segmentBreakMinutes: segment.breakMinutes,
          segmentEfinks: Math.round(segmentEfinks * 100) / 100,
          isLastSegment: segment.isLastDay,
          plannedStartTime: segment.startTimeMinutes,
          plannedEndTime: segment.endTimeMinutes,
          plannedDurationMinutes: segment.workMinutes
        });
        break;
      }
    }
  }
  
  return result.sort((a, b) => a.segmentStartTime - b.segmentStartTime);
}

/**
 * Expands jobs across a date range for Week/Month view display.
 * Returns jobs with their segments mapped to each day they span.
 * 
 * @param jobs - All jobs in the system
 * @param dateRange - Array of date strings (YYYY-MM-DD) to check
 * @param teams - Array of team objects with id and averageEfinks
 * @param overtimeMap - Overtime settings by date/team
 * @param config - Optional SchedulerConfig for dynamic configuration (defaults to DEFAULT_CONFIG)
 * @returns Map of dateStr -> array of job segments for that day
 */
export function expandJobsForDateRange(
  jobs: JobForSegmentExpansion[],
  dateRange: string[],
  teams: Array<{ id: string; averageEfinks?: number }>,
  overtimeMap: OvertimeSettingsMap = {},
  config: SchedulerConfig = DEFAULT_CONFIG
): Map<string, JobDaySegment[]> {
  const result = new Map<string, JobDaySegment[]>();
  
  for (const dateStr of dateRange) {
    const daySegments: JobDaySegment[] = [];
    
    for (const team of teams) {
      const teamAverageEfinks = team.averageEfinks ?? 80;
      const teamSegments = expandJobsForDay(
        jobs,
        dateStr,
        team.id,
        overtimeMap,
        teamAverageEfinks,
        config
      );
      daySegments.push(...teamSegments);
    }
    
    if (daySegments.length > 0) {
      result.set(dateStr, daySegments);
    }
  }
  
  return result;
}

/**
 * Gets E-Finks totals for a date considering multi-day job segments.
 * This ensures Week/Month views show accurate daily workload.
 * @param jobs - All jobs in the system
 * @param dateStr - The date to check
 * @param teams - Array of team objects with id and averageEfinks
 * @param overtimeMap - Overtime settings by date/team
 * @param config - Optional SchedulerConfig for dynamic configuration (defaults to DEFAULT_CONFIG)
 */
export function getSegmentEfinksForDate(
  jobs: JobForSegmentExpansion[],
  dateStr: string,
  teams: Array<{ id: string; averageEfinks?: number }>,
  overtimeMap: OvertimeSettingsMap = {},
  config: SchedulerConfig = DEFAULT_CONFIG
): number {
  let total = 0;
  
  for (const team of teams) {
    const teamAverageEfinks = team.averageEfinks ?? 80;
    const segments = expandJobsForDay(
      jobs,
      dateStr,
      team.id,
      overtimeMap,
      teamAverageEfinks,
      config
    );
    
    for (const segment of segments) {
      total += segment.segmentEfinks;
    }
  }
  
  return Math.round(total * 100) / 100;
}
