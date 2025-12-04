import { useRef, useEffect, useMemo, useCallback, useState, memo } from 'react';
import { VariableSizeList as List } from 'react-window';
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

const DAY_HEADER_HEIGHT = 60;
const STANDARD_WORKING_HOURS = 10;
const PIXELS_PER_MINUTE = PlannerV2.PIXELS_PER_MINUTE;
const BUFFER_HOURS = 1;
const SCROLL_THRESHOLD_DAYS = 5;

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

function calculateDayHeight(hasLateOt: boolean, hasEarlyOt: boolean): number {
  let workingHours = STANDARD_WORKING_HOURS;
  if (hasLateOt) workingHours += 2;
  if (hasEarlyOt) workingHours += 1;
  
  const timelineMinutes = workingHours * 60 + (BUFFER_HOURS * 2 * 60);
  const timelineHeight = timelineMinutes * PIXELS_PER_MINUTE;
  
  return DAY_HEADER_HEIGHT + timelineHeight;
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
  const listRef = useRef<List>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
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
  
  const getItemSize = useCallback((index: number): number => {
    const dateStr = dates[index];
    const config = overtimeByDay[dateStr];
    const hasLateOt = config?.lateOt || Object.values(config?.overtimeByTeam || {}).some(t => t.enabled);
    const hasEarlyOt = config?.earlyOt || false;
    return calculateDayHeight(hasLateOt, hasEarlyOt);
  }, [dates, overtimeByDay]);
  
  useEffect(() => {
    if (listRef.current && !hasInitialized && dates.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToItem(todayIndex, 'center');
        setHasInitialized(true);
      }, 100);
    }
  }, [dates, todayIndex, hasInitialized]);
  
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }: { scrollOffset: number; scrollUpdateWasRequested: boolean }) => {
    if (scrollUpdateWasRequested || !hasInitialized) return;
    
    let currentOffset = 0;
    let visibleStartIndex = 0;
    for (let i = 0; i < dates.length; i++) {
      const height = getItemSize(i);
      if (currentOffset + height > scrollOffset) {
        visibleStartIndex = i;
        break;
      }
      currentOffset += height;
    }
    
    if (visibleStartIndex < SCROLL_THRESHOLD_DAYS && !extendingRef.current.past) {
      extendingRef.current.past = true;
      onDateRangeExtend('past');
      setTimeout(() => { extendingRef.current.past = false; }, 1000);
    }
    
    if (visibleStartIndex > dates.length - SCROLL_THRESHOLD_DAYS && !extendingRef.current.future) {
      extendingRef.current.future = true;
      onDateRangeExtend('future');
      setTimeout(() => { extendingRef.current.future = false; }, 1000);
    }
  }, [dates, getItemSize, hasInitialized, onDateRangeExtend]);
  
  const handleScrollToToday = useCallback(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(todayIndex, 'center');
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
    listRef.current?.resetAfterIndex(dates.indexOf(dateStr));
  }, [dates, onDayOvertimeChange]);
  
  const handleLateOtToggle = useCallback((dateStr: string, enabled: boolean) => {
    onDayOvertimeChange?.(dateStr, { lateOt: enabled });
    listRef.current?.resetAfterIndex(dates.indexOf(dateStr));
  }, [dates, onDayOvertimeChange]);
  
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
    listRef.current?.resetAfterIndex(dates.indexOf(dateStr));
  }, [dates, overtimeByDay, onDayOvertimeChange]);

  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const dateStr = dates[index];
    const dayJobs = jobsByDate.get(dateStr) || [];
    const dayBlocks = blocksByDate.get(dateStr) || [];
    const dayConfig = overtimeByDay[dateStr] || { earlyOt: false, lateOt: false, overtimeByTeam: {} };
    
    return (
      <div style={style} onDragEnd={handleDragEnd}>
        <DaySection
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
      </div>
    );
  }, [
    dates, 
    jobsByDate, 
    blocksByDate, 
    overtimeByDay, 
    jobs, 
    jigTeams, 
    chainJobsMap,
    handleDragStartWrapper,
    handleDragEnd,
    onDragOver,
    onDrop,
    onJobDoubleClick,
    onJobClick,
    onJobDurationChange,
    onJobDurationReset,
    onTeamDoubleClick,
    onJobRollover,
    globalStaging,
    onBlockClick,
    draggedJobId,
    handleEarlyOtToggle,
    handleLateOtToggle,
    handleTeamOvertimeChange
  ]);

  return (
    <Stack styles={{ root: { position: 'relative', height: '100%', width: '100%' } }}>
      <List
        ref={listRef}
        height={window.innerHeight - 180}
        width="100%"
        itemCount={dates.length}
        itemSize={getItemSize}
        onScroll={handleScroll}
        overscanCount={2}
        style={{ outline: 'none' }}
      >
        {Row}
      </List>
      
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
          {dates.length} days loaded ({dateRange.dateFrom} to {dateRange.dateTo})
        </Text>
      </Stack>
    </Stack>
  );
};

export const InfinitePlanner = memo(InfinitePlannerComponent);
