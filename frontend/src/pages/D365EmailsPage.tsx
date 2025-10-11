import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { d365EmailService } from '../services/d365Services';
import type { D365Email } from '../types/millennium';

export const D365EmailsPage = () => {
  const [emails, setEmails] = useState<D365Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'subject', name: 'Subject', fieldName: 'subject', minWidth: 200, maxWidth: 250 },
    { key: 'from', name: 'From', fieldName: 'from', minWidth: 150, maxWidth: 200 },
    { key: 'to', name: 'To', fieldName: 'to', minWidth: 150, maxWidth: 200 },
    { 
      key: 'directionCode', 
      name: 'Direction', 
      fieldName: 'directionCode', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: D365Email) => item.directionCode ? 'Outgoing' : 'Incoming'
    },
  ];

  const loadEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365EmailService.getAll();
      setEmails(data);
    } catch (err) {
      setError('Failed to load emails');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmails();
  }, []);

  return (
    <EntityList
      title="D365 Emails"
      items={emails}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadEmails}
      searchPlaceholder="Search emails..."
    />
  );
};
