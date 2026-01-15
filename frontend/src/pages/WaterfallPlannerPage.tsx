import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Stack, Text, CommandBar, Spinner, MessageBar, MessageBarType,
  Toggle, IconButton, mergeStyles, Dropdown
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { jigService, scheduleBlockService, type ScheduleBlock } from '../services/millenniumServices';
import { productionService } from '../services/d365Services';
import { jobAllocationService, type JobAllocationDto, type CreateJobAllocationDto } from '../services/jobAllocationService';
import { teamDaySettingsService, type TeamDaySettingsDto } from '../services/teamDaySettingsService';
import type { Jig } from '../types/millennium';
import { eFinksToMinutes, scheduleJob, type DaySettings } from '../domain/waterfallScheduler/scheduler';
import { getDayCapacity, addDays } from '../domain/waterfallScheduler/dayCapacity';
import { EARLY_OT_DEFAULT_START, LATE_OT_DEFAULT_END, DEFAULT_WORKING_HOURS, type JobAllocation } from '../domain/waterfallScheduler/types';
import { TimeLoggingPanel } from '../components/WaterfallPlanner/TimeLoggingPanel';

type ViewMode = 'month' | 'week' | 'day';

interface UnallocatedJob {
  id: string;
  productionId: string;
  orderNumber: string;
  customerName: string;
  productionName: string;
  siteAddress?: string;
  estimatedEfinks: number;
}

const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

const formatDateStr = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const getDaysInMonth = (date: Date): string[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const startDate = getMonday(firstDay);
  const endDate = new Date(lastDay);
  while (endDate.getDay() !== 0) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  const days: string[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    days.push(formatDateStr(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

const getDaysInWeek = (startDate: Date): string[] => {
  const days: string[] = [];
  const monday = getMonday(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(formatDateStr(d));
  }
  return days;
};

const containerClass = mergeStyles({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  overflow: 'hidden'
});

const contentClass = mergeStyles({
  display: 'flex',
  flex: 1,
  overflow: 'hidden'
});

const unallocatedPanelClass = mergeStyles({
  width: 280,
  borderRight: '1px solid #e1dfdd',
  backgroundColor: '#faf9f8',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
});

const mainPanelClass = mergeStyles({
  flex: 1,
  overflow: 'auto',
  padding: 16
});

const jobCardClass = mergeStyles({
  padding: 8,
  marginBottom: 8,
  backgroundColor: '#fff',
  border: '1px solid #e1dfdd',
  borderRadius: 4,
  cursor: 'grab',
  ':hover': {
    backgroundColor: '#f3f2f1'
  }
});

const allocatedJobCardClass = mergeStyles({
  padding: 6,
  marginBottom: 4,
  background: 'linear-gradient(135deg, rgba(0, 120, 212, 0.85), rgba(0, 90, 180, 0.75))',
  borderRadius: 4,
  color: 'white',
  cursor: 'grab',
  fontSize: 12
});

const dayCellClass = mergeStyles({
  border: '1px solid #e1dfdd',
  borderRadius: 4,
  backgroundColor: 'white',
  minHeight: 120,
  overflow: 'hidden'
});

const dayHeaderClass = mergeStyles({
  padding: '6px 10px',
  backgroundColor: '#0078d4',
  color: 'white',
  cursor: 'pointer',
  ':hover': {
    backgroundColor: '#106ebe'
  }
});

const weekendHeaderClass = mergeStyles({
  padding: '6px 10px',
  backgroundColor: '#999',
  color: 'white'
});

export const WaterfallPlannerPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Jig[]>([]);
  const [unallocatedJobs, setUnallocatedJobs] = useState<UnallocatedJob[]>([]);
  const [allocations, setAllocations] = useState<JobAllocationDto[]>([]);
  const [daySettings, setDaySettings] = useState<Map<string, TeamDaySettingsDto>>(new Map());
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [operationInProgress, setOperationInProgress] = useState(false);
  
  const [selectedAllocation, setSelectedAllocation] = useState<JobAllocationDto | null>(null);
  const [timeLogPanelOpen, setTimeLogPanelOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      const dateFrom = formatDateStr(new Date(today.getFullYear(), today.getMonth() - 3, 1));
      const dateTo = formatDateStr(new Date(today.getFullYear(), today.getMonth() + 6, 0));

      const [teamsData, productionsData, allocationsData, settingsData, blocksData] = await Promise.all([
        jigService.getAll(),
        productionService.getForPlanner({ dateFrom, dateTo }),
        jobAllocationService.getAll({ dateFrom, dateTo }),
        teamDaySettingsService.getRange({ dateFrom, dateTo }),
        scheduleBlockService.getAll({ dateFrom, dateTo })
      ]);

      setTeams(teamsData.sort((a: Jig, b: Jig) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)));
      
      const allocatedProductionIds = new Set(allocationsData.map(a => a.productionId).filter(Boolean));
      
      const unalloc: UnallocatedJob[] = productionsData
        .filter((p) => 
          !p.productionComplete && !allocatedProductionIds.has(p.id)
        )
        .map((p) => ({
          id: p.id,
          productionId: p.id,
          orderNumber: p.orderNumber || '',
          customerName: p.customerName || '',
          productionName: p.name || '',
          siteAddress: '',
          estimatedEfinks: p.newEstimateDefinks || 0
        }));
      setUnallocatedJobs(unalloc);
      setAllocations(allocationsData);

      const settingsMap = new Map<string, TeamDaySettingsDto>();
      for (const s of settingsData) {
        settingsMap.set(`${s.teamId}|${s.workDate}`, s);
      }
      setDaySettings(settingsMap);
      setScheduleBlocks(blocksData);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load planner data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDaySettingsForDate = useCallback((teamId: string, dateStr: string): DaySettings => {
    const key = `${teamId}|${dateStr}`;
    const settings = daySettings.get(key);
    if (settings) {
      return {
        isWorkingDay: settings.isWorkingDay,
        earlyOtEnabled: settings.earlyOtEnabled,
        earlyOtStartMinutes: settings.earlyOtStartMinutes,
        lateOtEnabled: settings.lateOtEnabled,
        lateOtEndMinutes: settings.lateOtEndMinutes
      };
    }
    return {
      earlyOtEnabled: false,
      lateOtEnabled: false
    };
  }, [daySettings]);

  const getBlocksForDate = useCallback((teamId: string, dateStr: string) => {
    return scheduleBlocks
      .filter(block => {
        const matchesDate = block.dateStr === dateStr;
        const matchesTeam = block.teamId === null || block.teamId === teamId;
        return matchesDate && matchesTeam;
      })
      .map(block => ({
        id: block.id,
        type: block.blockType,
        startMinutes: block.startTimeMinutes ?? 0,
        endMinutes: block.endTimeMinutes ?? 0,
        isFullDay: block.blockType === 'PublicHoliday'
      }));
  }, [scheduleBlocks]);

  const handleOtToggle = useCallback(async (teamId: string, dateStr: string, type: 'early' | 'late', enabled: boolean) => {
    setOperationInProgress(true);
    try {
      const key = `${teamId}|${dateStr}`;
      const existing = daySettings.get(key);
      
      const dto = {
        teamId,
        workDate: dateStr,
        earlyOtEnabled: type === 'early' ? enabled : (existing?.earlyOtEnabled ?? false),
        earlyOtStartMinutes: existing?.earlyOtStartMinutes ?? EARLY_OT_DEFAULT_START,
        lateOtEnabled: type === 'late' ? enabled : (existing?.lateOtEnabled ?? false),
        lateOtEndMinutes: existing?.lateOtEndMinutes ?? LATE_OT_DEFAULT_END,
        isWorkingDay: existing?.isWorkingDay ?? true
      };

      const result = await teamDaySettingsService.upsert(dto);
      
      setDaySettings(prev => {
        const next = new Map(prev);
        next.set(key, result);
        return next;
      });
    } catch (err) {
      console.error('Failed to update OT settings:', err);
      setError('Failed to update overtime settings');
    } finally {
      setOperationInProgress(false);
    }
  }, [daySettings]);

  const handleOtTimeChange = useCallback(async (teamId: string, dateStr: string, type: 'early' | 'late', minutes: number) => {
    setOperationInProgress(true);
    try {
      const key = `${teamId}|${dateStr}`;
      const existing = daySettings.get(key);
      
      const dto = {
        teamId,
        workDate: dateStr,
        earlyOtEnabled: existing?.earlyOtEnabled ?? false,
        earlyOtStartMinutes: type === 'early' ? minutes : (existing?.earlyOtStartMinutes ?? EARLY_OT_DEFAULT_START),
        lateOtEnabled: existing?.lateOtEnabled ?? false,
        lateOtEndMinutes: type === 'late' ? minutes : (existing?.lateOtEndMinutes ?? LATE_OT_DEFAULT_END),
        isWorkingDay: existing?.isWorkingDay ?? true
      };

      const result = await teamDaySettingsService.upsert(dto);
      
      setDaySettings(prev => {
        const next = new Map(prev);
        next.set(key, result);
        return next;
      });
    } catch (err) {
      console.error('Failed to update OT time:', err);
      setError('Failed to update overtime time');
    } finally {
      setOperationInProgress(false);
    }
  }, [daySettings]);

  const earlyOtTimeOptions: IDropdownOption[] = useMemo(() => {
    const options: IDropdownOption[] = [];
    for (let h = 5; h <= 7; h++) {
      for (let m = 0; m < 60; m += 15) {
        const minutes = h * 60 + m;
        if (minutes >= 300 && minutes <= 420) {
          options.push({ key: minutes, text: formatTime(minutes) });
        }
      }
    }
    return options;
  }, []);

  const lateOtTimeOptions: IDropdownOption[] = useMemo(() => {
    const options: IDropdownOption[] = [];
    for (let h = 17; h <= 20; h++) {
      for (let m = 0; m < 60; m += 15) {
        const minutes = h * 60 + m;
        if (minutes >= 1020 && minutes <= 1200) {
          options.push({ key: minutes, text: formatTime(minutes) });
        }
      }
    }
    return options;
  }, []);

  const breakSlots = useMemo(() => [
    { startMinutes: 9 * 60, endMinutes: 9 * 60 + 15, label: 'Tea', color: '#d4edda' },
    { startMinutes: 12 * 60, endMinutes: 12 * 60 + 30, label: 'Lunch', color: '#fff3cd' },
    { startMinutes: 17 * 60, endMinutes: 17 * 60 + 30, label: 'Dinner', color: '#f8d7da' }
  ], []);

  const handleDragStart = useCallback((jobId: string) => {
    setDraggedJobId(jobId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDropOnTeamDay = useCallback(async (teamId: string, dateStr: string) => {
    if (!draggedJobId) return;

    const job = unallocatedJobs.find(j => j.id === draggedJobId);
    if (!job) {
      setDraggedJobId(null);
      return;
    }

    setOperationInProgress(true);
    try {
      const team = teams.find(t => t.id === teamId);
      const teamAverageEfinks = team?.averageEfinks ?? 80;
      
      const teamAllocations = allocations
        .filter(a => a.teamId === teamId && !a.isComplete)
        .sort((a, b) => a.queuePosition - b.queuePosition);

      const existingOnDay = teamAllocations.filter(a => a.spanStartDate === dateStr);
      const queuePosition = existingOnDay.length > 0 
        ? Math.max(...existingOnDay.map(a => a.queuePosition)) + 1 
        : teamAllocations.length + 1;

      const settings = getDaySettingsForDate(teamId, dateStr);
      const blocks = getBlocksForDate(teamId, dateStr);
      const dayCapacity = getDayCapacity(
        dateStr,
        settings.earlyOtEnabled,
        settings.earlyOtStartMinutes,
        settings.lateOtEnabled,
        settings.lateOtEndMinutes,
        blocks,
        settings.isWorkingDay
      );

      let startMinutes = dayCapacity.workingHours.startMinutes;
      
      if (existingOnDay.length > 0) {
        const lastJob = existingOnDay[existingOnDay.length - 1];
        if (lastJob.spanEndMinutes) {
          startMinutes = lastJob.spanEndMinutes;
        }
      }

      const tempAllocation: JobAllocation = {
        id: 'temp',
        productionId: job.productionId,
        teamId,
        orderNumber: job.orderNumber,
        customerName: job.customerName,
        productionName: job.productionName,
        siteAddress: job.siteAddress,
        estimatedEfinks: job.estimatedEfinks,
        estimatedDurationMinutes: eFinksToMinutes(job.estimatedEfinks, teamAverageEfinks),
        spanStartDate: dateStr,
        spanStartMinutes: startMinutes,
        queuePosition,
        status: 'scheduled',
        isComplete: false
      };

      const getDaySettingsFn = (d: string): DaySettings => getDaySettingsForDate(teamId, d);
      const getBlocksFn = (d: string) => getBlocksForDate(teamId, d);

      const scheduleResult = scheduleJob(tempAllocation, getDaySettingsFn, getBlocksFn, teamAverageEfinks);

      const dto: CreateJobAllocationDto = {
        productionId: job.productionId,
        teamId,
        orderNumber: job.orderNumber,
        customerName: job.customerName,
        productionName: job.productionName,
        siteAddress: job.siteAddress,
        estimatedEfinks: job.estimatedEfinks,
        estimatedDurationMinutes: eFinksToMinutes(job.estimatedEfinks, teamAverageEfinks),
        spanStartDate: dateStr,
        spanStartMinutes: startMinutes,
        queuePosition,
        spanEndDate: scheduleResult.spanEndDate,
        spanEndMinutes: scheduleResult.spanEndMinutes
      };

      const newAllocation = await jobAllocationService.create(dto);
      
      setAllocations(prev => [...prev, newAllocation]);
      setUnallocatedJobs(prev => prev.filter(j => j.id !== draggedJobId));

    } catch (err) {
      console.error('Failed to allocate job:', err);
      setError('Failed to allocate job');
    } finally {
      setDraggedJobId(null);
      setOperationInProgress(false);
    }
  }, [draggedJobId, unallocatedJobs, allocations, getDaySettingsForDate, getBlocksForDate, teams]);

  const handleDeleteAllocation = useCallback(async (allocationId: string) => {
    setOperationInProgress(true);
    try {
      await jobAllocationService.delete(allocationId);
      setAllocations(prev => prev.filter(a => a.id !== allocationId));
    } catch (err) {
      console.error('Failed to delete allocation:', err);
      setError('Failed to remove job from schedule');
    } finally {
      setOperationInProgress(false);
    }
  }, []);

  const handleOpenTimeLog = useCallback((allocation: JobAllocationDto) => {
    setSelectedAllocation(allocation);
    setTimeLogPanelOpen(true);
  }, []);

  const handleCloseTimeLog = useCallback(() => {
    setTimeLogPanelOpen(false);
    setSelectedAllocation(null);
  }, []);

  const daysInView = useMemo(() => {
    if (viewMode === 'month') {
      return getDaysInMonth(currentDate);
    } else if (viewMode === 'week' && selectedWeekStart) {
      return getDaysInWeek(new Date(selectedWeekStart));
    } else if (viewMode === 'day' && selectedDay) {
      return [selectedDay];
    }
    return getDaysInMonth(currentDate);
  }, [viewMode, currentDate, selectedWeekStart, selectedDay]);

  const allocationsByTeamAndDate = useMemo(() => {
    const map = new Map<string, JobAllocationDto[]>();
    for (const alloc of allocations) {
      const dateOnly = alloc.spanStartDate.substring(0, 10);
      const key = `${alloc.teamId}|${dateOnly}`;
      const existing = map.get(key) || [];
      existing.push(alloc);
      map.set(key, existing);
    }
    return map;
  }, [allocations]);

  const getJobCountForTeamDay = useCallback((teamId: string, dateStr: string): number => {
    const key = `${teamId}|${dateStr}`;
    return allocationsByTeamAndDate.get(key)?.length || 0;
  }, [allocationsByTeamAndDate]);

  const getTotalEfinksForTeamDay = useCallback((teamId: string, dateStr: string): number => {
    const key = `${teamId}|${dateStr}`;
    const jobs = allocationsByTeamAndDate.get(key) || [];
    return jobs.reduce((sum, j) => sum + j.estimatedEfinks, 0);
  }, [allocationsByTeamAndDate]);

  const getAllocationsForTeamDay = useCallback((teamId: string, dateStr: string): JobAllocationDto[] => {
    const key = `${teamId}|${dateStr}`;
    return allocationsByTeamAndDate.get(key) || [];
  }, [allocationsByTeamAndDate]);

  const navigatePrev = useCallback(() => {
    if (viewMode === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    } else if (viewMode === 'week' && selectedWeekStart) {
      const d = new Date(selectedWeekStart);
      d.setDate(d.getDate() - 7);
      setSelectedWeekStart(formatDateStr(d));
    } else if (viewMode === 'day' && selectedDay) {
      setSelectedDay(addDays(selectedDay, -1));
    }
  }, [viewMode, selectedWeekStart, selectedDay]);

  const navigateNext = useCallback(() => {
    if (viewMode === 'month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    } else if (viewMode === 'week' && selectedWeekStart) {
      const d = new Date(selectedWeekStart);
      d.setDate(d.getDate() + 7);
      setSelectedWeekStart(formatDateStr(d));
    } else if (viewMode === 'day' && selectedDay) {
      setSelectedDay(addDays(selectedDay, 1));
    }
  }, [viewMode, selectedWeekStart, selectedDay]);

  const handleWeekClick = useCallback((weekStart: string) => {
    setSelectedWeekStart(weekStart);
    setViewMode('week');
  }, []);

  const handleDayClick = useCallback((dateStr: string) => {
    setSelectedDay(dateStr);
    setViewMode('day');
  }, []);

  const goBackToMonth = useCallback(() => {
    setViewMode('month');
    setSelectedWeekStart(null);
    setSelectedDay(null);
  }, []);

  const goBackToWeek = useCallback(() => {
    setViewMode('week');
    setSelectedDay(null);
  }, []);

  const formatMonthHeader = (): string => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const formatWeekHeader = (): string => {
    if (!selectedWeekStart) return '';
    const start = new Date(selectedWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `Week of ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  const formatDayHeader = (): string => {
    if (!selectedDay) return '';
    const d = new Date(selectedDay);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'back',
      text: viewMode === 'week' ? 'Back to Month' : viewMode === 'day' ? 'Back to Week' : '',
      iconProps: { iconName: 'Back' },
      disabled: viewMode === 'month',
      onClick: () => viewMode === 'day' ? goBackToWeek() : goBackToMonth()
    },
    {
      key: 'prev',
      iconProps: { iconName: 'ChevronLeft' },
      onClick: navigatePrev
    },
    {
      key: 'dateLabel',
      text: viewMode === 'month' ? formatMonthHeader() : viewMode === 'week' ? formatWeekHeader() : formatDayHeader(),
      disabled: true
    },
    {
      key: 'next',
      iconProps: { iconName: 'ChevronRight' },
      onClick: navigateNext
    },
    {
      key: 'today',
      text: 'Today',
      iconProps: { iconName: 'GotoToday' },
      onClick: () => {
        setCurrentDate(new Date());
        if (viewMode === 'week') {
          setSelectedWeekStart(formatDateStr(getMonday(new Date())));
        } else if (viewMode === 'day') {
          setSelectedDay(formatDateStr(new Date()));
        }
      }
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadData
    }
  ];

  const renderMonthView = () => {
    const weeks: string[][] = [];
    for (let i = 0; i < daysInView.length; i += 7) {
      weeks.push(daysInView.slice(i, i + 7));
    }

    return (
      <Stack tokens={{ childrenGap: 16 }}>
        {weeks.map((week, weekIdx) => {
          const weekMonday = week.find(d => new Date(d).getDay() === 1) || week[0];
          const weekNum = getISOWeekNumber(weekMonday);

          return (
            <Stack key={weekIdx}>
              <Stack
                horizontal
                horizontalAlign="space-between"
                onClick={() => handleWeekClick(weekMonday)}
                styles={{
                  root: {
                    padding: '8px 12px',
                    backgroundColor: '#0078d4',
                    color: 'white',
                    cursor: 'pointer',
                    borderRadius: '4px 4px 0 0',
                    ':hover': { backgroundColor: '#106ebe' }
                  }
                }}
              >
                <Text styles={{ root: { color: 'white', fontWeight: 600 } }}>Week {weekNum}</Text>
              </Stack>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, padding: 8, backgroundColor: '#f3f2f1', borderRadius: '0 0 4px 4px' }}>
                {week.map(dateStr => {
                  const date = new Date(dateStr);
                  const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;
                  const isCurrentMonthDay = date.getMonth() === currentDate.getMonth();

                  return (
                    <div
                      key={dateStr}
                      className={dayCellClass}
                      style={{ opacity: isCurrentMonthDay ? 1 : 0.5 }}
                    >
                      <div
                        className={isWeekendDay ? weekendHeaderClass : dayHeaderClass}
                        onClick={() => handleDayClick(dateStr)}
                      >
                        <Text variant="small" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]} {date.getDate()}
                        </Text>
                      </div>
                      <Stack styles={{ root: { padding: 6 } }} tokens={{ childrenGap: 4 }}>
                        {teams.map(team => {
                          const count = getJobCountForTeamDay(team.id, dateStr);
                          const efinks = getTotalEfinksForTeamDay(team.id, dateStr);
                          return (
                            <Stack
                              key={team.id}
                              horizontal
                              horizontalAlign="space-between"
                              onDragOver={handleDragOver}
                              onDrop={(e) => { e.stopPropagation(); handleDropOnTeamDay(team.id, dateStr); }}
                              styles={{
                                root: {
                                  padding: '2px 6px',
                                  backgroundColor: count > 0 ? (team.colour || '#0078d4') : '#e1dfdd',
                                  borderRadius: 2,
                                  color: count > 0 ? 'white' : '#666',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  minHeight: 18,
                                  ':hover': { backgroundColor: team.colour || '#0078d4', color: 'white' }
                                }
                              }}
                            >
                              <Text variant="tiny" styles={{ root: { color: 'inherit' } }}>{team.name}</Text>
                              {count > 0 && <Text variant="tiny" styles={{ root: { color: 'inherit' } }}>{count} ({efinks})</Text>}
                            </Stack>
                          );
                        })}
                      </Stack>
                    </div>
                  );
                })}
              </div>
            </Stack>
          );
        })}
      </Stack>
    );
  };

  const renderWeekView = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
        {daysInView.map(dateStr => {
          const date = new Date(dateStr);
          const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div key={dateStr} className={dayCellClass}>
              <div
                className={isWeekendDay ? weekendHeaderClass : dayHeaderClass}
                onClick={() => handleDayClick(dateStr)}
              >
                <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]} {date.getDate()}/{date.getMonth() + 1}
                </Text>
              </div>
              <Stack styles={{ root: { padding: 8, maxHeight: 400, overflowY: 'auto' } }} tokens={{ childrenGap: 8 }}>
                {teams.map(team => {
                  const teamJobs = getAllocationsForTeamDay(team.id, dateStr);
                  const settings = getDaySettingsForDate(team.id, dateStr);

                  return (
                    <Stack
                      key={team.id}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDropOnTeamDay(team.id, dateStr)}
                      styles={{
                        root: {
                          padding: 6,
                          backgroundColor: '#faf9f8',
                          borderRadius: 4,
                          border: '1px solid #e1dfdd',
                          minHeight: 60
                        }
                      }}
                    >
                      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                        <Text variant="small" styles={{ root: { fontWeight: 600, color: team.colour || '#0078d4' } }}>
                          {team.name}
                        </Text>
                        <Stack horizontal tokens={{ childrenGap: 4 }}>
                          <Toggle
                            label="OT"
                            inlineLabel
                            checked={settings.lateOtEnabled}
                            onChange={(_, checked) => handleOtToggle(team.id, dateStr, 'late', !!checked)}
                            styles={{ root: { marginBottom: 0 }, label: { fontSize: 10 } }}
                          />
                        </Stack>
                      </Stack>
                      <Stack tokens={{ childrenGap: 4 }} styles={{ root: { marginTop: 4 } }}>
                        {teamJobs.map(job => (
                          <div key={job.id} className={allocatedJobCardClass}>
                            <Stack horizontal horizontalAlign="space-between">
                              <Text variant="tiny" styles={{ root: { fontWeight: 600, color: 'white' } }}>
                                {job.orderNumber}
                              </Text>
                              <IconButton
                                iconProps={{ iconName: 'Delete' }}
                                styles={{ root: { height: 16, width: 16 }, icon: { fontSize: 10, color: 'white' } }}
                                onClick={() => handleDeleteAllocation(job.id)}
                              />
                            </Stack>
                            <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.9)' } }}>
                              {job.customerName}
                            </Text>
                            <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.8)' } }}>
                              {job.estimatedEfinks} E-Finks
                            </Text>
                          </div>
                        ))}
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    if (!selectedDay) return null;

    const hours: number[] = [];
    for (let h = 6; h <= 20; h++) {
      hours.push(h);
    }

    return (
      <Stack tokens={{ childrenGap: 16 }}>
        <Stack horizontal tokens={{ childrenGap: 16 }}>
          {teams.map(team => {
            const teamJobs = getAllocationsForTeamDay(team.id, selectedDay);
            const settings = getDaySettingsForDate(team.id, selectedDay);
            const dayCapacity = getDayCapacity(
              selectedDay,
              settings.earlyOtEnabled,
              settings.earlyOtStartMinutes,
              settings.lateOtEnabled,
              settings.lateOtEndMinutes,
              []
            );

            return (
              <Stack
                key={team.id}
                styles={{
                  root: {
                    flex: 1,
                    border: '1px solid #e1dfdd',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }
                }}
                onDragOver={handleDragOver}
                onDrop={() => handleDropOnTeamDay(team.id, selectedDay)}
              >
                <Stack styles={{ root: { padding: 10, backgroundColor: team.colour || '#0078d4' } }}>
                  <Text variant="medium" styles={{ root: { color: 'white', fontWeight: 600 } }}>
                    {team.name}
                  </Text>
                  <Stack horizontal tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 8 } }} wrap>
                    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                      <Toggle
                        label="Early OT"
                        inlineLabel
                        checked={settings.earlyOtEnabled}
                        onChange={(_, checked) => handleOtToggle(team.id, selectedDay, 'early', !!checked)}
                        styles={{ root: { marginBottom: 0 }, label: { fontSize: 11, color: 'white' } }}
                      />
                      {settings.earlyOtEnabled && (
                        <Dropdown
                          options={earlyOtTimeOptions}
                          selectedKey={settings.earlyOtStartMinutes ?? EARLY_OT_DEFAULT_START}
                          onChange={(_, opt) => opt && handleOtTimeChange(team.id, selectedDay, 'early', opt.key as number)}
                          styles={{ root: { width: 80 }, title: { fontSize: 11, minHeight: 24, lineHeight: 24, padding: '0 8px' }, dropdown: { minHeight: 24 } }}
                        />
                      )}
                    </Stack>
                    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                      <Toggle
                        label="Late OT"
                        inlineLabel
                        checked={settings.lateOtEnabled}
                        onChange={(_, checked) => handleOtToggle(team.id, selectedDay, 'late', !!checked)}
                        styles={{ root: { marginBottom: 0 }, label: { fontSize: 11, color: 'white' } }}
                      />
                      {settings.lateOtEnabled && (
                        <Dropdown
                          options={lateOtTimeOptions}
                          selectedKey={settings.lateOtEndMinutes ?? LATE_OT_DEFAULT_END}
                          onChange={(_, opt) => opt && handleOtTimeChange(team.id, selectedDay, 'late', opt.key as number)}
                          styles={{ root: { width: 80 }, title: { fontSize: 11, minHeight: 24, lineHeight: 24, padding: '0 8px' }, dropdown: { minHeight: 24 } }}
                        />
                      )}
                    </Stack>
                  </Stack>
                  <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.8)', marginTop: 4 } }}>
                    Working: {formatTime(dayCapacity.workingHours.startMinutes)} - {formatTime(dayCapacity.workingHours.endMinutes)}
                    {' '}({dayCapacity.availableMinutes} mins available)
                  </Text>
                </Stack>

                <Stack styles={{ root: { position: 'relative', height: 600, backgroundColor: '#faf9f8' } }}>
                  {hours.map(h => (
                    <div
                      key={h}
                      style={{
                        position: 'absolute',
                        top: (h - 6) * 40,
                        left: 0,
                        right: 0,
                        height: 40,
                        borderBottom: '1px solid #e1dfdd',
                        display: 'flex',
                        alignItems: 'flex-start',
                        paddingLeft: 4,
                        paddingTop: 2,
                        fontSize: 10,
                        color: '#666'
                      }}
                    >
                      {formatTime(h * 60)}
                    </div>
                  ))}

                  {breakSlots.map((brk, idx) => {
                    const showDinner = brk.label === 'Dinner' && settings.lateOtEnabled;
                    if (brk.label === 'Dinner' && !showDinner) return null;
                    const top = ((brk.startMinutes / 60) - 6) * 40;
                    const height = ((brk.endMinutes - brk.startMinutes) / 60) * 40;
                    return (
                      <div
                        key={idx}
                        style={{
                          position: 'absolute',
                          top,
                          left: 40,
                          right: 8,
                          height,
                          backgroundColor: brk.color,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color: '#666',
                          zIndex: 1,
                          opacity: 0.8
                        }}
                      >
                        {brk.label}
                      </div>
                    );
                  })}

                  {teamJobs.map(job => {
                    const startMinutes = job.spanStartMinutes ?? DEFAULT_WORKING_HOURS.startMinutes;
                    const durationMinutes = job.estimatedDurationMinutes || 60;
                    const top = ((startMinutes / 60) - 6) * 40;
                    const height = (durationMinutes / 60) * 40;

                    return (
                      <div
                        key={job.id}
                        draggable
                        onDragStart={() => handleDragStart(job.id)}
                        style={{
                          position: 'absolute',
                          top: Math.max(0, top),
                          left: 40,
                          right: 8,
                          height: Math.max(20, height),
                          background: 'linear-gradient(135deg, rgba(0, 120, 212, 0.9), rgba(0, 90, 180, 0.8))',
                          borderRadius: 4,
                          padding: 4,
                          color: 'white',
                          fontSize: 11,
                          overflow: 'hidden',
                          cursor: 'grab',
                          zIndex: 10
                        }}
                      >
                        <Stack horizontal horizontalAlign="space-between">
                          <Text variant="tiny" styles={{ root: { fontWeight: 600, color: 'white' } }}>
                            {job.orderNumber}
                          </Text>
                          <Stack horizontal tokens={{ childrenGap: 4 }}>
                            <IconButton
                              iconProps={{ iconName: 'Clock' }}
                              title="Log Time"
                              styles={{ root: { height: 14, width: 14 }, icon: { fontSize: 10, color: 'white' } }}
                              onClick={(e) => { e.stopPropagation(); handleOpenTimeLog(job); }}
                            />
                            <IconButton
                              iconProps={{ iconName: 'Delete' }}
                              title="Remove"
                              styles={{ root: { height: 14, width: 14 }, icon: { fontSize: 10, color: 'white' } }}
                              onClick={(e) => { e.stopPropagation(); handleDeleteAllocation(job.id); }}
                            />
                          </Stack>
                        </Stack>
                        <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.9)' } }}>
                          {job.customerName}
                        </Text>
                        <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.8)' } }}>
                          {job.estimatedEfinks} E-Finks • {formatTime(startMinutes)}-{formatTime(startMinutes + durationMinutes)}
                        </Text>
                      </div>
                    );
                  })}
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </Stack>
    );
  };

  if (loading) {
    return (
      <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { height: '100vh' } }}>
        <Spinner label="Loading planner..." />
      </Stack>
    );
  }

  return (
    <div className={containerClass}>
      <CommandBar items={commandBarItems} />
      
      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      {operationInProgress && (
        <MessageBar messageBarType={MessageBarType.info}>
          <Spinner size={0} /> Processing...
        </MessageBar>
      )}

      <div className={contentClass}>
        <div className={unallocatedPanelClass}>
          <Stack styles={{ root: { padding: 12, borderBottom: '1px solid #e1dfdd' } }}>
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              Unallocated ({unallocatedJobs.length})
            </Text>
            <Text variant="small" styles={{ root: { color: '#666' } }}>
              Drag jobs to schedule
            </Text>
          </Stack>
          <Stack styles={{ root: { flex: 1, overflow: 'auto', padding: 8 } }}>
            {unallocatedJobs.map(job => (
              <div
                key={job.id}
                className={jobCardClass}
                draggable
                onDragStart={() => handleDragStart(job.id)}
              >
                <Text variant="small" block styles={{ root: { fontWeight: 600 } }}>
                  {job.orderNumber}
                </Text>
                <Text variant="small" block styles={{ root: { color: '#666' } }}>
                  {job.customerName}
                </Text>
                <Text variant="tiny" block styles={{ root: { color: '#999' } }}>
                  {job.estimatedEfinks} E-Finks
                </Text>
              </div>
            ))}
            {unallocatedJobs.length === 0 && (
              <Text variant="small" styles={{ root: { color: '#999', textAlign: 'center', padding: 20 } }}>
                No unallocated jobs
              </Text>
            )}
          </Stack>
        </div>

        <div className={mainPanelClass}>
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </div>

      <TimeLoggingPanel
        isOpen={timeLogPanelOpen}
        onDismiss={handleCloseTimeLog}
        allocation={selectedAllocation}
        workDate={selectedDay || formatDateStr(new Date())}
        onSaved={loadData}
      />
    </div>
  );
};

function getISOWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default WaterfallPlannerPage;
