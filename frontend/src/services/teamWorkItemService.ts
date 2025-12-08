import { api } from './api';

export interface TeamWorkItemDto {
  id: string;
  productionId: string;
  teamId: string;
  workDate: string;
  sequence: number;
  plannedStartMinutes: number;
  plannedEndMinutes: number;
  plannedDurationMinutes: number;
  breakAdjustmentMinutes: number;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDurationMinutes?: number;
  status: string;
  parentWipId?: string;
  rolloverSequence: number;
  spilloverMinutes?: number;
  overtimeEnabled: boolean;
  earlyOvertimeEnabled: boolean;
  timberCubes?: number;
  totalCuts?: number;
  actualEfinks?: number;
  pickingComplete: boolean;
  sawingComplete: boolean;
  jiggingComplete: boolean;
  needsVerification: boolean;
  dayStartMinutes?: number;
  dayEndMinutes?: number;
  breakDefinitions?: string;
  createdOn: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
  productionName?: string;
  teamName?: string;
  customerName?: string;
  orderNumber?: string;
  estimatedEfinks?: number;
}

export interface CreateTeamWorkItemDto {
  productionId: string;
  teamId: string;
  workDate: string;
  sequence: number;
  plannedStartMinutes: number;
  plannedEndMinutes: number;
  plannedDurationMinutes: number;
  breakAdjustmentMinutes: number;
  status?: string;
  parentWipId?: string;
  rolloverSequence?: number;
  spilloverMinutes?: number;
  overtimeEnabled?: boolean;
  earlyOvertimeEnabled?: boolean;
  timberCubes?: number;
  totalCuts?: number;
  dayStartMinutes?: number;
  dayEndMinutes?: number;
  breakDefinitions?: string;
  customDurationMinutes?: number | null;
}

export interface UpdateTeamWorkItemDto {
  teamId?: string;
  workDate?: string;
  sequence?: number;
  plannedStartMinutes?: number;
  plannedEndMinutes?: number;
  plannedDurationMinutes?: number;
  breakAdjustmentMinutes?: number;
  actualStartTime?: string;
  actualEndTime?: string;
  actualDurationMinutes?: number;
  status?: string;
  parentWipId?: string;
  rolloverSequence?: number;
  spilloverMinutes?: number;
  overtimeEnabled?: boolean;
  earlyOvertimeEnabled?: boolean;
  timberCubes?: number;
  totalCuts?: number;
  actualEfinks?: number;
  pickingComplete?: boolean;
  sawingComplete?: boolean;
  jiggingComplete?: boolean;
  needsVerification?: boolean;
  dayStartMinutes?: number;
  dayEndMinutes?: number;
  breakDefinitions?: string;
}

export interface CompleteTeamWorkItemDto {
  actualStartTime?: string;
  actualEndTime?: string;
  actualDurationMinutes?: number;
  actualEfinks?: number;
  timberCubes?: number;
  totalCuts?: number;
  needsVerification: boolean;
}

export interface BatchAllocateDto {
  allocations: CreateTeamWorkItemDto[];
}

export interface BatchUpdateDto {
  updates: { id: string; data: UpdateTeamWorkItemDto }[];
}

class TeamWorkItemService {
  async getAll(params?: {
    teamId?: string;
    workDate?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TeamWorkItemDto[]> {
    const query = new URLSearchParams();
    if (params?.teamId) query.append('teamId', params.teamId);
    if (params?.workDate) query.append('workDate', params.workDate);
    if (params?.status) query.append('status', params.status);
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    
    const queryStr = query.toString();
    return api.get<TeamWorkItemDto[]>(`/TeamWorkItems${queryStr ? `?${queryStr}` : ''}`);
  }

  async getForPlanner(params?: {
    dateFrom?: string;
    dateTo?: string;
    teamId?: string;
  }): Promise<TeamWorkItemDto[]> {
    const query = new URLSearchParams();
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    if (params?.teamId) query.append('teamId', params.teamId);
    
    const queryStr = query.toString();
    return api.get<TeamWorkItemDto[]>(`/TeamWorkItems/planner${queryStr ? `?${queryStr}` : ''}`);
  }

  async getById(id: string): Promise<TeamWorkItemDto> {
    return api.get<TeamWorkItemDto>(`/TeamWorkItems/${id}`);
  }

  async getByTeamAndDate(teamId: string, dateStr: string): Promise<TeamWorkItemDto[]> {
    return api.get<TeamWorkItemDto[]>(`/TeamWorkItems/team/${teamId}/date/${dateStr}`);
  }

  async getUnallocated(params?: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<any[]> {
    const query = new URLSearchParams();
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    
    const queryStr = query.toString();
    return api.get<any[]>(`/TeamWorkItems/unallocated${queryStr ? `?${queryStr}` : ''}`);
  }

  async create(dto: CreateTeamWorkItemDto): Promise<TeamWorkItemDto> {
    return api.post<TeamWorkItemDto>('/TeamWorkItems', dto);
  }

  async update(id: string, dto: UpdateTeamWorkItemDto): Promise<TeamWorkItemDto> {
    return api.put<TeamWorkItemDto>(`/TeamWorkItems/${id}`, dto);
  }

  async delete(id: string): Promise<void> {
    return api.delete(`/TeamWorkItems/${id}`);
  }

  async complete(id: string, dto: CompleteTeamWorkItemDto): Promise<TeamWorkItemDto> {
    return api.post<TeamWorkItemDto>(`/TeamWorkItems/${id}/complete`, dto);
  }

  async batchAllocate(allocations: CreateTeamWorkItemDto[]): Promise<TeamWorkItemDto[]> {
    return api.post<TeamWorkItemDto[]>('/TeamWorkItems/batch', allocations);
  }

  async syncFromProductions(params?: { dateFrom?: string; dateTo?: string }): Promise<{ created: number; updated: number; total: number }> {
    const query = new URLSearchParams();
    if (params?.dateFrom) query.append('dateFrom', params.dateFrom);
    if (params?.dateTo) query.append('dateTo', params.dateTo);
    const queryStr = query.toString();
    return api.post<{ created: number; updated: number; total: number }>(
      `/TeamWorkItems/sync-from-productions${queryStr ? `?${queryStr}` : ''}`,
      {}
    );
  }

  async batchUpdate(updates: { id: string; data: UpdateTeamWorkItemDto }[]): Promise<TeamWorkItemDto[]> {
    const results: TeamWorkItemDto[] = [];
    for (const update of updates) {
      const result = await this.update(update.id, update.data);
      results.push(result);
    }
    return results;
  }

  async deallocate(id: string): Promise<void> {
    await this.delete(id);
  }

  async deleteByProductionId(productionId: string): Promise<void> {
    return api.delete(`/TeamWorkItems/by-production/${productionId}`);
  }

  async moveToTeam(id: string, newTeamId: string, newWorkDate?: string): Promise<TeamWorkItemDto> {
    const updateData: UpdateTeamWorkItemDto = { teamId: newTeamId };
    if (newWorkDate) {
      updateData.workDate = newWorkDate;
    }
    return this.update(id, updateData);
  }

  async reschedule(id: string, newWorkDate: string, newSequence?: number): Promise<TeamWorkItemDto> {
    const updateData: UpdateTeamWorkItemDto = { workDate: newWorkDate };
    if (newSequence !== undefined) {
      updateData.sequence = newSequence;
    }
    return this.update(id, updateData);
  }

  async updateTiming(
    id: string, 
    plannedStartMinutes: number, 
    plannedEndMinutes: number,
    plannedDurationMinutes: number,
    breakAdjustmentMinutes?: number
  ): Promise<TeamWorkItemDto> {
    const updateData: UpdateTeamWorkItemDto = {
      plannedStartMinutes,
      plannedEndMinutes,
      plannedDurationMinutes
    };
    if (breakAdjustmentMinutes !== undefined) {
      updateData.breakAdjustmentMinutes = breakAdjustmentMinutes;
    }
    return this.update(id, updateData);
  }
}

export const teamWorkItemService = new TeamWorkItemService();
