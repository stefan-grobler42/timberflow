import { useState, useEffect } from 'react';
import {
  Panel,
  PanelType,
  TextField,
  PrimaryButton,
  DefaultButton,
  Stack,
  Dropdown,
  Checkbox,
  MessageBar,
  MessageBarType,
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { customerService, companyService } from '../services';
import type { Customer, CreateCustomerDto, UpdateCustomerDto, Company } from '../types';

interface CustomerFormProps {
  isOpen: boolean;
  customer?: Customer;
  onDismiss: () => void;
  onSave: () => void;
}

export const CustomerForm = ({ isOpen, customer, onDismiss, onSave }: CustomerFormProps) => {
  const [formData, setFormData] = useState<Partial<CreateCustomerDto>>({
    accountNo: '',
    accountName: '',
    companyTypeId: undefined,
    email: '',
    phone: '',
    website: '',
    vatRegistrationNo: '',
    companyRegistrationNo: '',
    streetAddress: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    customerStatus: 'Prospect',
    isActive: true,
  });
  const [companyTypes, setCompanyTypes] = useState<Company[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCompanyTypes();
  }, []);

  useEffect(() => {
    if (customer) {
      setFormData({
        accountNo: customer.accountNo,
        accountName: customer.accountName,
        companyTypeId: customer.companyTypeId || undefined,
        email: customer.email,
        phone: customer.phone,
        website: customer.website || '',
        vatRegistrationNo: customer.vatRegistrationNo || '',
        companyRegistrationNo: customer.companyRegistrationNo || '',
        streetAddress: customer.streetAddress,
        city: customer.city,
        province: customer.province,
        postalCode: customer.postalCode,
        country: customer.country,
        customerStatus: customer.customerStatus,
        isActive: customer.isActive,
      });
    } else {
      setFormData({
        accountNo: '',
        accountName: '',
        companyTypeId: undefined,
        email: '',
        phone: '',
        website: '',
        vatRegistrationNo: '',
        companyRegistrationNo: '',
        streetAddress: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'South Africa',
        customerStatus: 'Prospect',
        isActive: true,
      });
    }
    setError(null);
  }, [customer, isOpen]);

  const loadCompanyTypes = async () => {
    try {
      const data = await companyService.getAll(true);
      setCompanyTypes(data);
    } catch (err) {
      console.error('Failed to load company types:', err);
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
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const onRenderFooterContent = () => (
    <Stack horizontal tokens={{ childrenGap: 8 }}>
      <PrimaryButton onClick={handleSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </PrimaryButton>
      <DefaultButton onClick={onDismiss} disabled={saving}>
        Cancel
      </DefaultButton>
    </Stack>
  );

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      type={PanelType.medium}
      headerText={customer ? 'Edit Customer' : 'New Customer'}
      onRenderFooterContent={onRenderFooterContent}
      isFooterAtBottom={true}
    >
      <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16 } }}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

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
            setFormData({ ...formData, companyTypeId: option?.key ? Number(option.key) : undefined })
          }
        />

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
          label="Website"
          value={formData.website}
          onChange={(_, value) => setFormData({ ...formData, website: value || '' })}
        />

        <TextField
          label="VAT Registration No"
          value={formData.vatRegistrationNo}
          onChange={(_, value) => setFormData({ ...formData, vatRegistrationNo: value || '' })}
        />

        <TextField
          label="Company Registration No"
          value={formData.companyRegistrationNo}
          onChange={(_, value) => setFormData({ ...formData, companyRegistrationNo: value || '' })}
        />

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

        <TextField
          label="Country"
          required
          value={formData.country}
          onChange={(_, value) => setFormData({ ...formData, country: value || '' })}
        />

        <Dropdown
          label="Customer Status"
          required
          options={statusOptions}
          selectedKey={formData.customerStatus}
          onChange={(_, option) => setFormData({ ...formData, customerStatus: option?.key as string })}
        />

        <Checkbox
          label="Active"
          checked={formData.isActive}
          onChange={(_, checked) => setFormData({ ...formData, isActive: checked || false })}
        />
      </Stack>
    </Panel>
  );
};
