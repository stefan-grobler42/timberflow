import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  Dropdown,
} from '@fluentui/react';
import type { IDropdownOption, IColumn } from '@fluentui/react';
import { accountService, d365ContactService, d365QuoteService, d365OrderService, lookupService } from '../services/d365Services';
import { tenderService } from '../services/millenniumServices';
import { useLookupData } from '../hooks/useLookupData';
import { resolveLookup } from '../utils/lookupHelpers';
import { StandardLookupField, StandardPhoneField, StandardFormHeader, type LookupOption } from './standards';
import { RelatedEntityGrid } from './RelatedEntityGrid';
import { D365ContactFormWrapper } from './D365ContactFormWrapper';
import { D365QuoteFormWrapper } from './D365QuoteFormWrapper';
import { D365OrderFormWrapper } from './D365OrderFormWrapper';
import { TenderFormWrapper } from './TenderFormWrapper';
import type { Account, D365Contact, D365Quote, D365Order, Tender } from '../types/millennium';

declare global {
  interface Window {
    google: any;
  }
}

declare const google: any;

interface AccountFormProps {
  account?: Account;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

const companyTypeOptions: IDropdownOption[] = [
  { key: 1, text: 'Developer' },
  { key: 2, text: 'Contractor' },
  { key: 3, text: 'Supplier' },
  { key: 4, text: 'Architect' },
  { key: 5, text: 'Engineer' },
];

const accountTypeOptions: IDropdownOption[] = [
  { key: 1, text: 'Cash' },
  { key: 2, text: 'Credit' },
  { key: 3, text: 'COD' },
];

const relationshipTypeOptions: IDropdownOption[] = [
  { key: 1, text: 'Customer' },
  { key: 2, text: 'Supplier' },
  { key: 3, text: 'Partner' },
  { key: 4, text: 'Competitor' },
];

export const AccountForm = ({
  account,
  onDismiss,
  onSave,
  onDelete,
}: AccountFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    accountNumber: '',
    cr694CompanyType: undefined,
    cr694CompanyRegistrationNumber: '',
    cr694VatRegistrationNo: '',
    telephone1: '',
    emailAddress1: '',
    websiteUrl: '',
    parentAccountId: undefined,
    cr694AccountType: undefined,
    cr694SalesRepresentative: undefined,
    relationshipTypeCode: undefined,
    primaryContactId: undefined,
    address1Name: '',
    address1Line1: '',
    address1Line2: '',
    address1Line3: '',
    address1City: '',
    address1StateOrProvince: '',
    address1PostalCode: '',
    address1Country: '',
    address1County: '',
    address1Latitude: undefined,
    address1Longitude: undefined,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  
  const [contacts, setContacts] = useState<D365Contact[]>([]);
  const [quotes, setQuotes] = useState<D365Quote[]>([]);
  const [orders, setOrders] = useState<D365Order[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  
  const lookupData = useLookupData();

  // Search functions for AsyncLookupField using backend API
  const searchAccounts = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await lookupService.searchAccounts(searchTerm);
      return results.map(r => ({ id: r.id, text: r.text }));
    } catch (error) {
      console.error('Error searching accounts:', error);
      return [];
    }
  };

  const searchEmployees = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await lookupService.searchEmployees(searchTerm);
      return results.map(r => ({ id: r.id, text: r.text }));
    } catch (error) {
      console.error('Error searching employees:', error);
      return [];
    }
  };

  const searchContacts = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await lookupService.searchContacts(searchTerm);
      return results.map(r => ({ id: r.id, text: r.text }));
    } catch (error) {
      console.error('Error searching contacts:', error);
      return [];
    }
  };

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        accountNumber: account.accountNumber || '',
        cr694CompanyType: account.cr694CompanyType,
        cr694CompanyRegistrationNumber: account.cr694CompanyRegistrationNumber || '',
        cr694VatRegistrationNo: account.cr694VatRegistrationNo || '',
        telephone1: account.telephone1 || '',
        emailAddress1: account.emailAddress1 || '',
        websiteUrl: account.websiteUrl || '',
        parentAccountId: account.parentAccountId,
        cr694AccountType: account.cr694AccountType,
        cr694SalesRepresentative: account.cr694SalesRepresentative,
        relationshipTypeCode: account.relationshipTypeCode,
        primaryContactId: account.primaryContactId,
        address1Name: account.address1Name || '',
        address1Line1: account.address1Line1 || '',
        address1Line2: account.address1Line2 || '',
        address1Line3: account.address1Line3 || '',
        address1City: account.address1City || '',
        address1StateOrProvince: account.address1StateOrProvince || '',
        address1PostalCode: account.address1PostalCode || '',
        address1Country: account.address1Country || '',
        address1County: account.address1County || '',
        address1Latitude: account.address1Latitude,
        address1Longitude: account.address1Longitude,
      });

      if (account.address1Latitude && account.address1Longitude && map) {
        const position = { lat: account.address1Latitude, lng: account.address1Longitude };
        map.setCenter(position);
        if (marker) {
          marker.setPosition(position);
        }
      }

      loadRelatedData(account.id);
    }
    setError(null);
  }, [account, map, marker]);

  useEffect(() => {
    initializeGoogleMaps();
  }, []);

  const loadRelatedData = async (accountId: string) => {
    try {
      const accountIdLower = accountId.toLowerCase();
      const [contactsData, quotesData, ordersData, tendersData] = await Promise.all([
        d365ContactService.getAll().then((data) => data.filter((c: D365Contact) => c.parentCustomerId?.toLowerCase() === accountIdLower)),
        d365QuoteService.getAll().then((data) => data.filter((q: D365Quote) => q.customerId?.toLowerCase() === accountIdLower)),
        d365OrderService.getAll().then((data) => data.filter((o: D365Order) => o.customerId?.toLowerCase() === accountIdLower)),
        tenderService.getAll().then((data) => data.filter((t: Tender) => t.customer?.toLowerCase() === accountIdLower)),
      ]);

      setContacts(contactsData);
      setQuotes(quotesData);
      setOrders(ordersData);
      setTenders(tendersData);
    } catch (err) {
      console.error('Failed to load related data:', err);
    }
  };

  const getAvailableContacts = async (): Promise<D365Contact[]> => {
    if (!account?.id) return [];
    
    try {
      const allContacts = await d365ContactService.getAll();
      const accountIdLower = account.id.toLowerCase();
      
      return allContacts.filter(
        (contact) => 
          !contact.parentCustomerId || 
          contact.parentCustomerId.toLowerCase() !== accountIdLower
      );
    } catch (err) {
      console.error('Failed to load available contacts:', err);
      return [];
    }
  };

  const handleLinkContacts = async (selectedIds: string[]) => {
    if (!account?.id) return;
    
    try {
      await Promise.all(
        selectedIds.map((contactId) =>
          d365ContactService.update(contactId, { parentCustomerId: account.id })
        )
      );
      
      await loadRelatedData(account.id);
    } catch (err) {
      console.error('Failed to link contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to link contacts');
    }
  };

  const initializeGoogleMaps = () => {
    if (typeof google === 'undefined' || !google.maps) {
      // Check if script is already being loaded
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
    const mapElement = document.getElementById('account-form-map');
    const searchInput = document.getElementById('address-search-input') as HTMLInputElement;
    
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
        let city = '';
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
          if (types.includes('locality')) {
            city = component.long_name;
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
          address1City: city,
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (account) {
        await accountService.update(account.id, formData);
      } else {
        await accountService.create(formData);
      }

      onSave();
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
      setSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (account) {
        await accountService.update(account.id, formData);
      } else {
        await accountService.create(formData);
      }

      onSave();
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
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

  const contactColumns: IColumn[] = [
    {
      key: 'fullName',
      name: 'Full Name',
      fieldName: 'fullName',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
    },
    {
      key: 'emailAddress1',
      name: 'Email',
      fieldName: 'emailAddress1',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
    },
    {
      key: 'telephone1',
      name: 'Phone',
      fieldName: 'telephone1',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
    },
  ];

  const quoteColumns: IColumn[] = [
    {
      key: 'quoteNumber',
      name: 'Quote Number',
      fieldName: 'quoteNumber',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'totalAmount',
      name: 'Total Amount',
      fieldName: 'totalAmount',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: D365Quote) => item.totalAmount ? `R ${item.totalAmount.toFixed(2)}` : '-',
    },
  ];

  const orderColumns: IColumn[] = [
    {
      key: 'orderNumber',
      name: 'Order Number',
      fieldName: 'orderNumber',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'totalAmount',
      name: 'Total Amount',
      fieldName: 'totalAmount',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: D365Order) => item.totalAmount ? `R ${item.totalAmount.toFixed(2)}` : '-',
    },
  ];

  const tenderColumns: IColumn[] = [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'closingDate',
      name: 'Closing Date',
      fieldName: 'closingDate',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: Tender) => item.closingDate ? new Date(item.closingDate).toLocaleDateString() : '-',
    },
    {
      key: 'totalValueExcl',
      name: 'Total Value',
      fieldName: 'totalValueExcl',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: Tender) => item.totalValueExcl ? `R ${item.totalValueExcl.toFixed(2)}` : '-',
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 0 }} styles={{ root: { height: '100%', backgroundColor: 'white' } }}>
      <StandardFormHeader
        title={account ? (account.name || 'New Account') : 'New Account'}
        subtitle="Account"
        onBack={onDismiss}
        onSave={handleSave}
        onSaveAndExit={handleSaveAndExit}
        onDelete={account && onDelete ? handleDelete : undefined}
        onCancel={onDismiss}
        saving={saving}
        isNew={!account}
      />

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <Stack horizontal styles={{ root: { borderBottom: '1px solid #edebe9', backgroundColor: '#faf9f8' } }}>
        <DefaultButton text="Summary" onClick={() => setActiveTab('summary')} styles={tabStyles(activeTab === 'summary')} />
        <DefaultButton text="Quotes" onClick={() => setActiveTab('quotes')} styles={tabStyles(activeTab === 'quotes')} />
        <DefaultButton text="Orders" onClick={() => setActiveTab('orders')} styles={tabStyles(activeTab === 'orders')} />
        <DefaultButton text="Tenders" onClick={() => setActiveTab('tenders')} styles={tabStyles(activeTab === 'tenders')} />
      </Stack>

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: 20 } }}>
        {activeTab === 'summary' && (
          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { width: '60%', flexShrink: 0 } }}>
              <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                ACCOUNT INFORMATION
              </Text>

              <TextField
                label="Account Number"
                value={formData.accountNumber}
                onChange={(_, value) => setFormData({ ...formData, accountNumber: value || '' })}
              />

              <TextField
                label="Account Name"
                required
                value={formData.name}
                onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
              />

              <Dropdown
                label="Company Type"
                options={companyTypeOptions}
                selectedKey={formData.cr694CompanyType}
                onChange={(_, option) => setFormData({ ...formData, cr694CompanyType: option?.key as number })}
              />

              <TextField
                label="Company Registration No"
                value={formData.cr694CompanyRegistrationNumber}
                onChange={(_, value) => setFormData({ ...formData, cr694CompanyRegistrationNumber: value || '' })}
              />

              <TextField
                label="VAT Registration No"
                value={formData.cr694VatRegistrationNo}
                onChange={(_, value) => setFormData({ ...formData, cr694VatRegistrationNo: value || '' })}
              />

              <StandardPhoneField
                label="Phone"
                value={formData.telephone1 || ''}
                onChange={(phone) => setFormData({ ...formData, telephone1: phone })}
              />

              <TextField
                label="Email"
                type="email"
                value={formData.emailAddress1}
                onChange={(_, value) => setFormData({ ...formData, emailAddress1: value || '' })}
              />

              <TextField
                label="Website"
                value={formData.websiteUrl}
                onChange={(_, value) => setFormData({ ...formData, websiteUrl: value || '' })}
              />

              <StandardLookupField
                label="Parent Account"
                value={formData.parentAccountId}
                selectedText={formData.parentAccountId ? resolveLookup(formData.parentAccountId, lookupData.customers) : ''}
                entityName="Account"
                onChange={(id) => setFormData({ ...formData, parentAccountId: id })}
                onSearch={searchAccounts}
              />

              <Dropdown
                label="Account Type"
                options={accountTypeOptions}
                selectedKey={formData.cr694AccountType}
                onChange={(_, option) => setFormData({ ...formData, cr694AccountType: option?.key as number })}
              />

              <StandardLookupField
                label="Sales Representative"
                value={formData.cr694SalesRepresentative}
                selectedText={formData.cr694SalesRepresentative ? resolveLookup(formData.cr694SalesRepresentative, lookupData.employees) : ''}
                entityName="Employee"
                onChange={(id) => setFormData({ ...formData, cr694SalesRepresentative: id })}
                onSearch={searchEmployees}
              />

              <Dropdown
                label="Relationship Type"
                options={relationshipTypeOptions}
                selectedKey={formData.relationshipTypeCode}
                onChange={(_, option) => setFormData({ ...formData, relationshipTypeCode: option?.key as number })}
              />

              <StandardLookupField
                label="Primary Contact"
                value={formData.primaryContactId}
                selectedText={formData.primaryContactId ? resolveLookup(formData.primaryContactId, lookupData.contacts) : ''}
                entityName="Contact"
                onChange={(id) => setFormData({ ...formData, primaryContactId: id })}
                onSearch={searchContacts}
              />

              <RelatedEntityGrid
                title="Contacts"
                items={contacts}
                columns={contactColumns}
                entityName="Contact"
                parentId={account?.id}
                onRefresh={() => account?.id && loadRelatedData(account.id)}
                FormComponent={D365ContactFormWrapper}
                onDelete={async (id) => await d365ContactService.delete(id)}
                getItemId={(item) => item.id}
                onLinkExisting={handleLinkContacts}
                getAllAvailableItems={getAvailableContacts}
              />
            </Stack>

            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { width: '38%', flexShrink: 0 } }}>
              <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                ADDRESS
              </Text>

              <TextField
                id="address-search-input"
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
                id="account-form-map"
                style={{
                  height: '250px',
                  width: '100%',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  marginTop: 16,
                }}
              />
            </Stack>
          </Stack>
        )}

        {activeTab === 'quotes' && (
          <RelatedEntityGrid
            title="Quotes"
            items={quotes}
            columns={quoteColumns}
            entityName="Quote"
            parentId={account?.id}
            onRefresh={() => account?.id && loadRelatedData(account.id)}
            FormComponent={D365QuoteFormWrapper}
            onDelete={async (id) => await d365QuoteService.delete(id)}
            getItemId={(item) => item.id}
          />
        )}

        {activeTab === 'orders' && (
          <RelatedEntityGrid
            title="Orders"
            items={orders}
            columns={orderColumns}
            entityName="Order"
            parentId={account?.id}
            onRefresh={() => account?.id && loadRelatedData(account.id)}
            FormComponent={D365OrderFormWrapper}
            onDelete={async (id) => await d365OrderService.delete(id)}
            getItemId={(item) => item.id}
          />
        )}

        {activeTab === 'tenders' && (
          <RelatedEntityGrid
            title="Tenders"
            items={tenders}
            columns={tenderColumns}
            entityName="Tender"
            parentId={account?.id}
            onRefresh={() => account?.id && loadRelatedData(account.id)}
            FormComponent={TenderFormWrapper}
            onDelete={async (id) => await tenderService.delete(id)}
            getItemId={(item) => item.id}
          />
        )}
      </Stack>
    </Stack>
  );
};
