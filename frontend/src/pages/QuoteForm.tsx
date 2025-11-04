import { useState, useEffect } from 'react';
import {
  Stack,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  PrimaryButton,
  Dropdown,
  DatePicker,
  DetailsList,
  DetailsListLayoutMode,
  CommandBar,
  Text,
  Panel,
  PanelType,
  Dialog,
  DialogType,
  DialogFooter,
  Selection,
  SelectionMode,
  SpinButton,
} from '@fluentui/react';
import type { IDropdownOption, IColumn, ICommandBarItemProps } from '@fluentui/react';
import { d365QuoteService, d365QuoteDetailService, accountService, lookupService, d365ProductService } from '../services/d365Services';
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

const freightTermsOptions: IDropdownOption[] = [
  { key: 1, text: 'FOB' },
  { key: 2, text: 'No Charge' },
  { key: 3, text: 'Freight Included' },
  { key: 4, text: 'Collect' },
];

const paymentTermsOptions: IDropdownOption[] = [
  { key: 1, text: 'Net 30' },
  { key: 2, text: 'Net 60' },
  { key: 3, text: '2% 10 Net 30' },
  { key: 4, text: 'Due on Receipt' },
  { key: 5, text: 'Net 45' },
];

interface QuoteFormProps {
  quote?: D365Quote;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const QuoteForm = ({ quote, onDismiss, onSave, onDelete }: QuoteFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('summary');
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
    priceLevelId: undefined,
    opportunityId: undefined,
  });

  // revisionId does not exist in backend D365Quote entity - commented out
  // const [revisionId, setRevisionId] = useState('');
  const [freightTermsCode, setFreightTermsCode] = useState<number | undefined>(undefined);
  const [paymentTermsCode, setPaymentTermsCode] = useState<number | undefined>(undefined);

  const [customerName, setCustomerName] = useState('');
  // const [priceLevelName, setPriceLevelName] = useState('');
  // const [opportunityName, setOpportunityName] = useState('');
  const [quoteDetails, setQuoteDetails] = useState<D365QuoteDetail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLineItem, setSelectedLineItem] = useState<D365QuoteDetail | null>(null);
  const [lineItemFormData, setLineItemFormData] = useState<Partial<D365QuoteDetail>>({
    productId: undefined,
    productName: '',
    description: '',
    quantity: 1,
    pricePerUnit: 0,
    manualDiscountAmount: 0,
    tax: 0,
    baseAmount: 0,
    extendedAmount: 0,
  });
  const [productLookupName, setProductLookupName] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [lineItemToDelete, setLineItemToDelete] = useState<D365QuoteDetail | null>(null);

  const [selection] = useState(
    () =>
      new Selection({
        onSelectionChanged: () => {
          const selected = selection.getSelection();
          if (selected.length > 0) {
            setSelectedLineItem(selected[0] as D365QuoteDetail);
          } else {
            setSelectedLineItem(null);
          }
        },
      })
  );

  useEffect(() => {
    if (quote) {
      setFormData({
        quoteNumber: quote.quoteNumber || '',
        name: quote.name || '',
        customerId: quote.customerId,
        effectiveFrom: quote.effectiveFrom,
        effectiveTo: quote.effectiveTo,
        requestDeliveryBy: quote.requestDeliveryBy,
        expiresOn: quote.expiresOn,
        statusCode: quote.statusCode || 1,
        description: quote.description || '',
        billTo_Name: quote.billTo_Name || '',
        billTo_Line1: quote.billTo_Line1 || '',
        billTo_City: quote.billTo_City || '',
        billTo_StateOrProvince: quote.billTo_StateOrProvince || '',
        billTo_PostalCode: quote.billTo_PostalCode || '',
        billTo_Country: quote.billTo_Country || '',
        billTo_Telephone: quote.billTo_Telephone || '',
        billTo_Latitude: quote.billTo_Latitude,
        billTo_Longitude: quote.billTo_Longitude,
        shipTo_Name: quote.shipTo_Name || '',
        shipTo_Line1: quote.shipTo_Line1 || '',
        shipTo_City: quote.shipTo_City || '',
        shipTo_StateOrProvince: quote.shipTo_StateOrProvince || '',
        shipTo_PostalCode: quote.shipTo_PostalCode || '',
        shipTo_Country: quote.shipTo_Country || '',
        shipTo_Telephone: quote.shipTo_Telephone || '',
        shipTo_Latitude: quote.shipTo_Latitude,
        shipTo_Longitude: quote.shipTo_Longitude,
        totalAmount: quote.totalAmount || 0,
        totalLineItemAmount: quote.totalLineItemAmount || 0,
        totalDiscountAmount: quote.totalDiscountAmount || 0,
        discountPercentage: quote.discountPercentage || 0,
        totalTax: quote.totalTax || 0,
        freightAmount: quote.freightAmount || 0,
        totalAmountLessFreight: quote.totalAmountLessFreight || 0,
        priceLevelId: quote.priceLevelId,
        opportunityId: quote.opportunityId,
      });

      if (quote.customerId) {
        loadCustomerName(quote.customerId);
      }

      loadLineItems(quote.id);
    } else {
      setFormData({
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
        priceLevelId: undefined,
        opportunityId: undefined,
      });
      setCustomerName('');
      // setPriceLevelName('');
      // setOpportunityName('');
      setQuoteDetails([]);
    }
    setError(null);
  }, [quote]);

  useEffect(() => {
    calculateLineItemTotals();
  }, [
    lineItemFormData.quantity,
    lineItemFormData.pricePerUnit,
    lineItemFormData.manualDiscountAmount,
    lineItemFormData.tax,
  ]);

  const loadCustomerName = async (customerId: string) => {
    try {
      const customer = await accountService.getById(customerId);
      setCustomerName(customer.name || '');
    } catch (err) {
      console.error('Failed to load customer:', err);
    }
  };

  const loadLineItems = async (quoteId: string) => {
    try {
      const details = await d365QuoteDetailService.getByQuoteId(quoteId);
      setQuoteDetails(details);
    } catch (err) {
      console.error('Failed to load line items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load line items');
    }
  };

  const refreshQuoteAndLineItems = async () => {
    if (quote?.id) {
      const updatedQuote = await d365QuoteService.getById(quote.id);
      setFormData(updatedQuote);
      await loadLineItems(quote.id);
    }
  };

  const calculateLineItemTotals = () => {
    const quantity = lineItemFormData.quantity || 0;
    const pricePerUnit = lineItemFormData.pricePerUnit || 0;
    const discount = lineItemFormData.manualDiscountAmount || 0;
    const tax = lineItemFormData.tax || 0;

    const baseAmount = quantity * pricePerUnit;
    const extendedAmount = baseAmount - discount + tax;

    setLineItemFormData((prev) => ({
      ...prev,
      baseAmount,
      extendedAmount,
    }));
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

  const searchProducts = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await lookupService.searchProducts(searchTerm);
      return results;
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  };

  // PriceLevel and Opportunity entities do not exist in backend - commenting out
  // const searchPriceLevels = async (searchTerm: string): Promise<LookupOption[]> => {
  //   try {
  //     return [];
  //   } catch (error) {
  //     console.error('Error searching price levels:', error);
  //     return [];
  //   }
  // };

  // const searchOpportunities = async (searchTerm: string): Promise<LookupOption[]> => {
  //   try {
  //     return [];
  //   } catch (error) {
  //     console.error('Error searching opportunities:', error);
  //     return [];
  //   }
  // };

  const handleAddLineItem = () => {
    setIsEditing(false);
    setLineItemFormData({
      productId: undefined,
      productName: '',
      description: '',
      quantity: 1,
      pricePerUnit: 0,
      manualDiscountAmount: 0,
      tax: 0,
      baseAmount: 0,
      extendedAmount: 0,
    });
    setProductLookupName('');
    setIsPanelOpen(true);
  };

  const handleEditLineItem = () => {
    if (!selectedLineItem) return;

    setIsEditing(true);
    setLineItemFormData({
      productId: selectedLineItem.productId,
      productName: selectedLineItem.productName || '',
      description: selectedLineItem.description || '',
      quantity: selectedLineItem.quantity || 1,
      pricePerUnit: selectedLineItem.pricePerUnit || 0,
      manualDiscountAmount: selectedLineItem.manualDiscountAmount || 0,
      tax: selectedLineItem.tax || 0,
      baseAmount: selectedLineItem.baseAmount || 0,
      extendedAmount: selectedLineItem.extendedAmount || 0,
    });
    setProductLookupName(selectedLineItem.productName || '');
    setIsPanelOpen(true);
  };

  const handleDeleteLineItem = () => {
    if (!selectedLineItem) return;
    setLineItemToDelete(selectedLineItem);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteLineItem = async () => {
    if (!lineItemToDelete) return;

    try {
      setError(null);
      setSuccessMessage(null);
      await d365QuoteDetailService.delete(lineItemToDelete.id);
      setIsDeleteDialogOpen(false);
      setLineItemToDelete(null);
      setSelectedLineItem(null);
      selection.setAllSelected(false);

      await refreshQuoteAndLineItems();
      
      setSuccessMessage(`Line item deleted successfully. New total: R ${formData.totalAmount?.toFixed(2) || '0.00'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete line item');
    }
  };

  const handleSaveLineItem = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      setSaving(true);

      if (!quote?.id) {
        setError('Please save the quote first before adding line items');
        return;
      }

      const lineItemData: Partial<D365QuoteDetail> = {
        ...lineItemFormData,
        quoteId: quote.id,
      };

      if (isEditing && selectedLineItem) {
        await d365QuoteDetailService.update(selectedLineItem.id, lineItemData);
        setSuccessMessage('Line item updated successfully');
      } else {
        await d365QuoteDetailService.create(lineItemData);
        setSuccessMessage('Line item added successfully');
      }

      setIsPanelOpen(false);
      setSelectedLineItem(null);
      selection.setAllSelected(false);

      await refreshQuoteAndLineItems();

      setSuccessMessage(
        `Line item ${isEditing ? 'updated' : 'added'} successfully. New total: R ${formData.totalAmount?.toFixed(2) || '0.00'}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save line item');
    } finally {
      setSaving(false);
    }
  };

  const handlePanelDismiss = () => {
    setIsPanelOpen(false);
    setIsEditing(false);
    setLineItemFormData({
      productId: undefined,
      productName: '',
      description: '',
      quantity: 1,
      pricePerUnit: 0,
      manualDiscountAmount: 0,
      tax: 0,
      baseAmount: 0,
      extendedAmount: 0,
    });
    setProductLookupName('');
  };

  const handleSave = async (closeAfter: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (quote?.id) {
        await d365QuoteService.update(quote.id, formData);
        setSuccessMessage('Quote saved successfully');
        if (closeAfter) {
          onSave();
        }
      } else {
        await d365QuoteService.create(formData);
        setSuccessMessage('Quote created successfully');
        onSave();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quote');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (quote?.id && window.confirm(`Are you sure you want to delete this quote?`)) {
      try {
        await d365QuoteService.delete(quote.id);
        if (onDelete) {
          onDelete();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete quote');
      }
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

  const quoteDetailColumns: IColumn[] = [
    {
      key: 'lineItemNumber',
      name: 'Line #',
      fieldName: 'lineItemNumber',
      minWidth: 50,
      maxWidth: 70,
      isResizable: true,
    },
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
      onRender: (item: D365QuoteDetail) => (
        <Text>{item.manualDiscountAmount ? `R ${item.manualDiscountAmount.toFixed(2)}` : '-'}</Text>
      ),
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
      text: 'New Line Item',
      iconProps: { iconName: 'Add' },
      onClick: handleAddLineItem,
      disabled: !quote?.id,
    },
    {
      key: 'editLineItem',
      text: 'Edit',
      iconProps: { iconName: 'Edit' },
      onClick: handleEditLineItem,
      disabled: !selectedLineItem,
    },
    {
      key: 'deleteLineItem',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      onClick: handleDeleteLineItem,
      disabled: !selectedLineItem,
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 0 }} styles={{ root: { height: '100%', backgroundColor: 'white' } }}>
      <StandardFormHeader
        title={formData.name || 'New Quote'}
        subtitle="Quote"
        onBack={onDismiss}
        onSave={() => handleSave(false)}
        onSaveAndClose={() => handleSave(true)}
        onDelete={quote?.id ? handleDelete : undefined}
        saving={saving}
        isNew={!quote?.id}
      />

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      {successMessage && (
        <MessageBar messageBarType={MessageBarType.success} onDismiss={() => setSuccessMessage(null)}>
          {successMessage}
        </MessageBar>
      )}

      <Stack horizontal styles={{ root: { borderBottom: '1px solid #edebe9', backgroundColor: '#faf9f8' } }}>
        <DefaultButton text="Summary" onClick={() => setActiveTab('summary')} styles={tabStyles(activeTab === 'summary')} />
        <DefaultButton text="Financials" onClick={() => setActiveTab('financials')} styles={tabStyles(activeTab === 'financials')} />
        <DefaultButton text="Products" onClick={() => setActiveTab('products')} styles={tabStyles(activeTab === 'products')} />
      </Stack>

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: 20 } }}>
        {activeTab === 'summary' && (
          <Stack tokens={{ childrenGap: 24 }}>
            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
              <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                QUOTE INFORMATION
              </Text>

              <TextField
                label="Quote Number"
                value={formData.quoteNumber || ''}
                onChange={(_, value) => setFormData({ ...formData, quoteNumber: value || '' })}
                readOnly={!!quote?.id}
              />

              <TextField
                label="Name"
                required
                value={formData.name || ''}
                onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
              />

              {/* revisionId does not exist in backend D365Quote entity - commented out
              <TextField
                label="Revision ID"
                value={revisionId}
                onChange={(_, value) => setRevisionId(value || '')}
              />
              */}

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
                label="Expires On"
                value={formData.expiresOn ? new Date(formData.expiresOn) : undefined}
                onSelectDate={(date) =>
                  setFormData({
                    ...formData,
                    expiresOn: date ? date.toISOString() : undefined,
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

            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
              <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                SALES INFORMATION
              </Text>

              <StandardLookupField
                label="Potential Customer"
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

              {/* PriceLevel entity does not exist in backend - commented out
              <StandardLookupField
                label="Price List"
                value={formData.priceLevelId}
                selectedText={priceLevelName}
                entityName="PriceLevel"
                onChange={(priceLevelId) => {
                  setFormData({ ...formData, priceLevelId });
                  setPriceLevelName('');
                }}
                onSearch={searchPriceLevels}
              />
              */}

              <Dropdown
                label="Freight Terms"
                options={freightTermsOptions}
                selectedKey={freightTermsCode}
                onChange={(_, option) => setFreightTermsCode(option?.key as number)}
              />

              <Dropdown
                label="Payment Terms"
                options={paymentTermsOptions}
                selectedKey={paymentTermsCode}
                onChange={(_, option) => setPaymentTermsCode(option?.key as number)}
              />

              {/* Opportunity entity does not exist in backend - commented out
              <StandardLookupField
                label="Opportunity"
                value={formData.opportunityId}
                selectedText={opportunityName}
                entityName="Opportunity"
                onChange={(opportunityId) => {
                  setFormData({ ...formData, opportunityId });
                  setOpportunityName('');
                }}
                onSearch={searchOpportunities}
              />
              */}
            </Stack>

            <Stack tokens={{ childrenGap: 16 }}>
              <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                ADDRESSES
              </Text>

              <Stack horizontal tokens={{ childrenGap: 20 }} wrap>
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1, minWidth: 400 } }}>
                  <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                    Bill To
                  </Text>

                  <StandardAddressFields
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
                    label="Phone"
                    value={formData.billTo_Telephone || ''}
                    onChange={(value) => setFormData({ ...formData, billTo_Telephone: value })}
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1, minWidth: 400 } }}>
                  <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                    Ship To
                  </Text>

                  <StandardAddressFields
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
                    label="Phone"
                    value={formData.shipTo_Telephone || ''}
                    onChange={(value) => setFormData({ ...formData, shipTo_Telephone: value })}
                  />
                </Stack>
              </Stack>
            </Stack>
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

        {activeTab === 'products' && (
          <Stack tokens={{ childrenGap: 16 }}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
              PRODUCTS
            </Text>

            {!quote?.id && (
              <MessageBar messageBarType={MessageBarType.warning}>
                Please save the quote first before adding line items.
              </MessageBar>
            )}

            <CommandBar items={lineItemsCommandBarItems} />

            <DetailsList
              items={quoteDetails}
              columns={quoteDetailColumns}
              layoutMode={DetailsListLayoutMode.justified}
              selection={selection}
              selectionMode={SelectionMode.single}
              onItemInvoked={handleEditLineItem}
            />

            {quoteDetails.length === 0 && (
              <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
                <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
                  No line items yet. Click "New Line Item" to get started.
                </Text>
              </Stack>
            )}
          </Stack>
        )}
      </Stack>

      <Panel
        isOpen={isPanelOpen}
        onDismiss={handlePanelDismiss}
        type={PanelType.medium}
        headerText={isEditing ? 'Edit Line Item' : 'New Line Item'}
        closeButtonAriaLabel="Close"
      >
        <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 20 } }}>
          <StandardLookupField
            label="Product"
            value={lineItemFormData.productId}
            selectedText={productLookupName}
            entityName="Product"
            onChange={async (productId) => {
              setLineItemFormData({ ...lineItemFormData, productId });
              if (productId) {
                try {
                  const product = await d365ProductService.getById(productId);
                  setProductLookupName(product.name || '');
                  setLineItemFormData({
                    ...lineItemFormData,
                    productId,
                    productName: product.name || '',
                    pricePerUnit: product.price || 0,
                  });
                } catch (err) {
                  console.error('Failed to load product:', err);
                }
              } else {
                setProductLookupName('');
              }
            }}
            onSearch={searchProducts}
          />

          <TextField
            label="Product Name"
            value={lineItemFormData.productName || ''}
            onChange={(_, value) => setLineItemFormData({ ...lineItemFormData, productName: value || '' })}
          />

          <TextField
            label="Description"
            multiline
            rows={3}
            value={lineItemFormData.description || ''}
            onChange={(_, value) => setLineItemFormData({ ...lineItemFormData, description: value || '' })}
          />

          <SpinButton
            label="Quantity"
            value={lineItemFormData.quantity?.toString() || '1'}
            min={1}
            step={1}
            onIncrement={(value) => {
              const newValue = (parseInt(value) || 0) + 1;
              setLineItemFormData({ ...lineItemFormData, quantity: newValue });
            }}
            onDecrement={(value) => {
              const newValue = Math.max(1, (parseInt(value) || 0) - 1);
              setLineItemFormData({ ...lineItemFormData, quantity: newValue });
            }}
            onValidate={(value) => {
              const parsed = parseInt(value) || 1;
              setLineItemFormData({ ...lineItemFormData, quantity: Math.max(1, parsed) });
            }}
          />

          <TextField
            label="Price Per Unit"
            type="number"
            value={lineItemFormData.pricePerUnit?.toString() || '0'}
            onChange={(_, value) => {
              const parsed = parseFloat(value || '0');
              setLineItemFormData({ ...lineItemFormData, pricePerUnit: isNaN(parsed) ? 0 : parsed });
            }}
            prefix="R"
          />

          <TextField
            label="Manual Discount"
            type="number"
            value={lineItemFormData.manualDiscountAmount?.toString() || '0'}
            onChange={(_, value) => {
              const parsed = parseFloat(value || '0');
              setLineItemFormData({ ...lineItemFormData, manualDiscountAmount: isNaN(parsed) ? 0 : parsed });
            }}
            prefix="R"
          />

          <TextField
            label="Tax"
            type="number"
            value={lineItemFormData.tax?.toString() || '0'}
            onChange={(_, value) => {
              const parsed = parseFloat(value || '0');
              setLineItemFormData({ ...lineItemFormData, tax: isNaN(parsed) ? 0 : parsed });
            }}
            prefix="R"
          />

          <TextField label="Base Amount" value={`R ${lineItemFormData.baseAmount?.toFixed(2) || '0.00'}`} readOnly />

          <TextField
            label="Extended Amount"
            value={`R ${lineItemFormData.extendedAmount?.toFixed(2) || '0.00'}`}
            readOnly
            styles={{ root: { fontWeight: 600 } }}
          />

          <Stack horizontal tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 20 } }}>
            <PrimaryButton text="Save" onClick={handleSaveLineItem} disabled={saving} />
            <DefaultButton text="Cancel" onClick={handlePanelDismiss} />
          </Stack>
        </Stack>
      </Panel>

      <Dialog
        hidden={!isDeleteDialogOpen}
        onDismiss={() => setIsDeleteDialogOpen(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Confirm Delete',
          subText: 'Are you sure you want to delete this line item? This action cannot be undone.',
        }}
      >
        <DialogFooter>
          <PrimaryButton onClick={confirmDeleteLineItem} text="Delete" />
          <DefaultButton onClick={() => setIsDeleteDialogOpen(false)} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};
