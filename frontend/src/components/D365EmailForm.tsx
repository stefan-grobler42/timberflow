import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
  Checkbox,
} from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { d365EmailService } from '../services/d365Services';
import type { D365Email } from '../types/millennium';

interface D365EmailFormProps {
  email?: D365Email;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const D365EmailForm = ({
  email,
  onDismiss,
  onSave,
  onDelete,
}: D365EmailFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<D365Email>>({
    subject: '',
    from: '',
    to: '',
    cc: '',
    bcc: '',
    description: '',
    directionCode: false,
    regardingObjectId: '',
    ownerId: '',
    stateCode: 0,
    statusCode: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (email) {
      setFormData({
        subject: email.subject || '',
        from: email.from || '',
        to: email.to || '',
        cc: email.cc || '',
        bcc: email.bcc || '',
        description: email.description || '',
        directionCode: email.directionCode || false,
        regardingObjectId: email.regardingObjectId || '',
        ownerId: email.ownerId || '',
        stateCode: email.stateCode || 0,
        statusCode: email.statusCode || 0,
      });
    }
    setError(null);
  }, [email]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (email) {
        await d365EmailService.update(email.id, formData);
      } else {
        await d365EmailService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (email) {
        await d365EmailService.update(email.id, formData);
      } else {
        await d365EmailService.create(formData);
      }

      setFormData({
        subject: '',
        from: '',
        to: '',
        cc: '',
        bcc: '',
        description: '',
        directionCode: false,
        regardingObjectId: '',
        ownerId: '',
        stateCode: 0,
        statusCode: 0,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save email');
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
    ...(email && onDelete
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
        {email ? 'Edit Email' : 'New Email'}
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
              text="Email Information"
              iconProps={{ iconName: 'Mail' }}
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
              text="Recipients"
              iconProps={{ iconName: 'People' }}
              onClick={() => setActiveTab('recipients')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'recipients' ? '#0078d4' : 'transparent',
                  color: activeTab === 'recipients' ? 'white' : '#323130',
                  fontWeight: activeTab === 'recipients' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'recipients' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'recipients' ? 'white' : '#323130',
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
                    label="Subject"
                    required
                    value={formData.subject}
                    onChange={(_, value) => setFormData({ ...formData, subject: value || '' })}
                  />

                  <TextField
                    label="Description"
                    multiline
                    rows={6}
                    value={formData.description}
                    onChange={(_, value) =>
                      setFormData({ ...formData, description: value || '' })
                    }
                  />

                  <Checkbox
                    label="Direction Code (Outgoing)"
                    checked={formData.directionCode}
                    onChange={(_, checked) =>
                      setFormData({ ...formData, directionCode: checked || false })
                    }
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Regarding Object ID"
                    value={formData.regardingObjectId}
                    onChange={(_, value) =>
                      setFormData({ ...formData, regardingObjectId: value || '' })
                    }
                  />

                  <TextField
                    label="Owner ID"
                    value={formData.ownerId}
                    onChange={(_, value) => setFormData({ ...formData, ownerId: value || '' })}
                  />

                  <TextField
                    label="State Code"
                    type="number"
                    value={String(formData.stateCode)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, stateCode: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Status Code"
                    type="number"
                    value={String(formData.statusCode)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, statusCode: Number(value) || 0 })
                    }
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'recipients' && (
              <Stack
                tokens={{ childrenGap: 16 }}
                styles={{ root: { marginTop: 16, maxWidth: 600 } }}
              >
                <TextField
                  label="From"
                  type="email"
                  value={formData.from}
                  onChange={(_, value) => setFormData({ ...formData, from: value || '' })}
                />

                <TextField
                  label="To"
                  type="email"
                  value={formData.to}
                  onChange={(_, value) => setFormData({ ...formData, to: value || '' })}
                  description="Separate multiple email addresses with semicolons"
                />

                <TextField
                  label="CC"
                  type="email"
                  value={formData.cc}
                  onChange={(_, value) => setFormData({ ...formData, cc: value || '' })}
                  description="Separate multiple email addresses with semicolons"
                />

                <TextField
                  label="BCC"
                  type="email"
                  value={formData.bcc}
                  onChange={(_, value) => setFormData({ ...formData, bcc: value || '' })}
                  description="Separate multiple email addresses with semicolons"
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
