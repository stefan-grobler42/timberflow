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
import { d365ProductService } from '../services/d365Services';
import type { D365Product } from '../types/millennium';

interface D365ProductFormProps {
  product?: D365Product;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const D365ProductForm = ({
  product,
  onDismiss,
  onSave,
  onDelete,
}: D365ProductFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<D365Product>>({
    productNumber: '',
    name: '',
    description: '',
    productStructure: 0,
    productTypeCode: 0,
    quantityOnHand: 0,
    quantityDecimal: 0,
    stockWeight: 0,
    stockVolume: 0,
    price: 0,
    currentCost: 0,
    standardCost: 0,
    vendorId: '',
    vendorName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        productNumber: product.productNumber || '',
        name: product.name || '',
        description: product.description || '',
        productStructure: product.productStructure || 0,
        productTypeCode: product.productTypeCode || 0,
        quantityOnHand: product.quantityOnHand || 0,
        quantityDecimal: product.quantityDecimal || 0,
        stockWeight: product.stockWeight || 0,
        stockVolume: product.stockVolume || 0,
        price: product.price || 0,
        currentCost: product.currentCost || 0,
        standardCost: product.standardCost || 0,
        vendorId: product.vendorId || '',
        vendorName: product.vendorName || '',
      });
    }
    setError(null);
  }, [product]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (product) {
        await d365ProductService.update(product.id, formData);
      } else {
        await d365ProductService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (product) {
        await d365ProductService.update(product.id, formData);
      } else {
        await d365ProductService.create(formData);
      }

      setFormData({
        productNumber: '',
        name: '',
        description: '',
        productStructure: 0,
        productTypeCode: 0,
        quantityOnHand: 0,
        quantityDecimal: 0,
        stockWeight: 0,
        stockVolume: 0,
        price: 0,
        currentCost: 0,
        standardCost: 0,
        vendorId: '',
        vendorName: '',
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
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
    ...(product && onDelete
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
        {product ? 'Edit Product' : 'New Product'}
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
              text="Product Information"
              iconProps={{ iconName: 'Product' }}
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
              text="Inventory"
              iconProps={{ iconName: 'NumberedList' }}
              onClick={() => setActiveTab('inventory')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'inventory' ? '#0078d4' : 'transparent',
                  color: activeTab === 'inventory' ? 'white' : '#323130',
                  fontWeight: activeTab === 'inventory' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'inventory' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'inventory' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Pricing"
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
            {activeTab === 'basic' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16, overflowY: 'auto' } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Product Number"
                    required
                    value={formData.productNumber}
                    onChange={(_, value) =>
                      setFormData({ ...formData, productNumber: value || '' })
                    }
                  />

                  <TextField
                    label="Product Name"
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
                  <TextField
                    label="Product Structure"
                    type="number"
                    value={String(formData.productStructure)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, productStructure: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Product Type Code"
                    type="number"
                    value={String(formData.productTypeCode)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, productTypeCode: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Vendor ID"
                    value={formData.vendorId}
                    onChange={(_, value) => setFormData({ ...formData, vendorId: value || '' })}
                  />

                  <TextField
                    label="Vendor Name"
                    value={formData.vendorName}
                    onChange={(_, value) =>
                      setFormData({ ...formData, vendorName: value || '' })
                    }
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'inventory' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16, overflowY: 'auto' } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Quantity On Hand"
                    type="number"
                    value={String(formData.quantityOnHand)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, quantityOnHand: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Quantity Decimal"
                    type="number"
                    value={String(formData.quantityDecimal)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, quantityDecimal: Number(value) || 0 })
                    }
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Stock Weight"
                    type="number"
                    value={String(formData.stockWeight)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, stockWeight: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Stock Volume"
                    type="number"
                    value={String(formData.stockVolume)}
                    onChange={(_, value) =>
                      setFormData({ ...formData, stockVolume: Number(value) || 0 })
                    }
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'pricing' && (
              <Stack
                tokens={{ childrenGap: 16 }}
                styles={{ root: { marginTop: 16, maxWidth: 600 } }}
              >
                <TextField
                  label="Price"
                  type="number"
                  value={String(formData.price)}
                  onChange={(_, value) => setFormData({ ...formData, price: Number(value) || 0 })}
                  prefix="$"
                />

                <TextField
                  label="Current Cost"
                  type="number"
                  value={String(formData.currentCost)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, currentCost: Number(value) || 0 })
                  }
                  prefix="$"
                />

                <TextField
                  label="Standard Cost"
                  type="number"
                  value={String(formData.standardCost)}
                  onChange={(_, value) =>
                    setFormData({ ...formData, standardCost: Number(value) || 0 })
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
