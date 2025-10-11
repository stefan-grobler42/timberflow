import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { accountService } from '../services/d365Services';
import type { Account } from '../types/millennium';

export const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'accountNumber', name: 'Account Number', fieldName: 'accountNumber', minWidth: 120, maxWidth: 150 },
    { key: 'telephone1', name: 'Phone', fieldName: 'telephone1', minWidth: 120, maxWidth: 150 },
    { key: 'emailAddress1', name: 'Email', fieldName: 'emailAddress1', minWidth: 150, maxWidth: 200 },
    { key: 'address1City', name: 'City', fieldName: 'address1City', minWidth: 120, maxWidth: 150 },
  ];

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      setError('Failed to load accounts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  return (
    <EntityList
      title="Accounts"
      items={accounts}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadAccounts}
      searchPlaceholder="Search accounts..."
    />
  );
};
