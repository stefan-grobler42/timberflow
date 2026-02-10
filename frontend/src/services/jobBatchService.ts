import { api } from './api';

export interface BatchedJob {
  id: string;
  name: string;
  customerId?: string;
  customerName?: string;
  orderNumbers?: string;
  orderId?: string;
  estimatedEfinks?: number;
  customDurationMinutes?: number;
  productionPlannedDate?: string;
  jigId?: string;
  productionComplete?: boolean;
  plannedStartTime?: number;
  plannedEndTime?: number;
  plannedDurationMinutes?: number;
  breakAdjustmentMinutes?: number;
  isInWip?: boolean;
  sourceProductionIds: string;
  batchEfficiencyFactor?: number;
  createdOn?: string;
  modifiedOn?: string;
}

const batchedJobService = {
  async combineJobs(jobAId: string, jobBId: string): Promise<BatchedJob> {
    return api.post<BatchedJob>('/batchedjobs/combine', { jobAId, jobBId });
  },

  async addToBatch(batchedJobId: string, productionId: string): Promise<BatchedJob> {
    return api.post<BatchedJob>(`/batchedjobs/${batchedJobId}/add`, { productionId });
  },

  async removeFromBatch(batchedJobId: string, productionId: string): Promise<{ message: string; dissolved: boolean; batchedJob?: BatchedJob }> {
    return api.post(`/batchedjobs/${batchedJobId}/remove`, { productionId }) as Promise<{ message: string; dissolved: boolean; batchedJob?: BatchedJob }>;
  },

  async deleteBatch(id: string): Promise<void> {
    await api.delete(`/batchedjobs/${id}`);
  },

  async updateBatch(id: string, data: Partial<BatchedJob>): Promise<BatchedJob> {
    return api.patch<BatchedJob>(`/batchedjobs/${id}`, data);
  }
};

export default batchedJobService;
