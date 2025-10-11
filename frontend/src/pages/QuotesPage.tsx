import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { quoteMRoofingService } from '../services/millenniumServices';
import type { QuoteMRoofing } from '../types/millennium';

export const QuotesPage = () => {
  const [quotes, setQuotes] = useState<QuoteMRoofing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'account', name: 'Account', fieldName: 'account', minWidth: 150, maxWidth: 200 },
  ];

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quoteMRoofingService.getAll();
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
      title="Quotes - MRoofing"
      items={quotes}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadQuotes}
      searchPlaceholder="Search quotes..."
    />
  );
};
