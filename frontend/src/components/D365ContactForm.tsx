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
import { d365ContactService } from '../services/d365Services';
import type { D365Contact } from '../types/millennium';

interface D365ContactFormProps {
  contact?: D365Contact;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const D365ContactForm = ({
  contact,
  onDismiss,
  onSave,
  onDelete,
}: D365ContactFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<D365Contact>>({
    firstName: '',
    lastName: '',
    fullName: '',
    emailAddress1: '',
    telephone1: '',
    mobilePhone: '',
    jobTitle: '',
    parentCustomerId: '',
    address1Line1: '',
    address1City: '',
    address1StateOrProvince: '',
    address1PostalCode: '',
    address1Country: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        fullName: contact.fullName || '',
        emailAddress1: contact.emailAddress1 || '',
        telephone1: contact.telephone1 || '',
        mobilePhone: contact.mobilePhone || '',
        jobTitle: contact.jobTitle || '',
        parentCustomerId: contact.parentCustomerId || '',
        address1Line1: contact.address1Line1 || '',
        address1City: contact.address1City || '',
        address1StateOrProvince: contact.address1StateOrProvince || '',
        address1PostalCode: contact.address1PostalCode || '',
        address1Country: contact.address1Country || '',
      });
    }
    setError(null);
  }, [contact]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (contact) {
        await d365ContactService.update(contact.id, formData);
      } else {
        await d365ContactService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (contact) {
        await d365ContactService.update(contact.id, formData);
      } else {
        await d365ContactService.create(formData);
      }

      setFormData({
        firstName: '',
        lastName: '',
        fullName: '',
        emailAddress1: '',
        telephone1: '',
        mobilePhone: '',
        jobTitle: '',
        parentCustomerId: '',
        address1Line1: '',
        address1City: '',
        address1StateOrProvince: '',
        address1PostalCode: '',
        address1Country: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
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
    ...(contact && onDelete
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
        {contact ? 'Edit Contact' : 'New Contact'}
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
              text="Contact Details"
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
                    label="First Name"
                    required
                    value={formData.firstName}
                    onChange={(_, value) => setFormData({ ...formData, firstName: value || '' })}
                  />

                  <TextField
                    label="Last Name"
                    required
                    value={formData.lastName}
                    onChange={(_, value) => setFormData({ ...formData, lastName: value || '' })}
                  />

                  <TextField
                    label="Full Name"
                    value={formData.fullName}
                    onChange={(_, value) => setFormData({ ...formData, fullName: value || '' })}
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Job Title"
                    value={formData.jobTitle}
                    onChange={(_, value) => setFormData({ ...formData, jobTitle: value || '' })}
                  />

                  <TextField
                    label="Parent Customer ID"
                    value={formData.parentCustomerId}
                    onChange={(_, value) =>
                      setFormData({ ...formData, parentCustomerId: value || '' })
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
                  label="Email"
                  type="email"
                  value={formData.emailAddress1}
                  onChange={(_, value) =>
                    setFormData({ ...formData, emailAddress1: value || '' })
                  }
                />

                <TextField
                  label="Phone"
                  value={formData.telephone1}
                  onChange={(_, value) => setFormData({ ...formData, telephone1: value || '' })}
                />

                <TextField
                  label="Mobile Phone"
                  value={formData.mobilePhone}
                  onChange={(_, value) => setFormData({ ...formData, mobilePhone: value || '' })}
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
