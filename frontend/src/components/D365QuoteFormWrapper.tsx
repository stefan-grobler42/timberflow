import { useState, useEffect } from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';
import { d365QuoteService } from '../services/d365Services';
import { D365QuoteForm } from './D365QuoteForm';
import type { D365Quote } from '../types/millennium';

interface D365QuoteFormWrapperProps {
  entityId?: string;
  parentId?: string;
  onDismiss: () => void;
  onSaved: () => void;
}

export const D365QuoteFormWrapper = ({
  entityId,
  parentId,
  onDismiss,
  onSaved,
}: D365QuoteFormWrapperProps) => {
  const [quote, setQuote] = useState<D365Quote | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entityId) {
      loadQuote();
    }
  }, [entityId]);

  const loadQuote = async () => {
    if (!entityId) return;
    
    setLoading(true);
    try {
      const data = await d365QuoteService.getById(entityId);
      setQuote(data);
    } catch (error) {
      console.error('Error loading quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSaved();
  };

  const handleDelete = async () => {
    if (entityId) {
      await d365QuoteService.delete(entityId);
      onSaved();
    }
  };

  if (loading) {
    return <Spinner size={SpinnerSize.large} label="Loading quote..." />;
  }

  const quoteData = quote || { customerId: parentId };

  return (
    <D365QuoteForm
      quote={quoteData as D365Quote}
      onDismiss={onDismiss}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    />
  );
};
