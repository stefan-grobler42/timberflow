import { api } from './api';
import type { 
  Account, D365Contact, D365Product, D365Quote, D365Order,
  D365Appointment, D365Email
} from '../types/millennium';

export const accountService = {
  getAll: () => api.get<Account[]>('/accounts'),
  getById: (id: string) => api.get<Account>(`/accounts/${id}`),
  create: (data: Partial<Account>) => api.post<Account>('/accounts', data),
  update: (id: string, data: Partial<Account>) => api.put<Account>(`/accounts/${id}`, data),
  delete: (id: string) => api.delete(`/accounts/${id}`),
};

export const d365ContactService = {
  getAll: () => api.get<D365Contact[]>('/d365contacts'),
  getById: (id: string) => api.get<D365Contact>(`/d365contacts/${id}`),
  create: (data: Partial<D365Contact>) => api.post<D365Contact>('/d365contacts', data),
  update: (id: string, data: Partial<D365Contact>) => api.put<D365Contact>(`/d365contacts/${id}`, data),
  delete: (id: string) => api.delete(`/d365contacts/${id}`),
};

export const d365ProductService = {
  getAll: () => api.get<D365Product[]>('/d365products'),
  getById: (id: string) => api.get<D365Product>(`/d365products/${id}`),
  create: (data: Partial<D365Product>) => api.post<D365Product>('/d365products', data),
  update: (id: string, data: Partial<D365Product>) => api.put<D365Product>(`/d365products/${id}`, data),
  delete: (id: string) => api.delete(`/d365products/${id}`),
};

export const d365QuoteService = {
  getAll: () => api.get<D365Quote[]>('/d365quotes'),
  getById: (id: string) => api.get<D365Quote>(`/d365quotes/${id}`),
  create: (data: Partial<D365Quote>) => api.post<D365Quote>('/d365quotes', data),
  update: (id: string, data: Partial<D365Quote>) => api.put<D365Quote>(`/d365quotes/${id}`, data),
  delete: (id: string) => api.delete(`/d365quotes/${id}`),
};

export const d365OrderService = {
  getAll: () => api.get<D365Order[]>('/d365orders'),
  getById: (id: string) => api.get<D365Order>(`/d365orders/${id}`),
  create: (data: Partial<D365Order>) => api.post<D365Order>('/d365orders', data),
  update: (id: string, data: Partial<D365Order>) => api.put<D365Order>(`/d365orders/${id}`, data),
  delete: (id: string) => api.delete(`/d365orders/${id}`),
};

export const d365AppointmentService = {
  getAll: () => api.get<D365Appointment[]>('/d365appointments'),
  getById: (id: string) => api.get<D365Appointment>(`/d365appointments/${id}`),
  create: (data: Partial<D365Appointment>) => api.post<D365Appointment>('/d365appointments', data),
  update: (id: string, data: Partial<D365Appointment>) => api.put<D365Appointment>(`/d365appointments/${id}`, data),
  delete: (id: string) => api.delete(`/d365appointments/${id}`),
};

export const d365EmailService = {
  getAll: () => api.get<D365Email[]>('/d365emails'),
  getById: (id: string) => api.get<D365Email>(`/d365emails/${id}`),
  create: (data: Partial<D365Email>) => api.post<D365Email>('/d365emails', data),
  update: (id: string, data: Partial<D365Email>) => api.put<D365Email>(`/d365emails/${id}`, data),
  delete: (id: string) => api.delete(`/d365emails/${id}`),
};

export interface LookupOption {
  id: string;
  text: string;
}

export const lookupService = {
  searchAccounts: (term: string = '') => 
    api.get<LookupOption[]>(`/lookups/accounts/search?term=${encodeURIComponent(term)}`),
  
  searchEmployees: (term: string = '') => 
    api.get<LookupOption[]>(`/lookups/employees/search?term=${encodeURIComponent(term)}`),
  
  searchContacts: (term: string = '') => 
    api.get<LookupOption[]>(`/lookups/contacts/search?term=${encodeURIComponent(term)}`),
  
  getRecentAccounts: () => 
    api.get<LookupOption[]>('/lookups/accounts/recent'),
  
  getRecentEmployees: () => 
    api.get<LookupOption[]>('/lookups/employees/recent'),
  
  getRecentContacts: () => 
    api.get<LookupOption[]>('/lookups/contacts/recent'),
};
