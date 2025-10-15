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
  Dropdown,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { tenderService, customerService, designerService } from '../services';
import { d365ContactService, d365QuoteService } from '../services/d365Services';
import type { Tender, Customer, Designer, D365Contact, D365Quote } from '../types/millennium';

interface TenderFormProps {
  tender?: Tender;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const TenderForm = ({
  tender,
  onDismiss,
  onSave,
  onDelete,
}: TenderFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<Tender>>({
    name: '',
    description: '',
    fileLink: '',
    streetAddress: '',
    latitude: null,
    longitude: null,
    closingDate: '',
    distanceToSite: 0,
    contact: '',
    customer: '',
    quoteNo: '',
    roofCoveringSheeting: false,
    roofCoveringTiles: false,
    timberStructure: false,
    totalValueExcl: 0,
    totalValueExclBase: 0,
    exchangeRate: 1,
    newDesigner: '',
    newNotes: '',
    newPricingSubmitted: false,
    newSubmissionDate: '',
    newTenderStatus: 0,
    transactionCurrencyId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<D365Contact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [quotes, setQuotes] = useState<D365Quote[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    loadLookupData();
    initializeGoogleMaps();
  }, []);

  useEffect(() => {
    if (tender) {
      setFormData({
        name: tender.name || '',
        description: tender.description || '',
        fileLink: tender.fileLink || '',
        streetAddress: tender.streetAddress || '',
        latitude: tender.latitude,
        longitude: tender.longitude,
        closingDate: tender.closingDate || '',
        distanceToSite: tender.distanceToSite || 0,
        contact: tender.contact || '',
        customer: tender.customer || '',
        quoteNo: tender.quoteNo || '',
        roofCoveringSheeting: tender.roofCoveringSheeting || false,
        roofCoveringTiles: tender.roofCoveringTiles || false,
        timberStructure: tender.timberStructure || false,
        totalValueExcl: tender.totalValueExcl || 0,
        totalValueExclBase: tender.totalValueExclBase || 0,
        exchangeRate: tender.exchangeRate || 1,
        newDesigner: tender.newDesigner || '',
        newNotes: tender.newNotes || '',
        newPricingSubmitted: tender.newPricingSubmitted || false,
        newSubmissionDate: tender.newSubmissionDate || '',
        newTenderStatus: tender.newTenderStatus || 0,
        transactionCurrencyId: tender.transactionCurrencyId || '',
      });

      if (tender.latitude && tender.longitude && map) {
        const position = { lat: tender.latitude, lng: tender.longitude };
        map.setCenter(position);
        if (marker) {
          marker.setPosition(position);
        }
      }
    }
    setError(null);
  }, [tender, map, marker]);

  const loadLookupData = async () => {
    try {
      const [contactsData, customersData, designersData, quotesData] = await Promise.all([
        d365ContactService.getAll(),
        customerService.getAll(),
        designerService.getAll(),
        d365QuoteService.getAll(),
      ]);
      setContacts(contactsData);
      setCustomers(customersData);
      setDesigners(designersData);
      setQuotes(quotesData);
    } catch (err) {
      console.error('Failed to load lookup data:', err);
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
    const mapElement = document.getElementById('tender-map');
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

    const input = document.getElementById('tender-address-autocomplete') as HTMLInputElement;
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
            streetAddress: place.formatted_address || '',
            latitude: position.lat(),
            longitude: position.lng(),
          }));

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

      if (tender) {
        await tenderService.update(tender.id, formData);
      } else {
        await tenderService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tender');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (tender) {
        await tenderService.update(tender.id, formData);
      } else {
        await tenderService.create(formData);
      }

      setFormData({
        name: '',
        description: '',
        fileLink: '',
        streetAddress: '',
        latitude: null,
        longitude: null,
        closingDate: '',
        distanceToSite: 0,
        contact: '',
        customer: '',
        quoteNo: '',
        roofCoveringSheeting: false,
        roofCoveringTiles: false,
        timberStructure: false,
        totalValueExcl: 0,
        totalValueExclBase: 0,
        exchangeRate: 1,
        newDesigner: '',
        newNotes: '',
        newPricingSubmitted: false,
        newSubmissionDate: '',
        newTenderStatus: 0,
        transactionCurrencyId: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tender');
      setSaving(false);
    }
  };

  const statusOptions: IDropdownOption[] = [
    { key: 0, text: 'Draft' },
    { key: 1, text: 'Submitted' },
    { key: 2, text: 'Won' },
    { key: 3, text: 'Lost' },
    { key: 4, text: 'Cancelled' },
  ];

  const contactOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...contacts.map((c) => ({ key: c.id, text: c.fullName || `${c.firstName} ${c.lastName}` })),
  ];

  const customerOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...customers.map((c) => ({ key: c.id, text: c.accountName })),
  ];

  const designerOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...designers.map((d) => ({ key: d.id, text: d.name })),
  ];

  const quoteOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...quotes.map((q) => ({ key: q.id, text: q.name || q.quoteNumber || `Quote ${q.id}` })),
  ];

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
    ...(tender && onDelete
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
        {tender ? 'Edit Tender' : 'New Tender'}
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
              text="Location & Details"
              iconProps={{ iconName: 'MapPin' }}
              onClick={() => setActiveTab('location')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'location' ? '#0078d4' : 'transparent',
                  color: activeTab === 'location' ? 'white' : '#323130',
                  fontWeight: activeTab === 'location' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'location' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'location' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Scope"
              iconProps={{ iconName: 'CheckboxComposite' }}
              onClick={() => setActiveTab('scope')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'scope' ? '#0078d4' : 'transparent',
                  color: activeTab === 'scope' ? 'white' : '#323130',
                  fontWeight: activeTab === 'scope' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'scope' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'scope' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Financial"
              iconProps={{ iconName: 'Money' }}
              onClick={() => setActiveTab('financial')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'financial' ? '#0078d4' : 'transparent',
                  color: activeTab === 'financial' ? 'white' : '#323130',
                  fontWeight: activeTab === 'financial' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'financial' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'financial' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Submission"
              iconProps={{ iconName: 'Send' }}
              onClick={() => setActiveTab('submission')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'submission' ? '#0078d4' : 'transparent',
                  color: activeTab === 'submission' ? 'white' : '#323130',
                  fontWeight: activeTab === 'submission' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'submission' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'submission' ? 'white' : '#323130',
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
                  label="Description"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(_, value) => setFormData({ ...formData, description: value || '' })}
                />

                <Dropdown
                  label="Customer"
                  options={customerOptions}
                  selectedKey={formData.customer || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, customer: option?.key as string || '' })
                  }
                />

                <Dropdown
                  label="Contact"
                  options={contactOptions}
                  selectedKey={formData.contact || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, contact: option?.key as string || '' })
                  }
                />

                <Dropdown
                  label="Quote No"
                  options={quoteOptions}
                  selectedKey={formData.quoteNo || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, quoteNo: option?.key as string || '' })
                  }
                />
              </Stack>
            )}

            {activeTab === 'location' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16 } }}>
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="end">
                  <TextField
                    id="tender-address-autocomplete"
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
                  id="tender-map"
                  style={{
                    height: '400px',
                    width: '100%',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                  }}
                />

                <TextField
                  label="Street Address"
                  multiline
                  rows={2}
                  value={formData.streetAddress}
                  onChange={(_, value) =>
                    setFormData({ ...formData, streetAddress: value || '' })
                  }
                />

                <TextField
                  label="Distance to Site (km)"
                  type="number"
                  value={String(formData.distanceToSite)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, distanceToSite: Number(value) || 0 })
                  }
                />

                <TextField
                  label="File Link"
                  value={formData.fileLink}
                  onChange={(_, value) => setFormData({ ...formData, fileLink: value || '' })}
                />

                {formData.latitude && formData.longitude && (
                  <Text variant="small">
                    Coordinates: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </Text>
                )}
              </Stack>
            )}

            {activeTab === 'scope' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <Checkbox
                  label="Roof Covering - Sheeting"
                  checked={formData.roofCoveringSheeting}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, roofCoveringSheeting: checked || false })
                  }
                />

                <Checkbox
                  label="Roof Covering - Tiles"
                  checked={formData.roofCoveringTiles}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, roofCoveringTiles: checked || false })
                  }
                />

                <Checkbox
                  label="Timber Structure"
                  checked={formData.timberStructure}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, timberStructure: checked || false })
                  }
                />
              </Stack>
            )}

            {activeTab === 'financial' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <TextField
                  label="Total Value (Excl)"
                  type="number"
                  value={String(formData.totalValueExcl)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, totalValueExcl: Number(value) || 0 })
                  }
                />

                <TextField
                  label="Total Value Base (Excl)"
                  type="number"
                  value={String(formData.totalValueExclBase)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, totalValueExclBase: Number(value) || 0 })
                  }
                />

                <TextField
                  label="Exchange Rate"
                  type="number"
                  value={String(formData.exchangeRate)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, exchangeRate: Number(value) || 1 })
                  }
                />

                <TextField
                  label="Transaction Currency ID"
                  value={formData.transactionCurrencyId}
                  onChange={(_, value) =>
                    setFormData({ ...formData, transactionCurrencyId: value || '' })
                  }
                />
              </Stack>
            )}

            {activeTab === 'submission' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
                <DatePicker
                  label="Closing Date"
                  value={formData.closingDate ? new Date(formData.closingDate) : undefined}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, closingDate: date?.toISOString() || '' })
                  }
                />

                <Dropdown
                  label="Designer"
                  options={designerOptions}
                  selectedKey={formData.newDesigner || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, newDesigner: option?.key as string || '' })
                  }
                />

                <Dropdown
                  label="Tender Status"
                  options={statusOptions}
                  selectedKey={formData.newTenderStatus}
                  onChange={(_, option) =>
                    setFormData({ ...formData, newTenderStatus: Number(option?.key) || 0 })
                  }
                />

                <Checkbox
                  label="Pricing Submitted"
                  checked={formData.newPricingSubmitted}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, newPricingSubmitted: checked || false })
                  }
                />

                <DatePicker
                  label="Submission Date"
                  value={
                    formData.newSubmissionDate ? new Date(formData.newSubmissionDate) : undefined
                  }
                  onSelectDate={(date) =>
                    setFormData({ ...formData, newSubmissionDate: date?.toISOString() || '' })
                  }
                />

                <TextField
                  label="Notes"
                  multiline
                  rows={4}
                  value={formData.newNotes}
                  onChange={(_, value) => setFormData({ ...formData, newNotes: value || '' })}
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
