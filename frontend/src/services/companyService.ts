import { api } from './api';
import type { Company, CreateCompanyDto, UpdateCompanyDto } from '../types';

export const companyService = {
  getAll: (activeOnly?: boolean) => {
    const query = activeOnly ? '?activeOnly=true' : '';
    return api.get<Company[]>(`/companies${query}`);
  },
  
  getById: (id: number) => api.get<Company>(`/companies/${id}`),
  
  create: (data: CreateCompanyDto) => api.post<Company>('/companies', data),
  
  update: (id: number, data: UpdateCompanyDto) => api.put<Company>(`/companies/${id}`, data),
  
  delete: (id: number) => api.delete(`/companies/${id}`),
};
