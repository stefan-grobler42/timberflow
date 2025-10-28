import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  Dropdown,
  DatePicker,
  DetailsList,
  DetailsListLayoutMode,
  CommandBar,
  Text,
} from '@fluentui/react';
import type { IDropdownOption, IColumn, ICommandBarItemProps } from '@fluentui/react';
import { d365QuoteService, accountService, lookupService } from '../services/d365Services';
import { StandardLookupField, StandardPhoneField, StandardFormHeader, type LookupOption } from '../components/standards';
import { StandardAddressFields } from '../components/standards/StandardAddressFields';
import type { D365Quote, D365QuoteDetail } from '../types/millennium';

const statusOptions: IDropdownOption[] = [
  { key: 1, text: 'Draft' },
  { key: 2, text: 'Active' },
  { key: 3, text: 'Won' },
  { key: 4, text: 'Lost' },
  { key: 5, text: 'Closed' },
];

export const QuoteForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('general');
  const [formData, setFormData] = useState<Partial<D365Quote>>({
    quoteNumber: '',
    name: '',
    customerId: undefined,
    effectiveFrom: undefined,
    effectiveTo: undefined,
    requestDeliveryBy: undefined,
    expiresOn: undefined,
    statusCode: 1,
    description: '',
    billTo_Name: '',
    billTo_Line1: '',
    billTo_City: '',
    billTo_StateOrProvince: '',
    billTo_PostalCode: '',
    billTo_Country: '',
    billTo_Telephone: '',
    billTo_Latitude: undefined,
    billTo_Longitude: undefined,
    shipTo_Name: '',
    shipTo_Line1: '',
    shipTo_City: '',
    shipTo_StateOrProvince: '',
    shipTo_PostalCode: '',
    shipTo_Country: '',
    shipTo_Telephone: '',
    shipTo_Latitude: undefined,
    shipTo_Longitude: undefined,
    totalAmount: 0,
    totalLineItemAmount: 0,
    totalDiscountAmount: 0,
    discountPercentage: 0,
    totalTax: 0,
    freightAmount: 0,
    totalAmountLessFreight: 0,
  });

  const [customerName, setCustomerName] = useState('');
  const [quoteDetails, setQuoteDetails] = useState<D365QuoteDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && id !== 'new') {
      loadQuote(id);
    }
  }, [id]);

  const loadQuote = async (quoteId: string) => {
    try {
      const quote = await d365QuoteService.getById(quoteId);
      setFormData(quote);

      if (quote.customerId) {
        try {
          const customer = await accountService.getById(quote.customerId);
          setCustomerName(customer.name || '');
        } catch (err) {
          console.error('Failed to load customer:', err);
        }
      }

      // Load quote details if they exist
      if (quote.quoteDetails) {
        setQuoteDetails(quote.quoteDetails);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quote');
    }
  };

  const searchAccounts = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await lookupService.searchAccounts(searchTerm);
      return results.map((r) => ({ id: r.id, text: r.text }));
    } catch (error) {
      console.error('Error searching accounts:', error);
      return [];
    }
  };

  const handleSave = async (closeAfter: boolean) => {
    try {
      setSaving(true);
      setError(null);

      if (id && id !== 'new') {
        await d365QuoteService.update(id, formData);
      } else {
        const created = await d365QuoteService.create(formData);
        if (closeAfter) {
          navigate('/quotes');
        } else {
          navigate(`/quotes/${created.id}`);
        }
        return;
      }

      if (closeAfter) {
        navigate('/quotes');
      } else {
        await loadQuote(id!);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quote');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (id && id !== 'new' && window.confirm(`Are you sure you want to delete this quote?`)) {
      try {
        await d365QuoteService.delete(id);
        navigate('/quotes');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete quote');
      }
    }
  };

  const handleBack = () => {
    navigate('/quotes');
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

  const quoteDetailColumns: IColumn[] = [
    {
      key: 'productName',
      name: 'Product',
      fieldName: 'productName',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
    },
    {
      key: 'description',
      name: 'Description',
      fieldName: 'description',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'quantity',
      name: 'Quantity',
      fieldName: 'quantity',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
    },
    {
      key: 'pricePerUnit',
      name: 'Price Per Unit',
      fieldName: 'pricePerUnit',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: D365QuoteDetail) => <Text>{item.pricePerUnit ? `R ${item.pricePerUnit.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'manualDiscountAmount',
      name: 'Discount',
      fieldName: 'manualDiscountAmount',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      onRender: (item: D365QuoteDetail) => <Text>{item.manualDiscountAmount ? `R ${item.manualDiscountAmount.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'tax',
      name: 'Tax',
      fieldName: 'tax',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      onRender: (item: D365QuoteDetail) => <Text>{item.tax ? `R ${item.tax.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'extendedAmount',
      name: 'Extended Amount',
      fieldName: 'extendedAmount',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: D365QuoteDetail) => <Text>{item.extendedAmount ? `R ${item.extendedAmount.toFixed(2)}` : '-'}</Text>,
    },
  ];

  const lineItemsCommandBarItems: ICommandBarItemProps[] = [
    {
      key: 'addLineItem',
      text: 'Add Line Item',
      iconProps: { iconName: 'Add' },
      onClick: () => {
        // TODO: Implement add line item modal
        alert('Add Line Item functionality to be implemented');
      },
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 0 }} styles={{ root: { height: '100%', backgroundColor: 'white' } }}>
      <StandardFormHeader
        title={formData.name || 'New Quote'}
        subtitle="Quote"
        onBack={handleBack}
        onSave={() => handleSave(false)}
        onSaveAndClose={() => handleSave(true)}
        onDelete={id && id !== 'new' ? handleDelete : undefined}
        saving={saving}
        isNew={!id || id === 'new'}
      />

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <Stack horizontal styles={{ root: { borderBottom: '1px solid #edebe9', backgroundColor: '#faf9f8' } }}>
        <DefaultButton text="General" onClick={() => setActiveTab('general')} styles={tabStyles(activeTab === 'general')} />
        <DefaultButton text="Billing Address" onClick={() => setActiveTab('billing')} styles={tabStyles(activeTab === 'billing')} />
        <DefaultButton text="Shipping Address" onClick={() => setActiveTab('shipping')} styles={tabStyles(activeTab === 'shipping')} />
        <DefaultButton text="Financials" onClick={() => setActiveTab('financials')} styles={tabStyles(activeTab === 'financials')} />
        <DefaultButton text="Line Items" onClick={() => setActiveTab('lineitems')} styles={tabStyles(activeTab === 'lineitems')} />
      </Stack>

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: 20 } }}>
        {activeTab === 'general' && (
          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
              QUOTE INFORMATION
            </Text>

            <TextField
              label="Quote Number"
              value={formData.quoteNumber || ''}
              onChange={(_, value) => setFormData({ ...formData, quoteNumber: value || '' })}
              readOnly={id !== 'new'}
            />

            <TextField
              label="Name"
              required
              value={formData.name || ''}
              onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
            />

            <StandardLookupField
              label="Customer (Account)"
              value={formData.customerId}
              selectedText={customerName}
              entityName="Account"
              onChange={async (customerId) => {
                setFormData({ ...formData, customerId });
                if (customerId) {
                  try {
                    const customer = await accountService.getById(customerId);
                    setCustomerName(customer.name || '');
                  } catch (err) {
                    console.error('Failed to load customer:', err);
                  }
                } else {
                  setCustomerName('');
                }
              }}
              onSearch={searchAccounts}
            />

            <DatePicker
              label="Effective From"
              value={formData.effectiveFrom ? new Date(formData.effectiveFrom) : undefined}
              onSelectDate={(date) =>
                setFormData({
                  ...formData,
                  effectiveFrom: date ? date.toISOString() : undefined,
                })
              }
            />

            <DatePicker
              label="Effective To"
              value={formData.effectiveTo ? new Date(formData.effectiveTo) : undefined}
              onSelectDate={(date) =>
                setFormData({
                  ...formData,
                  effectiveTo: date ? date.toISOString() : undefined,
                })
              }
            />

            <DatePicker
              label="Request Delivery By"
              value={formData.requestDeliveryBy ? new Date(formData.requestDeliveryBy) : undefined}
              onSelectDate={(date) =>
                setFormData({
                  ...formData,
                  requestDeliveryBy: date ? date.toISOString() : undefined,
                })
              }
            />

            <DatePicker
              label="Expires On"
              value={formData.expiresOn ? new Date(formData.expiresOn) : undefined}
              onSelectDate={(date) =>
                setFormData({
                  ...formData,
                  expiresOn: date ? date.toISOString() : undefined,
                })
              }
            />

            <Dropdown
              label="Status"
              options={statusOptions}
              selectedKey={formData.statusCode}
              onChange={(_, option) => setFormData({ ...formData, statusCode: option?.key as number })}
            />

            <TextField
              label="Description"
              multiline
              rows={4}
              value={formData.description || ''}
              onChange={(_, value) => setFormData({ ...formData, description: value || '' })}
            />
          </Stack>
        )}

        {activeTab === 'billing' && (
          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
            <StandardAddressFields
              sectionTitle="BILLING ADDRESS"
              uniqueId="quote-billing"
              street={formData.billTo_Line1 || ''}
              stateOrProvince={formData.billTo_StateOrProvince || ''}
              postalCode={formData.billTo_PostalCode || ''}
              country={formData.billTo_Country || ''}
              latitude={formData.billTo_Latitude}
              longitude={formData.billTo_Longitude}
              onStreetChange={(value) => setFormData({ ...formData, billTo_Line1: value })}
              onStateOrProvinceChange={(value) => setFormData({ ...formData, billTo_StateOrProvince: value })}
              onPostalCodeChange={(value) => setFormData({ ...formData, billTo_PostalCode: value })}
              onCountryChange={(value) => setFormData({ ...formData, billTo_Country: value })}
              onLatitudeChange={(value) => setFormData({ ...formData, billTo_Latitude: value })}
              onLongitudeChange={(value) => setFormData({ ...formData, billTo_Longitude: value })}
            />

            <TextField
              label="Address Name"
              value={formData.billTo_Name || ''}
              onChange={(_, value) => setFormData({ ...formData, billTo_Name: value || '' })}
            />

            <TextField
              label="City"
              value={formData.billTo_City || ''}
              onChange={(_, value) => setFormData({ ...formData, billTo_City: value || '' })}
            />

            <StandardPhoneField
              label="Billing Phone"
              value={formData.billTo_Telephone || ''}
              onChange={(value) => setFormData({ ...formData, billTo_Telephone: value })}
            />
          </Stack>
        )}

        {activeTab === 'shipping' && (
          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
            <StandardAddressFields
              sectionTitle="SHIPPING ADDRESS"
              uniqueId="quote-shipping"
              street={formData.shipTo_Line1 || ''}
              stateOrProvince={formData.shipTo_StateOrProvince || ''}
              postalCode={formData.shipTo_PostalCode || ''}
              country={formData.shipTo_Country || ''}
              latitude={formData.shipTo_Latitude}
              longitude={formData.shipTo_Longitude}
              onStreetChange={(value) => setFormData({ ...formData, shipTo_Line1: value })}
              onStateOrProvinceChange={(value) => setFormData({ ...formData, shipTo_StateOrProvince: value })}
              onPostalCodeChange={(value) => setFormData({ ...formData, shipTo_PostalCode: value })}
              onCountryChange={(value) => setFormData({ ...formData, shipTo_Country: value })}
              onLatitudeChange={(value) => setFormData({ ...formData, shipTo_Latitude: value })}
              onLongitudeChange={(value) => setFormData({ ...formData, shipTo_Longitude: value })}
            />

            <TextField
              label="Address Name"
              value={formData.shipTo_Name || ''}
              onChange={(_, value) => setFormData({ ...formData, shipTo_Name: value || '' })}
            />

            <TextField
              label="City"
              value={formData.shipTo_City || ''}
              onChange={(_, value) => setFormData({ ...formData, shipTo_City: value || '' })}
            />

            <StandardPhoneField
              label="Shipping Phone"
              value={formData.shipTo_Telephone || ''}
              onChange={(value) => setFormData({ ...formData, shipTo_Telephone: value })}
            />
          </Stack>
        )}

        {activeTab === 'financials' && (
          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
              FINANCIAL INFORMATION
            </Text>

            <TextField
              label="Total Line Item Amount"
              value={formData.totalLineItemAmount?.toFixed(2) || '0.00'}
              readOnly
              prefix="R"
            />

            <TextField
              label="Total Discount Amount"
              value={formData.totalDiscountAmount?.toString() || '0'}
              onChange={(_, value) => {
                const parsed = parseFloat(value || '0');
                setFormData({ ...formData, totalDiscountAmount: isNaN(parsed) ? 0 : parsed });
              }}
              prefix="R"
            />

            <TextField
              label="Discount Percentage"
              value={formData.discountPercentage?.toString() || '0'}
              onChange={(_, value) => {
                const parsed = parseFloat(value || '0');
                setFormData({ ...formData, discountPercentage: isNaN(parsed) ? 0 : parsed });
              }}
              suffix="%"
            />

            <TextField
              label="Total Tax"
              value={formData.totalTax?.toFixed(2) || '0.00'}
              readOnly
              prefix="R"
            />

            <TextField
              label="Freight Amount"
              value={formData.freightAmount?.toString() || '0'}
              onChange={(_, value) => {
                const parsed = parseFloat(value || '0');
                setFormData({ ...formData, freightAmount: isNaN(parsed) ? 0 : parsed });
              }}
              prefix="R"
            />

            <TextField
              label="Total Amount Less Freight"
              value={formData.totalAmountLessFreight?.toFixed(2) || '0.00'}
              readOnly
              prefix="R"
            />

            <TextField
              label="Total Amount"
              value={formData.totalAmount?.toFixed(2) || '0.00'}
              readOnly
              prefix="R"
              styles={{
                root: {
                  fontWeight: 600,
                  fontSize: 18,
                },
              }}
            />
          </Stack>
        )}

        {activeTab === 'lineitems' && (
          <Stack tokens={{ childrenGap: 16 }}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
              LINE ITEMS
            </Text>

            <CommandBar items={lineItemsCommandBarItems} />

            <DetailsList
              items={quoteDetails}
              columns={quoteDetailColumns}
              layoutMode={DetailsListLayoutMode.justified}
              selectionMode={0}
            />

            {quoteDetails.length === 0 && (
              <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
                <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
                  No line items yet. Click "Add Line Item" to get started.
                </Text>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};
