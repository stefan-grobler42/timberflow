import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { designerService } from '../services/millenniumServices';
import type { Designer } from '../types/millennium';

export const DesignersPage = () => {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'cellNumber', name: 'Cell Number', fieldName: 'cellNumber', minWidth: 120, maxWidth: 150 },
    { key: 'emailAddress', name: 'Email', fieldName: 'emailAddress', minWidth: 150, maxWidth: 200 },
    { key: 'employeeNo', name: 'Employee No', fieldName: 'employeeNo', minWidth: 100, maxWidth: 120 },
    { key: 'newEmployeeFile', name: 'Employee File', fieldName: 'newEmployeeFile', minWidth: 120, maxWidth: 150 },
  ];

  const loadDesigners = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await designerService.getAll();
      setDesigners(data);
    } catch (err) {
      setError('Failed to load designers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDesigners();
  }, []);

  return (
    <EntityList
      title="Designers"
      items={designers}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadDesigners}
      searchPlaceholder="Search designers..."
    />
  );
};
