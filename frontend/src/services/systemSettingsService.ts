import { api } from './api';

export interface SystemSettings {
  financialYear?: FinancialYearSettings;
  workingHours?: WorkingHoursSettings;
  timezone?: TimezoneSettings;
  breakTimes?: BreakTimesSettings;
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
  weekday?: WeekdayBreaks;
  weekdayOvertime?: OvertimeBreaks;
  weekendOvertime?: WeekendOvertime;
}

export interface WeekdayBreaks {
  teaStart: string;
  teaEnd: string;
  lunchStart: string;
  lunchEnd: string;
}

export interface OvertimeBreaks {
  dinnerStart: string;
  dinnerEnd: string;
}

export interface WeekendOvertime {
  workingHoursStart: string;
  workingHoursEnd: string;
  lunchStart: string;
  lunchEnd: string;
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
