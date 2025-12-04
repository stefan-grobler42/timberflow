import { api } from './api';

export interface WorkingHoursConfig {
  standardStartMinutes: number;
  standardEndMinutes: number;
  earlyStartMinutes: number;
  lateEndMinutes: number;
}

export interface BreakItem {
  name: string;
  startMinutes: number;
  endMinutes: number;
  duration: number;
  isOvertimeOnly: boolean;
}

export interface BreaksConfig {
  breaks: BreakItem[];
}

export interface SchedulingConfig {
  bufferMinutes: number;
  minJobDuration: number;
  durationRoundingIncrement: number;
  eFinkMultiplier: number;
}

export interface OvertimeConfig {
  defaultOvertimeEnabled: boolean;
  defaultLateOtEndMinutes: number;
  allowEarlyStartOt: boolean;
  defaultEarlyStartMinutes: number;
}

export interface UiConfig {
  pixelsPerMinute: number;
  visibleHoursBeforeShift: number;
  visibleHoursAfterShift: number;
  dayHeaderHeight: number;
}

export interface TeamConfig {
  id: string;
  name: string;
  displayOrder: number;
  colour: string;
  averageEfinks: number;
}

export interface PlannerConfig {
  workingHours: WorkingHoursConfig;
  breaks: BreaksConfig;
  scheduling: SchedulingConfig;
  overtime: OvertimeConfig;
  ui: UiConfig;
  teams: TeamConfig[];
}

class PlannerConfigService {
  private cachedConfig: PlannerConfig | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 30000;

  async getConfig(forceRefresh = false): Promise<PlannerConfig> {
    if (!forceRefresh && this.cachedConfig && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return this.cachedConfig;
    }
    const config = await api.get<PlannerConfig>('/PlannerConfig');
    this.cachedConfig = config;
    this.cacheTimestamp = Date.now();
    return config;
  }

  invalidateCache(): void {
    this.cachedConfig = null;
    this.cacheTimestamp = 0;
  }

  getCachedConfigSync(): PlannerConfig | null {
    if (this.cachedConfig && Date.now() - this.cacheTimestamp < this.CACHE_TTL) {
      return this.cachedConfig;
    }
    return null;
  }
}

export const plannerConfigService = new PlannerConfigService();
