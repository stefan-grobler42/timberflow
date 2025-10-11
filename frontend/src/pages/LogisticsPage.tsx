import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { logisticsService } from '../services/millenniumServices';
import type { Logistics } from '../types/millennium';

export const LogisticsPage = () => {
  const [logistics, setLogistics] = useState<Logistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'deliveryNo', name: 'Delivery No.', fieldName: 'deliveryNo', minWidth: 100, maxWidth: 120 },
    { key: 'description', name: 'Description', fieldName: 'description', minWidth: 150, maxWidth: 250 },
    { 
      key: 'plannedLoadDate', 
      name: 'Planned Load Date', 
      fieldName: 'plannedLoadDate', 
      minWidth: 120, 
      maxWidth: 150,
      onRender: (item: Logistics) => item.plannedLoadDate ? new Date(item.plannedLoadDate).toLocaleDateString() : '-'
    },
    { 
      key: 'newLoadCompleted', 
      name: 'Completed', 
      fieldName: 'newLoadCompleted', 
      minWidth: 80, 
      maxWidth: 100,
      onRender: (item: Logistics) => (item.newLoadCompleted ? 'Yes' : 'No')
    },
  ];

  const loadLogistics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await logisticsService.getAll();
      setLogistics(data);
    } catch (err) {
      setError('Failed to load logistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogistics();
  }, []);

  return (
    <EntityList
      title="Logistics"
      items={logistics}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadLogistics}
      searchPlaceholder="Search logistics..."
    />
  );
};
