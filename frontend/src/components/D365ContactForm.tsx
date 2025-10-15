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
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<D365Contact>>({
    firstName: '',
    lastName: '',
    fullName: '',
    emailAddress1: '',
    telephone1: '',
    mobilePhone: '',
    jobTitle: '',
    parentCustomerId: '',
    address1Line1: '',
    address1City: '',
    address1StateOrProvince: '',
    address1PostalCode: '',
    address1Country: '',
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    loadAccounts();
    initializeGoogleMaps();
  }, []);

  useEffect(() => {
    if (contact) {
      setFormData({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        fullName: contact.fullName || '',
        emailAddress1: contact.emailAddress1 || '',
        telephone1: contact.telephone1 || '',
        mobilePhone: contact.mobilePhone || '',
        jobTitle: contact.jobTitle || '',
        parentCustomerId: contact.parentCustomerId || '',
        address1Line1: contact.address1Line1 || '',
        address1City: contact.address1City || '',
        address1StateOrProvince: contact.address1StateOrProvince || '',
        address1PostalCode: contact.address1PostalCode || '',
        address1Country: contact.address1Country || '',
        latitude: contact.latitude,
        longitude: contact.longitude,
      });

      if (contact.latitude && contact.longitude && map) {
        const position = { lat: contact.latitude, lng: contact.longitude };
        map.setCenter(position);
        if (marker) {
          marker.setPosition(position);
        }
      }
    }
    setError(null);
  }, [contact, map, marker]);

  const loadAccounts = async () => {
    try {
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const accountOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...accounts.map((a) => ({ key: a.id, text: a.name })),
  ];

  const initializeGoogleMaps = () => {
    if (typeof google === 'undefined' || !google.maps) {
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
    const mapElement = document.getElementById('contact-map');
    if (!mapElement) {
      setTimeout(setupMap, 100);
      return;
    }

    const defaultCenter = { lat: -26.2041, lng: 28.0473 };
    const mapInstance = new google.maps.Map(mapElement, {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
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
          latitude: position.lat(),
          longitude: position.lng(),
        }));
      }
    });

    const input = document.getElementById('contact-address-autocomplete') as HTMLInputElement;
    if (input) {
      const autocompleteInstance = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: 'za' },
        fields: ['address_components', 'geometry', 'formatted_address'],
      });

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (place.geometry?.location) {
          const position = place.geometry.location;
          mapInstance.setCenter(position);
          mapInstance.setZoom(15);
          markerInstance.setPosition(position);

          setFormData((prev) => ({
            ...prev,
            address1Line1: place.formatted_address || '',
            latitude: position.lat(),
            longitude: position.lng(),
          }));

          if (place.address_components) {
            const components = place.address_components;
            const city = components.find((c) => c.types.includes('locality'))?.long_name;
            const province = components.find((c) =>
              c.types.includes('administrative_area_level_1')
            )?.long_name;
            const postalCode = components.find((c) => c.types.includes('postal_code'))?.long_name;

            setFormData((prev) => ({
              ...prev,
              address1City: city || prev.address1City || '',
              address1StateOrProvince: province || prev.address1StateOrProvince || '',
              address1PostalCode: postalCode || prev.address1PostalCode || '',
            }));
          }

          input.value = '';
        }
      });

      setAutocomplete(autocompleteInstance);
    }

    setMap(mapInstance);
    setMarker(markerInstance);
    setMapInitialized(true);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          if (map) {
            map.setCenter(pos);
          }
          if (marker) {
            marker.setPosition(pos);
          }

          setFormData((prev) => ({
            ...prev,
            latitude: pos.lat,
            longitude: pos.lng,
          }));
        },
        () => {
          setError('Failed to get your location');
        }
      );
    }
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (contact) {
        await d365ContactService.update(contact.id, formData);
      } else {
        await d365ContactService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (contact) {
        await d365ContactService.update(contact.id, formData);
      } else {
        await d365ContactService.create(formData);
      }

      setFormData({
        firstName: '',
        lastName: '',
        fullName: '',
        emailAddress1: '',
        telephone1: '',
        mobilePhone: '',
        jobTitle: '',
        parentCustomerId: '',
        address1Line1: '',
        address1City: '',
        address1StateOrProvince: '',
        address1PostalCode: '',
        address1Country: '',
        latitude: null,
        longitude: null,
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
              text="Contact Details"
              iconProps={{ iconName: 'Contact' }}
              onClick={() => setActiveTab('contact')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'contact' ? '#0078d4' : 'transparent',
                  color: activeTab === 'contact' ? 'white' : '#323130',
                  fontWeight: activeTab === 'contact' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'contact' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'contact' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Address"
              iconProps={{ iconName: 'MapPin' }}
              onClick={() => setActiveTab('address')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'address' ? '#0078d4' : 'transparent',
                  color: activeTab === 'address' ? 'white' : '#323130',
                  fontWeight: activeTab === 'address' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'address' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'address' ? 'white' : '#323130',
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
                    label="First Name"
                    required
                    value={formData.firstName}
                    onChange={(_, value) => setFormData({ ...formData, firstName: value || '' })}
                  />

                  <TextField
                    label="Last Name"
                    required
                    value={formData.lastName}
                    onChange={(_, value) => setFormData({ ...formData, lastName: value || '' })}
                  />

                  <TextField
                    label="Full Name"
                    value={formData.fullName}
                    onChange={(_, value) => setFormData({ ...formData, fullName: value || '' })}
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Job Title"
                    value={formData.jobTitle}
                    onChange={(_, value) => setFormData({ ...formData, jobTitle: value || '' })}
                  />

                  <Dropdown
                    label="Parent Customer"
                    options={accountOptions}
                    selectedKey={formData.parentCustomerId || ''}
                    onChange={(_, option) =>
                      setFormData({ ...formData, parentCustomerId: option?.key as string || '' })
                    }
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'contact' && (
              <Stack
                tokens={{ childrenGap: 16 }}
                styles={{ root: { marginTop: 16, maxWidth: 600 } }}
              >
                <TextField
                  label="Email"
                  type="email"
                  value={formData.emailAddress1}
                  onChange={(_, value) =>
                    setFormData({ ...formData, emailAddress1: value || '' })
                  }
                />

                <TextField
                  label="Phone"
                  value={formData.telephone1}
                  onChange={(_, value) => setFormData({ ...formData, telephone1: value || '' })}
                />

                <TextField
                  label="Mobile Phone"
                  value={formData.mobilePhone}
                  onChange={(_, value) => setFormData({ ...formData, mobilePhone: value || '' })}
                />
              </Stack>
            )}

            {activeTab === 'address' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16 } }}>
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="end">
                  <TextField
                    id="contact-address-autocomplete"
                    label="Search Address"
                    placeholder="Start typing an address..."
                    styles={{ root: { flex: 1 } }}
                  />
                  <DefaultButton
                    text="Use My Location"
                    iconProps={{ iconName: 'MyLocation' }}
                    onClick={handleUseMyLocation}
                  />
                </Stack>

                <div
                  id="contact-map"
                  style={{
                    height: '400px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />

                <Stack horizontal tokens={{ childrenGap: 16 }}>
                  <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                    <TextField
                      label="Street Address"
                      multiline
                      rows={2}
                      value={formData.address1Line1}
                      onChange={(_, value) =>
                        setFormData({ ...formData, address1Line1: value || '' })
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
                      label="Postal Code"
                      value={formData.address1PostalCode}
                      onChange={(_, value) =>
                        setFormData({ ...formData, address1PostalCode: value || '' })
                      }
                    />
                  </Stack>
                </Stack>

                <TextField
                  label="Country"
                  value={formData.address1Country}
                  onChange={(_, value) =>
                    setFormData({ ...formData, address1Country: value || '' })
                  }
                />

                {formData.latitude && formData.longitude && (
                  <Text variant="small">
                    Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
