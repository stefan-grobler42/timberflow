import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { d365ContactService } from '../services/d365Services';
import type { D365Contact } from '../types/millennium';

export const D365ContactsPage = () => {
  const [contacts, setContacts] = useState<D365Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'fullName', name: 'Full Name', fieldName: 'fullName', minWidth: 150, maxWidth: 200 },
    { key: 'emailAddress1', name: 'Email', fieldName: 'emailAddress1', minWidth: 150, maxWidth: 200 },
    { key: 'telephone1', name: 'Phone', fieldName: 'telephone1', minWidth: 120, maxWidth: 150 },
    { key: 'jobTitle', name: 'Job Title', fieldName: 'jobTitle', minWidth: 120, maxWidth: 150 },
    { key: 'address1City', name: 'City', fieldName: 'address1City', minWidth: 120, maxWidth: 150 },
  ];

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365ContactService.getAll();
      setContacts(data);
    } catch (err) {
      setError('Failed to load contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return (
    <EntityList
      title="D365 Contacts"
      items={contacts}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadContacts}
      searchPlaceholder="Search contacts..."
    />
  );
};
