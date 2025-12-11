const API_BASE = '/api/jobworklogs';

export interface JobWorkLogDto {
  id: string;
  allocationId: string;
  workDate: string;
  plannedStartMinutes: number;
  plannedEndMinutes: number;
  plannedDurationMinutes: number;
  breakAdjustmentMinutes: number;
  actualStartMinutes?: number;
  actualEndMinutes?: number;
  actualDurationMinutes?: number;
  efinksCompleted?: number;
  leaderId?: string;
  leaderName?: string;
  helper1Id?: string;
  helper1Name?: string;
  helper2Id?: string;
  helper2Name?: string;
  helper3Id?: string;
  helper3Name?: string;
  helper4Id?: string;
  helper4Name?: string;
  notes?: string;
  overtimeType?: string;
  isOvertime: boolean;
  createdOn: string;
  modifiedOn?: string;
}

export interface CreateJobWorkLogDto {
  allocationId: string;
  workDate: string;
  plannedStartMinutes: number;
  plannedEndMinutes: number;
  plannedDurationMinutes: number;
  breakAdjustmentMinutes?: number;
  actualStartMinutes?: number;
  actualEndMinutes?: number;
  actualDurationMinutes?: number;
  efinksCompleted?: number;
  leaderId?: string;
  helper1Id?: string;
  helper2Id?: string;
  helper3Id?: string;
  helper4Id?: string;
  notes?: string;
  overtimeType?: string;
  isOvertime?: boolean;
}

export interface UpdateJobWorkLogDto {
  actualStartMinutes?: number;
  actualEndMinutes?: number;
  actualDurationMinutes?: number;
  efinksCompleted?: number;
  leaderId?: string;
  helper1Id?: string;
  helper2Id?: string;
  helper3Id?: string;
  helper4Id?: string;
  notes?: string;
  overtimeType?: string;
  isOvertime?: boolean;
}

export const jobWorkLogService = {
  async getByAllocation(allocationId: string): Promise<JobWorkLogDto[]> {
    const response = await fetch(`${API_BASE}/allocation/${allocationId}`);
    if (!response.ok) throw new Error('Failed to fetch work logs');
    return response.json();
  },

  async getByDate(dateStr: string): Promise<JobWorkLogDto[]> {
    const response = await fetch(`${API_BASE}/date/${dateStr}`);
    if (!response.ok) throw new Error('Failed to fetch work logs for date');
    return response.json();
  },

  async create(dto: CreateJobWorkLogDto): Promise<JobWorkLogDto> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create work log');
    }
    return response.json();
  },

  async update(id: string, dto: UpdateJobWorkLogDto): Promise<JobWorkLogDto> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });
    if (!response.ok) throw new Error('Failed to update work log');
    return response.json();
  }
};
