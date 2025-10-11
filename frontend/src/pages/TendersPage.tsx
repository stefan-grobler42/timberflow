import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { tenderService } from '../services/millenniumServices';
import type { Tender } from '../types/millennium';

export const TendersPage = () => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'description', name: 'Description', fieldName: 'description', minWidth: 150, maxWidth: 250 },
    { key: 'fileLink', name: 'File Link', fieldName: 'fileLink', minWidth: 120, maxWidth: 150 },
    { 
      key: 'closingDate', 
      name: 'Closing Date', 
      fieldName: 'closingDate', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: Tender) => item.closingDate ? new Date(item.closingDate).toLocaleDateString() : '-'
    },
    { key: 'customer', name: 'Customer', fieldName: 'customer', minWidth: 120, maxWidth: 150 },
    { key: 'quoteNo', name: 'Quote No', fieldName: 'quoteNo', minWidth: 100, maxWidth: 120 },
    { 
      key: 'totalValueExcl', 
      name: 'Total Value (Excl)', 
      fieldName: 'totalValueExcl', 
      minWidth: 120, 
      maxWidth: 150,
      onRender: (item: Tender) => item.totalValueExcl ? `R ${item.totalValueExcl.toLocaleString()}` : '-'
    },
  ];

  const loadTenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenderService.getAll();
      setTenders(data);
    } catch (err) {
      setError('Failed to load tenders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenders();
  }, []);

  return (
    <EntityList
      title="Tenders"
      items={tenders}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadTenders}
      searchPlaceholder="Search tenders..."
    />
  );
};
