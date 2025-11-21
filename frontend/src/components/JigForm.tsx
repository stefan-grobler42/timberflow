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
import { jigService, employeeService } from '../services/millenniumServices';
import type { Jig, Employee } from '../types/millennium';

interface JigFormProps {
  jig?: Jig;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const JigForm = ({
  jig,
  onDismiss,
  onSave,
  onDelete,
}: JigFormProps) => {
  const [formData, setFormData] = useState<Partial<Jig>>({
    name: '',
    description: '',
    leaderId: '',
    proficiency: '',
    reliabilityScore: undefined,
    strengths: '',
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
    if (jig) {
      setFormData({
        name: jig.name || '',
        description: jig.description || '',
        leaderId: jig.leaderId || '',
        proficiency: jig.proficiency || '',
        reliabilityScore: jig.reliabilityScore,
        strengths: jig.strengths || '',
      });
    }
    setError(null);
  }, [jig]);

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

      if (jig) {
        await jigService.update(jig.id, formData);
      } else {
        await jigService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save jig');
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

      if (jig) {
        await jigService.update(jig.id, formData);
      } else {
        await jigService.create(formData);
      }

      setFormData({
        name: '',
        description: '',
        leaderId: '',
        proficiency: '',
        reliabilityScore: undefined,
        strengths: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save jig');
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
    ...(jig && onDelete
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
        {jig ? 'Edit Jig' : 'New Jig'}
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
            label="Leader"
            placeholder="Select a leader"
            options={employeeOptions}
            selectedKey={formData.leaderId}
            onChange={(_, option) => setFormData({ ...formData, leaderId: option?.key as string })}
            disabled={saving || loading}
          />

          <TextField
            label="Proficiency"
            value={formData.proficiency}
            onChange={(_, value) => setFormData({ ...formData, proficiency: value })}
            disabled={saving}
          />

          <TextField
            label="Reliability Score"
            type="number"
            value={formData.reliabilityScore?.toString() || ''}
            onChange={(_, value) => setFormData({ ...formData, reliabilityScore: value ? parseFloat(value) : undefined })}
            disabled={saving}
          />

          <TextField
            label="Strengths"
            multiline
            rows={4}
            value={formData.strengths}
            onChange={(_, value) => setFormData({ ...formData, strengths: value })}
            disabled={saving}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};
