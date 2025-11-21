import { useState, useEffect } from 'react';
import {
  Stack,
  TextField,
  MessageBar,
  MessageBarType,
  DatePicker,
  Dropdown,
  Label,
  Pivot,
  PivotItem,
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { d365OrderService, accountService, d365QuoteService } from '../services/d365Services';
import { StandardLookupField, StandardFormHeader, type LookupOption } from './standards';
import type { D365Order } from '../types/millennium';

interface D365OrderFormProps {
  order?: D365Order;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

const stateCodeOptions: IDropdownOption[] = [
  { key: 0, text: 'Active' },
  { key: 1, text: 'Inactive' },
  { key: 2, text: 'Submitted' },
  { key: 3, text: 'Canceled' },
];

const statusCodeOptions: IDropdownOption[] = [
  { key: 1, text: 'New' },
  { key: 2, text: 'Pending' },
  { key: 3, text: 'In Progress' },
  { key: 4, text: 'No Money' },
  { key: 100000, text: 'Complete' },
  { key: 100001, text: 'Partial' },
  { key: 100002, text: 'Invoiced' },
  { key: 5, text: 'Canceled' },
];

export const D365OrderForm = ({
  order,
  onDismiss,
  onSave,
  onDelete,
}: D365OrderFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [formData, setFormData] = useState<Partial<D365Order>>({
    orderNumber: '',
    name: '',
    customerId: '',
    quoteId: '',
    dateFulfilled: '',
    requestDeliveryBy: '',
    totalAmount: 0,
    totalDiscountAmount: 0,
    totalLineItemAmount: 0,
    stateCode: 0,
    statusCode: 1,
    description: '',
    ownerId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [selectedCustomerText, setSelectedCustomerText] = useState<string>('');
  const [selectedQuoteText, setSelectedQuoteText] = useState<string>('');

  useEffect(() => {
    if (order) {
      setFormData({
        orderNumber: order.orderNumber || '',
        name: order.name || '',
        customerId: order.customerId || '',
        quoteId: order.quoteId || '',
        dateFulfilled: order.dateFulfilled || '',
        requestDeliveryBy: order.requestDeliveryBy || '',
        totalAmount: order.totalAmount || 0,
        totalDiscountAmount: order.totalDiscountAmount || 0,
        totalLineItemAmount: order.totalLineItemAmount || 0,
        stateCode: order.stateCode ?? 0,
        statusCode: order.statusCode ?? 1,
        description: order.description || '',
        ownerId: order.ownerId || '',
      });
      
      loadLookupTexts(order);
    }
    setError(null);
  }, [order]);

  const loadLookupTexts = async (ord: D365Order) => {
    try {
      if (ord.customerId) {
        const accounts = await accountService.getAll();
        const account = accounts.find(a => a.id === ord.customerId);
        if (account) {
          setSelectedCustomerText(account.name || '');
        }
      }
      
      if (ord.quoteId) {
        const quotes = await d365QuoteService.getAll();
        const quote = quotes.find(q => q.id === ord.quoteId);
        if (quote) {
          setSelectedQuoteText(quote.quoteNumber ? `${quote.quoteNumber}${quote.name ? ' - ' + quote.name : ''}` : (quote.name || ''));
        }
      }
    } catch (err) {
      console.error('Failed to load lookup texts:', err);
    }
  };

  const handleSubmit = async (saveAndNew: boolean = false) => {
    try {
      setSaving(true);
      setError(null);

      if (order) {
        await d365OrderService.update(order.id, formData);
      } else {
        await d365OrderService.create(formData);
      }

      if (saveAndNew) {
        setFormData({
          orderNumber: '',
          name: '',
          customerId: '',
          quoteId: '',
          dateFulfilled: '',
          requestDeliveryBy: '',
          totalAmount: 0,
          totalDiscountAmount: 0,
          totalLineItemAmount: 0,
          stateCode: 0,
          statusCode: 1,
          description: '',
          ownerId: '',
        });
        setSelectedCustomerText('');
        setSelectedQuoteText('');
        setSaving(false);
      } else {
        onSave();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
      setSaving(false);
    }
  };

  const parseDate = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const formatDateForInput = (date?: Date): string => {
    if (!date) return '';
    return date.toISOString();
  };

  const handleCustomerSearch = async (term: string): Promise<LookupOption[]> => {
    const accounts = await accountService.getAll();
    const search = term.toLowerCase();
    return accounts
      .filter(a => (a.name?.toLowerCase() || '').includes(search))
      .slice(0, 50)
      .map(a => ({ id: a.id, text: a.name || '' }));
  };

  const handleQuoteSearch = async (term: string): Promise<LookupOption[]> => {
    const quotes = await d365QuoteService.getAll();
    const search = term.toLowerCase();
    return quotes
      .filter(q => 
        (q.quoteNumber?.toLowerCase() || '').includes(search) ||
        (q.name?.toLowerCase() || '').includes(search)
      )
      .slice(0, 50)
      .map(q => ({
        id: q.id,
        text: q.quoteNumber ? `${q.quoteNumber}${q.name ? ' - ' + q.name : ''}` : (q.name || q.id)
      }));
  };

  return (
    <Stack styles={{ root: { height: '100%', overflow: 'hidden' } }}>
      <StandardFormHeader
        title={order ? `Order: ${order.orderNumber || order.name || 'Untitled'}` : 'New Order'}
        onSave={() => handleSubmit(false)}
        onSaveAndNew={order ? undefined : () => handleSubmit(true)}
        onCancel={onDismiss}
        onDelete={order && onDelete ? onDelete : undefined}
        isSaving={saving}
      />

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' } }}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

        <Pivot
          selectedKey={activeTab}
          onLinkClick={(item) => setActiveTab(item?.props.itemKey || 'summary')}
          headersOnly
          styles={{ root: { marginTop: 10 } }}
        >
          <PivotItem headerText="Summary" itemKey="summary" />
          <PivotItem headerText="General" itemKey="general" />
          <PivotItem headerText="Production" itemKey="production" />
          <PivotItem headerText="Costing" itemKey="costing" />
          <PivotItem headerText="Dispatch" itemKey="dispatch" />
          <PivotItem headerText="Invoices" itemKey="invoices" />
          <PivotItem headerText="Details" itemKey="details" />
          <PivotItem headerText="Related" itemKey="related" />
        </Pivot>

        <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 20 } }}>
          {activeTab === 'summary' && (
            <Stack tokens={{ childrenGap: 20 }}>
              <Stack tokens={{ childrenGap: 12 }}>
                <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>Order Information</Label>
                
                <TextField
                  label="Order Number"
                  value={formData.orderNumber || ''}
                  onChange={(_, value) => setFormData({ ...formData, orderNumber: value })}
                  disabled={saving}
                />

                <TextField
                  label="Name"
                  value={formData.name || ''}
                  onChange={(_, value) => setFormData({ ...formData, name: value })}
                  disabled={saving}
                  required
                />

                <StandardLookupField
                  label="Customer"
                  selectedId={formData.customerId || ''}
                  selectedText={selectedCustomerText}
                  onSearch={handleCustomerSearch}
                  onChange={(id, text) => {
                    setFormData({ ...formData, customerId: id });
                    setSelectedCustomerText(text);
                  }}
                  disabled={saving}
                />

                <StandardLookupField
                  label="Quote"
                  selectedId={formData.quoteId || ''}
                  selectedText={selectedQuoteText}
                  onSearch={handleQuoteSearch}
                  onChange={(id, text) => {
                    setFormData({ ...formData, quoteId: id });
                    setSelectedQuoteText(text);
                  }}
                  disabled={saving}
                />

                <DatePicker
                  label="Request Delivery By"
                  value={parseDate(formData.requestDeliveryBy)}
                  onSelectDate={(date) => 
                    setFormData({ ...formData, requestDeliveryBy: formatDateForInput(date || undefined) })
                  }
                  disabled={saving}
                />
              </Stack>

              <Stack tokens={{ childrenGap: 12 }}>
                <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>Key Prices</Label>
                
                <TextField
                  label="Total Amount"
                  type="number"
                  value={formData.totalAmount?.toString() || '0'}
                  onChange={(_, value) => setFormData({ ...formData, totalAmount: parseFloat(value || '0') })}
                  disabled={saving}
                  prefix="R"
                />

                <TextField
                  label="Total Discount Amount"
                  type="number"
                  value={formData.totalDiscountAmount?.toString() || '0'}
                  onChange={(_, value) => setFormData({ ...formData, totalDiscountAmount: parseFloat(value || '0') })}
                  disabled={saving}
                  prefix="R"
                />

                <TextField
                  label="Total Line Item Amount"
                  type="number"
                  value={formData.totalLineItemAmount?.toString() || '0'}
                  onChange={(_, value) => setFormData({ ...formData, totalLineItemAmount: parseFloat(value || '0') })}
                  disabled={saving}
                  prefix="R"
                />
              </Stack>

              <Stack tokens={{ childrenGap: 12 }}>
                <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>Other Information</Label>
                
                <Dropdown
                  label="Status"
                  selectedKey={formData.stateCode ?? 0}
                  options={stateCodeOptions}
                  onChange={(_, option) => 
                    setFormData({ ...formData, stateCode: option?.key as number })
                  }
                  disabled={saving}
                />

                <Dropdown
                  label="Status Reason"
                  selectedKey={formData.statusCode ?? 1}
                  options={statusCodeOptions}
                  onChange={(_, option) => 
                    setFormData({ ...formData, statusCode: option?.key as number })
                  }
                  disabled={saving}
                />

                <DatePicker
                  label="Date Fulfilled"
                  value={parseDate(formData.dateFulfilled)}
                  onSelectDate={(date) => 
                    setFormData({ ...formData, dateFulfilled: formatDateForInput(date || undefined) })
                  }
                  disabled={saving}
                />
              </Stack>
            </Stack>
          )}

          {activeTab === 'general' && (
            <Stack tokens={{ childrenGap: 16 }}>
              <TextField
                label="Order Number"
                value={formData.orderNumber || ''}
                onChange={(_, value) => setFormData({ ...formData, orderNumber: value })}
                disabled={saving}
              />

              <TextField
                label="Name"
                value={formData.name || ''}
                onChange={(_, value) => setFormData({ ...formData, name: value })}
                disabled={saving}
                required
              />

              <StandardLookupField
                label="Customer"
                selectedId={formData.customerId || ''}
                selectedText={selectedCustomerText}
                onSearch={handleCustomerSearch}
                onChange={(id, text) => {
                  setFormData({ ...formData, customerId: id });
                  setSelectedCustomerText(text);
                }}
                disabled={saving}
              />

              <DatePicker
                label="Request Delivery By"
                value={parseDate(formData.requestDeliveryBy)}
                onSelectDate={(date) => 
                  setFormData({ ...formData, requestDeliveryBy: formatDateForInput(date || undefined) })
                }
                disabled={saving}
              />

              <Dropdown
                label="Status"
                selectedKey={formData.stateCode ?? 0}
                options={stateCodeOptions}
                onChange={(_, option) => 
                  setFormData({ ...formData, stateCode: option?.key as number })
                }
                disabled={saving}
              />

              <Dropdown
                label="Status Reason"
                selectedKey={formData.statusCode ?? 1}
                options={statusCodeOptions}
                onChange={(_, option) => 
                  setFormData({ ...formData, statusCode: option?.key as number })
                }
                disabled={saving}
              />
            </Stack>
          )}

          {activeTab === 'production' && (
            <Stack tokens={{ childrenGap: 16 }}>
              <Label>Production-related fields will be managed through the Production module</Label>
              
              <StandardLookupField
                label="Quote"
                selectedId={formData.quoteId || ''}
                selectedText={selectedQuoteText}
                onSearch={handleQuoteSearch}
                onChange={(id, text) => {
                  setFormData({ ...formData, quoteId: id });
                  setSelectedQuoteText(text);
                }}
                disabled={saving}
              />

              <DatePicker
                label="Date Fulfilled"
                value={parseDate(formData.dateFulfilled)}
                onSelectDate={(date) => 
                  setFormData({ ...formData, dateFulfilled: formatDateForInput(date || undefined) })
                }
                disabled={saving}
              />
            </Stack>
          )}

          {activeTab === 'costing' && (
            <Stack tokens={{ childrenGap: 16 }}>
              <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>Financial Details</Label>
              
              <TextField
                label="Total Amount"
                type="number"
                value={formData.totalAmount?.toString() || '0'}
                onChange={(_, value) => setFormData({ ...formData, totalAmount: parseFloat(value || '0') })}
                disabled={saving}
                prefix="R"
              />

              <TextField
                label="Total Discount Amount"
                type="number"
                value={formData.totalDiscountAmount?.toString() || '0'}
                onChange={(_, value) => setFormData({ ...formData, totalDiscountAmount: parseFloat(value || '0') })}
                disabled={saving}
                prefix="R"
              />

              <TextField
                label="Total Line Item Amount"
                type="number"
                value={formData.totalLineItemAmount?.toString() || '0'}
                onChange={(_, value) => setFormData({ ...formData, totalLineItemAmount: parseFloat(value || '0') })}
                disabled={saving}
                prefix="R"
              />
            </Stack>
          )}

          {activeTab === 'dispatch' && (
            <Stack tokens={{ childrenGap: 16 }}>
              <Label>Dispatch information will be managed through the Deliveries module</Label>
              
              <DatePicker
                label="Request Delivery By"
                value={parseDate(formData.requestDeliveryBy)}
                onSelectDate={(date) => 
                  setFormData({ ...formData, requestDeliveryBy: formatDateForInput(date || undefined) })
                }
                disabled={saving}
              />

              <DatePicker
                label="Date Fulfilled"
                value={parseDate(formData.dateFulfilled)}
                onSelectDate={(date) => 
                  setFormData({ ...formData, dateFulfilled: formatDateForInput(date || undefined) })
                }
                disabled={saving}
              />

              <StandardLookupField
                label="Customer"
                selectedId={formData.customerId || ''}
                selectedText={selectedCustomerText}
                onSearch={handleCustomerSearch}
                onChange={(id, text) => {
                  setFormData({ ...formData, customerId: id });
                  setSelectedCustomerText(text);
                }}
                disabled={saving}
              />
            </Stack>
          )}

          {activeTab === 'invoices' && (
            <Stack tokens={{ childrenGap: 16 }}>
              <Label>Invoice information will be managed through the Invoicing module</Label>
              
              <Dropdown
                label="Status"
                selectedKey={formData.stateCode ?? 0}
                options={stateCodeOptions}
                onChange={(_, option) => 
                  setFormData({ ...formData, stateCode: option?.key as number })
                }
                disabled={saving}
              />

              <DatePicker
                label="Date Fulfilled"
                value={parseDate(formData.dateFulfilled)}
                onSelectDate={(date) => 
                  setFormData({ ...formData, dateFulfilled: formatDateForInput(date || undefined) })
                }
                disabled={saving}
              />

              <TextField
                label="Total Amount"
                type="number"
                value={formData.totalAmount?.toString() || '0'}
                onChange={(_, value) => setFormData({ ...formData, totalAmount: parseFloat(value || '0') })}
                disabled={saving}
                prefix="R"
              />
            </Stack>
          )}

          {activeTab === 'details' && (
            <Stack tokens={{ childrenGap: 16 }}>
              <TextField
                label="Description"
                multiline
                rows={6}
                value={formData.description || ''}
                onChange={(_, value) => setFormData({ ...formData, description: value })}
                disabled={saving}
              />

              {order && (
                <>
                  <TextField
                    label="Created On"
                    value={order.createdOn ? new Date(order.createdOn).toLocaleString() : ''}
                    disabled
                    readOnly
                  />

                  <TextField
                    label="Modified On"
                    value={order.modifiedOn ? new Date(order.modifiedOn).toLocaleString() : ''}
                    disabled
                    readOnly
                  />
                </>
              )}
            </Stack>
          )}

          {activeTab === 'related' && (
            <Stack tokens={{ childrenGap: 16 }}>
              <Label>Related entities such as Order Products, Activities, and Documents can be managed here</Label>
              
              <StandardLookupField
                label="Quote"
                selectedId={formData.quoteId || ''}
                selectedText={selectedQuoteText}
                onSearch={handleQuoteSearch}
                onChange={(id, text) => {
                  setFormData({ ...formData, quoteId: id });
                  setSelectedQuoteText(text);
                }}
                disabled={saving}
              />

              <StandardLookupField
                label="Customer"
                selectedId={formData.customerId || ''}
                selectedText={selectedCustomerText}
                onSearch={handleCustomerSearch}
                onChange={(id, text) => {
                  setFormData({ ...formData, customerId: id });
                  setSelectedCustomerText(text);
                }}
                disabled={saving}
              />
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};
