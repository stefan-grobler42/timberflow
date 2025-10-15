import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  Checkbox,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
  DatePicker,
  Dropdown,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { logisticsService, employeeService, vehicleService } from '../services';
import type { Logistics, Employee, Vehicle } from '../types/millennium';

interface LogisticsFormProps {
  logistics?: Logistics;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const LogisticsForm = ({
  logistics,
  onDismiss,
  onSave,
  onDelete,
}: LogisticsFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<Logistics>>({
    deliveryNo: '',
    description: '',
    dispatchManager: '',
    driver: '',
    helper1: '',
    helper2: '',
    helper3: '',
    helper4: '',
    helper5: '',
    loadMaster: '',
    security: '',
    trailer: '',
    vehicle: '',
    plannedLoadDate: '',
    newKmsTravelled: 0,
    newKmsTravelledDate: '',
    newKmsTravelledState: 0,
    newLoadCompleted: false,
    newLoadDuration: 0,
    newLoadDurationDate: '',
    newLoadDurationState: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    loadEmployees();
    loadVehicles();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadVehicles = async () => {
    try {
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const employeeOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...employees.map((e) => ({ key: e.id, text: e.name })),
  ];

  const vehicleOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...vehicles.map((v) => ({ key: v.id, text: v.name || v.registrationNumber })),
  ];

  useEffect(() => {
    if (logistics) {
      setFormData({
        deliveryNo: logistics.deliveryNo || '',
        description: logistics.description || '',
        dispatchManager: logistics.dispatchManager || '',
        driver: logistics.driver || '',
        helper1: logistics.helper1 || '',
        helper2: logistics.helper2 || '',
        helper3: logistics.helper3 || '',
        helper4: logistics.helper4 || '',
        helper5: logistics.helper5 || '',
        loadMaster: logistics.loadMaster || '',
        security: logistics.security || '',
        trailer: logistics.trailer || '',
        vehicle: logistics.vehicle || '',
        plannedLoadDate: logistics.plannedLoadDate || '',
        newKmsTravelled: logistics.newKmsTravelled || 0,
        newKmsTravelledDate: logistics.newKmsTravelledDate || '',
        newKmsTravelledState: logistics.newKmsTravelledState || 0,
        newLoadCompleted: logistics.newLoadCompleted || false,
        newLoadDuration: logistics.newLoadDuration || 0,
        newLoadDurationDate: logistics.newLoadDurationDate || '',
        newLoadDurationState: logistics.newLoadDurationState || 0,
      });
    }
    setError(null);
  }, [logistics]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (logistics) {
        await logisticsService.update(logistics.id, formData);
      } else {
        await logisticsService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save logistics');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (logistics) {
        await logisticsService.update(logistics.id, formData);
      } else {
        await logisticsService.create(formData);
      }

      setFormData({
        deliveryNo: '',
        description: '',
        dispatchManager: '',
        driver: '',
        helper1: '',
        helper2: '',
        helper3: '',
        helper4: '',
        helper5: '',
        loadMaster: '',
        security: '',
        trailer: '',
        vehicle: '',
        plannedLoadDate: '',
        newKmsTravelled: 0,
        newKmsTravelledDate: '',
        newKmsTravelledState: 0,
        newLoadCompleted: false,
        newLoadDuration: 0,
        newLoadDurationDate: '',
        newLoadDurationState: 0,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save logistics');
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
    ...(logistics && onDelete
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
        {logistics ? 'Edit Logistics' : 'New Logistics'}
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
              text="Basic Info"
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
              text="Personnel"
              iconProps={{ iconName: 'People' }}
              onClick={() => setActiveTab('personnel')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'personnel' ? '#0078d4' : 'transparent',
                  color: activeTab === 'personnel' ? 'white' : '#323130',
                  fontWeight: activeTab === 'personnel' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'personnel' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'personnel' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Vehicle & Equipment"
              iconProps={{ iconName: 'Car' }}
              onClick={() => setActiveTab('vehicle')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'vehicle' ? '#0078d4' : 'transparent',
                  color: activeTab === 'vehicle' ? 'white' : '#323130',
                  fontWeight: activeTab === 'vehicle' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'vehicle' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'vehicle' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Metrics"
              iconProps={{ iconName: 'Chart' }}
              onClick={() => setActiveTab('metrics')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'metrics' ? '#0078d4' : 'transparent',
                  color: activeTab === 'metrics' ? 'white' : '#323130',
                  fontWeight: activeTab === 'metrics' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'metrics' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'metrics' ? 'white' : '#323130',
                },
              }}
            />
          </Stack>

          <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '20px 0' } }}>
            {activeTab === 'basic' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16, maxWidth: 600 } }}>
                <TextField
                  label="Delivery No"
                  value={formData.deliveryNo}
                  onChange={(_, value) => setFormData({ ...formData, deliveryNo: value || '' })}
                />

                <TextField
                  label="Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(_, value) => setFormData({ ...formData, description: value || '' })}
                />

                <DatePicker
                  label="Planned Load Date"
                  value={formData.plannedLoadDate ? new Date(formData.plannedLoadDate) : undefined}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, plannedLoadDate: date?.toISOString() || '' })
                  }
                />

                <Checkbox
                  label="Load Completed"
                  checked={formData.newLoadCompleted}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, newLoadCompleted: checked || false })
                  }
                />
              </Stack>
            )}

            {activeTab === 'personnel' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16 } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Dispatch Manager"
                    value={formData.dispatchManager}
                    onChange={(_, value) =>
                      setFormData({ ...formData, dispatchManager: value || '' })
                    }
                  />

                  <Dropdown
                    label="Driver"
                    options={employeeOptions}
                    selectedKey={formData.driver || ''}
                    onChange={(_, option) =>
                      setFormData({ ...formData, driver: option?.key as string || '' })
                    }
                  />

                  <TextField
                    label="Load Master"
                    value={formData.loadMaster}
                    onChange={(_, value) => setFormData({ ...formData, loadMaster: value || '' })}
                  />

                  <TextField
                    label="Security"
                    value={formData.security}
                    onChange={(_, value) => setFormData({ ...formData, security: value || '' })}
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Helper 1"
                    value={formData.helper1}
                    onChange={(_, value) => setFormData({ ...formData, helper1: value || '' })}
                  />

                  <TextField
                    label="Helper 2"
                    value={formData.helper2}
                    onChange={(_, value) => setFormData({ ...formData, helper2: value || '' })}
                  />

                  <TextField
                    label="Helper 3"
                    value={formData.helper3}
                    onChange={(_, value) => setFormData({ ...formData, helper3: value || '' })}
                  />

                  <TextField
                    label="Helper 4"
                    value={formData.helper4}
                    onChange={(_, value) => setFormData({ ...formData, helper4: value || '' })}
                  />

                  <TextField
                    label="Helper 5"
                    value={formData.helper5}
                    onChange={(_, value) => setFormData({ ...formData, helper5: value || '' })}
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'vehicle' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16, maxWidth: 600 } }}>
                <Dropdown
                  label="Vehicle"
                  options={vehicleOptions}
                  selectedKey={formData.vehicle || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, vehicle: option?.key as string || '' })
                  }
                />

                <Dropdown
                  label="Trailer"
                  options={vehicleOptions}
                  selectedKey={formData.trailer || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, trailer: option?.key as string || '' })
                  }
                />
              </Stack>
            )}

            {activeTab === 'metrics' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16 } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Kms Travelled"
                    type="number"
                    suffix="km"
                    value={String(formData.newKmsTravelled || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, newKmsTravelled: Number(value) || 0 })
                    }
                  />

                  <DatePicker
                    label="Kms Travelled Date"
                    value={formData.newKmsTravelledDate ? new Date(formData.newKmsTravelledDate) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, newKmsTravelledDate: date?.toISOString() || '' })
                    }
                  />

                  <TextField
                    label="Kms Travelled State"
                    type="number"
                    value={String(formData.newKmsTravelledState || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, newKmsTravelledState: Number(value) || 0 })
                    }
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Load Duration (minutes)"
                    type="number"
                    suffix="min"
                    value={String(formData.newLoadDuration || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, newLoadDuration: Number(value) || 0 })
                    }
                  />

                  <DatePicker
                    label="Load Duration Date"
                    value={formData.newLoadDurationDate ? new Date(formData.newLoadDurationDate) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, newLoadDurationDate: date?.toISOString() || '' })
                    }
                  />

                  <TextField
                    label="Load Duration State"
                    type="number"
                    value={String(formData.newLoadDurationState || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, newLoadDurationState: Number(value) || 0 })
                    }
                  />
                </Stack>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
