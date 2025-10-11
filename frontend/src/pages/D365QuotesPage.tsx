import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { d365QuoteService } from '../services/d365Services';
import type { D365Quote } from '../types/millennium';

export const D365QuotesPage = () => {
  const [quotes, setQuotes] = useState<D365Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'quoteNumber', name: 'Quote Number', fieldName: 'quoteNumber', minWidth: 120, maxWidth: 150 },
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'customerId', name: 'Customer ID', fieldName: 'customerId', minWidth: 120, maxWidth: 150 },
    { key: 'totalAmount', name: 'Total Amount', fieldName: 'totalAmount', minWidth: 120, maxWidth: 150 },
    { 
      key: 'effectiveFrom', 
      name: 'Effective From', 
      fieldName: 'effectiveFrom', 
      minWidth: 120, 
      maxWidth: 150,
      onRender: (item: D365Quote) => item.effectiveFrom ? new Date(item.effectiveFrom).toLocaleDateString() : '-'
    },
  ];

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365QuoteService.getAll();
      setQuotes(data);
    } catch (err) {
      setError('Failed to load quotes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  return (
    <EntityList
      title="D365 Quotes"
      items={quotes}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadQuotes}
      searchPlaceholder="Search quotes..."
    />
  );
};
