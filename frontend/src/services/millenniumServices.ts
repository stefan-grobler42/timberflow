import { api } from './api';
import type { 
  Designer, SaleRepresentative, Vehicle, Employee, 
  QuoteMRoofing, Tender, PricingCalculation, InstallationProgress,
  Production, Logistics, Delivery 
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
  getAll: () => api.get<InstallationProgress[]>('/installationprogress'),
  getById: (id: string) => api.get<InstallationProgress>(`/installationprogress/${id}`),
  create: (data: Partial<InstallationProgress>) => api.post<InstallationProgress>('/installationprogress', data),
  update: (id: string, data: Partial<InstallationProgress>) => api.put<InstallationProgress>(`/installationprogress/${id}`, data),
  delete: (id: string) => api.delete(`/installationprogress/${id}`),
};

export const productionService = {
  getAll: (completeOnly?: boolean) => 
    api.get<Production[]>(`/productions${completeOnly ? '?completeOnly=true' : ''}`),
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
  getAll: () => api.get<Delivery[]>('/deliveries'),
  getById: (id: string) => api.get<Delivery>(`/deliveries/${id}`),
  create: (data: Partial<Delivery>) => api.post<Delivery>('/deliveries', data),
  update: (id: string, data: Partial<Delivery>) => api.put<Delivery>(`/deliveries/${id}`, data),
  delete: (id: string) => api.delete(`/deliveries/${id}`),
};
