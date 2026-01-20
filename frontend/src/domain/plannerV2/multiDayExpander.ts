/**
 * Multi-day job expansion utility for Month and Week views.
 * Expands jobs that span multiple days into separate segments for display.
 */

import { 
  STANDARD_WORKING_MINUTES, 
  STANDARD_BREAKS_TOTAL
} from './constants';
import { calculateEfinksDuration, roundEfinks } from './durationCalculator';

export interface JobInput {
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

export interface ExpandedJobSegment extends JobInput {
  segmentEfinks: number;
  segmentWorkMinutes: number;
  segmentBreakMinutes: number;
  segmentIndex: number;
  totalSegments: number;
  isFirstSegment: boolean;
  isLastSegment: boolean;
  displayDate: string;
  segmentLabel: string;
}

interface TeamInfo {
  id: string;
  averageEfinks?: number;
}

/**
 * Adds business days to a date string, skipping weekends.
 */
function addBusinessDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  let added = 0;
  
  while (added < days) {
    date.setUTCDate(date.getUTCDate() + 1);
    const dayOfWeek = date.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Formats time in minutes to a human-readable string.
 */
function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Expands a single job into multiple segments if it spans multiple days.
 */
export function expandJobToSegments(
  job: JobInput,
  teamAverageEfinks?: number
): ExpandedJobSegment[] {
  if (!job.plannedDateStr || job.productionComplete) {
    return [{
      ...job,
      segmentEfinks: job.estimatedEFinks,
      segmentWorkMinutes: calculateEfinksDuration(job.estimatedEFinks, teamAverageEfinks),
      segmentBreakMinutes: 0,
      segmentIndex: 0,
      totalSegments: 1,
      isFirstSegment: true,
      isLastSegment: true,
      displayDate: job.plannedDateStr || '',
      segmentLabel: ''
    }];
  }
  
  const totalDuration = job.customDurationMinutes || 
                        job.plannedDurationMinutes || 
                        calculateEfinksDuration(job.estimatedEFinks, teamAverageEfinks);
  
  if (totalDuration <= STANDARD_WORKING_MINUTES) {
    const workMinutes = totalDuration;
    const breakMinutes = totalDuration >= STANDARD_WORKING_MINUTES * 0.5 ? 
      Math.round(STANDARD_BREAKS_TOTAL * (workMinutes / STANDARD_WORKING_MINUTES)) : 0;
    
    return [{
      ...job,
      segmentEfinks: job.estimatedEFinks,
      segmentWorkMinutes: workMinutes,
      segmentBreakMinutes: breakMinutes,
      segmentIndex: 0,
      totalSegments: 1,
      isFirstSegment: true,
      isLastSegment: true,
      displayDate: job.plannedDateStr,
      segmentLabel: ''
    }];
  }
  
  const segments: ExpandedJobSegment[] = [];
  let remainingDuration = totalDuration;
  let remainingEfinks = job.estimatedEFinks;
  let currentDateStr = job.plannedDateStr;
  let segmentIndex = 0;
  
  while (remainingDuration > 0) {
    const segmentWorkMinutes = Math.min(remainingDuration, STANDARD_WORKING_MINUTES);
    const segmentRatio = segmentWorkMinutes / totalDuration;
    const segmentEfinks = roundEfinks(job.estimatedEFinks * segmentRatio);
    const segmentBreakMinutes = segmentWorkMinutes >= STANDARD_WORKING_MINUTES * 0.5 ?
      Math.round(STANDARD_BREAKS_TOTAL * (segmentWorkMinutes / STANDARD_WORKING_MINUTES)) : 0;
    
    remainingDuration -= segmentWorkMinutes;
    remainingEfinks -= segmentEfinks;
    
    const totalSegmentsEstimate = Math.ceil(totalDuration / STANDARD_WORKING_MINUTES);
    const isFirst = segmentIndex === 0;
    const isLast = remainingDuration <= 0;
    
    const finalSegmentEfinks = isLast ? roundEfinks(segmentEfinks + remainingEfinks) : segmentEfinks;
    
    segments.push({
      ...job,
      segmentEfinks: finalSegmentEfinks,
      segmentWorkMinutes,
      segmentBreakMinutes,
      segmentIndex,
      totalSegments: totalSegmentsEstimate,
      isFirstSegment: isFirst,
      isLastSegment: isLast,
      displayDate: currentDateStr,
      segmentLabel: `Day ${segmentIndex + 1}/${totalSegmentsEstimate}: ${finalSegmentEfinks} E-Finks (${formatDuration(segmentWorkMinutes)} work${segmentBreakMinutes > 0 ? ` + ${segmentBreakMinutes}m breaks` : ''})`
    });
    
    if (remainingDuration > 0) {
      currentDateStr = addBusinessDays(currentDateStr, 1);
      segmentIndex++;
    }
  }
  
  return segments;
}

/**
 * Expands all jobs for a date range, creating segments for multi-day jobs.
 * Groups results by display date for easy lookup.
 */
export function expandJobsForDateRange(
  jobs: JobInput[],
  teams: TeamInfo[],
  startDate: string,
  endDate: string
): Map<string, ExpandedJobSegment[]> {
  const result = new Map<string, ExpandedJobSegment[]>();
  const teamMap = new Map(teams.map(t => [t.id, t.averageEfinks]));
  
  for (const job of jobs) {
    if (!job.plannedDateStr) continue;
    
    const teamAvgEfinks = job.jigId ? teamMap.get(job.jigId) : undefined;
    const segments = expandJobToSegments(job, teamAvgEfinks);
    
    for (const segment of segments) {
      if (segment.displayDate >= startDate && segment.displayDate <= endDate) {
        const existing = result.get(segment.displayDate) || [];
        existing.push(segment);
        result.set(segment.displayDate, existing);
      }
    }
  }
  
  return result;
}

/**
 * Calculates the total E-Finks for segments on a specific date.
 */
export function getTotalSegmentEfinksForDate(
  segmentMap: Map<string, ExpandedJobSegment[]>,
  dateStr: string
): number {
  const segments = segmentMap.get(dateStr) || [];
  return segments.reduce((sum, seg) => sum + seg.segmentEfinks, 0);
}

/**
 * Gets segment info for a specific job on a specific date.
 * Useful for DayView to display "Day X/Y" indicators.
 */
export interface SegmentInfo {
  segmentIndex: number;
  totalSegments: number;
  segmentEfinks: number;
  isMultiDay: boolean;
}

export function getJobSegmentInfo(
  job: JobInput,
  viewDate: string,
  teamAverageEfinks?: number
): SegmentInfo | null {
  if (!job.plannedDateStr) {
    return null;
  }
  
  const segments = expandJobToSegments(job, teamAverageEfinks);
  
  if (segments.length <= 1) {
    return {
      segmentIndex: 0,
      totalSegments: 1,
      segmentEfinks: job.estimatedEFinks,
      isMultiDay: false
    };
  }
  
  const matchingSegment = segments.find(seg => seg.displayDate === viewDate);
  
  if (!matchingSegment) {
    return null;
  }
  
  return {
    segmentIndex: matchingSegment.segmentIndex,
    totalSegments: matchingSegment.totalSegments,
    segmentEfinks: matchingSegment.segmentEfinks,
    isMultiDay: true
  };
}
