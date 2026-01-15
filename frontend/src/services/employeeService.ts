const API_BASE = '/api/employees';

export interface Employee {
  id: string;
  name: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  employeeNo?: string;
  jobDescription?: string;
  newActiveEmployee?: boolean;
}

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const response = await fetch(`${API_BASE}?activeOnly=true`);
    if (!response.ok) throw new Error('Failed to fetch employees');
    return response.json();
  },

  async getById(id: string): Promise<Employee> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch employee');
    return response.json();
  }
};
