import { api } from './api';

export interface SystemSettings {
  financialYear?: FinancialYearSettings;
  workingHours?: WorkingHoursSettings;
  timezone?: TimezoneSettings;
  breakTimes?: BreakTimesSettings;
  productionScheduling?: ProductionSchedulingSettings;
}

export interface ProductionSchedulingSettings {
  general?: GeneralSchedulingSettings;
  overtimeDefaults?: OvertimeDefaultsSettings;
  uiDisplay?: UiDisplaySettings;
}

export interface GeneralSchedulingSettings {
  bufferMinutes: number;
  minJobDuration: number;
  durationRoundingIncrement: number;
  eFinkMultiplier: number;
}

export interface OvertimeDefaultsSettings {
  defaultOvertimeEnabled: boolean;
  defaultLateOtEndTime: string;
  allowEarlyStartOt: boolean;
  defaultEarlyStartTime: string;
}

export interface UiDisplaySettings {
  pixelsPerMinute: number;
  visibleHoursBeforeShift: number;
  visibleHoursAfterShift: number;
  dayHeaderHeight: number;
}

export interface FinancialYearSettings {
  startMonth: number;
  startDay: number;
}

export interface WorkingHoursSettings {
  officeStaff?: StaffWorkingHours;
  factoryStaff?: StaffWorkingHours;
}

export interface StaffWorkingHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

export interface TimezoneSettings {
  timeZoneId: string;
  displayName: string;
  utcOffset: string;
}

export interface BreakTimesSettings {
  teaMorning?: BreakTimeRange;
  lunch?: BreakTimeRange;
  teaAfternoon?: BreakTimeRange;
  dinnerOvertime?: BreakTimeRange;
}

export interface BreakTimeRange {
  start: string;
  end: string;
}

class SystemSettingsService {
  async getSettings(): Promise<SystemSettings> {
    return await api.get<SystemSettings>('/SystemSettings');
  }

  async updateSettings(settings: SystemSettings): Promise<void> {
    await api.put('/SystemSettings', settings);
  }
}

export const systemSettingsService = new SystemSettingsService();
