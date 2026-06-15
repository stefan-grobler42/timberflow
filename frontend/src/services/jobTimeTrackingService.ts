import { api } from './api';

const getLocalIsoDate = (): string => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().split('T')[0];
};

export interface JobTimeEntryDto {
  id: string;
  jobId: string;
  teamId: string;
  stageType: JobStageType | 'overall' | string;
  startedAt: string;
  endedAt?: string | null;
  actualDurationMinutes?: number | null;
  status: string;
  startedBy?: string | null;
  endedBy?: string | null;
  notes?: string | null;
}

export type JobStageType = 'picking' | 'sawing' | 'production';

export interface JobStageSummaryDto {
  stageType: JobStageType | string;
  status: 'not_started' | 'in_progress' | 'completed' | string;
  totalDurationMinutes: number;
  activeEntry?: JobTimeEntryDto | null;
  latestEntry?: JobTimeEntryDto | null;
}

export interface JobTimingSummaryDto {
  status: 'not_started' | 'in_progress' | 'completed' | string;
  hasOverallTiming: boolean;
  hasStageTiming: boolean;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  actualDurationMinutes?: number | null;
  activeEntry?: JobTimeEntryDto | null;
  latestEntry?: JobTimeEntryDto | null;
  stageDurations: {
    pickingMinutes: number;
    sawingMinutes: number;
    productionMinutes: number;
    totalLabourMinutes: number;
  };
  stages: JobStageSummaryDto[];
}

export interface MobileJobDto {
  jobId: string;
  productionId?: string | null;
  teamId: string;
  teamName?: string | null;
  workDate: string;
  jobNumber?: string | null;
  customerName?: string | null;
  siteAddress?: string | null;
  plannedStartMinutes: number;
  plannedEndMinutes: number;
  plannedDurationMinutes: number;
  actualDurationMinutes?: number | null;
  status: 'not_started' | 'in_progress' | 'completed' | string;
  activeEntry?: JobTimeEntryDto | null;
  latestEntry?: JobTimeEntryDto | null;
  timingSummary?: JobTimingSummaryDto | null;
  stages?: JobStageSummaryDto[];
}

export const jobTimeTrackingService = {
  getTodayJobs(teamId: string, workDate = getLocalIsoDate()): Promise<MobileJobDto[]> {
    const query = new URLSearchParams({ teamId, workDate });
    return api.get<MobileJobDto[]>(`/JobTimeTracking/today?${query.toString()}`);
  },

  startJob(jobId: string, notes?: string): Promise<MobileJobDto> {
    return api.post<MobileJobDto>(`/JobTimeTracking/${jobId}/start`, { notes });
  },

  endJob(jobId: string, notes?: string): Promise<MobileJobDto> {
    return api.post<MobileJobDto>(`/JobTimeTracking/${jobId}/end`, { notes });
  },

  startStage(jobId: string, stageType: JobStageType, notes?: string): Promise<MobileJobDto> {
    return api.post<MobileJobDto>(`/JobTimeTracking/${jobId}/stages/${stageType}/start`, { notes });
  },

  stopStage(jobId: string, stageType: JobStageType, notes?: string): Promise<MobileJobDto> {
    return api.post<MobileJobDto>(`/JobTimeTracking/${jobId}/stages/${stageType}/stop`, { notes });
  },

  getHistory(jobId: string): Promise<JobTimeEntryDto[]> {
    return api.get<JobTimeEntryDto[]>(`/JobTimeTracking/${jobId}/history`);
  }
};
