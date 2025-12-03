import { api } from './api';
import type { 
  Designer, SaleRepresentative, Vehicle, Employee, 
  QuoteMRoofing, Tender, PricingCalculation, InstallationProgress,
  Production, Logistics, Delivery, PickingTeam, Saw, Jig 
} from '../types/millennium';

export const designerService = {
  getAll: (activeOnly?: boolean) => 
    api.get<Designer[]>(`/designers${activeOnly ? '?activeOnly=true' : ''}`),
  getById: (id: string) => api.get<Designer>(`/designers/${id}`),
  create: (data: Partial<Designer>) => api.post<Designer>('/designers', data),
  update: (id: string, data: Partial<Designer>) => api.put<Designer>(`/designers/${id}`, data),
  delete: (id: string) => api.delete(`/designers/${id}`),
};

export const saleRepresentativeService = {
  getAll: (activeOnly?: boolean) => 
    api.get<SaleRepresentative[]>(`/salerepresentatives${activeOnly ? '?activeOnly=true' : ''}`),
  getById: (id: string) => api.get<SaleRepresentative>(`/salerepresentatives/${id}`),
  create: (data: Partial<SaleRepresentative>) => api.post<SaleRepresentative>('/salerepresentatives', data),
  update: (id: string, data: Partial<SaleRepresentative>) => api.put<SaleRepresentative>(`/salerepresentatives/${id}`, data),
  delete: (id: string) => api.delete(`/salerepresentatives/${id}`),
};

export const vehicleService = {
  getAll: (activeOnly?: boolean) => 
    api.get<Vehicle[]>(`/vehicles${activeOnly ? '?activeOnly=true' : ''}`),
  getById: (id: string) => api.get<Vehicle>(`/vehicles/${id}`),
  create: (data: Partial<Vehicle>) => api.post<Vehicle>('/vehicles', data),
  update: (id: string, data: Partial<Vehicle>) => api.put<Vehicle>(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
};

export const employeeService = {
  getAll: (activeOnly?: boolean) => 
    api.get<Employee[]>(`/employees${activeOnly ? '?activeOnly=true' : ''}`),
  getById: (id: string) => api.get<Employee>(`/employees/${id}`),
  create: (data: Partial<Employee>) => api.post<Employee>('/employees', data),
  update: (id: string, data: Partial<Employee>) => api.put<Employee>(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};

export const quoteMRoofingService = {
  getAll: () => api.get<QuoteMRoofing[]>('/quotemroofings'),
  getById: (id: string) => api.get<QuoteMRoofing>(`/quotemroofings/${id}`),
  create: (data: Partial<QuoteMRoofing>) => api.post<QuoteMRoofing>('/quotemroofings', data),
  update: (id: string, data: Partial<QuoteMRoofing>) => api.put<QuoteMRoofing>(`/quotemroofings/${id}`, data),
  delete: (id: string) => api.delete(`/quotemroofings/${id}`),
};

export const tenderService = {
  getAll: (status?: string) => 
    api.get<Tender[]>(`/tenders${status ? `?status=${status}` : ''}`),
  getById: (id: string) => api.get<Tender>(`/tenders/${id}`),
  create: (data: Partial<Tender>) => api.post<Tender>('/tenders', data),
  update: (id: string, data: Partial<Tender>) => api.put<Tender>(`/tenders/${id}`, data),
  delete: (id: string) => api.delete(`/tenders/${id}`),
};

export const pricingCalculationService = {
  getAll: () => api.get<PricingCalculation[]>('/pricingcalculations'),
  getById: (id: string) => api.get<PricingCalculation>(`/pricingcalculations/${id}`),
  create: (data: Partial<PricingCalculation>) => api.post<PricingCalculation>('/pricingcalculations', data),
  update: (id: string, data: Partial<PricingCalculation>) => api.put<PricingCalculation>(`/pricingcalculations/${id}`, data),
  delete: (id: string) => api.delete(`/pricingcalculations/${id}`),
};

export const installationProgressService = {
  getAll: (orderNo?: string) => {
    const params = new URLSearchParams();
    if (orderNo) params.append('orderNo', orderNo);
    const queryString = params.toString();
    return api.get<InstallationProgress[]>(`/installationprogress${queryString ? '?' + queryString : ''}`);
  },
  getByOrderNo: (orderNo: string) => 
    api.get<InstallationProgress[]>(`/installationprogress?orderNo=${orderNo}`),
  getById: (id: string) => api.get<InstallationProgress>(`/installationprogress/${id}`),
  create: (data: Partial<InstallationProgress>) => api.post<InstallationProgress>('/installationprogress', data),
  update: (id: string, data: Partial<InstallationProgress>) => api.put<InstallationProgress>(`/installationprogress/${id}`, data),
  delete: (id: string) => api.delete(`/installationprogress/${id}`),
};

export const productionService = {
  getAll: (completeOnly?: boolean, orderNo?: string) => {
    const params = new URLSearchParams();
    if (completeOnly) params.append('completeOnly', 'true');
    if (orderNo) params.append('orderNo', orderNo);
    const queryString = params.toString();
    return api.get<Production[]>(`/productions${queryString ? '?' + queryString : ''}`);
  },
  getByOrderNo: (orderNo: string) => 
    api.get<Production[]>(`/productions?orderNo=${orderNo}`),
  getById: (id: string) => api.get<Production>(`/productions/${id}`),
  create: (data: Partial<Production>) => api.post<Production>('/productions', data),
  update: (id: string, data: Partial<Production>) => api.put<Production>(`/productions/${id}`, data),
  delete: (id: string) => api.delete(`/productions/${id}`),
};

export const logisticsService = {
  getAll: (completedOnly?: boolean) => 
    api.get<Logistics[]>(`/logistics${completedOnly ? '?completedOnly=true' : ''}`),
  getById: (id: string) => api.get<Logistics>(`/logistics/${id}`),
  create: (data: Partial<Logistics>) => api.post<Logistics>('/logistics', data),
  update: (id: string, data: Partial<Logistics>) => api.put<Logistics>(`/logistics/${id}`, data),
  delete: (id: string) => api.delete(`/logistics/${id}`),
};

export const deliveryService = {
  getAll: (orderNo?: string) => {
    const params = new URLSearchParams();
    if (orderNo) params.append('orderNo', orderNo);
    const queryString = params.toString();
    return api.get<Delivery[]>(`/deliveries${queryString ? '?' + queryString : ''}`);
  },
  getByOrderNo: (orderNo: string) => 
    api.get<Delivery[]>(`/deliveries?orderNo=${orderNo}`),
  getById: (id: string) => api.get<Delivery>(`/deliveries/${id}`),
  create: (data: Partial<Delivery>) => api.post<Delivery>('/deliveries', data),
  update: (id: string, data: Partial<Delivery>) => api.put<Delivery>(`/deliveries/${id}`, data),
  delete: (id: string) => api.delete(`/deliveries/${id}`),
};

export const pickingTeamService = {
  getAll: () => api.get<PickingTeam[]>('/pickingteams'),
  getById: (id: string) => api.get<PickingTeam>(`/pickingteams/${id}`),
  create: (data: Partial<PickingTeam>) => api.post<PickingTeam>('/pickingteams', data),
  update: (id: string, data: Partial<PickingTeam>) => api.put<PickingTeam>(`/pickingteams/${id}`, data),
  delete: (id: string) => api.delete(`/pickingteams/${id}`),
};

export const sawService = {
  getAll: () => api.get<Saw[]>('/saws'),
  getById: (id: string) => api.get<Saw>(`/saws/${id}`),
  create: (data: Partial<Saw>) => api.post<Saw>('/saws', data),
  update: (id: string, data: Partial<Saw>) => api.put<Saw>(`/saws/${id}`, data),
  delete: (id: string) => api.delete(`/saws/${id}`),
};

export const jigService = {
  getAll: () => api.get<Jig[]>('/jigs'),
  getById: (id: string) => api.get<Jig>(`/jigs/${id}`),
  create: (data: Partial<Jig>) => api.post<Jig>('/jigs', data),
  update: (id: string, data: Partial<Jig>) => api.put<Jig>(`/jigs/${id}`, data),
  delete: (id: string) => api.delete(`/jigs/${id}`),
};

export interface ProductionAudit {
  id: string;
  productionId: string;
  changeType: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  oldJigId?: string;
  newJigId?: string;
  oldJigName?: string;
  newJigName?: string;
  oldPlannedDate?: string;
  newPlannedDate?: string;
  oldStartTime?: number;
  newStartTime?: number;
  oldEndTime?: number;
  newEndTime?: number;
  oldDurationMinutes?: number;
  newDurationMinutes?: number;
  batchId?: string;
  orderNumber?: string;
  customerName?: string;
  changedBy?: string;
  changedOn: string;
  notes?: string;
}

export interface CreateProductionAuditDto {
  productionId: string;
  changeType: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  oldJigId?: string | null;
  newJigId?: string | null;
  oldPlannedDate?: string | null;
  newPlannedDate?: string | null;
  oldStartTime?: number | null;
  newStartTime?: number | null;
  oldEndTime?: number | null;
  newEndTime?: number | null;
  oldDurationMinutes?: number | null;
  newDurationMinutes?: number | null;
  batchId?: string;
  orderNumber?: string;
  customerName?: string;
  changedBy?: string;
  notes?: string;
}

export const productionAuditService = {
  getAll: (params?: { productionId?: string; batchId?: string; fromDate?: string; toDate?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.productionId) searchParams.append('productionId', params.productionId);
    if (params?.batchId) searchParams.append('batchId', params.batchId);
    if (params?.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params?.toDate) searchParams.append('toDate', params.toDate);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    const queryString = searchParams.toString();
    return api.get<ProductionAudit[]>(`/productionaudits${queryString ? '?' + queryString : ''}`);
  },
  getById: (id: string) => api.get<ProductionAudit>(`/productionaudits/${id}`),
  getByProductionId: (productionId: string) => api.get<ProductionAudit[]>(`/productionaudits/production/${productionId}`),
  getByBatchId: (batchId: string) => api.get<ProductionAudit[]>(`/productionaudits/batch/${batchId}`),
  create: (data: CreateProductionAuditDto) => api.post<ProductionAudit>('/productionaudits', data),
  createBatch: (data: CreateProductionAuditDto[]) => api.post<ProductionAudit[]>('/productionaudits/batch', data),
};

export type ScheduleBlockType = 'PublicHoliday' | 'Breakdown' | 'Maintenance' | 'MaterialShortage' | 'GeneralDelay';

export interface ScheduleBlock {
  id: string;
  blockType: ScheduleBlockType;
  dateStr: string;
  teamId?: string | null;
  teamName?: string | null;
  startTimeMinutes: number;
  endTimeMinutes: number;
  description?: string | null;
  relatedProductionId?: string | null;
  relatedProductionName?: string | null;
  createdOn?: string;
  createdBy?: string;
  modifiedOn?: string;
  modifiedBy?: string;
}

export interface CreateScheduleBlockDto {
  blockType: ScheduleBlockType;
  dateStr: string;
  teamId?: string | null;
  startTimeMinutes: number;
  endTimeMinutes: number;
  description?: string | null;
  relatedProductionId?: string | null;
}

export interface UpdateScheduleBlockDto {
  blockType?: ScheduleBlockType;
  dateStr?: string;
  teamId?: string | null;
  startTimeMinutes?: number;
  endTimeMinutes?: number;
  description?: string | null;
  relatedProductionId?: string | null;
}

export const scheduleBlockService = {
  getAll: (params?: { dateFrom?: string; dateTo?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.dateFrom) searchParams.append('dateFrom', params.dateFrom);
    if (params?.dateTo) searchParams.append('dateTo', params.dateTo);
    const queryString = searchParams.toString();
    return api.get<ScheduleBlock[]>(`/scheduleblocks${queryString ? '?' + queryString : ''}`);
  },
  getById: (id: string) => api.get<ScheduleBlock>(`/scheduleblocks/${id}`),
  create: (data: CreateScheduleBlockDto) => api.post<ScheduleBlock>('/scheduleblocks', data),
  update: (id: string, data: UpdateScheduleBlockDto) => api.put<ScheduleBlock>(`/scheduleblocks/${id}`, data),
  delete: (id: string) => api.delete(`/scheduleblocks/${id}`),
};
