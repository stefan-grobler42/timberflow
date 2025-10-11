import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { deliveryService } from '../services/millenniumServices';
import type { Delivery } from '../types/millennium';

export const DeliveriesPage = () => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'deliveryNo', name: 'Delivery No', fieldName: 'deliveryNo', minWidth: 100, maxWidth: 120 },
    { key: 'orderNo', name: 'Order No', fieldName: 'orderNo', minWidth: 100, maxWidth: 120 },
    { 
      key: 'loadingDate', 
      name: 'Loading Date', 
      fieldName: 'loadingDate', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: Delivery) => item.loadingDate ? new Date(item.loadingDate).toLocaleDateString() : '-'
    },
    { 
      key: 'actualStart', 
      name: 'Start', 
      fieldName: 'actualStart', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: Delivery) => item.actualStart ? new Date(item.actualStart).toLocaleDateString() : '-'
    },
    { 
      key: 'actualEnd', 
      name: 'End', 
      fieldName: 'actualEnd', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: Delivery) => item.actualEnd ? new Date(item.actualEnd).toLocaleDateString() : '-'
    },
    { 
      key: 'partLoad', 
      name: 'Part Load', 
      fieldName: 'partLoad', 
      minWidth: 80, 
      maxWidth: 100,
      onRender: (item: Delivery) => (item.partLoad ? 'Yes' : 'No')
    },
  ];

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryService.getAll();
      setDeliveries(data);
    } catch (err) {
      setError('Failed to load deliveries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  return (
    <EntityList
      title="Deliveries"
      items={deliveries}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadDeliveries}
      searchPlaceholder="Search deliveries..."
    />
  );
};
