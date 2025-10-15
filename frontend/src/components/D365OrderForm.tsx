import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
  DatePicker,
  Dropdown,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { d365OrderService, accountService, d365QuoteService } from '../services/d365Services';
import type { D365Order, Account, D365Quote } from '../types/millennium';

interface D365OrderFormProps {
  order?: D365Order;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const D365OrderForm = ({
  order,
  onDismiss,
  onSave,
  onDelete,
}: D365OrderFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
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
    statusCode: 0,
    description: '',
    ownerId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [quotes, setQuotes] = useState<D365Quote[]>([]);

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
        stateCode: order.stateCode || 0,
        statusCode: order.statusCode || 0,
        description: order.description || '',
        ownerId: order.ownerId || '',
      });
    }
    setError(null);
  }, [order]);

  useEffect(() => {
    loadLookupData();
  }, []);

  const loadLookupData = async () => {
    try {
      const [accountsData, quotesData] = await Promise.all([
        accountService.getAll(),
        d365QuoteService.getAll(),
      ]);
      setAccounts(accountsData);
      setQuotes(quotesData);
    } catch (err) {
      console.error('Failed to load lookup data:', err);
    }
  };

  const accountOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...accounts.map((a) => ({ key: a.id, text: a.name })),
  ];

  const quoteOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...quotes.map((q) => ({ key: q.id, text: q.name || q.quoteNumber || `Quote ${q.id}` })),
  ];

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (order) {
        await d365OrderService.update(order.id, formData);
      } else {
        await d365OrderService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (order) {
        await d365OrderService.update(order.id, formData);
      } else {
        await d365OrderService.create(formData);
      }

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
        statusCode: 0,
        description: '',
        ownerId: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
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
    ...(order && onDelete
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

  const parseDate = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { height: '100%' } }}>
      <Text variant="xxLarge" styles={{ root: { padding: '20px 20px 0 20px' } }}>
        {order ? 'Edit Order' : 'New Order'}
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
              text="Order Information"
              iconProps={{ iconName: 'ShoppingCart' }}
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
              text="Customer Details"
              iconProps={{ iconName: 'People' }}
              onClick={() => setActiveTab('customer')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'customer' ? '#0078d4' : 'transparent',
                  color: activeTab === 'customer' ? 'white' : '#323130',
                  fontWeight: activeTab === 'customer' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'customer' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'customer' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Amounts"
              iconProps={{ iconName: 'Money' }}
              onClick={() => setActiveTab('amounts')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'amounts' ? '#0078d4' : 'transparent',
                  color: activeTab === 'amounts' ? 'white' : '#323130',
                  fontWeight: activeTab === 'amounts' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'amounts' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'amounts' ? 'white' : '#323130',
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
                    label="Order Number"
                    required
                    value={formData.orderNumber}
                    onChange={(_, value) =>
                      setFormData({ ...formData, orderNumber: value || '' })
                    }
                  />

                  <TextField
                    label="Order Name"
                    required
                    value={formData.name}
                    onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
                  />

                  <TextField
                    label="Description"
                    multiline
                    rows={3}
                    value={formData.description}
                    onChange={(_, value) =>
                      setFormData({ ...formData, description: value || '' })
                    }
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <DatePicker
                    label="Date Fulfilled"
                    value={parseDate(formData.dateFulfilled)}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, dateFulfilled: date?.toISOString() || '' })
                    }
                  />

                  <DatePicker
                    label="Request Delivery By"
                    value={parseDate(formData.requestDeliveryBy)}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, requestDeliveryBy: date?.toISOString() || '' })
                    }
                  />

                  <TextField
                    label="State Code"
                    type="number"
                    value={String(formData.stateCode)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, stateCode: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Status Code"
                    type="number"
                    value={String(formData.statusCode)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, statusCode: Number(value) || 0 })
                    }
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'customer' && (
              <Stack
                tokens={{ childrenGap: 16 }}
                styles={{ root: { marginTop: 16, maxWidth: 600 } }}
              >
                <Dropdown
                  label="Customer"
                  options={accountOptions}
                  selectedKey={formData.customerId || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, customerId: option?.key as string || '' })
                  }
                />

                <Dropdown
                  label="Quote"
                  options={quoteOptions}
                  selectedKey={formData.quoteId || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, quoteId: option?.key as string || '' })
                  }
                />

                <TextField
                  label="Owner ID"
                  value={formData.ownerId}
                  onChange={(_, value) => setFormData({ ...formData, ownerId: value || '' })}
                />
              </Stack>
            )}

            {activeTab === 'amounts' && (
              <Stack
                tokens={{ childrenGap: 16 }}
                styles={{ root: { marginTop: 16, maxWidth: 600 } }}
              >
                <TextField
                  label="Total Amount"
                  type="number"
                  value={String(formData.totalAmount)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, totalAmount: Number(value) || 0 })
                  }
                  prefix="$"
                />

                <TextField
                  label="Total Discount Amount"
                  type="number"
                  value={String(formData.totalDiscountAmount)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, totalDiscountAmount: Number(value) || 0 })
                  }
                  prefix="$"
                />

                <TextField
                  label="Total Line Item Amount"
                  type="number"
                  value={String(formData.totalLineItemAmount)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, totalLineItemAmount: Number(value) || 0 })
                  }
                  prefix="$"
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
