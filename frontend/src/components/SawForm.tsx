import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  CommandBar,
  Dropdown,
  DatePicker,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { sawService, employeeService } from '../services/millenniumServices';
import type { Saw, Employee } from '../types/millennium';

interface SawFormProps {
  saw?: Saw;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const SawForm = ({
  saw,
  onDismiss,
  onSave,
  onDelete,
}: SawFormProps) => {
  const [formData, setFormData] = useState<Partial<Saw>>({
    name: '',
    description: '',
    operatorId: '',
    averageTimePerCut: undefined,
    lastServiceDate: '',
    serialNumber: '',
    assetNumber: '',
    lastBladeChange: '',
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
    if (saw) {
      setFormData({
        name: saw.name || '',
        description: saw.description || '',
        operatorId: saw.operatorId || '',
        averageTimePerCut: saw.averageTimePerCut,
        lastServiceDate: saw.lastServiceDate || '',
        serialNumber: saw.serialNumber || '',
        assetNumber: saw.assetNumber || '',
        lastBladeChange: saw.lastBladeChange || '',
      });
    }
    setError(null);
  }, [saw]);

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

      if (saw) {
        await sawService.update(saw.id, formData);
      } else {
        await sawService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save saw');
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

      if (saw) {
        await sawService.update(saw.id, formData);
      } else {
        await sawService.create(formData);
      }

      setFormData({
        name: '',
        description: '',
        operatorId: '',
        averageTimePerCut: undefined,
        lastServiceDate: '',
        serialNumber: '',
        assetNumber: '',
        lastBladeChange: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save saw');
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
    ...(saw && onDelete
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
        {saw ? 'Edit Saw' : 'New Saw'}
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
            label="Operator"
            placeholder="Select an operator"
            options={employeeOptions}
            selectedKey={formData.operatorId}
            onChange={(_, option) => setFormData({ ...formData, operatorId: option?.key as string })}
            disabled={saving || loading}
          />

          <TextField
            label="Average Time /Cut"
            type="number"
            value={formData.averageTimePerCut?.toString() || ''}
            onChange={(_, value) => setFormData({ ...formData, averageTimePerCut: value ? parseFloat(value) : undefined })}
            disabled={saving}
          />

          <DatePicker
            label="Last Service Date"
            value={formData.lastServiceDate ? new Date(formData.lastServiceDate) : undefined}
            onSelectDate={(date) => setFormData({ ...formData, lastServiceDate: date?.toISOString() || '' })}
            disabled={saving}
            formatDate={(date) => date?.toLocaleDateString() || ''}
          />

          <TextField
            label="Serial Number"
            value={formData.serialNumber}
            onChange={(_, value) => setFormData({ ...formData, serialNumber: value })}
            disabled={saving}
          />

          <TextField
            label="Asset Number"
            value={formData.assetNumber}
            onChange={(_, value) => setFormData({ ...formData, assetNumber: value })}
            disabled={saving}
          />

          <DatePicker
            label="Last Blade Change"
            value={formData.lastBladeChange ? new Date(formData.lastBladeChange) : undefined}
            onSelectDate={(date) => setFormData({ ...formData, lastBladeChange: date?.toISOString() || '' })}
            disabled={saving}
            formatDate={(date) => date?.toLocaleDateString() || ''}
          />
        </Stack>
      </Stack>
    </Stack>
  );
};
