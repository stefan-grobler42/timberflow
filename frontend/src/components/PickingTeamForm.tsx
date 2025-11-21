import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  CommandBar,
  Dropdown,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { pickingTeamService, employeeService } from '../services/millenniumServices';
import type { PickingTeam, Employee } from '../types/millennium';

interface PickingTeamFormProps {
  pickingTeam?: PickingTeam;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const PickingTeamForm = ({
  pickingTeam,
  onDismiss,
  onSave,
  onDelete,
}: PickingTeamFormProps) => {
  const [formData, setFormData] = useState<Partial<PickingTeam>>({
    name: '',
    description: '',
    teamLeaderId: '',
    averageTimePerM3: undefined,
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<IDropdownOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (pickingTeam) {
      setFormData({
        name: pickingTeam.name || '',
        description: pickingTeam.description || '',
        teamLeaderId: pickingTeam.teamLeaderId || '',
        averageTimePerM3: pickingTeam.averageTimePerM3,
      });
    }
    setError(null);
  }, [pickingTeam]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const employeeData = await employeeService.getAll();
      setEmployees(employeeData);
      
      const options: IDropdownOption[] = employeeData.map(emp => ({
        key: emp.id,
        text: emp.name,
      }));
      setEmployeeOptions(options);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name || formData.name.trim() === '') {
        setError('Name is required');
        setSaving(false);
        return;
      }

      if (pickingTeam) {
        await pickingTeamService.update(pickingTeam.id, formData);
      } else {
        await pickingTeamService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save picking team');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (!formData.name || formData.name.trim() === '') {
        setError('Name is required');
        setSaving(false);
        return;
      }

      if (pickingTeam) {
        await pickingTeamService.update(pickingTeam.id, formData);
      } else {
        await pickingTeamService.create(formData);
      }

      setFormData({
        name: '',
        description: '',
        teamLeaderId: '',
        averageTimePerM3: undefined,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save picking team');
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
    ...(pickingTeam && onDelete
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
        {pickingTeam ? 'Edit Picking Team' : 'New Picking Team'}
      </Text>

      <CommandBar items={commandBarItems} />

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' } }}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

        <Stack tokens={{ childrenGap: 16 }}>
          <TextField
            label="Name"
            required
            value={formData.name}
            onChange={(_, value) => setFormData({ ...formData, name: value })}
            disabled={saving}
          />

          <TextField
            label="Description"
            multiline
            rows={4}
            value={formData.description}
            onChange={(_, value) => setFormData({ ...formData, description: value })}
            disabled={saving}
          />

          <Dropdown
            label="Team Leader"
            placeholder="Select a team leader"
            options={employeeOptions}
            selectedKey={formData.teamLeaderId}
            onChange={(_, option) => setFormData({ ...formData, teamLeaderId: option?.key as string })}
            disabled={saving || loading}
          />

          <TextField
            label="Average Time /m³"
            type="number"
            value={formData.averageTimePerM3?.toString() || ''}
            onChange={(_, value) => setFormData({ ...formData, averageTimePerM3: value ? parseFloat(value) : undefined })}
            disabled={saving}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};
