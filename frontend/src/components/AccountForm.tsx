import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
} from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { accountService } from '../services/d365Services';
import type { Account } from '../types/millennium';

interface AccountFormProps {
  account?: Account;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const AccountForm = ({
  account,
  onDismiss,
  onSave,
  onDelete,
}: AccountFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    accountNumber: '',
    telephone1: '',
    emailAddress1: '',
    websiteUrl: '',
    address1Line1: '',
    address1City: '',
    address1StateOrProvince: '',
    address1PostalCode: '',
    address1Country: '',
    revenue: 0,
    numberOfEmployees: 0,
    industryCode: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        accountNumber: account.accountNumber || '',
        telephone1: account.telephone1 || '',
        emailAddress1: account.emailAddress1 || '',
        websiteUrl: account.websiteUrl || '',
        address1Line1: account.address1Line1 || '',
        address1City: account.address1City || '',
        address1StateOrProvince: account.address1StateOrProvince || '',
        address1PostalCode: account.address1PostalCode || '',
        address1Country: account.address1Country || '',
        revenue: account.revenue || 0,
        numberOfEmployees: account.numberOfEmployees || 0,
        industryCode: account.industryCode || 0,
      });
    }
    setError(null);
  }, [account]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (account) {
        await accountService.update(account.id, formData);
      } else {
        await accountService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (account) {
        await accountService.update(account.id, formData);
      } else {
        await accountService.create(formData);
      }

      setFormData({
        name: '',
        accountNumber: '',
        telephone1: '',
        emailAddress1: '',
        websiteUrl: '',
        address1Line1: '',
        address1City: '',
        address1StateOrProvince: '',
        address1PostalCode: '',
        address1Country: '',
        revenue: 0,
        numberOfEmployees: 0,
        industryCode: 0,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
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
    ...(account && onDelete
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
        {account ? 'Edit Account' : 'New Account'}
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
            <DefaultButton
              text="Contact Information"
              iconProps={{ iconName: 'Contact' }}
              onClick={() => setActiveTab('contact')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'contact' ? '#0078d4' : 'transparent',
                  color: activeTab === 'contact' ? 'white' : '#323130',
                  fontWeight: activeTab === 'contact' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'contact' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'contact' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Address"
              iconProps={{ iconName: 'MapPin' }}
              onClick={() => setActiveTab('address')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'address' ? '#0078d4' : 'transparent',
                  color: activeTab === 'address' ? 'white' : '#323130',
                  fontWeight: activeTab === 'address' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'address' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'address' ? 'white' : '#323130',
                },
              }}
            />
          </Stack>

          <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '20px 0' } }}>
            {activeTab === 'basic' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16, overflowY: 'auto' } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Account Name"
                    required
                    value={formData.name}
                    onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
                  />

                  <TextField
                    label="Account Number"
                    value={formData.accountNumber}
                    onChange={(_, value) =>
                      setFormData({ ...formData, accountNumber: value || '' })
                    }
                  />

                  <TextField
                    label="Revenue"
                    type="number"
                    value={String(formData.revenue)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, revenue: Number(value) || 0 })
                    }
                    prefix="$"
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Number of Employees"
                    type="number"
                    value={String(formData.numberOfEmployees)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, numberOfEmployees: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Industry Code"
                    type="number"
                    value={String(formData.industryCode)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, industryCode: Number(value) || 0 })
                    }
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'contact' && (
              <Stack
                tokens={{ childrenGap: 16 }}
                styles={{ root: { marginTop: 16, maxWidth: 600 } }}
              >
                <TextField
                  label="Phone"
                  value={formData.telephone1}
                  onChange={(_, value) => setFormData({ ...formData, telephone1: value || '' })}
                />

                <TextField
                  label="Email"
                  type="email"
                  value={formData.emailAddress1}
                  onChange={(_, value) =>
                    setFormData({ ...formData, emailAddress1: value || '' })
                  }
                />

                <TextField
                  label="Website"
                  value={formData.websiteUrl}
                  onChange={(_, value) => setFormData({ ...formData, websiteUrl: value || '' })}
                />
              </Stack>
            )}

            {activeTab === 'address' && (
              <Stack
                tokens={{ childrenGap: 16 }}
                styles={{ root: { marginTop: 16, maxWidth: 600 } }}
              >
                <TextField
                  label="Street Address"
                  multiline
                  rows={2}
                  value={formData.address1Line1}
                  onChange={(_, value) =>
                    setFormData({ ...formData, address1Line1: value || '' })
                  }
                />

                <TextField
                  label="City"
                  value={formData.address1City}
                  onChange={(_, value) =>
                    setFormData({ ...formData, address1City: value || '' })
                  }
                />

                <TextField
                  label="State/Province"
                  value={formData.address1StateOrProvince}
                  onChange={(_, value) =>
                    setFormData({ ...formData, address1StateOrProvince: value || '' })
                  }
                />

                <TextField
                  label="Postal Code"
                  value={formData.address1PostalCode}
                  onChange={(_, value) =>
                    setFormData({ ...formData, address1PostalCode: value || '' })
                  }
                />

                <TextField
                  label="Country"
                  value={formData.address1Country}
                  onChange={(_, value) =>
                    setFormData({ ...formData, address1Country: value || '' })
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
