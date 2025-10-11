import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { productionService } from '../services/millenniumServices';
import type { Production } from '../types/millennium';

export const ProductionPage = () => {
  const [production, setProduction] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'orderNo', name: 'Order No', fieldName: 'orderNo', minWidth: 100, maxWidth: 120 },
    { 
      key: 'jigStart', 
      name: 'Jig Start', 
      fieldName: 'jigStart', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: Production) => item.jigStart ? new Date(item.jigStart).toLocaleDateString() : '-'
    },
    { 
      key: 'jigEnd', 
      name: 'Jig End', 
      fieldName: 'jigEnd', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: Production) => item.jigEnd ? new Date(item.jigEnd).toLocaleDateString() : '-'
    },
    { 
      key: 'productionComplete', 
      name: 'Complete', 
      fieldName: 'productionComplete', 
      minWidth: 80, 
      maxWidth: 100,
      onRender: (item: Production) => (item.productionComplete ? 'Yes' : 'No')
    },
    { 
      key: 'productionPlannedDate', 
      name: 'Planned Date', 
      fieldName: 'productionPlannedDate', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: Production) => item.productionPlannedDate ? new Date(item.productionPlannedDate).toLocaleDateString() : '-'
    },
  ];

  const loadProduction = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productionService.getAll();
      setProduction(data);
    } catch (err) {
      setError('Failed to load production');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduction();
  }, []);

  return (
    <EntityList
      title="Production"
      items={production}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadProduction}
      searchPlaceholder="Search production..."
    />
  );
};
