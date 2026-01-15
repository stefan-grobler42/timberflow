const API_BASE = '/api/joballocations';

export interface JobAllocationDto {
  id: string;
  productionId?: string;
  teamId: string;
  orderNumber?: string;
  customerName?: string;
  productionName?: string;
  siteAddress?: string;
  estimatedEfinks: number;
  estimatedDurationMinutes: number;
  spanStartDate: string;
  spanStartMinutes: number;
  spanEndDate?: string;
  spanEndMinutes?: number;
  queuePosition: number;
  status: string;
  actualEfinks?: number;
  actualDurationMinutes?: number;
  isComplete: boolean;
  completedOn?: string;
  salesOrderId?: string;
  createdOn: string;
  modifiedOn?: string;
}

export interface CreateJobAllocationDto {
  productionId?: string;
  teamId: string;
  orderNumber?: string;
  customerName?: string;
  productionName?: string;
  siteAddress?: string;
  estimatedEfinks: number;
  estimatedDurationMinutes: number;
  spanStartDate: string;
  spanStartMinutes: number;
  spanEndDate?: string;
  spanEndMinutes?: number;
  queuePosition: number;
  salesOrderId?: string;
}

export interface UpdateJobAllocationDto {
  teamId?: string;
  spanStartDate?: string;
  spanStartMinutes?: number;
  spanEndDate?: string;
  spanEndMinutes?: number;
  queuePosition?: number;
  status?: string;
  estimatedEfinks?: number;
  estimatedDurationMinutes?: number;
}

export interface CompleteJobAllocationDto {
  actualEfinks?: number;
  actualDurationMinutes?: number;
}

export interface CascadeRescheduleDto {
  teamId: string;
  fromPosition: number;
  startDate: string;
  startMinutes: number;
}

export const jobAllocationService = {
  async getAll(params?: {
    teamId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<JobAllocationDto[]> {
    const searchParams = new URLSearchParams();
    if (params?.teamId) searchParams.append('teamId', params.teamId);
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
    if (params?.status) searchParams.append('status', params.status);
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.take) searchParams.append('take', params.take.toString());

    const response = await fetch(`${API_BASE}?${searchParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch allocations');
    return response.json();
  },

  async getById(id: string): Promise<JobAllocationDto> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error('Allocation not found');
    return response.json();
  },

  async create(dto: CreateJobAllocationDto): Promise<JobAllocationDto> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to create allocation');
    }
    return response.json();
  },

  async update(id: string, dto: UpdateJobAllocationDto): Promise<JobAllocationDto> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });
    if (!response.ok) throw new Error('Failed to update allocation');
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete allocation');
  },

  async complete(id: string, dto: CompleteJobAllocationDto): Promise<JobAllocationDto> {
    const response = await fetch(`${API_BASE}/${id}/complete`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });
    if (!response.ok) throw new Error('Failed to complete allocation');
    return response.json();
  },

  async cascade(dto: CascadeRescheduleDto): Promise<JobAllocationDto[]> {
    const response = await fetch(`${API_BASE}/cascade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto)
    });
    if (!response.ok) throw new Error('Failed to cascade reschedule');
    return response.json();
  }
};
