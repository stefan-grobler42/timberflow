import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { employeeService } from '../services/millenniumServices';
import type { Employee } from '../types/millennium';

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'employeeNo', name: 'Employee No', fieldName: 'employeeNo', minWidth: 100, maxWidth: 120 },
    { key: 'newCellNo', name: 'Cell No', fieldName: 'newCellNo', minWidth: 120, maxWidth: 150 },
    { key: 'newEmailAddress', name: 'Email', fieldName: 'newEmailAddress', minWidth: 150, maxWidth: 200 },
    { key: 'jobDescription', name: 'Job Description', fieldName: 'jobDescription', minWidth: 150, maxWidth: 200 },
    { 
      key: 'newActiveEmployee', 
      name: 'Active', 
      fieldName: 'newActiveEmployee', 
      minWidth: 80, 
      maxWidth: 100,
      onRender: (item: Employee) => (item.newActiveEmployee ? 'Yes' : 'No')
    },
    { 
      key: 'newStartDate', 
      name: 'Start Date', 
      fieldName: 'newStartDate', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: Employee) => item.newStartDate ? new Date(item.newStartDate).toLocaleDateString() : '-'
    },
  ];

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (err) {
      setError('Failed to load employees');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return (
    <EntityList
      title="Employees"
      items={employees}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadEmployees}
      searchPlaceholder="Search employees..."
    />
  );
};
