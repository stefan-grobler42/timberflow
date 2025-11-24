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

  const timezoneOptions: IDropdownOption[] = [
    { key: 'South Africa Standard Time', text: 'South Africa (GMT+02:00)' },
    { key: 'GMT Standard Time', text: 'United Kingdom (GMT+00:00)' },
    { key: 'Central European Standard Time', text: 'Central Europe (GMT+01:00)' },
    { key: 'Eastern Standard Time', text: 'US Eastern (GMT-05:00)' },
    { key: 'Central Standard Time', text: 'US Central (GMT-06:00)' },
    { key: 'Mountain Standard Time', text: 'US Mountain (GMT-07:00)' },
    { key: 'Pacific Standard Time', text: 'US Pacific (GMT-08:00)' },
    { key: 'China Standard Time', text: 'China (GMT+08:00)' },
    { key: 'India Standard Time', text: 'India (GMT+05:30)' },
    { key: 'AUS Eastern Standard Time', text: 'Australia Eastern (GMT+10:00)' }
  ];

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

        <PivotItem headerText="Timezone">
          <Stack styles={{ root: { marginTop: 20, maxWidth: 600 } }} tokens={{ childrenGap: 20 }}>
            <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
              System Timezone Configuration
            </Text>
            <Text variant="small" styles={{ root: { color: '#666' } }}>
              Select the timezone for your organization. All dates and times in the system will be displayed in this timezone.
            </Text>

            <Dropdown
              label="Timezone"
              selectedKey={settings.timezone?.timeZoneId || 'South Africa Standard Time'}
              options={timezoneOptions}
              onChange={(_, option) => {
                const selectedOption = timezoneOptions.find(tz => tz.key === option?.key);
                setSettings(prev => ({
                  ...prev,
                  timezone: {
                    timeZoneId: option?.key as string,
                    displayName: selectedOption?.text || '',
                    utcOffset: selectedOption?.text.match(/GMT([+-]\d{2}:\d{2})/)?.[1] || '+02:00'
                  }
                }));
              }}
              required
            />

            <MessageBar messageBarType={MessageBarType.info}>
              Current Timezone: {settings.timezone?.displayName || 'South Africa (GMT+02:00)'}
            </MessageBar>

            <MessageBar messageBarType={MessageBarType.warning}>
              Important: Changing the timezone will affect how all dates and times are displayed throughout the system. 
              Existing data will not be modified, only the display format will change.
            </MessageBar>
          </Stack>
        </PivotItem>
      </Pivot>
    </Stack>
  );
};
