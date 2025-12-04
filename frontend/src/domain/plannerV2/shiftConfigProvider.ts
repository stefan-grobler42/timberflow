import type { PlannerConfig, BreakItem } from '../../services/plannerConfigService';
import type { Break } from './types';

export interface WorkingRange {
  start: number;
  end: number;
}

export class ShiftConfigProvider {
  private config: PlannerConfig;

  constructor(config: PlannerConfig) {
    this.config = config;
  }

  updateConfig(config: PlannerConfig): void {
    this.config = config;
  }

  getWorkingRange(_date: Date, hasOvertime: boolean, hasEarlyOt: boolean): WorkingRange {
    const { workingHours, overtime } = this.config;

    let start = workingHours.standardStartMinutes;
    let end = workingHours.standardEndMinutes;

    if (hasEarlyOt && overtime.allowEarlyStartOt) {
      start = overtime.defaultEarlyStartMinutes;
    }

    if (hasOvertime) {
      end = overtime.defaultLateOtEndMinutes;
    }

    return { start, end };
  }

  getBreaksForDay(_date: Date, hasOvertime: boolean): Break[] {
    const { breaks } = this.config;

    return breaks.breaks
      .filter(b => hasOvertime || !b.isOvertimeOnly)
      .map(b => this.mapBreakItemToBreak(b));
  }

  getStandardBreaks(): Break[] {
    return this.config.breaks.breaks
      .filter(b => !b.isOvertimeOnly)
      .map(b => this.mapBreakItemToBreak(b));
  }

  getOvertimeBreaks(): Break[] {
    return this.config.breaks.breaks.map(b => this.mapBreakItemToBreak(b));
  }

  private mapBreakItemToBreak(item: BreakItem): Break {
    return {
      name: item.name,
      start: item.startMinutes,
      end: item.endMinutes,
      duration: item.duration
    };
  }

  getBufferMinutes(): number {
    return this.config.scheduling.bufferMinutes;
  }

  getMinJobDuration(): number {
    return this.config.scheduling.minJobDuration;
  }

  getDurationRoundingIncrement(): number {
    return this.config.scheduling.durationRoundingIncrement;
  }

  getEFinkMultiplier(): number {
    return this.config.scheduling.eFinkMultiplier;
  }

  getPixelsPerMinute(): number {
    return this.config.ui.pixelsPerMinute;
  }

  getVisibleHoursBeforeShift(): number {
    return this.config.ui.visibleHoursBeforeShift;
  }

  getVisibleHoursAfterShift(): number {
    return this.config.ui.visibleHoursAfterShift;
  }

  getDayHeaderHeight(): number {
    return this.config.ui.dayHeaderHeight;
  }

  getStandardStartMinutes(): number {
    return this.config.workingHours.standardStartMinutes;
  }

  getStandardEndMinutes(): number {
    return this.config.workingHours.standardEndMinutes;
  }

  getEarlyStartMinutes(): number {
    return this.config.workingHours.earlyStartMinutes;
  }

  getLateEndMinutes(): number {
    return this.config.workingHours.lateEndMinutes;
  }

  getDefaultOvertimeEnabled(): boolean {
    return this.config.overtime.defaultOvertimeEnabled;
  }

  getAllowEarlyStartOt(): boolean {
    return this.config.overtime.allowEarlyStartOt;
  }

  getDefaultLateOtEndMinutes(): number {
    return this.config.overtime.defaultLateOtEndMinutes;
  }

  getDefaultEarlyStartMinutes(): number {
    return this.config.overtime.defaultEarlyStartMinutes;
  }

  getTeams() {
    return this.config.teams;
  }

  getTeamById(id: string) {
    return this.config.teams.find(t => t.id === id);
  }

  getTeamAverageEfinks(teamId: string): number {
    const team = this.getTeamById(teamId);
    return team?.averageEfinks ?? 80;
  }

  getStandardBreaksTotal(): number {
    return this.getStandardBreaks().reduce((sum, b) => sum + b.duration, 0);
  }

  getOvertimeBreaksTotal(): number {
    return this.getOvertimeBreaks().reduce((sum, b) => sum + b.duration, 0);
  }

  getStandardWorkingMinutes(): number {
    const { workingHours } = this.config;
    return workingHours.standardEndMinutes - workingHours.standardStartMinutes - this.getStandardBreaksTotal();
  }

  getOvertimeWorkingMinutes(): number {
    const { workingHours, overtime } = this.config;
    return overtime.defaultLateOtEndMinutes - workingHours.standardStartMinutes - this.getOvertimeBreaksTotal();
  }

  getConfig(): PlannerConfig {
    return this.config;
  }
}

export function createDefaultConfig(): PlannerConfig {
  return {
    workingHours: {
      standardStartMinutes: 420,
      standardEndMinutes: 1020,
      earlyStartMinutes: 360,
      lateEndMinutes: 1140
    },
    breaks: {
      breaks: [
        { name: 'Morning Tea', startMinutes: 540, endMinutes: 555, duration: 15, isOvertimeOnly: false },
        { name: 'Lunch', startMinutes: 720, endMinutes: 750, duration: 30, isOvertimeOnly: false },
        { name: 'Afternoon Tea', startMinutes: 870, endMinutes: 885, duration: 15, isOvertimeOnly: false },
        { name: 'Dinner', startMinutes: 1020, endMinutes: 1050, duration: 30, isOvertimeOnly: true }
      ]
    },
    scheduling: {
      bufferMinutes: 30,
      minJobDuration: 15,
      durationRoundingIncrement: 15,
      eFinkMultiplier: 6.5625
    },
    overtime: {
      defaultOvertimeEnabled: false,
      defaultLateOtEndMinutes: 1140,
      allowEarlyStartOt: false,
      defaultEarlyStartMinutes: 360
    },
    ui: {
      pixelsPerMinute: 1.5,
      visibleHoursBeforeShift: 1,
      visibleHoursAfterShift: 1,
      dayHeaderHeight: 40
    },
    teams: []
  };
}
