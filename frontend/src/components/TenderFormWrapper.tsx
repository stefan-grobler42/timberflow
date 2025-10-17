import { useState, useEffect } from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';
import { tenderService } from '../services/millenniumServices';
import { TenderForm } from './TenderForm';
import type { Tender } from '../types/millennium';

interface TenderFormWrapperProps {
  entityId?: string;
  parentId?: string;
  onDismiss: () => void;
  onSaved: () => void;
}

export const TenderFormWrapper = ({
  entityId,
  parentId,
  onDismiss,
  onSaved,
}: TenderFormWrapperProps) => {
  const [tender, setTender] = useState<Tender | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entityId) {
      loadTender();
    }
  }, [entityId]);

  const loadTender = async () => {
    if (!entityId) return;
    
    setLoading(true);
    try {
      const data = await tenderService.getById(entityId);
      setTender(data);
    } catch (error) {
      console.error('Error loading tender:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSaved();
  };

  const handleDelete = async () => {
    if (entityId) {
      await tenderService.delete(entityId);
      onSaved();
    }
  };

  if (loading) {
    return <Spinner size={SpinnerSize.large} label="Loading tender..." />;
  }

  const tenderData = tender || { customer: parentId };

  return (
    <TenderForm
      tender={tenderData as Tender}
      onDismiss={onDismiss}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    />
  );
};
