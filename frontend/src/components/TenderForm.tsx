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
import type { ICommandBarItemProps, IColumn, IDropdownOption } from '@fluentui/react';
import { tenderService, designerService } from '../services';
import { d365ContactService, d365QuoteService, accountService } from '../services/d365Services';
import type { Tender, Account, Designer, D365Contact, D365Quote } from '../types/millennium';
import { LookupField } from './LookupField';
import type { LookupOption } from './LookupField';
import { AdvancedSearchDialog } from './AdvancedSearchDialog';
import { CustomerFormFullScreen } from './CustomerFormFullScreen';
import { D365ContactForm } from './D365ContactForm';
import { DesignerForm } from './DesignerForm';
import { D365QuoteForm } from './D365QuoteForm';
import { PeekView } from './PeekView';

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
  const [customers, setCustomers] = useState<Account[]>([]);
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [quotes, setQuotes] = useState<D365Quote[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showDesignerSearch, setShowDesignerSearch] = useState(false);
  const [showQuoteSearch, setShowQuoteSearch] = useState(false);
  
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showDesignerForm, setShowDesignerForm] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  
  const [selectedCustomerText, setSelectedCustomerText] = useState<string | undefined>();
  const [selectedContactText, setSelectedContactText] = useState<string | undefined>();
  const [selectedDesignerText, setSelectedDesignerText] = useState<string | undefined>();
  const [selectedQuoteText, setSelectedQuoteText] = useState<string | undefined>();

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

      if (tender.customer && customers.length > 0) {
        const cust = customers.find(c => c.id === tender.customer);
        setSelectedCustomerText(cust?.name);
      }
      if (tender.contact && contacts.length > 0) {
        const cont = contacts.find(c => c.id === tender.contact);
        setSelectedContactText(cont?.fullName || `${cont?.firstName} ${cont?.lastName}`);
      }
      if (tender.newDesigner && designers.length > 0) {
        const des = designers.find(d => d.id === tender.newDesigner);
        setSelectedDesignerText(des?.name);
      }
      if (tender.quoteNo && quotes.length > 0) {
        const qt = quotes.find(q => q.id === tender.quoteNo);
        setSelectedQuoteText(qt?.name || qt?.quoteNumber || `Quote ${qt?.id}`);
      }

      if (tender.latitude && tender.longitude && map) {
        const position = { lat: tender.latitude, lng: tender.longitude };
        map.setCenter(position);
        if (marker) {
          marker.setPosition(position);
        }
      }
    }
    setError(null);
  }, [tender, map, marker, customers, contacts, designers, quotes]);

  const loadLookupData = async () => {
    try {
      const [contactsData, customersData, designersData, quotesData] = await Promise.all([
        d365ContactService.getAll(),
        accountService.getAll(),
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

  const contactLookupOptions: LookupOption[] = contacts.map((c) => ({
    id: c.id,
    text: c.fullName || `${c.firstName} ${c.lastName}`,
    subText: c.emailAddress1,
    record: c
  }));

  const customerLookupOptions: LookupOption[] = customers.map((c) => ({
    id: c.id,
    text: c.name || c.accountNumber || '',
    subText: c.telephone1,
    record: c
  }));

  const designerLookupOptions: LookupOption[] = designers.map((d) => ({
    id: d.id,
    text: d.name,
    subText: d.emailAddress,
    record: d
  }));

  const quoteLookupOptions: LookupOption[] = quotes.map((q) => ({
    id: q.id,
    text: q.name || q.quoteNumber || `Quote ${q.id}`,
    subText: q.totalAmount ? `Amount: ${q.totalAmount}` : undefined,
    record: q
  }));

  const customerSearchColumns: IColumn[] = [
    { key: 'name', name: 'Account Name', fieldName: 'name', minWidth: 200, isResizable: true },
    { key: 'telephone1', name: 'Phone', fieldName: 'telephone1', minWidth: 120, isResizable: true },
    { key: 'emailAddress1', name: 'Email', fieldName: 'emailAddress1', minWidth: 180, isResizable: true },
  ];

  const contactSearchColumns: IColumn[] = [
    { key: 'fullName', name: 'Name', fieldName: 'fullName', minWidth: 150, isResizable: true },
    { key: 'emailAddress1', name: 'Email', fieldName: 'emailAddress1', minWidth: 180, isResizable: true },
    { key: 'telephone1', name: 'Phone', fieldName: 'telephone1', minWidth: 120, isResizable: true },
  ];

  const designerSearchColumns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, isResizable: true },
    { key: 'emailAddress', name: 'Email', fieldName: 'emailAddress', minWidth: 180, isResizable: true },
    { key: 'cellNumber', name: 'Mobile', fieldName: 'cellNumber', minWidth: 120, isResizable: true },
  ];

  const quoteSearchColumns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, isResizable: true },
    { key: 'quoteNumber', name: 'Quote Number', fieldName: 'quoteNumber', minWidth: 120, isResizable: true },
    { key: 'totalAmount', name: 'Total Amount', fieldName: 'totalAmount', minWidth: 120, isResizable: true },
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
    <>
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

                <LookupField
                  label="Customer"
                  value={formData.customer}
                  selectedText={selectedCustomerText}
                  options={customerLookupOptions}
                  onChange={(id, text) => {
                    setFormData({ ...formData, customer: id || '' });
                    setSelectedCustomerText(text);
                  }}
                  onAdvancedSearch={() => setShowCustomerSearch(true)}
                  onCreateNew={() => setShowCustomerForm(true)}
                  entityName="Customer"
                  showPeekView={true}
                  peekViewContent={
                    formData.customer ? (
                      <PeekView
                        title={customers.find(c => c.id === formData.customer)?.name || 'Customer'}
                        fields={[
                          { label: 'Phone', value: customers.find(c => c.id === formData.customer)?.telephone1 },
                          { label: 'Email', value: customers.find(c => c.id === formData.customer)?.emailAddress1 },
                          { label: 'City', value: customers.find(c => c.id === formData.customer)?.address1City },
                          { label: 'Account Number', value: customers.find(c => c.id === formData.customer)?.accountNumber },
                        ]}
                      />
                    ) : undefined
                  }
                />

                <LookupField
                  label="Contact"
                  value={formData.contact}
                  selectedText={selectedContactText}
                  options={contactLookupOptions}
                  onChange={(id, text) => {
                    setFormData({ ...formData, contact: id || '' });
                    setSelectedContactText(text);
                  }}
                  onAdvancedSearch={() => setShowContactSearch(true)}
                  onCreateNew={() => setShowContactForm(true)}
                  entityName="Contact"
                  showPeekView={true}
                  peekViewContent={
                    formData.contact ? (
                      <PeekView
                        title={contacts.find(c => c.id === formData.contact)?.fullName || 'Contact'}
                        fields={[
                          { label: 'Job Title', value: contacts.find(c => c.id === formData.contact)?.jobTitle },
                          { label: 'Email', value: contacts.find(c => c.id === formData.contact)?.emailAddress1 },
                          { label: 'Phone', value: contacts.find(c => c.id === formData.contact)?.telephone1 },
                          { label: 'Mobile', value: contacts.find(c => c.id === formData.contact)?.mobilePhone },
                        ]}
                      />
                    ) : undefined
                  }
                />

                <LookupField
                  label="Quote No"
                  value={formData.quoteNo}
                  selectedText={selectedQuoteText}
                  options={quoteLookupOptions}
                  onChange={(id, text) => {
                    setFormData({ ...formData, quoteNo: id || '' });
                    setSelectedQuoteText(text);
                  }}
                  onAdvancedSearch={() => setShowQuoteSearch(true)}
                  onCreateNew={() => setShowQuoteForm(true)}
                  entityName="Quote"
                  showPeekView={true}
                  peekViewContent={
                    formData.quoteNo ? (
                      <PeekView
                        title={quotes.find(q => q.id === formData.quoteNo)?.name || 'Quote'}
                        fields={[
                          { label: 'Quote Number', value: quotes.find(q => q.id === formData.quoteNo)?.quoteNumber },
                          { label: 'Total Amount', value: quotes.find(q => q.id === formData.quoteNo)?.totalAmount },
                          { label: 'Status', value: quotes.find(q => q.id === formData.quoteNo)?.statusCode?.toString() },
                          { label: 'Description', value: quotes.find(q => q.id === formData.quoteNo)?.description },
                        ]}
                      />
                    ) : undefined
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

                <LookupField
                  label="Designer"
                  value={formData.newDesigner}
                  selectedText={selectedDesignerText}
                  options={designerLookupOptions}
                  onChange={(id, text) => {
                    setFormData({ ...formData, newDesigner: id || '' });
                    setSelectedDesignerText(text);
                  }}
                  onAdvancedSearch={() => setShowDesignerSearch(true)}
                  onCreateNew={() => setShowDesignerForm(true)}
                  entityName="Designer"
                  showPeekView={true}
                  peekViewContent={
                    formData.newDesigner ? (
                      <PeekView
                        title={designers.find(d => d.id === formData.newDesigner)?.name || 'Designer'}
                        fields={[
                          { label: 'Employee No', value: designers.find(d => d.id === formData.newDesigner)?.employeeNo },
                          { label: 'Email', value: designers.find(d => d.id === formData.newDesigner)?.emailAddress },
                          { label: 'Cell Number', value: designers.find(d => d.id === formData.newDesigner)?.cellNumber },
                        ]}
                      />
                    ) : undefined
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

      <AdvancedSearchDialog
        isOpen={showCustomerSearch}
        onDismiss={() => setShowCustomerSearch(false)}
        onSelect={(option) => {
          setFormData({ ...formData, customer: option.id });
          setSelectedCustomerText(option.text);
          setShowCustomerSearch(false);
        }}
        entityName="Customer"
        columns={customerSearchColumns}
        items={customers}
      />

      <AdvancedSearchDialog
        isOpen={showContactSearch}
        onDismiss={() => setShowContactSearch(false)}
        onSelect={(option) => {
          setFormData({ ...formData, contact: option.id });
          setSelectedContactText(option.text);
          setShowContactSearch(false);
        }}
        entityName="Contact"
        columns={contactSearchColumns}
        items={contacts}
      />

      <AdvancedSearchDialog
        isOpen={showDesignerSearch}
        onDismiss={() => setShowDesignerSearch(false)}
        onSelect={(option) => {
          setFormData({ ...formData, newDesigner: option.id });
          setSelectedDesignerText(option.text);
          setShowDesignerSearch(false);
        }}
        entityName="Designer"
        columns={designerSearchColumns}
        items={designers}
      />

      <AdvancedSearchDialog
        isOpen={showQuoteSearch}
        onDismiss={() => setShowQuoteSearch(false)}
        onSelect={(option) => {
          setFormData({ ...formData, quoteNo: option.id });
          setSelectedQuoteText(option.text);
          setShowQuoteSearch(false);
        }}
        entityName="Quote"
        columns={quoteSearchColumns}
        items={quotes}
      />

      {showCustomerForm && (
        <CustomerFormFullScreen
          onDismiss={() => {
            setShowCustomerForm(false);
            loadLookupData();
          }}
          onSave={() => {
            setShowCustomerForm(false);
            loadLookupData();
          }}
        />
      )}

      {showContactForm && (
        <D365ContactForm
          onDismiss={() => {
            setShowContactForm(false);
            loadLookupData();
          }}
          onSave={() => {
            setShowContactForm(false);
            loadLookupData();
          }}
        />
      )}

      {showDesignerForm && (
        <DesignerForm
          onDismiss={() => {
            setShowDesignerForm(false);
            loadLookupData();
          }}
          onSave={() => {
            setShowDesignerForm(false);
            loadLookupData();
          }}
        />
      )}

      {showQuoteForm && (
        <D365QuoteForm
          onDismiss={() => {
            setShowQuoteForm(false);
            loadLookupData();
          }}
          onSave={() => {
            setShowQuoteForm(false);
            loadLookupData();
          }}
        />
      )}
    </>
  );
};
