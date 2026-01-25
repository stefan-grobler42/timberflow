import React, { useState, useEffect } from 'react';
import { Stack, Text, Spinner, MessageBar, MessageBarType, PrimaryButton, TextField, Dropdown, Pivot, PivotItem, Toggle } from '@fluentui/react';
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

            <Stack tokens={{ childrenGap: 15 }} styles={{ root: { marginTop: 20 } }}>
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                Break Times
              </Text>
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Define standard break times for the factory. Format: HH:MM (24-hour time).
              </Text>

              <Stack tokens={{ childrenGap: 15 }}>
                <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
                  <TextField 
                    label="Tea Break (Morning) - Start" 
                    value={settings.breakTimes?.teaMorning?.start || '09:00'}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimes: {
                          ...prev.breakTimes,
                          teaMorning: {
                            start: value || '09:00',
                            end: prev.breakTimes?.teaMorning?.end || '09:15'
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="09:00"
                  />
                  <TextField 
                    label="End" 
                    value={settings.breakTimes?.teaMorning?.end || '09:15'}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimes: {
                          ...prev.breakTimes,
                          teaMorning: {
                            start: prev.breakTimes?.teaMorning?.start || '09:00',
                            end: value || '09:15'
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="09:15"
                  />
                </Stack>

                <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
                  <TextField 
                    label="Lunch Break - Start" 
                    value={settings.breakTimes?.lunch?.start || '12:00'}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimes: {
                          ...prev.breakTimes,
                          lunch: {
                            start: value || '12:00',
                            end: prev.breakTimes?.lunch?.end || '12:30'
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="12:00"
                  />
                  <TextField 
                    label="End" 
                    value={settings.breakTimes?.lunch?.end || '12:30'}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimes: {
                          ...prev.breakTimes,
                          lunch: {
                            start: prev.breakTimes?.lunch?.start || '12:00',
                            end: value || '12:30'
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="12:30"
                  />
                </Stack>

                <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
                  <TextField 
                    label="Tea Break (Afternoon) - Start" 
                    value={settings.breakTimes?.teaAfternoon?.start || '14:30'}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimes: {
                          ...prev.breakTimes,
                          teaAfternoon: {
                            start: value || '14:30',
                            end: prev.breakTimes?.teaAfternoon?.end || '14:45'
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="14:30"
                  />
                  <TextField 
                    label="End" 
                    value={settings.breakTimes?.teaAfternoon?.end || '14:45'}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimes: {
                          ...prev.breakTimes,
                          teaAfternoon: {
                            start: prev.breakTimes?.teaAfternoon?.start || '14:30',
                            end: value || '14:45'
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="14:45"
                  />
                </Stack>

                <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
                  <TextField 
                    label="Dinner Break (Overtime only) - Start" 
                    value={settings.breakTimes?.dinnerOvertime?.start || '17:00'}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimes: {
                          ...prev.breakTimes,
                          dinnerOvertime: {
                            start: value || '17:00',
                            end: prev.breakTimes?.dinnerOvertime?.end || '17:30'
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="17:00"
                  />
                  <TextField 
                    label="End" 
                    value={settings.breakTimes?.dinnerOvertime?.end || '17:30'}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimes: {
                          ...prev.breakTimes,
                          dinnerOvertime: {
                            start: prev.breakTimes?.dinnerOvertime?.start || '17:00',
                            end: value || '17:30'
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="17:30"
                  />
                </Stack>
              </Stack>

              <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginTop: 10 } }}>
                Note: Dinner break only applies during overtime hours. Standard working hours end at 17:00.
              </MessageBar>
            </Stack>

            <Stack tokens={{ childrenGap: 15 }} styles={{ root: { marginTop: 20 } }}>
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                Break Times (Weekends)
              </Text>
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Define break times for weekend work. Format: HH:MM (24-hour time). Leave blank for no breaks.
              </Text>

              <Stack tokens={{ childrenGap: 15 }}>
                <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
                  <TextField 
                    label="Tea Break (Morning) - Start" 
                    value={settings.breakTimesWeekend?.teaMorning?.start || ''}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimesWeekend: {
                          ...prev.breakTimesWeekend,
                          teaMorning: {
                            start: value || '',
                            end: prev.breakTimesWeekend?.teaMorning?.end || ''
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="09:00"
                  />
                  <TextField 
                    label="End" 
                    value={settings.breakTimesWeekend?.teaMorning?.end || ''}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimesWeekend: {
                          ...prev.breakTimesWeekend,
                          teaMorning: {
                            start: prev.breakTimesWeekend?.teaMorning?.start || '',
                            end: value || ''
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="09:15"
                  />
                </Stack>

                <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
                  <TextField 
                    label="Lunch Break - Start" 
                    value={settings.breakTimesWeekend?.lunch?.start || ''}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimesWeekend: {
                          ...prev.breakTimesWeekend,
                          lunch: {
                            start: value || '',
                            end: prev.breakTimesWeekend?.lunch?.end || ''
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="12:00"
                  />
                  <TextField 
                    label="End" 
                    value={settings.breakTimesWeekend?.lunch?.end || ''}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimesWeekend: {
                          ...prev.breakTimesWeekend,
                          lunch: {
                            start: prev.breakTimesWeekend?.lunch?.start || '',
                            end: value || ''
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="12:30"
                  />
                </Stack>

                <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="end">
                  <TextField 
                    label="Tea Break (Afternoon) - Start" 
                    value={settings.breakTimesWeekend?.teaAfternoon?.start || ''}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimesWeekend: {
                          ...prev.breakTimesWeekend,
                          teaAfternoon: {
                            start: value || '',
                            end: prev.breakTimesWeekend?.teaAfternoon?.end || ''
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="14:30"
                  />
                  <TextField 
                    label="End" 
                    value={settings.breakTimesWeekend?.teaAfternoon?.end || ''}
                    onChange={(_, value) => {
                      setSettings(prev => ({
                        ...prev,
                        breakTimesWeekend: {
                          ...prev.breakTimesWeekend,
                          teaAfternoon: {
                            start: prev.breakTimesWeekend?.teaAfternoon?.start || '',
                            end: value || ''
                          }
                        }
                      }));
                    }}
                    styles={{ root: { width: 150 } }}
                    placeholder="14:45"
                  />
                </Stack>
              </Stack>

              <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginTop: 10 } }}>
                Weekend breaks are optional. Leave blank if no breaks are required during weekend work.
              </MessageBar>
            </Stack>

            <Stack tokens={{ childrenGap: 15 }} styles={{ root: { marginTop: 20 } }}>
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                Overtime Defaults (Weekdays)
              </Text>
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Configure default overtime settings for weekday production scheduling.
              </Text>

              <Stack horizontal tokens={{ childrenGap: 20 }} wrap verticalAlign="end">
                <Toggle
                  label="Default OT Enabled"
                  checked={settings.overtimeDefaults?.defaultOvertimeEnabled || false}
                  onChange={(_, checked) => {
                    setSettings(prev => ({
                      ...prev,
                      overtimeDefaults: {
                        ...prev.overtimeDefaults,
                        defaultOvertimeEnabled: checked || false
                      } as any
                    }));
                  }}
                  styles={{ root: { marginBottom: 5 } }}
                />
                <TextField 
                  label="Late OT End Time" 
                  value={settings.overtimeDefaults?.defaultLateOtEndTime || '21:00'}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      overtimeDefaults: {
                        ...prev.overtimeDefaults,
                        defaultLateOtEndTime: value || '21:00'
                      } as any
                    }));
                  }}
                  styles={{ root: { width: 150 } }}
                  placeholder="21:00"
                />
                <Toggle
                  label="Allow Early Start OT"
                  checked={settings.overtimeDefaults?.allowEarlyStartOt || false}
                  onChange={(_, checked) => {
                    setSettings(prev => ({
                      ...prev,
                      overtimeDefaults: {
                        ...prev.overtimeDefaults,
                        allowEarlyStartOt: checked || false
                      } as any
                    }));
                  }}
                  styles={{ root: { marginBottom: 5 } }}
                />
                <TextField 
                  label="Early Start Time" 
                  value={settings.overtimeDefaults?.defaultEarlyStartTime || '06:00'}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      overtimeDefaults: {
                        ...prev.overtimeDefaults,
                        defaultEarlyStartTime: value || '06:00'
                      } as any
                    }));
                  }}
                  styles={{ root: { width: 150 } }}
                  placeholder="06:00"
                />
              </Stack>
            </Stack>

            <Stack tokens={{ childrenGap: 15 }} styles={{ root: { marginTop: 20 } }}>
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                Overtime Defaults (Weekends)
              </Text>
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Configure default weekend work settings for production scheduling.
              </Text>

              <Stack horizontal tokens={{ childrenGap: 20 }} wrap verticalAlign="end">
                <Toggle
                  label="Default Weekend Work Enabled"
                  checked={settings.overtimeDefaultsWeekend?.defaultWeekendWorkEnabled || false}
                  onChange={(_, checked) => {
                    setSettings(prev => ({
                      ...prev,
                      overtimeDefaultsWeekend: {
                        ...prev.overtimeDefaultsWeekend,
                        defaultWeekendWorkEnabled: checked || false
                      } as any
                    }));
                  }}
                  styles={{ root: { marginBottom: 5 } }}
                />
                <TextField 
                  label="Default Start Time" 
                  value={settings.overtimeDefaultsWeekend?.defaultStartTime || ''}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      overtimeDefaultsWeekend: {
                        ...prev.overtimeDefaultsWeekend,
                        defaultStartTime: value || ''
                      } as any
                    }));
                  }}
                  styles={{ root: { width: 150 } }}
                  placeholder="07:00"
                />
                <TextField 
                  label="Default End Time" 
                  value={settings.overtimeDefaultsWeekend?.defaultEndTime || ''}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      overtimeDefaultsWeekend: {
                        ...prev.overtimeDefaultsWeekend,
                        defaultEndTime: value || ''
                      } as any
                    }));
                  }}
                  styles={{ root: { width: 150 } }}
                  placeholder="15:00"
                />
              </Stack>

              <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginTop: 10 } }}>
                These defaults apply when enabling weekend work in the Production Planner.
              </MessageBar>
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

        <PivotItem headerText="Production Scheduling">
          <Stack styles={{ root: { marginTop: 20 } }} tokens={{ childrenGap: 30 }}>
            <Stack tokens={{ childrenGap: 15 }}>
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                General Settings
              </Text>
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Configure general production scheduling parameters.
              </Text>

              <Stack horizontal tokens={{ childrenGap: 20 }} wrap>
                <TextField 
                  label="Buffer Between Jobs (minutes)" 
                  type="number"
                  value={settings.productionScheduling?.general?.bufferMinutes?.toString() || ''}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      productionScheduling: {
                        ...prev.productionScheduling,
                        general: {
                          ...prev.productionScheduling?.general,
                          bufferMinutes: parseInt(value || '0', 10)
                        } as any
                      }
                    }));
                  }}
                  styles={{ root: { width: 200 } }}
                />
                <TextField 
                  label="Minimum Job Duration (minutes)" 
                  type="number"
                  value={settings.productionScheduling?.general?.minJobDuration?.toString() || ''}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      productionScheduling: {
                        ...prev.productionScheduling,
                        general: {
                          ...prev.productionScheduling?.general,
                          minJobDuration: parseInt(value || '0', 10)
                        } as any
                      }
                    }));
                  }}
                  styles={{ root: { width: 200 } }}
                />
                <TextField 
                  label="Duration Rounding (minutes)" 
                  type="number"
                  value={settings.productionScheduling?.general?.durationRoundingIncrement?.toString() || ''}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      productionScheduling: {
                        ...prev.productionScheduling,
                        general: {
                          ...prev.productionScheduling?.general,
                          durationRoundingIncrement: parseInt(value || '0', 10)
                        } as any
                      }
                    }));
                  }}
                  styles={{ root: { width: 200 } }}
                />
              </Stack>

              <MessageBar messageBarType={MessageBarType.info} styles={{ root: { marginTop: 10 } }}>
                Note: E-Fink duration is automatically calculated from the Team's Maximum E-Finks field.
              </MessageBar>
            </Stack>

            <Stack tokens={{ childrenGap: 15 }}>
              <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                UI/Display Settings
              </Text>
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Configure display settings for the production planner interface.
              </Text>

              <Stack horizontal tokens={{ childrenGap: 20 }} wrap>
                <TextField 
                  label="Pixels Per Minute" 
                  type="number"
                  value={settings.productionScheduling?.uiDisplay?.pixelsPerMinute?.toString() || ''}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      productionScheduling: {
                        ...prev.productionScheduling,
                        uiDisplay: {
                          ...prev.productionScheduling?.uiDisplay,
                          pixelsPerMinute: parseInt(value || '0', 10)
                        } as any
                      }
                    }));
                  }}
                  styles={{ root: { width: 200 } }}
                />
                <TextField 
                  label="Visible Hours Before Shift" 
                  type="number"
                  value={settings.productionScheduling?.uiDisplay?.visibleHoursBeforeShift?.toString() || ''}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      productionScheduling: {
                        ...prev.productionScheduling,
                        uiDisplay: {
                          ...prev.productionScheduling?.uiDisplay,
                          visibleHoursBeforeShift: parseInt(value || '0', 10)
                        } as any
                      }
                    }));
                  }}
                  styles={{ root: { width: 200 } }}
                />
                <TextField 
                  label="Visible Hours After Shift" 
                  type="number"
                  value={settings.productionScheduling?.uiDisplay?.visibleHoursAfterShift?.toString() || ''}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      productionScheduling: {
                        ...prev.productionScheduling,
                        uiDisplay: {
                          ...prev.productionScheduling?.uiDisplay,
                          visibleHoursAfterShift: parseInt(value || '0', 10)
                        } as any
                      }
                    }));
                  }}
                  styles={{ root: { width: 200 } }}
                />
                <TextField 
                  label="Day Header Height (pixels)" 
                  type="number"
                  value={settings.productionScheduling?.uiDisplay?.dayHeaderHeight?.toString() || ''}
                  onChange={(_, value) => {
                    setSettings(prev => ({
                      ...prev,
                      productionScheduling: {
                        ...prev.productionScheduling,
                        uiDisplay: {
                          ...prev.productionScheduling?.uiDisplay,
                          dayHeaderHeight: parseInt(value || '0', 10)
                        } as any
                      }
                    }));
                  }}
                  styles={{ root: { width: 200 } }}
                />
              </Stack>
            </Stack>
          </Stack>
        </PivotItem>
      </Pivot>
    </Stack>
  );
};
