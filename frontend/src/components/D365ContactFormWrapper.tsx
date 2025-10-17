import { useState, useEffect } from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';
import { d365ContactService } from '../services/d365Services';
import { D365ContactForm } from './D365ContactForm';
import type { D365Contact } from '../types/millennium';

interface D365ContactFormWrapperProps {
  entityId?: string;
  parentId?: string;
  onDismiss: () => void;
  onSaved: () => void;
}

export const D365ContactFormWrapper = ({
  entityId,
  parentId,
  onDismiss,
  onSaved,
}: D365ContactFormWrapperProps) => {
  const [contact, setContact] = useState<D365Contact | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entityId) {
      loadContact();
    }
  }, [entityId]);

  const loadContact = async () => {
    if (!entityId) return;
    
    setLoading(true);
    try {
      const data = await d365ContactService.getById(entityId);
      setContact(data);
    } catch (error) {
      console.error('Error loading contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSaved();
  };

  const handleDelete = async () => {
    if (entityId) {
      await d365ContactService.delete(entityId);
      onSaved();
    }
  };

  if (loading) {
    return <Spinner size={SpinnerSize.large} label="Loading contact..." />;
  }

  // If creating new contact, set parentCustomerId from parentId
  const contactData = contact || { parentCustomerId: parentId };

  return (
    <D365ContactForm
      contact={contactData as D365Contact}
      onDismiss={onDismiss}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    />
  );
};
