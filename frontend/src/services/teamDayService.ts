import { api } from './api';

export interface TeamDayAllocationDto {
  id: string;
  teamDayId: string;
  productionId: string;
  productionName?: string;
  orderNumber?: string;
  customerName?: string;
  sequence: number;
  allocatedMinutes: number;
  startMinutes: number;
  overflowToAllocationId?: string;
  overflowFromAllocationId?: string;
  status: string;
  isRollover: boolean;
  createdOn: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface TeamDayDto {
  id: string;
  teamId: string;
  teamName?: string;
  workDate: string;
  baseMinutes: number;
  overtimeMinutes: number;
  totalAllocatedMinutes: number;
  totalCapacity: number;
  remainingCapacity: number;
  isLocked: boolean;
  overtimeEnabled: boolean;
  overtimeCloseTime?: string;
  createdOn: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
  allocations?: TeamDayAllocationDto[];
}

export interface CreateTeamDayDto {
  teamId: string;
  workDate: string;
  baseMinutes?: number;
  overtimeMinutes?: number;
  overtimeEnabled?: boolean;
  overtimeCloseTime?: string;
}

export interface UpdateTeamDayDto {
  baseMinutes?: number;
  overtimeMinutes?: number;
  isLocked?: boolean;
  overtimeEnabled?: boolean;
  overtimeCloseTime?: string;
}

export interface CreateAllocationDto {
  teamDayId: string;
  productionId: string;
  sequence: number;
  allocatedMinutes: number;
  startMinutes: number;
  overflowFromAllocationId?: string;
  status?: string;
  isRollover?: boolean;
}

export interface UpdateAllocationDto {
  sequence?: number;
  allocatedMinutes?: number;
  startMinutes?: number;
  overflowToAllocationId?: string;
  status?: string;
}

export interface AllocationItemDto {
  productionId: string;
  sequence: number;
  allocatedMinutes: number;
  startMinutes: number;
  status?: string;
  isRollover?: boolean;
}

export interface BulkAllocateDto {
  teamId: string;
  workDate: string;
  allocations: AllocationItemDto[];
  overtimeEnabled?: boolean;
  overtimeCloseTime?: string;
}

export interface ReorderAllocationDto {
  allocationId: string;
  sequence: number;
  startMinutes: number;
}

export const teamDayService = {
  getAll: (params?: { teamId?: string; startDate?: string; endDate?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.teamId) searchParams.append('teamId', params.teamId);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);
    const queryString = searchParams.toString();
    return api.get<TeamDayDto[]>(`/teamdays${queryString ? '?' + queryString : ''}`);
  },

  getById: (id: string) => api.get<TeamDayDto>(`/teamdays/${id}`),

  getByTeamAndDate: (teamId: string, date: string) => 
    api.get<TeamDayDto>(`/teamdays/team/${teamId}/date/${date}`),

  create: (data: CreateTeamDayDto) => api.post<TeamDayDto>('/teamdays', data),

  ensure: (data: CreateTeamDayDto) => api.post<TeamDayDto>('/teamdays/ensure', data),

  update: (id: string, data: UpdateTeamDayDto) => api.put<TeamDayDto>(`/teamdays/${id}`, data),

  updateOvertime: (id: string, data: UpdateTeamDayDto) => 
    api.put<TeamDayDto>(`/teamdays/${id}/overtime`, data),

  delete: (id: string) => api.delete(`/teamdays/${id}`),
};

export const teamDayAllocationService = {
  getAll: (params?: { teamDayId?: string; productionId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.teamDayId) searchParams.append('teamDayId', params.teamDayId);
    if (params?.productionId) searchParams.append('productionId', params.productionId);
    const queryString = searchParams.toString();
    return api.get<TeamDayAllocationDto[]>(`/teamdayallocations${queryString ? '?' + queryString : ''}`);
  },

  getById: (id: string) => api.get<TeamDayAllocationDto>(`/teamdayallocations/${id}`),

  getByProduction: (productionId: string) => 
    api.get<TeamDayAllocationDto[]>(`/teamdayallocations/production/${productionId}`),

  create: (data: CreateAllocationDto) => 
    api.post<TeamDayAllocationDto>('/teamdayallocations', data),

  bulkAllocate: (data: BulkAllocateDto) => 
    api.post<TeamDayDto>('/teamdayallocations/bulk', data),

  update: (id: string, data: UpdateAllocationDto) => 
    api.put<TeamDayAllocationDto>(`/teamdayallocations/${id}`, data),

  reorder: (data: ReorderAllocationDto[]) => 
    api.put<{ message: string }>('/teamdayallocations/reorder', data),

  delete: (id: string) => api.delete(`/teamdayallocations/${id}`),

  deleteByTeamDay: (teamDayId: string) => 
    api.delete(`/teamdayallocations/team-day/${teamDayId}`),
};
