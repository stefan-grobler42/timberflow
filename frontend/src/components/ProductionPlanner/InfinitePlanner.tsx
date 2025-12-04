import { useRef, useEffect, useMemo, useCallback, useState, memo } from 'react';
import { Stack, IconButton, Text } from '@fluentui/react';
import type { ScheduleBlock } from '../../services/millenniumServices';
import * as PlannerV2 from '../../domain/plannerV2';
import { DaySection } from './DaySection';

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

interface TeamOvertimeSettings {
  enabled: boolean;
  closeTime: string;
}

interface DayOvertimeConfig {
  earlyOt: boolean;
  lateOt: boolean;
  overtimeByTeam: Record<string, TeamOvertimeSettings>;
}

export interface InfinitePlannerProps {
  jobs: Job[];
  jigTeams: Jig[];
  onDragStart: (jobId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (dateStr: string, jigId: string | null, dropTimeMinutes?: number) => void;
  onJobDoubleClick: (jobId: string) => void;
  onJobClick?: (jobId: string) => void;
  onJobDurationChange?: (jobId: string, durationMinutes: number) => void;
  onJobDurationReset?: (jobId: string) => void;
  onTeamDoubleClick: (teamId: string) => void;
  onJobRollover?: (jobId: string, overflowMinutes: number, nextDateStr: string, jigId: string | null) => void;
  globalStaging?: PlannerV2.StagingState;
  scheduleBlocks?: ScheduleBlock[];
  onBlockClick?: (block: ScheduleBlock) => void;
  dateRange: { dateFrom: string; dateTo: string };
  onDateRangeExtend: (direction: 'past' | 'future') => void;
  overtimeByDay?: Record<string, DayOvertimeConfig>;
  onDayOvertimeChange?: (dateStr: string, config: Partial<DayOvertimeConfig>) => void;
}

const SCROLL_THRESHOLD_DAYS = 5;
const VISIBLE_DAYS_BUFFER = 7;

function generateDateArray(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  const start = new Date(dateFrom + 'T00:00:00Z');
  const end = new Date(dateTo + 'T00:00:00Z');
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  
  return dates;
}

function getTodayIndex(dates: string[]): number {
  const today = new Date().toISOString().split('T')[0];
  const index = dates.indexOf(today);
  return index >= 0 ? index : Math.floor(dates.length / 2);
}

const InfinitePlannerComponent: React.FC<InfinitePlannerProps> = ({
  jobs,
  jigTeams,
  onDragStart,
  onDragOver,
  onDrop,
  onJobDoubleClick,
  onJobClick,
  onJobDurationChange,
  onJobDurationReset,
  onTeamDoubleClick,
  onJobRollover,
  globalStaging,
  scheduleBlocks = [],
  onBlockClick,
  dateRange,
  onDateRangeExtend,
  overtimeByDay = {},
  onDayOvertimeChange
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [visibleStartIndex, setVisibleStartIndex] = useState(0);
  const extendingRef = useRef<{ past: boolean; future: boolean }>({ past: false, future: false });
  
  const dates = useMemo(() => 
    generateDateArray(dateRange.dateFrom, dateRange.dateTo),
    [dateRange.dateFrom, dateRange.dateTo]
  );
  
  const todayIndex = useMemo(() => getTodayIndex(dates), [dates]);
  
  const chainJobsMap = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs) {
      const rootId = job.parentProductionId || job.id;
      const existing = map.get(rootId) || [];
      existing.push(job);
      map.set(rootId, existing.sort((a, b) => (a.rolloverSequence || 0) - (b.rolloverSequence || 0)));
    }
    return map;
  }, [jobs]);
  
  const jobsByDate = useMemo(() => {
    const map = new Map<string, Job[]>();
    for (const job of jobs) {
      if (job.plannedDateStr) {
        const existing = map.get(job.plannedDateStr) || [];
        existing.push(job);
        map.set(job.plannedDateStr, existing);
      }
    }
    return map;
  }, [jobs]);
  
  const blocksByDate = useMemo(() => {
    const map = new Map<string, ScheduleBlock[]>();
    for (const block of scheduleBlocks) {
      const existing = map.get(block.dateStr) || [];
      existing.push(block);
      map.set(block.dateStr, existing);
    }
    return map;
  }, [scheduleBlocks]);
  
  const visibleDates = useMemo(() => {
    const start = Math.max(0, visibleStartIndex - VISIBLE_DAYS_BUFFER);
    const end = Math.min(dates.length, visibleStartIndex + VISIBLE_DAYS_BUFFER * 3);
    return dates.slice(start, end);
  }, [dates, visibleStartIndex]);

  useEffect(() => {
    if (!hasInitialized && dates.length > 0) {
      setVisibleStartIndex(Math.max(0, todayIndex - VISIBLE_DAYS_BUFFER));
      setHasInitialized(true);
    }
  }, [dates, todayIndex, hasInitialized]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    
    if (scrollTop < 500 && !extendingRef.current.past) {
      extendingRef.current.past = true;
      onDateRangeExtend('past');
      setTimeout(() => { extendingRef.current.past = false; }, 1000);
    }
    
    if (scrollTop + clientHeight > scrollHeight - 500 && !extendingRef.current.future) {
      extendingRef.current.future = true;
      onDateRangeExtend('future');
      setTimeout(() => { extendingRef.current.future = false; }, 1000);
    }
  }, [onDateRangeExtend]);
  
  const handleScrollToToday = useCallback(() => {
    setVisibleStartIndex(Math.max(0, todayIndex - VISIBLE_DAYS_BUFFER));
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [todayIndex]);
  
  const handleDragStartWrapper = useCallback((jobId: string) => {
    setDraggedJobId(jobId);
    onDragStart(jobId);
  }, [onDragStart]);
  
  const handleDragEnd = useCallback(() => {
    setDraggedJobId(null);
  }, []);
  
  const handleEarlyOtToggle = useCallback((dateStr: string, enabled: boolean) => {
    onDayOvertimeChange?.(dateStr, { earlyOt: enabled });
  }, [onDayOvertimeChange]);
  
  const handleLateOtToggle = useCallback((dateStr: string, enabled: boolean) => {
    onDayOvertimeChange?.(dateStr, { lateOt: enabled });
  }, [onDayOvertimeChange]);
  
  const handleTeamOvertimeChange = useCallback((
    dateStr: string, 
    teamId: string, 
    enabled: boolean, 
    closeTime: string
  ) => {
    const currentConfig = overtimeByDay[dateStr] || { earlyOt: false, lateOt: false, overtimeByTeam: {} };
    const newOvertimeByTeam = {
      ...currentConfig.overtimeByTeam,
      [teamId]: { enabled, closeTime }
    };
    onDayOvertimeChange?.(dateStr, { overtimeByTeam: newOvertimeByTeam });
  }, [overtimeByDay, onDayOvertimeChange]);

  console.log('[InfinitePlanner] Rendering with', visibleDates.length, 'visible dates out of', dates.length, 'total');

  return (
    <Stack styles={{ root: { position: 'relative', height: '100%', width: '100%' } }}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onDragEnd={handleDragEnd}
        style={{
          height: 'calc(100vh - 180px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          outline: 'none'
        }}
      >
        {visibleDates.map((dateStr) => {
          const dayJobs = jobsByDate.get(dateStr) || [];
          const dayBlocks = blocksByDate.get(dateStr) || [];
          const dayConfig = overtimeByDay[dateStr] || { earlyOt: false, lateOt: false, overtimeByTeam: {} };
          
          return (
            <DaySection
              key={dateStr}
              dateStr={dateStr}
              jobs={dayJobs}
              allJobs={jobs}
              jigTeams={jigTeams}
              chainJobsMap={chainJobsMap}
              onDragStart={handleDragStartWrapper}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onJobDoubleClick={onJobDoubleClick}
              onJobClick={onJobClick}
              onJobDurationChange={onJobDurationChange}
              onJobDurationReset={onJobDurationReset}
              onTeamDoubleClick={onTeamDoubleClick}
              onJobRollover={onJobRollover}
              globalStaging={globalStaging}
              scheduleBlocks={dayBlocks}
              onBlockClick={onBlockClick}
              isDragging={!!draggedJobId}
              earlyOtEnabled={dayConfig.earlyOt}
              lateOtEnabled={dayConfig.lateOt}
              overtimeByTeam={dayConfig.overtimeByTeam}
              onEarlyOtToggle={(enabled) => handleEarlyOtToggle(dateStr, enabled)}
              onLateOtToggle={(enabled) => handleLateOtToggle(dateStr, enabled)}
              onTeamOvertimeChange={(teamId, enabled, closeTime) => 
                handleTeamOvertimeChange(dateStr, teamId, enabled, closeTime)
              }
            />
          );
        })}
      </div>
      
      <IconButton
        iconProps={{ iconName: 'GotoToday' }}
        title="Return to Today"
        ariaLabel="Return to Today"
        onClick={handleScrollToToday}
        styles={{
          root: {
            position: 'absolute',
            bottom: 20,
            right: 20,
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: '#0078d4',
            boxShadow: '0 4px 12px rgba(0, 120, 212, 0.4)',
            zIndex: 1000
          },
          rootHovered: {
            backgroundColor: '#106ebe'
          },
          rootPressed: {
            backgroundColor: '#005a9e'
          },
          icon: {
            color: 'white',
            fontSize: 20
          }
        }}
      />
      
      <Stack 
        horizontal 
        horizontalAlign="center" 
        styles={{ 
          root: { 
            position: 'absolute', 
            bottom: 20, 
            left: 20, 
            backgroundColor: 'rgba(255,255,255,0.9)', 
            padding: '4px 8px', 
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          } 
        }}
      >
        <Text variant="tiny" styles={{ root: { color: '#666' } }}>
          Showing {visibleDates.length} days ({dateRange.dateFrom} to {dateRange.dateTo})
        </Text>
      </Stack>
    </Stack>
  );
};

export const InfinitePlanner = memo(InfinitePlannerComponent);
