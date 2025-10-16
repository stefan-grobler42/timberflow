import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  PrimaryButton,
  Dropdown,
  DetailsList,
  SelectionMode,
} from '@fluentui/react';
import type { IDropdownOption, IColumn } from '@fluentui/react';
import { accountService } from '../services/d365Services';
import { useLookupData } from '../hooks/useLookupData';
import { resolveLookup } from '../utils/lookupHelpers';
import type { Account } from '../types/millennium';

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  
  const lookupData = useLookupData();

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
    }
    setError(null);
  }, [account, map, marker]);

  useEffect(() => {
    initializeGoogleMaps();
  }, []);

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
    const mapElement = document.getElementById('account-form-map');
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

    setMap(mapInstance);
    setMarker(markerInstance);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (account) {
        await accountService.update(account.id, formData);
      } else {
        await accountService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
      setSaving(false);
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
  ];

  return (
    <Stack tokens={{ childrenGap: 0 }} styles={{ root: { height: '100%', backgroundColor: 'white' } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { padding: '12px 20px', borderBottom: '1px solid #edebe9' } }}>
        <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="center">
          <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
            {account ? account.name : 'New Account'}
          </Text>
          <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
            Account
          </Text>
        </Stack>
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <DefaultButton text="Cancel" onClick={onDismiss} disabled={saving} />
          <PrimaryButton text="Save" onClick={handleSubmit} disabled={saving} />
        </Stack>
      </Stack>

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
        <DefaultButton text="Related" onClick={() => setActiveTab('related')} styles={tabStyles(activeTab === 'related')} />
      </Stack>

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: 20 } }}>
        {activeTab === 'summary' && (
          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: '0 0 60%' } }}>
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

              <TextField
                label="Phone"
                value={formData.telephone1}
                onChange={(_, value) => setFormData({ ...formData, telephone1: value || '' })}
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

              <TextField
                label="Parent Account"
                value={formData.parentAccountId ? resolveLookup(formData.parentAccountId, lookupData.customers) : ''}
                readOnly
                iconProps={{ iconName: 'Search' }}
              />

              <Dropdown
                label="Account Type"
                options={accountTypeOptions}
                selectedKey={formData.cr694AccountType}
                onChange={(_, option) => setFormData({ ...formData, cr694AccountType: option?.key as number })}
              />

              <TextField
                label="Sales Representative"
                value={formData.cr694SalesRepresentative ? resolveLookup(formData.cr694SalesRepresentative, lookupData.employees) : ''}
                readOnly
                iconProps={{ iconName: 'Search' }}
              />

              <Dropdown
                label="Relationship Type"
                options={relationshipTypeOptions}
                selectedKey={formData.relationshipTypeCode}
                onChange={(_, option) => setFormData({ ...formData, relationshipTypeCode: option?.key as number })}
              />

              <TextField
                label="Primary Contact"
                value={formData.primaryContactId ? resolveLookup(formData.primaryContactId, lookupData.customers) : ''}
                readOnly
                iconProps={{ iconName: 'Search' }}
              />

              <Stack styles={{ root: { marginTop: 24 } }}>
                <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 12 } }}>
                  CONTACTS
                </Text>
                <DetailsList
                  items={[]}
                  columns={contactColumns}
                  selectionMode={SelectionMode.none}
                  styles={{ root: { minHeight: 100 } }}
                />
              </Stack>
            </Stack>

            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: '0 0 38%' } }}>
              <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                ADDRESS
              </Text>

              <TextField
                label="Address 1: Name"
                value={formData.address1Name}
                onChange={(_, value) => setFormData({ ...formData, address1Name: value || '' })}
              />

              <TextField
                label="Address 1: Street 1"
                value={formData.address1Line1}
                onChange={(_, value) => setFormData({ ...formData, address1Line1: value || '' })}
              />

              <TextField
                label="Address 1: Street 2"
                value={formData.address1Line2}
                onChange={(_, value) => setFormData({ ...formData, address1Line2: value || '' })}
              />

              <TextField
                label="Address 1: Street 3"
                value={formData.address1Line3}
                onChange={(_, value) => setFormData({ ...formData, address1Line3: value || '' })}
              />

              <TextField
                label="Address 1: City"
                value={formData.address1City}
                onChange={(_, value) => setFormData({ ...formData, address1City: value || '' })}
              />

              <TextField
                label="Address 1: State/Province"
                value={formData.address1StateOrProvince}
                onChange={(_, value) => setFormData({ ...formData, address1StateOrProvince: value || '' })}
              />

              <TextField
                label="Address 1: ZIP/Postal code"
                value={formData.address1PostalCode}
                onChange={(_, value) => setFormData({ ...formData, address1PostalCode: value || '' })}
              />

              <TextField
                label="Address 1: Country/Region"
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
          <Text>Quotes grid will be shown here (filtered by account)</Text>
        )}

        {activeTab === 'orders' && (
          <Text>Orders grid will be shown here (filtered by account)</Text>
        )}

        {activeTab === 'tenders' && (
          <Text>Tenders grid will be shown here (filtered by account)</Text>
        )}

        {activeTab === 'related' && (
          <Text>Related records will be shown here</Text>
        )}
      </Stack>
    </Stack>
  );
};
