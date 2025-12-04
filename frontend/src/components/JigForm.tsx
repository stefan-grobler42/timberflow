import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  CommandBar,
  Dropdown,
  SwatchColorPicker,
  Label,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption, IColorCellProps } from '@fluentui/react';
import { jigService, employeeService } from '../services/millenniumServices';
import type { Jig, Employee } from '../types/millennium';

const teamColourOptions: IColorCellProps[] = [
  { id: '#4A90A4', label: 'Carolina Blue', color: '#4A90A4' },
  { id: '#2E7D32', label: 'Forest Green', color: '#2E7D32' },
  { id: '#FF5722', label: 'Deep Orange', color: '#FF5722' },
  { id: '#9C27B0', label: 'Purple', color: '#9C27B0' },
  { id: '#F44336', label: 'Red', color: '#F44336' },
  { id: '#2196F3', label: 'Blue', color: '#2196F3' },
  { id: '#FFC107', label: 'Amber', color: '#FFC107' },
  { id: '#009688', label: 'Teal', color: '#009688' },
  { id: '#607D8B', label: 'Blue Grey', color: '#607D8B' },
  { id: '#795548', label: 'Brown', color: '#795548' },
  { id: '#E91E63', label: 'Pink', color: '#E91E63' },
  { id: '#3F51B5', label: 'Indigo', color: '#3F51B5' },
];

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
    averageEfinks: 80,
    displayOrder: 0,
    colour: '#4A90A4',
  });
  const [_employees, setEmployees] = useState<Employee[]>([]);
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
        averageEfinks: jig.averageEfinks ?? 80,
        displayOrder: jig.displayOrder ?? 0,
        colour: jig.colour || '#4A90A4',
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
        averageEfinks: 80,
        displayOrder: 0,
        colour: '#4A90A4',
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

          <TextField
            label="Average E-Finks per Day"
            type="number"
            min={1}
            step={0.01}
            description="The average E-Finks capacity this team can complete in a day (default: 80). Used for capacity planning."
            value={formData.averageEfinks !== undefined ? formData.averageEfinks.toFixed(2) : '80.00'}
            onChange={(_, value) => {
              const parsed = value ? parseFloat(value) : 80;
              setFormData({ ...formData, averageEfinks: Math.max(1, parsed) });
            }}
            disabled={saving}
          />

          <TextField
            label="Display Order"
            type="number"
            min={0}
            step={1}
            description="The order in which this team appears in the planner (lower numbers appear first)."
            value={formData.displayOrder?.toString() || '0'}
            onChange={(_, value) => {
              const parsed = value ? parseInt(value, 10) : 0;
              setFormData({ ...formData, displayOrder: Math.max(0, parsed) });
            }}
            disabled={saving}
          />

          <Stack tokens={{ childrenGap: 4 }}>
            <Label>Team Colour</Label>
            <Text variant="small" styles={{ root: { color: '#666', marginBottom: 8 } }}>
              Select a colour for visual identification in the production planner.
            </Text>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
              <SwatchColorPicker
                columnCount={6}
                cellShape="square"
                cellHeight={32}
                cellWidth={32}
                cellBorderWidth={2}
                colorCells={teamColourOptions}
                selectedId={formData.colour}
                onChange={(_, __, colour) => setFormData({ ...formData, colour: colour || '#4A90A4' })}
                disabled={saving}
              />
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <div 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    backgroundColor: formData.colour || '#4A90A4',
                    borderRadius: 4,
                    border: '2px solid #ccc'
                  }} 
                />
                <Text variant="small" styles={{ root: { fontFamily: 'monospace' } }}>
                  {formData.colour || '#4A90A4'}
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
