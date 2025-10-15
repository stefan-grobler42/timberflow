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
import { deliveryService, employeeService } from '../services';
import type { Delivery, Employee } from '../types/millennium';

interface DeliveryFormProps {
  delivery?: Delivery;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const DeliveryForm = ({
  delivery,
  onDismiss,
  onSave,
  onDelete,
}: DeliveryFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<Delivery>>({
    deliveryNo: '',
    customer: '',
    orderNo: '',
    loadingDate: '',
    driver: '',
    helper1: '',
    helper2: '',
    helper3: '',
    helper4: '',
    helper5: '',
    loadMaster: '',
    dispatchManager: '',
    openKms: '',
    closeKms: '',
    arrivalTime: '',
    arrivalTimeSite: '',
    departureTime: '',
    departureTimeSite: '',
    partLoad: false,
    actualStart: '',
    actualEnd: '',
    actualDurationMinutes: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const employeeOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...employees.map((e) => ({ key: e.id, text: e.name })),
  ];

  useEffect(() => {
    if (delivery) {
      setFormData({
        deliveryNo: delivery.deliveryNo || '',
        customer: delivery.customer || '',
        orderNo: delivery.orderNo || '',
        loadingDate: delivery.loadingDate || '',
        driver: delivery.driver || '',
        helper1: delivery.helper1 || '',
        helper2: delivery.helper2 || '',
        helper3: delivery.helper3 || '',
        helper4: delivery.helper4 || '',
        helper5: delivery.helper5 || '',
        loadMaster: delivery.loadMaster || '',
        dispatchManager: delivery.dispatchManager || '',
        openKms: delivery.openKms || '',
        closeKms: delivery.closeKms || '',
        arrivalTime: delivery.arrivalTime || '',
        arrivalTimeSite: delivery.arrivalTimeSite || '',
        departureTime: delivery.departureTime || '',
        departureTimeSite: delivery.departureTimeSite || '',
        partLoad: delivery.partLoad || false,
        actualStart: delivery.actualStart || '',
        actualEnd: delivery.actualEnd || '',
        actualDurationMinutes: delivery.actualDurationMinutes || 0,
      });
    }
    setError(null);
  }, [delivery]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (delivery) {
        await deliveryService.update(delivery.id, formData);
      } else {
        await deliveryService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save delivery');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (delivery) {
        await deliveryService.update(delivery.id, formData);
      } else {
        await deliveryService.create(formData);
      }

      setFormData({
        deliveryNo: '',
        customer: '',
        orderNo: '',
        loadingDate: '',
        driver: '',
        helper1: '',
        helper2: '',
        helper3: '',
        helper4: '',
        helper5: '',
        loadMaster: '',
        dispatchManager: '',
        openKms: '',
        closeKms: '',
        arrivalTime: '',
        arrivalTimeSite: '',
        departureTime: '',
        departureTimeSite: '',
        partLoad: false,
        actualStart: '',
        actualEnd: '',
        actualDurationMinutes: 0,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save delivery');
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
    ...(delivery && onDelete
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
        {delivery ? 'Edit Delivery' : 'New Delivery'}
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
              text="Timing & Metrics"
              iconProps={{ iconName: 'Clock' }}
              onClick={() => setActiveTab('timing')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'timing' ? '#0078d4' : 'transparent',
                  color: activeTab === 'timing' ? 'white' : '#323130',
                  fontWeight: activeTab === 'timing' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'timing' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'timing' ? 'white' : '#323130',
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
                  label="Customer"
                  value={formData.customer}
                  onChange={(_, value) => setFormData({ ...formData, customer: value || '' })}
                />

                <TextField
                  label="Order No"
                  value={formData.orderNo}
                  onChange={(_, value) => setFormData({ ...formData, orderNo: value || '' })}
                />

                <DatePicker
                  label="Loading Date"
                  value={formData.loadingDate ? new Date(formData.loadingDate) : undefined}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, loadingDate: date?.toISOString() || '' })
                  }
                />

                <Checkbox
                  label="Part Load"
                  checked={formData.partLoad}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, partLoad: checked || false })
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

            {activeTab === 'timing' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16 } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Open Kms"
                    value={formData.openKms}
                    onChange={(_, value) => setFormData({ ...formData, openKms: value || '' })}
                  />

                  <TextField
                    label="Close Kms"
                    value={formData.closeKms}
                    onChange={(_, value) => setFormData({ ...formData, closeKms: value || '' })}
                  />

                  <DatePicker
                    label="Arrival Time"
                    value={formData.arrivalTime ? new Date(formData.arrivalTime) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, arrivalTime: date?.toISOString() || '' })
                    }
                  />

                  <DatePicker
                    label="Arrival Time Site"
                    value={formData.arrivalTimeSite ? new Date(formData.arrivalTimeSite) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, arrivalTimeSite: date?.toISOString() || '' })
                    }
                  />

                  <DatePicker
                    label="Departure Time"
                    value={formData.departureTime ? new Date(formData.departureTime) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, departureTime: date?.toISOString() || '' })
                    }
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <DatePicker
                    label="Departure Time Site"
                    value={formData.departureTimeSite ? new Date(formData.departureTimeSite) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, departureTimeSite: date?.toISOString() || '' })
                    }
                  />

                  <DatePicker
                    label="Actual Start"
                    value={formData.actualStart ? new Date(formData.actualStart) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, actualStart: date?.toISOString() || '' })
                    }
                  />

                  <DatePicker
                    label="Actual End"
                    value={formData.actualEnd ? new Date(formData.actualEnd) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, actualEnd: date?.toISOString() || '' })
                    }
                  />

                  <TextField
                    label="Actual Duration (minutes)"
                    type="number"
                    suffix="min"
                    value={String(formData.actualDurationMinutes || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, actualDurationMinutes: Number(value) || 0 })
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
