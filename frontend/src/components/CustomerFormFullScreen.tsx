import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  Dropdown,
  Checkbox,
  MessageBar,
  MessageBarType,
  Pivot,
  PivotItem,
  CommandBar,
} from '@fluentui/react';
import type { IDropdownOption, ICommandBarItemProps } from '@fluentui/react';
import { customerService, companyService } from '../services';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, Company } from '../types';

interface CustomerFormFullScreenProps {
  customer?: Customer;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const CustomerFormFullScreen = ({
  customer,
  onDismiss,
  onSave,
  onDelete,
}: CustomerFormFullScreenProps) => {
  const [formData, setFormData] = useState<Partial<CreateCustomerDto>>({
    accountNo: '',
    accountName: '',
    companyTypeId: undefined,
    email: '',
    phone: '',
    mobile: '',
    website: '',
    vatRegistrationNo: '',
    companyRegistrationNo: '',
    streetAddress: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    latitude: null,
    longitude: null,
    customerStatus: 'Prospect',
    paymentTerms: 'Net 30',
    creditLimit: 0,
    currentBalance: 0,
    discount: 0,
    taxExempt: false,
    isActive: true,
  });
  const [companyTypes, setCompanyTypes] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    loadCompanyTypes();
    initializeGoogleMaps();
  }, []);

  useEffect(() => {
    if (customer) {
      setFormData({
        accountNo: customer.accountNo,
        accountName: customer.accountName,
        companyTypeId: customer.companyTypeId || undefined,
        email: customer.email || '',
        phone: customer.phone || '',
        mobile: customer.mobile || '',
        website: customer.website || '',
        vatRegistrationNo: customer.vatRegistrationNo || '',
        companyRegistrationNo: customer.companyRegistrationNo || '',
        streetAddress: customer.streetAddress || '',
        city: customer.city || '',
        province: customer.province || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'South Africa',
        latitude: customer.latitude,
        longitude: customer.longitude,
        customerStatus: customer.customerStatus,
        paymentTerms: customer.paymentTerms || 'Net 30',
        creditLimit: customer.creditLimit || 0,
        currentBalance: customer.currentBalance || 0,
        discount: customer.discount || 0,
        taxExempt: customer.taxExempt || false,
        isActive: customer.isActive,
      });

      if (customer.latitude && customer.longitude && map) {
        const position = { lat: customer.latitude, lng: customer.longitude };
        map.setCenter(position);
        if (marker) {
          marker.setPosition(position);
        }
      }
    }
    setError(null);
  }, [customer, map, marker]);

  const loadCompanyTypes = async () => {
    try {
      const data = await companyService.getAll(true);
      setCompanyTypes(data);
    } catch (err) {
      console.error('Failed to load company types:', err);
    }
  };

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
    const mapElement = document.getElementById('customer-map');
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
        setFormData({
          ...formData,
          latitude: position.lat(),
          longitude: position.lng(),
        });
      }
    });

    const input = document.getElementById('address-autocomplete') as HTMLInputElement;
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

          setFormData({
            ...formData,
            streetAddress: place.formatted_address || '',
            latitude: position.lat(),
            longitude: position.lng(),
          });

          if (place.address_components) {
            const components = place.address_components;
            const city = components.find((c) => c.types.includes('locality'))?.long_name;
            const province = components.find((c) =>
              c.types.includes('administrative_area_level_1')
            )?.long_name;
            const postalCode = components.find((c) => c.types.includes('postal_code'))?.long_name;

            setFormData((prev) => ({
              ...prev,
              city: city || prev.city || '',
              province: province || prev.province || '',
              postalCode: postalCode || prev.postalCode || '',
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

          setFormData({
            ...formData,
            latitude: pos.lat,
            longitude: pos.lng,
          });
        },
        () => {
          setError('Failed to get your location');
        }
      );
    }
  };

  const companyTypeOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...companyTypes.map((ct) => ({ key: ct.id, text: ct.name })),
  ];

  const statusOptions: IDropdownOption[] = [
    { key: 'Prospect', text: 'Prospect' },
    { key: 'Active', text: 'Active' },
    { key: 'Credit Approved', text: 'Credit Approved' },
    { key: 'On Hold', text: 'On Hold' },
    { key: 'Inactive', text: 'Inactive' },
  ];

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (customer) {
        const updateDto: UpdateCustomerDto = { ...formData };
        await customerService.update(customer.id, updateDto);
      } else {
        const createDto: CreateCustomerDto = formData as CreateCustomerDto;
        await customerService.create(createDto);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (customer) {
        const updateDto: UpdateCustomerDto = { ...formData };
        await customerService.update(customer.id, updateDto);
      } else {
        const createDto: CreateCustomerDto = formData as CreateCustomerDto;
        await customerService.create(createDto);
      }

      setFormData({
        accountNo: '',
        accountName: '',
        companyTypeId: undefined,
        email: '',
        phone: '',
        mobile: '',
        website: '',
        vatRegistrationNo: '',
        companyRegistrationNo: '',
        streetAddress: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'South Africa',
        latitude: null,
        longitude: null,
        customerStatus: 'Prospect',
        paymentTerms: 'Net 30',
        creditLimit: 0,
        currentBalance: 0,
        discount: 0,
        taxExempt: false,
        isActive: true,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
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
    ...(customer && onDelete
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
        {customer ? 'Edit Customer' : 'New Customer'}
      </Text>

      <CommandBar items={commandBarItems} />

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' } }}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

      <Pivot styles={{ root: { flex: 1, display: 'flex', flexDirection: 'column' } }}>
        <PivotItem headerText="Basic Information" itemIcon="Info">
          <Stack
            horizontal
            tokens={{ childrenGap: 32 }}
            styles={{ root: { marginTop: 16, overflowY: 'auto' } }}
          >
            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
              <TextField
                label="Account No"
                required
                value={formData.accountNo}
                onChange={(_, value) => setFormData({ ...formData, accountNo: value || '' })}
              />

              <TextField
                label="Account Name"
                required
                value={formData.accountName}
                onChange={(_, value) => setFormData({ ...formData, accountName: value || '' })}
              />

              <Dropdown
                label="Company Type"
                options={companyTypeOptions}
                selectedKey={formData.companyTypeId || ''}
                onChange={(_, option) =>
                  setFormData({
                    ...formData,
                    companyTypeId: option?.key ? Number(option.key) : undefined,
                  })
                }
              />

              <TextField
                label="VAT Registration No"
                value={formData.vatRegistrationNo}
                onChange={(_, value) =>
                  setFormData({ ...formData, vatRegistrationNo: value || '' })
                }
              />

              <TextField
                label="Company Registration No"
                value={formData.companyRegistrationNo}
                onChange={(_, value) =>
                  setFormData({ ...formData, companyRegistrationNo: value || '' })
                }
              />
            </Stack>

            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
              <Dropdown
                label="Customer Status"
                required
                options={statusOptions}
                selectedKey={formData.customerStatus}
                onChange={(_, option) =>
                  setFormData({ ...formData, customerStatus: option?.key as string })
                }
              />

              <TextField
                label="Payment Terms"
                value={formData.paymentTerms}
                onChange={(_, value) => setFormData({ ...formData, paymentTerms: value || '' })}
              />

              <TextField
                label="Credit Limit"
                type="number"
                value={String(formData.creditLimit)}
                onChange={(_, value) =>
                  setFormData({ ...formData, creditLimit: Number(value) || 0 })
                }
              />

              <TextField
                label="Discount %"
                type="number"
                value={String(formData.discount)}
                onChange={(_, value) => setFormData({ ...formData, discount: Number(value) || 0 })}
              />

              <Checkbox
                label="Tax Exempt"
                checked={formData.taxExempt}
                onChange={(_, checked) => setFormData({ ...formData, taxExempt: checked || false })}
              />

              <Checkbox
                label="Active"
                checked={formData.isActive}
                onChange={(_, checked) => setFormData({ ...formData, isActive: checked || false })}
              />
            </Stack>
          </Stack>
        </PivotItem>

        <PivotItem headerText="Contact Information" itemIcon="Contact">
          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16, maxWidth: 600 } }}>
            <TextField
              label="Email"
              required
              type="email"
              value={formData.email}
              onChange={(_, value) => setFormData({ ...formData, email: value || '' })}
            />

            <TextField
              label="Phone"
              required
              value={formData.phone}
              onChange={(_, value) => setFormData({ ...formData, phone: value || '' })}
            />

            <TextField
              label="Mobile"
              value={formData.mobile}
              onChange={(_, value) => setFormData({ ...formData, mobile: value || '' })}
            />

            <TextField
              label="Website"
              value={formData.website}
              onChange={(_, value) => setFormData({ ...formData, website: value || '' })}
            />
          </Stack>
        </PivotItem>

        <PivotItem headerText="Address & Location" itemIcon="MapPin">
          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16 } }}>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="end">
              <TextField
                id="address-autocomplete"
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
              id="customer-map"
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
                  required
                  multiline
                  rows={2}
                  value={formData.streetAddress}
                  onChange={(_, value) => setFormData({ ...formData, streetAddress: value || '' })}
                />

                <TextField
                  label="City"
                  required
                  value={formData.city}
                  onChange={(_, value) => setFormData({ ...formData, city: value || '' })}
                />
              </Stack>

              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                <TextField
                  label="Province"
                  required
                  value={formData.province}
                  onChange={(_, value) => setFormData({ ...formData, province: value || '' })}
                />

                <TextField
                  label="Postal Code"
                  required
                  value={formData.postalCode}
                  onChange={(_, value) => setFormData({ ...formData, postalCode: value || '' })}
                />
              </Stack>
            </Stack>

            <TextField
              label="Country"
              required
              value={formData.country}
              onChange={(_, value) => setFormData({ ...formData, country: value || '' })}
            />

            {formData.latitude && formData.longitude && (
              <Text variant="small">
                Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </Text>
            )}
          </Stack>
        </PivotItem>

        <PivotItem headerText="Financial Information" itemIcon="Money">
          <Stack
            tokens={{ childrenGap: 16 }}
            styles={{ root: { marginTop: 16, maxWidth: 600 } }}
          >
            <TextField
              label="Current Balance"
              type="number"
              value={String(formData.currentBalance)}
              onChange={(_, value) =>
                setFormData({ ...formData, currentBalance: Number(value) || 0 })
              }
              prefix="ZAR"
            />

            <TextField
              label="Credit Limit"
              type="number"
              value={String(formData.creditLimit)}
              onChange={(_, value) =>
                setFormData({ ...formData, creditLimit: Number(value) || 0 })
              }
              prefix="ZAR"
            />

            <TextField
              label="Discount %"
              type="number"
              value={String(formData.discount)}
              onChange={(_, value) => setFormData({ ...formData, discount: Number(value) || 0 })}
            />

            <TextField
              label="Payment Terms"
              value={formData.paymentTerms}
              onChange={(_, value) => setFormData({ ...formData, paymentTerms: value || '' })}
            />

            <Checkbox
              label="Tax Exempt"
              checked={formData.taxExempt}
              onChange={(_, checked) => setFormData({ ...formData, taxExempt: checked || false })}
            />
          </Stack>
        </PivotItem>
      </Pivot>
      </Stack>
    </Stack>
  );
};
