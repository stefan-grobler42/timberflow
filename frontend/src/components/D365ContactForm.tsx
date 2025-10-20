import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  Dropdown,
  DatePicker,
  Label,
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { d365ContactService, lookupService, accountService } from '../services/d365Services';
import type { D365Contact } from '../types/millennium';
import { 
  StandardLookupField, 
  StandardPhoneField, 
  StandardAddressFields, 
  StandardFormHeader,
  type LookupOption 
} from './standards';


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
  const [companyNameText, setCompanyNameText] = useState<string>('');

  // Normalize phone number to E.164 format: +27XXXXXXXXX
  const normalizePhoneNumber = (phone: string | undefined): string | undefined => {
    if (!phone) return undefined;
    
    const trimmed = phone.trim();
    if (!trimmed) return undefined;
    
    // Step 1: Extract only digits and leading + sign
    let digitsOnly = '';
    let hasPlus = trimmed.startsWith('+');
    
    for (let i = 0; i < trimmed.length; i++) {
      const char = trimmed[i];
      if (char >= '0' && char <= '9') {
        digitsOnly += char;
      } else if (char === '+' && i === 0) {
        // Keep the leading +, handled separately
        continue;
      }
    }
    
    if (!digitsOnly) return undefined;
    
    // Step 2: Handle different formats and convert to E.164
    let normalized: string;
    
    // Format: +27XXXXXXXXX (already E.164)
    if (hasPlus && digitsOnly.startsWith('27') && digitsOnly.length === 11) {
      normalized = '+' + digitsOnly;
    }
    // Format: 0027XXXXXXXXX (international with 00)
    else if (digitsOnly.startsWith('0027') && digitsOnly.length === 13) {
      normalized = '+27' + digitsOnly.substring(4);
    }
    // Format: 01127XXXXXXXXX (international with 011)
    else if (digitsOnly.startsWith('01127') && digitsOnly.length === 14) {
      normalized = '+27' + digitsOnly.substring(5);
    }
    // Format: 27XXXXXXXXX (without +)
    else if (digitsOnly.startsWith('27') && digitsOnly.length === 11) {
      normalized = '+' + digitsOnly;
    }
    // Format: 0XXXXXXXXX (local with leading 0)
    else if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
      normalized = '+27' + digitsOnly.substring(1);
    }
    // Format: XXXXXXXXX (local without 0)
    else if (digitsOnly.length === 9) {
      normalized = '+27' + digitsOnly;
    }
    // Invalid format
    else {
      console.warn(`Invalid SA phone number - cannot normalize: "${phone}" (digits: ${digitsOnly})`);
      return undefined; // Return undefined for invalid numbers instead of malformed values
    }
    
    // Step 3: Final validation - must be exactly +27 followed by 9 digits
    if (!normalized.match(/^\+27\d{9}$/)) {
      console.error(`Phone normalization produced invalid E.164: "${phone}" → "${normalized}"`);
      return undefined;
    }
    
    return normalized;
  };

  // Fetch account name when contact has parentCustomerId
  useEffect(() => {
    const fetchAccountName = async () => {
      if (contact?.parentCustomerId) {
        try {
          const account = await accountService.getById(contact.parentCustomerId);
          setCompanyNameText(account.name || '');
        } catch (error) {
          console.error('Failed to fetch account name:', error);
          setCompanyNameText('');
        }
      } else {
        setCompanyNameText('');
      }
    };
    
    fetchAccountName();
  }, [contact?.parentCustomerId]);

  useEffect(() => {
    if (contact) {
      setFormData({
        salutation: contact.salutation || '',
        firstName: contact.firstName || '',
        middleName: contact.middleName || '',
        lastName: contact.lastName || '',
        fullName: contact.fullName || '',
        emailAddress1: contact.emailAddress1 || '',
        telephone1: normalizePhoneNumber(contact.telephone1),
        telephone2: normalizePhoneNumber(contact.telephone2),
        telephone3: normalizePhoneNumber(contact.telephone3),
        mobilePhone: normalizePhoneNumber(contact.mobilePhone),
        fax: normalizePhoneNumber(contact.fax),
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
        address1Telephone1: normalizePhoneNumber(contact.address1Telephone1),
        description: contact.description || '',
        department: contact.department || '',
        managerName: contact.managerName || '',
        managerPhone: normalizePhoneNumber(contact.managerPhone),
        role: contact.role || '',
        assistantName: contact.assistantName || '',
        assistantPhone: normalizePhoneNumber(contact.assistantPhone),
        genderCode: contact.genderCode,
        familyStatusCode: contact.familyStatusCode,
        spousesPartner: contact.spousesPartner || '',
        birthDate: contact.birthDate,
        anniversary: contact.anniversary,
      });
    }
    setError(null);
  }, [contact]);

  const salutationOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    { key: 'Mr.', text: 'Mr.' },
    { key: 'Ms.', text: 'Ms.' },
    { key: 'Mrs.', text: 'Mrs.' },
    { key: 'Dr.', text: 'Dr.' },
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
      parentCustomerId: data.parentCustomerId || undefined,
      genderCode: data.genderCode ? parseInt(data.genderCode.toString()) : undefined,
      familyStatusCode: data.familyStatusCode ? parseInt(data.familyStatusCode.toString()) : undefined,
      address1AddressTypeCode: data.address1AddressTypeCode ? parseInt(data.address1AddressTypeCode.toString()) : undefined,
      fullName: `${data.firstName || ''} ${data.middleName || ''} ${data.lastName || ''}`.trim().replace(/\s+/g, ' '),
      telephone1: normalizePhoneNumber(data.telephone1),
      telephone2: normalizePhoneNumber(data.telephone2),
      telephone3: normalizePhoneNumber(data.telephone3),
      mobilePhone: normalizePhoneNumber(data.mobilePhone),
      fax: normalizePhoneNumber(data.fax),
      managerPhone: normalizePhoneNumber(data.managerPhone),
      assistantPhone: normalizePhoneNumber(data.assistantPhone),
      address1Telephone1: normalizePhoneNumber(data.address1Telephone1),
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

  // Search function for StandardLookupField
  const searchAccounts = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await lookupService.searchAccounts(searchTerm);
      return results.map(r => ({ id: r.id, text: r.text }));
    } catch (error) {
      console.error('Error searching accounts:', error);
      return [];
    }
  };

  return (
    <Stack tokens={{ childrenGap: 0 }} styles={{ root: { height: '100%' } }}>
      <StandardFormHeader
        title={contact ? 'Edit Contact' : 'New Contact'}
        subtitle="Contact"
        onBack={onDismiss}
        onSave={handleSubmit}
        onSaveAndNew={handleSaveAndNew}
        onDelete={contact && onDelete ? onDelete : undefined}
        onCancel={onDismiss}
        saving={saving}
        isNew={!contact}
      />

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
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16 } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <Label styles={{ root: { fontWeight: 600, fontSize: 16, marginBottom: 8 } }}>
                    Contact Details
                  </Label>

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
                    label="Email"
                    type="email"
                    required
                    value={formData.emailAddress1}
                    onChange={(_, value) =>
                      setFormData({ ...formData, emailAddress1: value || '' })
                    }
                  />

                  <StandardPhoneField
                    label="Business Phone"
                    value={formData.telephone1 || ''}
                    onChange={(phone) => setFormData({ ...formData, telephone1: phone })}
                  />

                  <StandardPhoneField
                    label="Home Phone"
                    value={formData.telephone2 || ''}
                    onChange={(phone) => setFormData({ ...formData, telephone2: phone })}
                  />

                  <StandardPhoneField
                    label="Mobile Phone"
                    value={formData.mobilePhone || ''}
                    onChange={(phone) => setFormData({ ...formData, mobilePhone: phone })}
                  />

                  <StandardPhoneField
                    label="Fax"
                    value={formData.fax || ''}
                    onChange={(phone) => setFormData({ ...formData, fax: phone })}
                  />

                  <TextField
                    label="Job Title"
                    value={formData.jobTitle}
                    onChange={(_, value) => setFormData({ ...formData, jobTitle: value || '' })}
                  />

                  <StandardLookupField
                    label="Company Name"
                    value={formData.parentCustomerId}
                    selectedText={companyNameText}
                    entityName="Account"
                    onChange={(id) => {
                      setFormData({ ...formData, parentCustomerId: id || '' });
                      if (id) {
                        accountService.getById(id).then(account => {
                          setCompanyNameText(account.name || '');
                        }).catch(() => setCompanyNameText(''));
                      } else {
                        setCompanyNameText('');
                      }
                    }}
                    onSearch={searchAccounts}
                  />

                  <TextField
                    label="Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={(_, value) => setFormData({ ...formData, description: value || '' })}
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <StandardAddressFields
                    sectionTitle="ADDRESS INFORMATION"
                    uniqueId="contact-address"
                    street={formData.address1Line1}
                    stateOrProvince={formData.address1StateOrProvince}
                    postalCode={formData.address1PostalCode}
                    country={formData.address1Country}
                    latitude={formData.address1Latitude}
                    longitude={formData.address1Longitude}
                    onStreetChange={(value) => setFormData({ ...formData, address1Line1: value })}
                    onStateOrProvinceChange={(value) => setFormData({ ...formData, address1StateOrProvince: value })}
                    onPostalCodeChange={(value) => setFormData({ ...formData, address1PostalCode: value })}
                    onCountryChange={(value) => setFormData({ ...formData, address1Country: value })}
                    onLatitudeChange={(value) => setFormData({ ...formData, address1Latitude: value })}
                    onLongitudeChange={(value) => setFormData({ ...formData, address1Longitude: value })}
                  />
                </Stack>
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

                      <StandardPhoneField
                        label="Manager Phone"
                        value={formData.managerPhone || ''}
                        onChange={(phone) => setFormData({ ...formData, managerPhone: phone })}
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

                      <StandardPhoneField
                        label="Assistant Phone"
                        value={formData.assistantPhone || ''}
                        onChange={(phone) => setFormData({ ...formData, assistantPhone: phone })}
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
