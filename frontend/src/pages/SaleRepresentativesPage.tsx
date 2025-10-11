import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { saleRepresentativeService } from '../services/millenniumServices';
import type { SaleRepresentative } from '../types/millennium';

export const SaleRepresentativesPage = () => {
  const [saleReps, setSaleReps] = useState<SaleRepresentative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'cellNumber', name: 'Cell Number', fieldName: 'cellNumber', minWidth: 120, maxWidth: 150 },
    { key: 'emailAddress', name: 'Email', fieldName: 'emailAddress', minWidth: 150, maxWidth: 200 },
    { key: 'employeeNo', name: 'Employee No', fieldName: 'employeeNo', minWidth: 100, maxWidth: 120 },
  ];

  const loadSaleReps = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await saleRepresentativeService.getAll();
      setSaleReps(data);
    } catch (err) {
      setError('Failed to load sale representatives');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSaleReps();
  }, []);

  return (
    <EntityList
      title="Sale Representatives"
      items={saleReps}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadSaleReps}
      searchPlaceholder="Search sale representatives..."
    />
  );
};
