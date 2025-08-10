// Customers Module - API Services
// Uses the platform API service for HTTP calls
import { api } from '../../platform/services/api.js';

class CustomersAPI {
  constructor() {
    this.baseUrl = '/api/customers';
  }

  async getCustomers(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data || response;
    } catch (error) {
      console.error('Failed to get customers:', error);
      throw error;
    }
  }

  async getCustomer(id) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to get customer:', error);
      throw error;
    }
  }

  async createCustomer(data) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data || response;
    } catch (error) {
      console.error('Failed to create customer:', error);
      throw error;
    }
  }

  async updateCustomer(id, data) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data || response;
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  }

  async deleteCustomer(id) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.success !== false;
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  }

  // Additional utility methods
  async searchCustomers(searchTerm) {
    return this.getCustomers({ search: searchTerm });
  }

  async getCustomersByType(accountType) {
    return this.getCustomers({ accountType });
  }

  async getCustomersByStatus(customerStatus) {
    return this.getCustomers({ customerStatus });
  }
}

export const customersAPI = new CustomersAPI();
export default customersAPI;