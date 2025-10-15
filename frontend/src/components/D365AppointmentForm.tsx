import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
  DatePicker,
} from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { d365AppointmentService } from '../services/d365Services';
import type { D365Appointment } from '../types/millennium';

interface D365AppointmentFormProps {
  appointment?: D365Appointment;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const D365AppointmentForm = ({
  appointment,
  onDismiss,
  onSave,
  onDelete,
}: D365AppointmentFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<D365Appointment>>({
    subject: '',
    location: '',
    scheduledStart: '',
    scheduledEnd: '',
    actualDurationMinutes: 0,
    scheduledDurationMinutes: 0,
    description: '',
    regardingObjectId: '',
    ownerId: '',
    stateCode: 0,
    statusCode: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (appointment) {
      setFormData({
        subject: appointment.subject || '',
        location: appointment.location || '',
        scheduledStart: appointment.scheduledStart || '',
        scheduledEnd: appointment.scheduledEnd || '',
        actualDurationMinutes: appointment.actualDurationMinutes || 0,
        scheduledDurationMinutes: appointment.scheduledDurationMinutes || 0,
        description: appointment.description || '',
        regardingObjectId: appointment.regardingObjectId || '',
        ownerId: appointment.ownerId || '',
        stateCode: appointment.stateCode || 0,
        statusCode: appointment.statusCode || 0,
      });
    }
    setError(null);
  }, [appointment]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (appointment) {
        await d365AppointmentService.update(appointment.id, formData);
      } else {
        await d365AppointmentService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save appointment');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (appointment) {
        await d365AppointmentService.update(appointment.id, formData);
      } else {
        await d365AppointmentService.create(formData);
      }

      setFormData({
        subject: '',
        location: '',
        scheduledStart: '',
        scheduledEnd: '',
        actualDurationMinutes: 0,
        scheduledDurationMinutes: 0,
        description: '',
        regardingObjectId: '',
        ownerId: '',
        stateCode: 0,
        statusCode: 0,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save appointment');
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
    ...(appointment && onDelete
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

  const parseDate = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { height: '100%' } }}>
      <Text variant="xxLarge" styles={{ root: { padding: '20px 20px 0 20px' } }}>
        {appointment ? 'Edit Appointment' : 'New Appointment'}
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
              text="Appointment Information"
              iconProps={{ iconName: 'Calendar' }}
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
              text="Scheduling"
              iconProps={{ iconName: 'DateTime' }}
              onClick={() => setActiveTab('scheduling')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'scheduling' ? '#0078d4' : 'transparent',
                  color: activeTab === 'scheduling' ? 'white' : '#323130',
                  fontWeight: activeTab === 'scheduling' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'scheduling' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'scheduling' ? 'white' : '#323130',
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
                    label="Location"
                    value={formData.location}
                    onChange={(_, value) => setFormData({ ...formData, location: value || '' })}
                  />

                  <TextField
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(_, value) =>
                      setFormData({ ...formData, description: value || '' })
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

            {activeTab === 'scheduling' && (
              <Stack
                tokens={{ childrenGap: 16 }}
                styles={{ root: { marginTop: 16, maxWidth: 600 } }}
              >
                <DatePicker
                  label="Scheduled Start"
                  value={parseDate(formData.scheduledStart)}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, scheduledStart: date?.toISOString() || '' })
                  }
                />

                <DatePicker
                  label="Scheduled End"
                  value={parseDate(formData.scheduledEnd)}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, scheduledEnd: date?.toISOString() || '' })
                  }
                />

                <TextField
                  label="Scheduled Duration (Minutes)"
                  type="number"
                  value={String(formData.scheduledDurationMinutes)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, scheduledDurationMinutes: Number(value) || 0 })
                  }
                />

                <TextField
                  label="Actual Duration (Minutes)"
                  type="number"
                  value={String(formData.actualDurationMinutes)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, actualDurationMinutes: Number(value) || 0 })
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
