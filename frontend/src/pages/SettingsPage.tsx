import React, { useState, useEffect } from 'react';
import { Stack, Text, Spinner, MessageBar, MessageBarType, PrimaryButton, TextField, Dropdown, Pivot, PivotItem } from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { systemSettingsService } from '../services/systemSettingsService';
import type { SystemSettings, StaffWorkingHours } from '../services/systemSettingsService';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await systemSettingsService.getSettings();
      
      // Initialize with defaults if not set
      if (!data.financialYear) {
        data.financialYear = { startMonth: 3, startDay: 1 };
      }
      if (!data.workingHours) {
        data.workingHours = {
          officeStaff: {
            monday: '08:00-16:00',
            tuesday: '08:00-16:00',
            wednesday: '08:00-16:00',
            thursday: '08:00-16:00',
            friday: '08:00-16:00',
            saturday: '',
            sunday: ''
          },
          factoryStaff: {
            monday: '07:00-17:00',
            tuesday: '07:00-17:00',
            wednesday: '07:00-17:00',
            thursday: '07:00-17:00',
            friday: '07:00-16:00',
            saturday: '',
            sunday: ''
          }
        };
      }
      
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: MessageBarType.error, text: 'Failed to load settings' });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await systemSettingsService.updateSettings(settings);
      setMessage({ type: MessageBarType.success, text: 'Settings saved successfully' });
      setSaving(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: MessageBarType.error, text: 'Failed to save settings' });
      setSaving(false);
    }
  };

  const monthOptions: IDropdownOption[] = [
    { key: 1, text: 'January' },
    { key: 2, text: 'February' },
    { key: 3, text: 'March' },
    { key: 4, text: 'April' },
    { key: 5, text: 'May' },
    { key: 6, text: 'June' },
    { key: 7, text: 'July' },
    { key: 8, text: 'August' },
    { key: 9, text: 'September' },
    { key: 10, text: 'October' },
    { key: 11, text: 'November' },
    { key: 12, text: 'December' }
  ];

  const dayOptions: IDropdownOption[] = Array.from({ length: 31 }, (_, i) => ({
    key: i + 1,
    text: (i + 1).toString()
  }));

  const updateStaffHours = (staffType: 'officeStaff' | 'factoryStaff', day: keyof StaffWorkingHours, value: string) => {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [staffType]: {
          ...(prev.workingHours?.[staffType] || {}),
          [day]: value
        }
      }
    }));
  };

  if (loading) {
    return (
      <Stack verticalAlign="center" horizontalAlign="center" styles={{ root: { height: '100vh' } }}>
        <Spinner label="Loading settings..." size={3} />
      </Stack>
    );
  }

  return (
    <Stack styles={{ root: { height: '100%' } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { marginBottom: 20 } }}>
        <Text variant="xxLarge">System Settings</Text>
        <PrimaryButton 
          text="Save Settings" 
          iconProps={{ iconName: 'Save' }}
          onClick={handleSave}
          disabled={saving}
        />
      </Stack>

      {message && (
        <MessageBar 
          messageBarType={message.type} 
          onDismiss={() => setMessage(null)}
          styles={{ root: { marginBottom: 20 } }}
        >
          {message.text}
        </MessageBar>
      )}

      <Pivot>
        <PivotItem headerText="Financial Year">
          <Stack styles={{ root: { marginTop: 20, maxWidth: 600 } }} tokens={{ childrenGap: 20 }}>
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              Financial Year Configuration
            </Text>
            <Text variant="small" styles={{ root: { color: '#666' } }}>
              Define when your financial year starts. This will be used for financial reporting and year-end calculations.
            </Text>

            <Dropdown
              label="Start Month"
              selectedKey={settings.financialYear?.startMonth}
              options={monthOptions}
              onChange={(_, option) => {
                setSettings(prev => ({
                  ...prev,
                  financialYear: {
                    ...prev.financialYear!,
                    startMonth: option?.key as number
                  }
                }));
              }}
              required
            />

            <Dropdown
              label="Start Day"
              selectedKey={settings.financialYear?.startDay}
              options={dayOptions}
              onChange={(_, option) => {
                setSettings(prev => ({
                  ...prev,
                  financialYear: {
                    ...prev.financialYear!,
                    startDay: option?.key as number
                  }
                }));
              }}
              required
            />

            <MessageBar messageBarType={MessageBarType.info}>
              Current Configuration: Financial year runs from {' '}
              {monthOptions.find(m => m.key === settings.financialYear?.startMonth)?.text} {settings.financialYear?.startDay} to {' '}
              {monthOptions.find(m => m.key === (settings.financialYear?.startMonth === 1 ? 12 : (settings.financialYear?.startMonth || 3) - 1))?.text} {' '}
              {settings.financialYear?.startMonth === 3 ? '28/29 (Feb)' : settings.financialYear?.startDay}
            </MessageBar>
          </Stack>
        </PivotItem>

        <PivotItem headerText="Working Hours">
          <Stack styles={{ root: { marginTop: 20 } }} tokens={{ childrenGap: 30 }}>
            <Stack tokens={{ childrenGap: 15 }}>
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                Office Staff Working Hours
              </Text>
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Format: HH:MM-HH:MM (e.g., 08:00-16:00). Leave blank for non-working days.
              </Text>

              <Stack horizontal tokens={{ childrenGap: 10 }} wrap>
                <TextField 
                  label="Monday" 
                  value={settings.workingHours?.officeStaff?.monday || ''}
                  onChange={(_, value) => updateStaffHours('officeStaff', 'monday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="08:00-16:00"
                />
                <TextField 
                  label="Tuesday" 
                  value={settings.workingHours?.officeStaff?.tuesday || ''}
                  onChange={(_, value) => updateStaffHours('officeStaff', 'tuesday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="08:00-16:00"
                />
                <TextField 
                  label="Wednesday" 
                  value={settings.workingHours?.officeStaff?.wednesday || ''}
                  onChange={(_, value) => updateStaffHours('officeStaff', 'wednesday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="08:00-16:00"
                />
                <TextField 
                  label="Thursday" 
                  value={settings.workingHours?.officeStaff?.thursday || ''}
                  onChange={(_, value) => updateStaffHours('officeStaff', 'thursday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="08:00-16:00"
                />
                <TextField 
                  label="Friday" 
                  value={settings.workingHours?.officeStaff?.friday || ''}
                  onChange={(_, value) => updateStaffHours('officeStaff', 'friday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="08:00-16:00"
                />
                <TextField 
                  label="Saturday" 
                  value={settings.workingHours?.officeStaff?.saturday || ''}
                  onChange={(_, value) => updateStaffHours('officeStaff', 'saturday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="(not working)"
                />
                <TextField 
                  label="Sunday" 
                  value={settings.workingHours?.officeStaff?.sunday || ''}
                  onChange={(_, value) => updateStaffHours('officeStaff', 'sunday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="(not working)"
                />
              </Stack>
            </Stack>

            <Stack tokens={{ childrenGap: 15 }}>
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                Factory Staff Working Hours
              </Text>
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Format: HH:MM-HH:MM (e.g., 07:00-17:00). Leave blank for non-working days.
              </Text>

              <Stack horizontal tokens={{ childrenGap: 10 }} wrap>
                <TextField 
                  label="Monday" 
                  value={settings.workingHours?.factoryStaff?.monday || ''}
                  onChange={(_, value) => updateStaffHours('factoryStaff', 'monday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="07:00-17:00"
                />
                <TextField 
                  label="Tuesday" 
                  value={settings.workingHours?.factoryStaff?.tuesday || ''}
                  onChange={(_, value) => updateStaffHours('factoryStaff', 'tuesday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="07:00-17:00"
                />
                <TextField 
                  label="Wednesday" 
                  value={settings.workingHours?.factoryStaff?.wednesday || ''}
                  onChange={(_, value) => updateStaffHours('factoryStaff', 'wednesday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="07:00-17:00"
                />
                <TextField 
                  label="Thursday" 
                  value={settings.workingHours?.factoryStaff?.thursday || ''}
                  onChange={(_, value) => updateStaffHours('factoryStaff', 'thursday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="07:00-17:00"
                />
                <TextField 
                  label="Friday" 
                  value={settings.workingHours?.factoryStaff?.friday || ''}
                  onChange={(_, value) => updateStaffHours('factoryStaff', 'friday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="07:00-16:00"
                />
                <TextField 
                  label="Saturday" 
                  value={settings.workingHours?.factoryStaff?.saturday || ''}
                  onChange={(_, value) => updateStaffHours('factoryStaff', 'saturday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="(not working)"
                />
                <TextField 
                  label="Sunday" 
                  value={settings.workingHours?.factoryStaff?.sunday || ''}
                  onChange={(_, value) => updateStaffHours('factoryStaff', 'sunday', value || '')}
                  styles={{ root: { width: 150 } }}
                  placeholder="(not working)"
                />
              </Stack>
            </Stack>
          </Stack>
        </PivotItem>
      </Pivot>
    </Stack>
  );
};
