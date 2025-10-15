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
import { installationProgressService } from '../services';
import type { InstallationProgress } from '../types/millennium';

interface InstallationProgressFormProps {
  installationProgress?: InstallationProgress;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const InstallationProgressForm = ({
  installationProgress,
  onDismiss,
  onSave,
  onDelete,
}: InstallationProgressFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<InstallationProgress>>({
    name: '',
    newInstallationOrderNo: '',
    newPercentageComplete: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (installationProgress) {
      setFormData({
        name: installationProgress.name || '',
        newInstallationOrderNo: installationProgress.newInstallationOrderNo || '',
        newPercentageComplete: installationProgress.newPercentageComplete || 0,
      });
    }
    setError(null);
  }, [installationProgress]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (installationProgress) {
        await installationProgressService.update(installationProgress.id, formData);
      } else {
        await installationProgressService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save installation progress');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (installationProgress) {
        await installationProgressService.update(installationProgress.id, formData);
      } else {
        await installationProgressService.create(formData);
      }

      setFormData({
        name: '',
        newInstallationOrderNo: '',
        newPercentageComplete: 0,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save installation progress');
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
    ...(installationProgress && onDelete
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
        {installationProgress ? 'Edit Installation Progress' : 'New Installation Progress'}
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
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16, maxWidth: 600 } }}>
                <TextField
                  label="Name"
                  required
                  value={formData.name}
                  onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
                />

                <TextField
                  label="Installation Order No"
                  value={formData.newInstallationOrderNo}
                  onChange={(_, value) =>
                    setFormData({ ...formData, newInstallationOrderNo: value || '' })
                  }
                />

                <TextField
                  label="Percentage Complete"
                  type="number"
                  suffix="%"
                  value={String(formData.newPercentageComplete || '')}
                  onChange={(_, value) =>
                    setFormData({ ...formData, newPercentageComplete: Number(value) || 0 })
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
