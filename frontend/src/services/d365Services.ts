import { api } from './api';
import type { 
  Account, D365Contact, D365Product, D365Quote, D365QuoteDetail, D365Order,
  D365Appointment, D365Email, Activity, InstallationProgress, Delivery, Logistics,
  Production
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

export const d365QuoteDetailService = {
  getAll: () => api.get<D365QuoteDetail[]>('/d365quotedetails'),
  getById: (id: string) => api.get<D365QuoteDetail>(`/d365quotedetails/${id}`),
  getByQuoteId: (quoteId: string) => api.get<D365QuoteDetail[]>(`/d365quotes/${quoteId}/details`),
  create: (data: Partial<D365QuoteDetail>) => api.post<D365QuoteDetail>('/d365quotedetails', data),
  update: (id: string, data: Partial<D365QuoteDetail>) => api.put<D365QuoteDetail>(`/d365quotedetails/${id}`, data),
  delete: (id: string) => api.delete(`/d365quotedetails/${id}`),
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

export const activityService = {
  getAll: () => api.get<Activity[]>('/activities'),
  getById: (id: number) => api.get<Activity>(`/activities/${id}`),
  create: (data: Partial<Activity>) => api.post<Activity>('/activities', data),
  update: (id: number, data: Partial<Activity>) => api.put<Activity>(`/activities/${id}`, data),
  delete: (id: number) => api.delete(`/activities/${id}`),
};

export const installationProgressService = {
  getAll: () => api.get<InstallationProgress[]>('/installationprogress'),
  getById: (id: string) => api.get<InstallationProgress>(`/installationprogress/${id}`),
  create: (data: Partial<InstallationProgress>) => api.post<InstallationProgress>('/installationprogress', data),
  update: (id: string, data: Partial<InstallationProgress>) => api.put<InstallationProgress>(`/installationprogress/${id}`, data),
  delete: (id: string) => api.delete(`/installationprogress/${id}`),
};

export const deliveryService = {
  getAll: () => api.get<Delivery[]>('/deliveries'),
  getById: (id: string) => api.get<Delivery>(`/deliveries/${id}`),
  create: (data: Partial<Delivery>) => api.post<Delivery>('/deliveries', data),
  update: (id: string, data: Partial<Delivery>) => api.put<Delivery>(`/deliveries/${id}`, data),
  delete: (id: string) => api.delete(`/deliveries/${id}`),
};

export const logisticsService = {
  getAll: () => api.get<Logistics[]>('/logistics'),
  getById: (id: string) => api.get<Logistics>(`/logistics/${id}`),
  create: (data: Partial<Logistics>) => api.post<Logistics>('/logistics', data),
  update: (id: string, data: Partial<Logistics>) => api.put<Logistics>(`/logistics/${id}`, data),
  delete: (id: string) => api.delete(`/logistics/${id}`),
};

export const productionService = {
  getAll: () => api.get<Production[]>('/productions'),
  getById: (id: string) => api.get<Production>(`/productions/${id}`),
  create: (data: Partial<Production>) => api.post<Production>('/productions', data),
  update: (id: string, data: Partial<Production>) => api.put<Production>(`/productions/${id}`, data),
  delete: (id: string) => api.delete(`/productions/${id}`),
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
  
  searchProducts: async (term: string = ''): Promise<LookupOption[]> => {
    try {
      const products = await d365ProductService.getAll();
      const filtered = products.filter(p => 
        p.name?.toLowerCase().includes(term.toLowerCase()) ||
        p.productNumber?.toLowerCase().includes(term.toLowerCase())
      );
      return filtered.map(p => ({ 
        id: p.id, 
        text: p.productNumber ? `${p.productNumber} - ${p.name || ''}` : (p.name || '')
      }));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },
  
  searchOrders: async (term: string = ''): Promise<LookupOption[]> => {
    try {
      const orders = await d365OrderService.getAll();
      const filtered = orders.filter(o => 
        o.name?.toLowerCase().includes(term.toLowerCase()) ||
        o.orderNumber?.toLowerCase().includes(term.toLowerCase())
      );
      return filtered.map(o => ({ 
        id: o.id, 
        text: o.orderNumber ? `${o.orderNumber} - ${o.name || ''}` : (o.name || '')
      }));
    } catch (error) {
      console.error('Error searching orders:', error);
      return [];
    }
  },
  
  getRecentAccounts: () => 
    api.get<LookupOption[]>('/lookups/accounts/recent'),
  
  getRecentEmployees: () => 
    api.get<LookupOption[]>('/lookups/employees/recent'),
  
  getRecentContacts: () => 
    api.get<LookupOption[]>('/lookups/contacts/recent'),
};
