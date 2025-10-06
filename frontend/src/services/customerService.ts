import { api } from './api';
import type { Customer, CreateCustomerDto, UpdateCustomerDto } from '../types';

export const customerService = {
  getAll: (activeOnly?: boolean) => {
    const query = activeOnly ? '?activeOnly=true' : '';
    return api.get<Customer[]>(`/customers${query}`);
  },
  
  getById: (id: number) => api.get<Customer>(`/customers/${id}`),
  
  create: (data: CreateCustomerDto) => api.post<Customer>('/customers', data),
  
  update: (id: number, data: UpdateCustomerDto) => api.put<Customer>(`/customers/${id}`, data),
  
  delete: (id: number) => api.delete(`/customers/${id}`),
};
