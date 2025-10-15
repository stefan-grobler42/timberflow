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
} from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { vehicleService } from '../services';
import type { Vehicle } from '../types/millennium';

interface VehiclesFormProps {
  vehicle?: Vehicle;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const VehiclesForm = ({
  vehicle,
  onDismiss,
  onSave,
  onDelete,
}: VehiclesFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    name: '',
    make: '',
    model: '',
    registrationNumber: '',
    yearModel: '',
    approvedDriver: '',
    cofInOrder: false,
    licenseRenewalDate: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        registrationNumber: vehicle.registrationNumber || '',
        yearModel: vehicle.yearModel || '',
        approvedDriver: vehicle.approvedDriver || '',
        cofInOrder: vehicle.cofInOrder || false,
        licenseRenewalDate: vehicle.licenseRenewalDate || '',
      });
    }
    setError(null);
  }, [vehicle]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (vehicle) {
        await vehicleService.update(vehicle.id, formData);
      } else {
        await vehicleService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (vehicle) {
        await vehicleService.update(vehicle.id, formData);
      } else {
        await vehicleService.create(formData);
      }

      setFormData({
        name: '',
        make: '',
        model: '',
        registrationNumber: '',
        yearModel: '',
        approvedDriver: '',
        cofInOrder: false,
        licenseRenewalDate: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save vehicle');
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
    ...(vehicle && onDelete
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
        {vehicle ? 'Edit Vehicle' : 'New Vehicle'}
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
              text="Vehicle Details"
              iconProps={{ iconName: 'Car' }}
              onClick={() => setActiveTab('details')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'details' ? '#0078d4' : 'transparent',
                  color: activeTab === 'details' ? 'white' : '#323130',
                  fontWeight: activeTab === 'details' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'details' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'details' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Compliance"
              iconProps={{ iconName: 'CheckMark' }}
              onClick={() => setActiveTab('compliance')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'compliance' ? '#0078d4' : 'transparent',
                  color: activeTab === 'compliance' ? 'white' : '#323130',
                  fontWeight: activeTab === 'compliance' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'compliance' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'compliance' ? 'white' : '#323130',
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
                  label="Registration Number"
                  required
                  value={formData.registrationNumber}
                  onChange={(_, value) =>
                    setFormData({ ...formData, registrationNumber: value || '' })
                  }
                />

                <TextField
                  label="Approved Driver"
                  value={formData.approvedDriver}
                  onChange={(_, value) =>
                    setFormData({ ...formData, approvedDriver: value || '' })
                  }
                />
              </Stack>
            )}

            {activeTab === 'details' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Make"
                  required
                  value={formData.make}
                  onChange={(_, value) => setFormData({ ...formData, make: value || '' })}
                />

                <TextField
                  label="Model"
                  required
                  value={formData.model}
                  onChange={(_, value) => setFormData({ ...formData, model: value || '' })}
                />

                <TextField
                  label="Year Model"
                  required
                  value={formData.yearModel}
                  onChange={(_, value) => setFormData({ ...formData, yearModel: value || '' })}
                />
              </Stack>
            )}

            {activeTab === 'compliance' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <Checkbox
                  label="COF In Order"
                  checked={formData.cofInOrder}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, cofInOrder: checked || false })
                  }
                />

                <DatePicker
                  label="License Renewal Date"
                  value={formData.licenseRenewalDate ? new Date(formData.licenseRenewalDate) : undefined}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, licenseRenewalDate: date?.toISOString() || '' })
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
