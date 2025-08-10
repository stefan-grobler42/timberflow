// Platform Services - Database Wrapper
// Wraps the existing storage service with same API
// Note: Original storage is loaded globally or via require

class DatabaseService {
  constructor() {
    // Access the storage via require (Node.js) or global window
    if (typeof window !== 'undefined' && window.storage) {
      this.storage = window.storage;
    } else if (typeof require !== 'undefined') {
      this.storage = require('../../server/storage.js').storage;
    } else {
      console.warn('Storage service not available');
      this.storage = null;
    }
  }

  // Customer operations
  async getCustomers(filters = {}) {
    return await this.storage.getCustomers(filters);
  }

  async getCustomer(id) {
    return await this.storage.getCustomer(id);
  }

  async createCustomer(data) {
    return await this.storage.createCustomer(data);
  }

  async updateCustomer(id, data) {
    return await this.storage.updateCustomer(id, data);
  }

  async deleteCustomer(id) {
    return await this.storage.deleteCustomer(id);
  }

  // Project operations
  async getProjects(filters = {}) {
    return await this.storage.getProjects(filters);
  }

  async getProject(id) {
    return await this.storage.getProject(id);
  }

  async createProject(data) {
    return await this.storage.createProject(data);
  }

  async updateProject(id, data) {
    return await this.storage.updateProject(id, data);
  }

  async deleteProject(id) {
    return await this.storage.deleteProject(id);
  }

  // Generic operations for extensibility
  async get(table, id) {
    const methodName = `get${table.charAt(0).toUpperCase() + table.slice(1, -1)}`;
    if (this.storage[methodName]) {
      return await this.storage[methodName](id);
    }
    return null;
  }

  async getAll(table, filters = {}) {
    const methodName = `get${table.charAt(0).toUpperCase() + table.slice(1)}`;
    if (this.storage[methodName]) {
      return await this.storage[methodName](filters);
    }
    return [];
  }

  async create(table, data) {
    const methodName = `create${table.charAt(0).toUpperCase() + table.slice(1, -1)}`;
    if (this.storage[methodName]) {
      return await this.storage[methodName](data);
    }
    return { id: Date.now(), ...data };
  }

  async update(table, id, data) {
    const methodName = `update${table.charAt(0).toUpperCase() + table.slice(1, -1)}`;
    if (this.storage[methodName]) {
      return await this.storage[methodName](id, data);
    }
    return { id, ...data };
  }

  async delete(table, id) {
    const methodName = `delete${table.charAt(0).toUpperCase() + table.slice(1, -1)}`;
    if (this.storage[methodName]) {
      return await this.storage[methodName](id);
    }
    return true;
  }
}

export const db = new DatabaseService();
export default db;