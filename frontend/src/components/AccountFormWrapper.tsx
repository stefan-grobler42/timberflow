import { useState, useEffect } from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';
import { accountService } from '../services/d365Services';
import { AccountForm } from './AccountForm';
import type { Account } from '../types/millennium';

interface AccountFormWrapperProps {
  entityId?: string;
  parentId?: string;
  onDismiss: () => void;
  onSaved: () => void;
}

export const AccountFormWrapper = ({
  entityId,
  parentId,
  onDismiss,
  onSaved,
}: AccountFormWrapperProps) => {
  const [account, setAccount] = useState<Account | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (entityId) {
      loadAccount();
    }
  }, [entityId]);

  const loadAccount = async () => {
    if (!entityId) return;
    
    setLoading(true);
    try {
      const data = await accountService.getById(entityId);
      setAccount(data);
    } catch (error) {
      console.error('Error loading account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSaved();
  };

  const handleDelete = async () => {
    if (entityId) {
      await accountService.delete(entityId);
      onSaved();
    }
  };

  if (loading) {
    return <Spinner size={SpinnerSize.large} label="Loading account..." />;
  }

  // If creating new account, set parentAccountId from parentId
  const accountData = account || { parentAccountId: parentId };

  return (
    <AccountForm
      account={accountData as Account}
      onDismiss={onDismiss}
      onSave={handleSave}
      onDelete={entityId ? handleDelete : undefined}
    />
  );
};
