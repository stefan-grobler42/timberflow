import { api } from './api';

export interface BatchedProduction {
  id: string;
  name?: string;
  orderNumber?: string;
  estimatedEfinks?: number;
  batchPosition: number;
}

export interface JobBatch {
  id: string;
  jigId?: string;
  jigName?: string;
  batchDate?: string;
  customerId?: string;
  customerName?: string;
  totalEfinks: number;
  combinedDurationMinutes?: number;
  plannedStartTime?: number;
  plannedEndTime?: number;
  breakAdjustmentMinutes?: number;
  createdOn: string;
  modifiedOn?: string;
  productions: BatchedProduction[];
}

export interface CombineJobsRequest {
  primaryJobId: string;
  secondaryJobId: string;
  jigId?: string;
  batchDate?: string;
  plannedStartTime?: number;
}

export interface UpdateBatchTimingRequest {
  jigId?: string;
  batchDate?: string;
  plannedStartTime?: number;
  plannedEndTime?: number;
  combinedDurationMinutes?: number;
  breakAdjustmentMinutes?: number;
}

const jobBatchService = {
  async getAll(): Promise<JobBatch[]> {
    return api.get<JobBatch[]>('/jobbatches');
  },

  async getById(id: string): Promise<JobBatch> {
    return api.get<JobBatch>(`/jobbatches/${id}`);
  },

  async getByDateRange(dateFrom: string, dateTo: string): Promise<JobBatch[]> {
    return api.get<JobBatch[]>(`/jobbatches/by-date-range?dateFrom=${dateFrom}&dateTo=${dateTo}`);
  },

  async combineJobs(request: CombineJobsRequest): Promise<JobBatch> {
    return api.post<JobBatch>('/jobbatches/combine', request);
  },

  async addToBatch(batchId: string, productionId: string): Promise<JobBatch> {
    return api.post<JobBatch>(`/jobbatches/${batchId}/add`, {
      batchId,
      productionId
    });
  },

  async removeFromBatch(batchId: string, productionId: string): Promise<{ message: string; dissolved: boolean }> {
    return api.delete(`/jobbatches/${batchId}/productions/${productionId}`) as Promise<{ message: string; dissolved: boolean }>;
  },

  async updateTiming(batchId: string, request: UpdateBatchTimingRequest): Promise<JobBatch> {
    return api.patch<JobBatch>(`/jobbatches/${batchId}/timing`, request);
  },

  async deleteBatch(id: string): Promise<void> {
    await api.delete(`/jobbatches/${id}`);
  }
};

export default jobBatchService;
