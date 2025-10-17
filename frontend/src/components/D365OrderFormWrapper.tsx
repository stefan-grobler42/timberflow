import { useState, useEffect } from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';
import { d365OrderService } from '../services/d365Services';
import { D365OrderForm } from './D365OrderForm';
import type { D365Order } from '../types/millennium';

interface D365OrderFormWrapperProps {
  entityId?: string;
  parentId?: string;
  onDismiss: () => void;
  onSaved: () => void;
}

export const D365OrderFormWrapper = ({
  entityId,
  parentId,
  onDismiss,
  onSaved,
}: D365OrderFormWrapperProps) => {
  const [order, setOrder] = useState<D365Order | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entityId) {
      loadOrder();
    }
  }, [entityId]);

  const loadOrder = async () => {
    if (!entityId) return;
    
    setLoading(true);
    try {
      const data = await d365OrderService.getById(entityId);
      setOrder(data);
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSaved();
  };

  const handleDelete = async () => {
    if (entityId) {
      await d365OrderService.delete(entityId);
      onSaved();
    }
  };

  if (loading) {
    return <Spinner size={SpinnerSize.large} label="Loading order..." />;
  }

  const orderData = order || { customerId: parentId };

  return (
    <D365OrderForm
      order={orderData as D365Order}
      onDismiss={onDismiss}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    />
  );
};
