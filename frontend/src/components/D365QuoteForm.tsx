import { useState, useEffect } from 'react';
import {
  Stack,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  DatePicker,
} from '@fluentui/react';
import { d365QuoteService, lookupService } from '../services/d365Services';
import { StandardLookupField, StandardFormHeader, type LookupOption } from './standards';
import type { D365Quote } from '../types/millennium';

interface D365QuoteFormProps {
  quote?: D365Quote;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const D365QuoteForm = ({
  quote,
  onDismiss,
  onSave,
  onDelete,
}: D365QuoteFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<D365Quote>>({
    quoteNumber: '',
    name: '',
    customerId: '',
    effectiveFrom: '',
    effectiveTo: '',
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
  const [selectedCustomerText, setSelectedCustomerText] = useState<string>('');

  const searchAccounts = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await lookupService.searchAccounts(searchTerm);
      return results.map(r => ({ id: r.id, text: r.text }));
    } catch (error) {
      console.error('Error searching accounts:', error);
      return [];
    }
  };

  useEffect(() => {
    if (quote) {
      setFormData({
        quoteNumber: quote.quoteNumber || '',
        name: quote.name || '',
        customerId: quote.customerId || '',
        effectiveFrom: quote.effectiveFrom || '',
        effectiveTo: quote.effectiveTo || '',
        totalAmount: quote.totalAmount || 0,
        totalDiscountAmount: quote.totalDiscountAmount || 0,
        totalLineItemAmount: quote.totalLineItemAmount || 0,
        stateCode: quote.stateCode || 0,
        statusCode: quote.statusCode || 0,
        description: quote.description || '',
        ownerId: quote.ownerId || '',
      });
      
      if (quote.customerId) {
        loadCustomerText(quote.customerId);
      }
    }
    setError(null);
  }, [quote]);

  const loadCustomerText = async (customerId: string) => {
    try {
      const results = await lookupService.searchAccounts('');
      const customer = results.find(r => r.id === customerId);
      if (customer) {
        setSelectedCustomerText(customer.text);
      }
    } catch (err) {
      console.error('Failed to load customer text:', err);
    }
  };

  const handleSave = async (closeAfter: boolean) => {
    try {
      setSaving(true);
      setError(null);

      if (quote) {
        await d365QuoteService.update(quote.id, formData);
      } else {
        await d365QuoteService.create(formData);
      }

      onSave();
      setSaving(false);
      
      if (closeAfter) {
        onDismiss();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save quote');
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

  const parseDate = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  return (
    <Stack tokens={{ childrenGap: 0 }} styles={{ root: { height: '100%', backgroundColor: 'white' } }}>
      <StandardFormHeader
        title={quote ? (quote.name || 'Edit Quote') : 'New Quote'}
        subtitle="Quote"
        onBack={onDismiss}
        onSave={() => handleSave(false)}
        onSaveAndClose={() => handleSave(true)}
        onDelete={quote && onDelete ? handleDelete : undefined}
        saving={saving}
        isNew={!quote}
      />

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <Stack horizontal styles={{ root: { borderBottom: '1px solid #edebe9', backgroundColor: '#faf9f8' } }}>
        <DefaultButton text="Quote Information" onClick={() => setActiveTab('basic')} styles={tabStyles(activeTab === 'basic')} />
        <DefaultButton text="Customer Details" onClick={() => setActiveTab('customer')} styles={tabStyles(activeTab === 'customer')} />
        <DefaultButton text="Amounts" onClick={() => setActiveTab('amounts')} styles={tabStyles(activeTab === 'amounts')} />
      </Stack>

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: 20 } }}>
        {activeTab === 'basic' && (
          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { width: '60%', flexShrink: 0 } }}>
                  <TextField
                    label="Quote Number"
                    required
                    value={formData.quoteNumber}
                    onChange={(_, value) =>
                      setFormData({ ...formData, quoteNumber: value || '' })
                    }
                  />

                  <TextField
                    label="Quote Name"
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

            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { width: '40%' } }}>
              <DatePicker
                    label="Effective From"
                    value={parseDate(formData.effectiveFrom)}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, effectiveFrom: date?.toISOString() || '' })
                    }
                  />

                  <DatePicker
                    label="Effective To"
                    value={parseDate(formData.effectiveTo)}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, effectiveTo: date?.toISOString() || '' })
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
          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
            <StandardLookupField
              label="Customer"
              value={formData.customerId}
              selectedText={selectedCustomerText}
              entityName="Account"
              onChange={(id) => {
                setFormData({ ...formData, customerId: id });
                if (!id) setSelectedCustomerText('');
              }}
              onTextChange={(text) => setSelectedCustomerText(text)}
              onSearch={searchAccounts}
            />

            <TextField
              label="Owner ID"
              value={formData.ownerId}
              onChange={(_, value) => setFormData({ ...formData, ownerId: value || '' })}
            />
          </Stack>
        )}

        {activeTab === 'amounts' && (
          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 600 } }}>
            <TextField
              label="Total Amount"
              type="number"
              value={String(formData.totalAmount)}
              onChange={(_, value) =>
                setFormData({ ...formData, totalAmount: Number(value) || 0 })
              }
              prefix="R"
            />

            <TextField
              label="Total Discount Amount"
              type="number"
              value={String(formData.totalDiscountAmount)}
              onChange={(_, value) =>
                setFormData({ ...formData, totalDiscountAmount: Number(value) || 0 })
              }
              prefix="R"
            />

            <TextField
              label="Total Line Item Amount"
              type="number"
              value={String(formData.totalLineItemAmount)}
              onChange={(_, value) =>
                setFormData({ ...formData, totalLineItemAmount: Number(value) || 0 })
              }
              prefix="R"
            />
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};
