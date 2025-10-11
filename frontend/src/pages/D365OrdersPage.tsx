import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { d365OrderService } from '../services/d365Services';
import type { D365Order } from '../types/millennium';

export const D365OrdersPage = () => {
  const [orders, setOrders] = useState<D365Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'orderNumber', name: 'Order Number', fieldName: 'orderNumber', minWidth: 120, maxWidth: 150 },
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'customerId', name: 'Customer ID', fieldName: 'customerId', minWidth: 120, maxWidth: 150 },
    { key: 'totalAmount', name: 'Total Amount', fieldName: 'totalAmount', minWidth: 120, maxWidth: 150 },
    { 
      key: 'requestDeliveryBy', 
      name: 'Request Delivery By', 
      fieldName: 'requestDeliveryBy', 
      minWidth: 140, 
      maxWidth: 170,
      onRender: (item: D365Order) => item.requestDeliveryBy ? new Date(item.requestDeliveryBy).toLocaleDateString() : '-'
    },
  ];

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365OrderService.getAll();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <EntityList
      title="D365 Orders"
      items={orders}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadOrders}
      searchPlaceholder="Search orders..."
    />
  );
};
