import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
  Dropdown,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { quoteMRoofingService } from '../services';
import { accountService } from '../services/d365Services';
import type { QuoteMRoofing, Account } from '../types/millennium';

interface QuoteMRoofingFormProps {
  quoteMRoofing?: QuoteMRoofing;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const QuoteMRoofingForm = ({
  quoteMRoofing,
  onDismiss,
  onSave,
  onDelete,
}: QuoteMRoofingFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<QuoteMRoofing>>({
    name: '',
    account: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const accountOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...accounts.map((a) => ({ key: a.id, text: a.name })),
  ];

  useEffect(() => {
    if (quoteMRoofing) {
      setFormData({
        name: quoteMRoofing.name || '',
        account: quoteMRoofing.account || '',
      });
    }
    setError(null);
  }, [quoteMRoofing]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (quoteMRoofing) {
        await quoteMRoofingService.update(quoteMRoofing.id, formData);
      } else {
        await quoteMRoofingService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quote');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (quoteMRoofing) {
        await quoteMRoofingService.update(quoteMRoofing.id, formData);
      } else {
        await quoteMRoofingService.create(formData);
      }

      setFormData({
        name: '',
        account: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quote');
      setSaving(false);
    }
  };

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'save',
      text: 'Save',
      iconProps: { iconName: 'Save' },
      onClick: handleSubmit,
      disabled: saving,
    },
    {
      key: 'saveAndNew',
      text: 'Save & New',
      iconProps: { iconName: 'SaveAndClose' },
      onClick: handleSaveAndNew,
      disabled: saving,
    },
    ...(quoteMRoofing && onDelete
      ? [
          {
            key: 'delete',
            text: 'Delete',
            iconProps: { iconName: 'Delete' },
            onClick: onDelete,
            disabled: saving,
          },
        ]
      : []),
    {
      key: 'cancel',
      text: 'Cancel',
      iconProps: { iconName: 'Cancel' },
      onClick: onDismiss,
      disabled: saving,
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { height: '100%' } }}>
      <Text variant="xxLarge" styles={{ root: { padding: '20px 20px 0 20px' } }}>
        {quoteMRoofing ? 'Edit Quote M Roofing' : 'New Quote M Roofing'}
      </Text>

      <CommandBar items={commandBarItems} />

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' } }}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

        <Stack styles={{ root: { flex: 1, display: 'flex', flexDirection: 'column' } }}>
          <Stack horizontal styles={{ root: { borderBottom: '1px solid #edebe9' } }}>
            <DefaultButton
              text="Basic Information"
              iconProps={{ iconName: 'Info' }}
              onClick={() => setActiveTab('basic')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'basic' ? '#0078d4' : 'transparent',
                  color: activeTab === 'basic' ? 'white' : '#323130',
                  fontWeight: activeTab === 'basic' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'basic' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'basic' ? 'white' : '#323130',
                },
              }}
            />
          </Stack>

          <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '20px 0' } }}>
            {activeTab === 'basic' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Name"
                  required
                  value={formData.name}
                  onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
                />

                <Dropdown
                  label="Account"
                  options={accountOptions}
                  selectedKey={formData.account || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, account: option?.key as string || '' })
                  }
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
