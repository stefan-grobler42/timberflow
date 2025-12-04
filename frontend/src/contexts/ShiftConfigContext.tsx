import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { systemSettingsService, type SystemSettings, type BreakTimesSettings } from '../services/systemSettingsService';

export interface BreakSlot {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  label: string;
  color: string;
}

export interface DayShiftConfig {
  workingHours: { start: number; end: number };
  baseBreakSlots: BreakSlot[];
  dinnerBreakSlot: BreakSlot | null;
  isWeekend: boolean;
}

interface ShiftConfigContextType {
  settings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getDayConfig: (dateStr: string) => DayShiftConfig;
}

const ShiftConfigContext = createContext<ShiftConfigContextType | null>(null);

const parseTime = (timeStr: string): { hour: number; minute: number } => {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute: minute || 0 };
};

const DEFAULT_WORKING_HOURS = { start: 7, end: 17 };

export function ShiftConfigProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await systemSettingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('[ShiftConfigProvider] Failed to load settings:', err);
      setError('Failed to load shift configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const buildBreakSlots = useCallback((breakTimes: BreakTimesSettings | undefined, isWeekend: boolean): { 
    baseBreakSlots: BreakSlot[]; 
    dinnerBreakSlot: BreakSlot | null;
  } => {
    const breaks: BreakSlot[] = [];
    let dinnerBreak: BreakSlot | null = null;

    if (isWeekend && breakTimes?.weekendOvertime) {
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
        dinnerBreak = {
          startHour: dinnerStart.hour,
          startMinute: dinnerStart.minute,
          endHour: dinnerEnd.hour,
          endMinute: dinnerEnd.minute,
          label: 'Dinner (OT)',
          color: '#f8d7da'
        };
      }
    }

    return { baseBreakSlots: breaks, dinnerBreakSlot: dinnerBreak };
  }, []);

  const getDayConfig = useCallback((dateStr: string): DayShiftConfig => {
    if (!settings) {
      return {
        workingHours: DEFAULT_WORKING_HOURS,
        baseBreakSlots: [],
        dinnerBreakSlot: null,
        isWeekend: false
      };
    }

    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek] as
      'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

    const factoryHours = settings.workingHours?.factoryStaff?.[dayName];

    let workingHours = DEFAULT_WORKING_HOURS;
    if (factoryHours) {
      const [start, end] = factoryHours.split('-');
      const startHour = parseInt(start.split(':')[0]);
      const endHour = parseInt(end.split(':')[0]);
      workingHours = { start: startHour, end: endHour };
    } else if (isWeekend && settings.breakTimes?.weekendOvertime) {
      const startTime = parseTime(settings.breakTimes.weekendOvertime.workingHoursStart);
      const endTime = parseTime(settings.breakTimes.weekendOvertime.workingHoursEnd);
      workingHours = { start: startTime.hour, end: endTime.hour };
    }

    const { baseBreakSlots, dinnerBreakSlot } = buildBreakSlots(settings.breakTimes, isWeekend);

    return {
      workingHours,
      baseBreakSlots,
      dinnerBreakSlot,
      isWeekend
    };
  }, [settings, buildBreakSlots]);

  const value = useMemo(() => ({
    settings,
    loading,
    error,
    refresh: loadSettings,
    getDayConfig
  }), [settings, loading, error, loadSettings, getDayConfig]);

  return (
    <ShiftConfigContext.Provider value={value}>
      {children}
    </ShiftConfigContext.Provider>
  );
}

export function useShiftConfig() {
  const context = useContext(ShiftConfigContext);
  if (!context) {
    throw new Error('useShiftConfig must be used within a ShiftConfigProvider');
  }
  return context;
}

export function useDayShiftConfig(dateStr: string): DayShiftConfig & { loading: boolean } {
  const { getDayConfig, loading } = useShiftConfig();
  
  const config = useMemo(() => getDayConfig(dateStr), [getDayConfig, dateStr]);
  
  return { ...config, loading };
}
