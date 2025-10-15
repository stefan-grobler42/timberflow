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
import { designerService } from '../services';
import type { Designer } from '../types/millennium';

interface DesignerFormProps {
  designer?: Designer;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const DesignerForm = ({
  designer,
  onDismiss,
  onSave,
  onDelete,
}: DesignerFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<Designer>>({
    name: '',
    cellNumber: '',
    emailAddress: '',
    employeeNo: '',
    newDisplayNameCalculated: '',
    newEmployeeFile: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (designer) {
      setFormData({
        name: designer.name || '',
        cellNumber: designer.cellNumber || '',
        emailAddress: designer.emailAddress || '',
        employeeNo: designer.employeeNo || '',
        newDisplayNameCalculated: designer.newDisplayNameCalculated || '',
        newEmployeeFile: designer.newEmployeeFile || '',
      });
    }
    setError(null);
  }, [designer]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (designer) {
        await designerService.update(designer.id, formData);
      } else {
        await designerService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save designer');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (designer) {
        await designerService.update(designer.id, formData);
      } else {
        await designerService.create(formData);
      }

      setFormData({
        name: '',
        cellNumber: '',
        emailAddress: '',
        employeeNo: '',
        newDisplayNameCalculated: '',
        newEmployeeFile: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save designer');
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
    ...(designer && onDelete
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
        {designer ? 'Edit Designer' : 'New Designer'}
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
              text="Additional"
              iconProps={{ iconName: 'DocumentSet' }}
              onClick={() => setActiveTab('additional')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'additional' ? '#0078d4' : 'transparent',
                  color: activeTab === 'additional' ? 'white' : '#323130',
                  fontWeight: activeTab === 'additional' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'additional' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'additional' ? 'white' : '#323130',
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

                <TextField
                  label="Employee No"
                  value={formData.employeeNo}
                  onChange={(_, value) => setFormData({ ...formData, employeeNo: value || '' })}
                />

                <TextField
                  label="Display Name"
                  value={formData.newDisplayNameCalculated}
                  onChange={(_, value) =>
                    setFormData({ ...formData, newDisplayNameCalculated: value || '' })
                  }
                />
              </Stack>
            )}

            {activeTab === 'contact' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Cell Number"
                  value={formData.cellNumber}
                  onChange={(_, value) => setFormData({ ...formData, cellNumber: value || '' })}
                />

                <TextField
                  label="Email Address"
                  type="email"
                  value={formData.emailAddress}
                  onChange={(_, value) =>
                    setFormData({ ...formData, emailAddress: value || '' })
                  }
                />
              </Stack>
            )}

            {activeTab === 'additional' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Employee File"
                  value={formData.newEmployeeFile}
                  onChange={(_, value) =>
                    setFormData({ ...formData, newEmployeeFile: value || '' })
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
