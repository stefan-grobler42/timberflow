import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
  Dropdown,
  DatePicker,
  Label,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { d365ContactService, accountService } from '../services/d365Services';
import type { D365Contact, Account } from '../types/millennium';

interface D365ContactFormProps {
  contact?: D365Contact;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const D365ContactForm = ({
  contact,
  onDismiss,
  onSave,
  onDelete,
}: D365ContactFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [formData, setFormData] = useState<Partial<D365Contact>>({
    salutation: '',
    firstName: '',
    middleName: '',
    lastName: '',
    fullName: '',
    emailAddress1: '',
    telephone1: '',
    telephone2: '',
    telephone3: '',
    mobilePhone: '',
    fax: '',
    jobTitle: '',
    parentCustomerId: '',
    address1AddressTypeCode: undefined,
    address1Name: '',
    address1Line1: '',
    address1Line2: '',
    address1Line3: '',
    address1City: '',
    address1StateOrProvince: '',
    address1PostalCode: '',
    address1Country: '',
    address1Telephone1: '',
    description: '',
    department: '',
    managerName: '',
    managerPhone: '',
    role: '',
    assistantName: '',
    assistantPhone: '',
    genderCode: undefined,
    familyStatusCode: undefined,
    spousesPartner: '',
    birthDate: undefined,
    anniversary: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (contact) {
      setFormData({
        salutation: contact.salutation || '',
        firstName: contact.firstName || '',
        middleName: contact.middleName || '',
        lastName: contact.lastName || '',
        fullName: contact.fullName || '',
        emailAddress1: contact.emailAddress1 || '',
        telephone1: contact.telephone1 || '',
        telephone2: contact.telephone2 || '',
        telephone3: contact.telephone3 || '',
        mobilePhone: contact.mobilePhone || '',
        fax: contact.fax || '',
        jobTitle: contact.jobTitle || '',
        parentCustomerId: contact.parentCustomerId || '',
        address1AddressTypeCode: contact.address1AddressTypeCode,
        address1Name: contact.address1Name || '',
        address1Line1: contact.address1Line1 || '',
        address1Line2: contact.address1Line2 || '',
        address1Line3: contact.address1Line3 || '',
        address1City: contact.address1City || '',
        address1StateOrProvince: contact.address1StateOrProvince || '',
        address1PostalCode: contact.address1PostalCode || '',
        address1Country: contact.address1Country || '',
        address1Telephone1: contact.address1Telephone1 || '',
        description: contact.description || '',
        department: contact.department || '',
        managerName: contact.managerName || '',
        managerPhone: contact.managerPhone || '',
        role: contact.role || '',
        assistantName: contact.assistantName || '',
        assistantPhone: contact.assistantPhone || '',
        genderCode: contact.genderCode,
        familyStatusCode: contact.familyStatusCode,
        spousesPartner: contact.spousesPartner || '',
        birthDate: contact.birthDate,
        anniversary: contact.anniversary,
      });
    }
    setError(null);
  }, [contact]);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const salutationOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    { key: 'Mr.', text: 'Mr.' },
    { key: 'Ms.', text: 'Ms.' },
    { key: 'Mrs.', text: 'Mrs.' },
    { key: 'Dr.', text: 'Dr.' },
  ];

  const accountOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...accounts.map((a) => ({ key: a.id, text: a.name ?? '' })),
  ];

  const addressTypeOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    { key: 1, text: 'Bill To' },
    { key: 2, text: 'Ship To' },
    { key: 3, text: 'Primary' },
    { key: 4, text: 'Other' },
  ];

  const genderOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    { key: 1, text: 'Male' },
    { key: 2, text: 'Female' },
  ];

  const maritalStatusOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    { key: 1, text: 'Single' },
    { key: 2, text: 'Married' },
    { key: 3, text: 'Divorced' },
    { key: 4, text: 'Widowed' },
  ];

  const normalizeFormData = (data: Partial<D365Contact>) => {
    return {
      ...data,
      parentCustomerId: data.parentCustomerId || null,
      genderCode: data.genderCode ? parseInt(data.genderCode.toString()) : null,
      familyStatusCode: data.familyStatusCode ? parseInt(data.familyStatusCode.toString()) : null,
      address1AddressTypeCode: data.address1AddressTypeCode ? parseInt(data.address1AddressTypeCode.toString()) : null,
      fullName: `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim().replace(/\s+/g, ' ')
    };
  };

  const validateFormData = (data: Partial<D365Contact>): string | null => {
    if (!data.lastName?.trim()) {
      return 'Last Name is required';
    }
    
    if (!data.firstName?.trim()) {
      return 'First Name is required';
    }

    if (!data.emailAddress1?.trim()) {
      return 'Email is required';
    }

    if (data.emailAddress1?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.emailAddress1.trim())) {
        return 'Please enter a valid email address';
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const validationError = validateFormData(formData);
      if (validationError) {
        setError(validationError);
        setSaving(false);
        return;
      }

      const normalizedContact = normalizeFormData(formData);

      if (contact) {
        await d365ContactService.update(contact.id, normalizedContact);
      } else {
        await d365ContactService.create(normalizedContact);
      }

      onSave();
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      const validationError = validateFormData(formData);
      if (validationError) {
        setError(validationError);
        setSaving(false);
        return;
      }

      const normalizedContact = normalizeFormData(formData);

      if (contact) {
        await d365ContactService.update(contact.id, normalizedContact);
      } else {
        await d365ContactService.create(normalizedContact);
      }

      setFormData({
        salutation: '',
        firstName: '',
        middleName: '',
        lastName: '',
        fullName: '',
        emailAddress1: '',
        telephone1: '',
        telephone2: '',
        telephone3: '',
        mobilePhone: '',
        fax: '',
        jobTitle: '',
        parentCustomerId: '',
        address1AddressTypeCode: undefined,
        address1Name: '',
        address1Line1: '',
        address1Line2: '',
        address1Line3: '',
        address1City: '',
        address1StateOrProvince: '',
        address1PostalCode: '',
        address1Country: '',
        address1Telephone1: '',
        description: '',
        department: '',
        managerName: '',
        managerPhone: '',
        role: '',
        assistantName: '',
        assistantPhone: '',
        genderCode: undefined,
        familyStatusCode: undefined,
        spousesPartner: '',
        birthDate: undefined,
        anniversary: undefined,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
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
    ...(contact && onDelete
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
        {contact ? 'Edit Contact' : 'New Contact'}
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
              text="General"
              iconProps={{ iconName: 'Contact' }}
              onClick={() => setActiveTab('general')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'general' ? '#0078d4' : 'transparent',
                  color: activeTab === 'general' ? 'white' : '#323130',
                  fontWeight: activeTab === 'general' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'general' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'general' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Details"
              iconProps={{ iconName: 'Info' }}
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
          </Stack>

          <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '20px 0' } }}>
            {activeTab === 'general' && (
              <Stack tokens={{ childrenGap: 20 }}>
                <Stack
                  horizontal
                  tokens={{ childrenGap: 32 }}
                  styles={{ root: { marginTop: 16 } }}
                >
                  <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                    <Dropdown
                      label="Salutation"
                      options={salutationOptions}
                      selectedKey={formData.salutation || ''}
                      onChange={(_, option) =>
                        setFormData({ ...formData, salutation: option?.key as string || '' })
                      }
                    />

                    <TextField
                      label="First Name"
                      required
                      value={formData.firstName}
                      onChange={(_, value) => setFormData({ ...formData, firstName: value || '' })}
                    />

                    <TextField
                      label="Middle Name"
                      value={formData.middleName}
                      onChange={(_, value) => setFormData({ ...formData, middleName: value || '' })}
                    />

                    <TextField
                      label="Last Name"
                      required
                      value={formData.lastName}
                      onChange={(_, value) => setFormData({ ...formData, lastName: value || '' })}
                    />

                    <TextField
                      label="Job Title"
                      value={formData.jobTitle}
                      onChange={(_, value) => setFormData({ ...formData, jobTitle: value || '' })}
                    />

                    <Dropdown
                      label="Company Name"
                      options={accountOptions}
                      selectedKey={formData.parentCustomerId || ''}
                      onChange={(_, option) =>
                        setFormData({ ...formData, parentCustomerId: option?.key as string || '' })
                      }
                    />
                  </Stack>

                  <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                    <TextField
                      label="Business Phone"
                      value={formData.telephone2}
                      onChange={(_, value) => setFormData({ ...formData, telephone2: value || '' })}
                    />

                    <TextField
                      label="Home Phone"
                      value={formData.telephone3}
                      onChange={(_, value) => setFormData({ ...formData, telephone3: value || '' })}
                    />

                    <TextField
                      label="Mobile Phone"
                      value={formData.mobilePhone}
                      onChange={(_, value) => setFormData({ ...formData, mobilePhone: value || '' })}
                    />

                    <TextField
                      label="Fax"
                      value={formData.fax}
                      onChange={(_, value) => setFormData({ ...formData, fax: value || '' })}
                    />

                    <TextField
                      label="Email"
                      type="email"
                      required
                      value={formData.emailAddress1}
                      onChange={(_, value) =>
                        setFormData({ ...formData, emailAddress1: value || '' })
                      }
                    />
                  </Stack>
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 20 } }}>
                  <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>Address</Label>
                  
                  <Stack horizontal tokens={{ childrenGap: 16 }}>
                    <Dropdown
                      label="Address Type"
                      options={addressTypeOptions}
                      selectedKey={formData.address1AddressTypeCode || ''}
                      onChange={(_, option) =>
                        setFormData({ ...formData, address1AddressTypeCode: option?.key as number || undefined })
                      }
                      styles={{ root: { flex: 1 } }}
                    />

                    <TextField
                      label="Address Name"
                      value={formData.address1Name}
                      onChange={(_, value) =>
                        setFormData({ ...formData, address1Name: value || '' })
                      }
                      styles={{ root: { flex: 1 } }}
                    />
                  </Stack>

                  <Stack horizontal tokens={{ childrenGap: 16 }}>
                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <TextField
                        label="Street"
                        value={formData.address1Line1}
                        onChange={(_, value) =>
                          setFormData({ ...formData, address1Line1: value || '' })
                        }
                      />

                      <TextField
                        label="Street 2"
                        value={formData.address1Line2}
                        onChange={(_, value) =>
                          setFormData({ ...formData, address1Line2: value || '' })
                        }
                      />

                      <TextField
                        label="Street 3"
                        value={formData.address1Line3}
                        onChange={(_, value) =>
                          setFormData({ ...formData, address1Line3: value || '' })
                        }
                      />

                      <TextField
                        label="City"
                        value={formData.address1City}
                        onChange={(_, value) =>
                          setFormData({ ...formData, address1City: value || '' })
                        }
                      />
                    </Stack>

                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <TextField
                        label="State/Province"
                        value={formData.address1StateOrProvince}
                        onChange={(_, value) =>
                          setFormData({ ...formData, address1StateOrProvince: value || '' })
                        }
                      />

                      <TextField
                        label="ZIP/Postal Code"
                        value={formData.address1PostalCode}
                        onChange={(_, value) =>
                          setFormData({ ...formData, address1PostalCode: value || '' })
                        }
                      />

                      <TextField
                        label="Country/Region"
                        value={formData.address1Country}
                        onChange={(_, value) =>
                          setFormData({ ...formData, address1Country: value || '' })
                        }
                      />

                      <TextField
                        label="Phone"
                        value={formData.address1Telephone1}
                        onChange={(_, value) =>
                          setFormData({ ...formData, address1Telephone1: value || '' })
                        }
                      />
                    </Stack>
                  </Stack>
                </Stack>

                <TextField
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(_, value) => setFormData({ ...formData, description: value || '' })}
                  styles={{ root: { marginTop: 20 } }}
                />
              </Stack>
            )}

            {activeTab === 'details' && (
              <Stack tokens={{ childrenGap: 32 }} styles={{ root: { marginTop: 16 } }}>
                <Stack tokens={{ childrenGap: 16 }}>
                  <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>
                    Professional Information
                  </Label>
                  
                  <Stack horizontal tokens={{ childrenGap: 32 }}>
                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <TextField
                        label="Department"
                        value={formData.department}
                        onChange={(_, value) =>
                          setFormData({ ...formData, department: value || '' })
                        }
                      />

                      <TextField
                        label="Manager"
                        value={formData.managerName}
                        onChange={(_, value) =>
                          setFormData({ ...formData, managerName: value || '' })
                        }
                      />

                      <TextField
                        label="Manager Phone"
                        value={formData.managerPhone}
                        onChange={(_, value) =>
                          setFormData({ ...formData, managerPhone: value || '' })
                        }
                      />
                    </Stack>

                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <TextField
                        label="Role"
                        value={formData.role}
                        onChange={(_, value) => setFormData({ ...formData, role: value || '' })}
                      />

                      <TextField
                        label="Assistant"
                        value={formData.assistantName}
                        onChange={(_, value) =>
                          setFormData({ ...formData, assistantName: value || '' })
                        }
                      />

                      <TextField
                        label="Assistant Phone"
                        value={formData.assistantPhone}
                        onChange={(_, value) =>
                          setFormData({ ...formData, assistantPhone: value || '' })
                        }
                      />
                    </Stack>
                  </Stack>
                </Stack>

                <Stack tokens={{ childrenGap: 16 }}>
                  <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>
                    Personal Information
                  </Label>
                  
                  <Stack horizontal tokens={{ childrenGap: 32 }}>
                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <Dropdown
                        label="Gender"
                        options={genderOptions}
                        selectedKey={formData.genderCode || ''}
                        onChange={(_, option) =>
                          setFormData({ ...formData, genderCode: option?.key as number || undefined })
                        }
                      />

                      <Dropdown
                        label="Marital Status"
                        options={maritalStatusOptions}
                        selectedKey={formData.familyStatusCode || ''}
                        onChange={(_, option) =>
                          setFormData({ ...formData, familyStatusCode: option?.key as number || undefined })
                        }
                      />

                      <TextField
                        label="Spouse/Partner Name"
                        value={formData.spousesPartner}
                        onChange={(_, value) =>
                          setFormData({ ...formData, spousesPartner: value || '' })
                        }
                      />
                    </Stack>

                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <DatePicker
                        label="Birthday"
                        value={formData.birthDate ? new Date(formData.birthDate) : undefined}
                        onSelectDate={(date) =>
                          setFormData({ ...formData, birthDate: date?.toISOString() })
                        }
                        formatDate={(date) =>
                          date ? date.toLocaleDateString() : ''
                        }
                      />

                      <DatePicker
                        label="Anniversary"
                        value={formData.anniversary ? new Date(formData.anniversary) : undefined}
                        onSelectDate={(date) =>
                          setFormData({ ...formData, anniversary: date?.toISOString() })
                        }
                        formatDate={(date) =>
                          date ? date.toLocaleDateString() : ''
                        }
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
