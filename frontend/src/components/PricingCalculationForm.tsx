import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
} from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { pricingCalculationService } from '../services';
import type { PricingCalculation } from '../types/millennium';

interface PricingCalculationFormProps {
  pricingCalculation?: PricingCalculation;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const PricingCalculationForm = ({
  pricingCalculation,
  onDismiss,
  onSave,
  onDelete,
}: PricingCalculationFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('product');
  const [formData, setFormData] = useState<Partial<PricingCalculation>>({
    productName: '',
    test: '',
    discount: 0,
    installedCost: 0,
    installedCostBase: 0,
    quantity: 0,
    totalPrice: 0,
    totalPriceBase: 0,
    unitPrice: 0,
    unitPriceBase: 0,
    exchangeRate: 1,
    transactionCurrencyId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pricingCalculation) {
      setFormData({
        productName: pricingCalculation.productName || '',
        test: pricingCalculation.test || '',
        discount: pricingCalculation.discount || 0,
        installedCost: pricingCalculation.installedCost || 0,
        installedCostBase: pricingCalculation.installedCostBase || 0,
        quantity: pricingCalculation.quantity || 0,
        totalPrice: pricingCalculation.totalPrice || 0,
        totalPriceBase: pricingCalculation.totalPriceBase || 0,
        unitPrice: pricingCalculation.unitPrice || 0,
        unitPriceBase: pricingCalculation.unitPriceBase || 0,
        exchangeRate: pricingCalculation.exchangeRate || 1,
        transactionCurrencyId: pricingCalculation.transactionCurrencyId || '',
      });
    }
    setError(null);
  }, [pricingCalculation]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (pricingCalculation) {
        await pricingCalculationService.update(pricingCalculation.id, formData);
      } else {
        await pricingCalculationService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing calculation');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (pricingCalculation) {
        await pricingCalculationService.update(pricingCalculation.id, formData);
      } else {
        await pricingCalculationService.create(formData);
      }

      setFormData({
        productName: '',
        test: '',
        discount: 0,
        installedCost: 0,
        installedCostBase: 0,
        quantity: 0,
        totalPrice: 0,
        totalPriceBase: 0,
        unitPrice: 0,
        unitPriceBase: 0,
        exchangeRate: 1,
        transactionCurrencyId: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing calculation');
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
    ...(pricingCalculation && onDelete
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
        {pricingCalculation ? 'Edit Pricing Calculation' : 'New Pricing Calculation'}
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
              text="Product Details"
              iconProps={{ iconName: 'Product' }}
              onClick={() => setActiveTab('product')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'product' ? '#0078d4' : 'transparent',
                  color: activeTab === 'product' ? 'white' : '#323130',
                  fontWeight: activeTab === 'product' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'product' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'product' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Pricing & Costs"
              iconProps={{ iconName: 'Money' }}
              onClick={() => setActiveTab('pricing')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'pricing' ? '#0078d4' : 'transparent',
                  color: activeTab === 'pricing' ? 'white' : '#323130',
                  fontWeight: activeTab === 'pricing' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'pricing' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'pricing' ? 'white' : '#323130',
                },
              }}
            />
          </Stack>

          <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '20px 0' } }}>
            {activeTab === 'product' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16, maxWidth: 600 } }}>
                <TextField
                  label="Product Name"
                  value={formData.productName}
                  onChange={(_, value) => setFormData({ ...formData, productName: value || '' })}
                />

                <TextField
                  label="Test"
                  value={formData.test}
                  onChange={(_, value) => setFormData({ ...formData, test: value || '' })}
                />

                <TextField
                  label="Quantity"
                  type="number"
                  value={String(formData.quantity || '')}
                  onChange={(_, value) =>
                    setFormData({ ...formData, quantity: Number(value) || 0 })
                  }
                />

                <TextField
                  label="Transaction Currency ID"
                  value={formData.transactionCurrencyId}
                  onChange={(_, value) =>
                    setFormData({ ...formData, transactionCurrencyId: value || '' })
                  }
                />

                <TextField
                  label="Exchange Rate"
                  type="number"
                  value={String(formData.exchangeRate || '')}
                  onChange={(_, value) =>
                    setFormData({ ...formData, exchangeRate: Number(value) || 1 })
                  }
                />
              </Stack>
            )}

            {activeTab === 'pricing' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16 } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Unit Price"
                    type="number"
                    value={String(formData.unitPrice || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, unitPrice: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Unit Price (Base)"
                    type="number"
                    value={String(formData.unitPriceBase || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, unitPriceBase: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Discount %"
                    type="number"
                    value={String(formData.discount || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, discount: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Total Price"
                    type="number"
                    value={String(formData.totalPrice || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, totalPrice: Number(value) || 0 })
                    }
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Total Price (Base)"
                    type="number"
                    value={String(formData.totalPriceBase || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, totalPriceBase: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Installed Cost"
                    type="number"
                    value={String(formData.installedCost || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, installedCost: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Installed Cost (Base)"
                    type="number"
                    value={String(formData.installedCostBase || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, installedCostBase: Number(value) || 0 })
                    }
                  />
                </Stack>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
