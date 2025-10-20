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
  StandardFormHeader,
  type LookupOption 
} from './standards';

declare global {
  interface Window {
    google: any;
  }
}

declare const google: any;


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
    address1Latitude: undefined,
    address1Longitude: undefined,
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
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

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
        address1Latitude: contact.address1Latitude,
        address1Longitude: contact.address1Longitude,
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

      if (contact.address1Latitude && contact.address1Longitude && map) {
        const position = { lat: contact.address1Latitude, lng: contact.address1Longitude };
        map.setCenter(position);
        if (marker) {
          marker.setPosition(position);
        }
      }
    }
    setError(null);
  }, [contact, map, marker]);

  const salutationOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    { key: 'Mr.', text: 'Mr.' },
    { key: 'Ms.', text: 'Ms.' },
    { key: 'Mrs.', text: 'Mrs.' },
    { key: 'Dr.', text: 'Dr.' },
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
        address1Latitude: undefined,
        address1Longitude: undefined,
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

  const tabStyles = (isActive: boolean) => ({
    root: {
      height: 40,
      padding: '0 16px',
      borderRadius: 0,
      border: 'none',
      borderBottom: isActive ? '2px solid #0078d4' : '2px solid transparent',
      backgroundColor: 'transparent',
      color: isActive ? '#0078d4' : '#323130',
      fontWeight: isActive ? '600' : '400',
    },
    rootHovered: {
      backgroundColor: '#f3f2f1',
      color: '#0078d4',
    },
  });

  useEffect(() => {
    initializeGoogleMaps();
  }, []);

  const initializeGoogleMaps = () => {
    if (typeof google === 'undefined' || !google.maps) {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => setupMap());
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
      }&libraries=places`;
      script.async = true;
      script.onload = () => setupMap();
      document.head.appendChild(script);
    } else {
      setupMap();
    }
  };

  const setupMap = () => {
    const mapElement = document.getElementById('contact-form-map');
    const searchInput = document.getElementById('contact-address-search-input') as HTMLInputElement;
    
    if (!mapElement) {
      setTimeout(setupMap, 100);
      return;
    }

    const defaultCenter = { lat: -26.2041, lng: 28.0473 };
    const mapInstance = new google.maps.Map(mapElement, {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const markerInstance = new google.maps.Marker({
      map: mapInstance,
      draggable: true,
      position: defaultCenter,
    });

    markerInstance.addListener('dragend', () => {
      const position = markerInstance.getPosition();
      if (position) {
        setFormData((prev) => ({
          ...prev,
          address1Latitude: position.lat(),
          address1Longitude: position.lng(),
        }));
      }
    });

    if (searchInput && google.maps.places) {
      const autocompleteInstance = new google.maps.places.Autocomplete(searchInput, {
        componentRestrictions: { country: 'za' },
      });

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        
        if (!place.geometry || !place.geometry.location) {
          return;
        }

        const location = place.geometry.location;
        mapInstance.setCenter(location);
        mapInstance.setZoom(15);
        markerInstance.setPosition(location);

        const addressComponents = place.address_components || [];
        let street = '';
        let state = '';
        let postalCode = '';
        let country = '';

        addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('street_number')) {
            street = component.long_name + ' ' + street;
          }
          if (types.includes('route')) {
            street += component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          }
          if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
          if (types.includes('country')) {
            country = component.long_name;
          }
        });

        setFormData((prev) => ({
          ...prev,
          address1Line1: street.trim(),
          address1StateOrProvince: state,
          address1PostalCode: postalCode,
          address1Country: country,
          address1Latitude: location.lat(),
          address1Longitude: location.lng(),
        }));
      });
    }

    setMap(mapInstance);
    setMarker(markerInstance);
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
          <Stack horizontal styles={{ root: { borderBottom: '1px solid #edebe9', backgroundColor: '#faf9f8' } }}>
            <DefaultButton
              text="General"
              onClick={() => setActiveTab('general')}
              styles={tabStyles(activeTab === 'general')}
            />
            <DefaultButton
              text="Details"
              onClick={() => setActiveTab('details')}
              styles={tabStyles(activeTab === 'details')}
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
                  <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                    ADDRESS
                  </Text>

                  <TextField
                    id="contact-address-search-input"
                    label="Search Address"
                    placeholder="Start typing to search..."
                    iconProps={{ iconName: 'MapPin' }}
                  />

                  <TextField
                    label="Address Name"
                    value={formData.address1Name}
                    onChange={(_, value) => setFormData({ ...formData, address1Name: value || '' })}
                  />

                  <TextField
                    label="Street 1"
                    value={formData.address1Line1}
                    onChange={(_, value) => setFormData({ ...formData, address1Line1: value || '' })}
                  />

                  <TextField
                    label="State/Province"
                    value={formData.address1StateOrProvince}
                    onChange={(_, value) => setFormData({ ...formData, address1StateOrProvince: value || '' })}
                  />

                  <TextField
                    label="ZIP/Postal Code"
                    value={formData.address1PostalCode}
                    onChange={(_, value) => setFormData({ ...formData, address1PostalCode: value || '' })}
                  />

                  <TextField
                    label="Country/Region"
                    value={formData.address1Country}
                    onChange={(_, value) => setFormData({ ...formData, address1Country: value || '' })}
                  />

                  <div
                    id="contact-form-map"
                    style={{
                      height: '200px',
                      width: '100%',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      marginTop: 16,
                    }}
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
