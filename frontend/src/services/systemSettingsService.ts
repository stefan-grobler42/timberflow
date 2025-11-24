import { api } from './api';

export interface SystemSettings {
  financialYear?: FinancialYearSettings;
  workingHours?: WorkingHoursSettings;
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

class SystemSettingsService {
  async getSettings(): Promise<SystemSettings> {
    return await api.get<SystemSettings>('/SystemSettings');
  }

  async updateSettings(settings: SystemSettings): Promise<void> {
    await api.put('/SystemSettings', settings);
  }
}

export const systemSettingsService = new SystemSettingsService();
