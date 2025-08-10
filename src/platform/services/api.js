// Platform Services - API Wrapper
// Wraps the existing app.apiCall method with same API
class APIService {
  constructor() {
    // Use existing app instance if available
    this.app = window.app || null;
  }

  // Main API call method - matches existing app.apiCall signature
  async apiCall(endpoint, method = 'GET', data = null) {
    if (this.app && this.app.apiCall) {
      return await this.app.apiCall(endpoint, method, data);
    }
    
    // Fallback implementation for direct API calls
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(endpoint, config);
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  // Convenience methods
  async get(endpoint) {
    return await this.apiCall(endpoint, 'GET');
  }

  async post(endpoint, data) {
    return await this.apiCall(endpoint, 'POST', data);
  }

  async put(endpoint, data) {
    return await this.apiCall(endpoint, 'PUT', data);
  }

  async delete(endpoint) {
    return await this.apiCall(endpoint, 'DELETE');
  }
}

export const api = new APIService();
export default api;