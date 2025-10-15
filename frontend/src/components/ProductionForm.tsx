import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  Checkbox,
  MessageBar,
  MessageBarType,
  DefaultButton,
  CommandBar,
  DatePicker,
  Dropdown,
} from '@fluentui/react';
import type { ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { productionService, customerService } from '../services';
import type { Production, Customer } from '../types/millennium';

interface ProductionFormProps {
  production?: Production;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

export const ProductionForm = ({
  production,
  onDismiss,
  onSave,
  onDelete,
}: ProductionFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [formData, setFormData] = useState<Partial<Production>>({
    name: '',
    customer: '',
    orderNo: '',
    jigStart: '',
    jigEnd: '',
    jigLeader: '',
    jigHelper1: '',
    jigHelper2: '',
    jigHelper3: '',
    jigHelper4: '',
    pickStart: '',
    pickEnd: '',
    pickingMaster: '',
    pickingHelper1: '',
    pickingHelper2: '',
    pickingHelper3: '',
    sawStart: '',
    sawEnd: '',
    sawOperator: '',
    sawHelper1: '',
    sawHelper2: '',
    productionComplete: false,
    productionPlannedDate: '',
    totalCuts: 0,
    totalTimberCubes: 0,
    trussCost: 0,
    trussSelling: 0,
    workUnitsEfinks: 0,
    newEstimateDefinks: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const customerOptions: IDropdownOption[] = [
    { key: '', text: '(None)' },
    ...customers.map((c) => ({ key: c.id, text: c.accountName })),
  ];

  useEffect(() => {
    if (production) {
      setFormData({
        name: production.name || '',
        customer: production.customer || '',
        orderNo: production.orderNo || '',
        jigStart: production.jigStart || '',
        jigEnd: production.jigEnd || '',
        jigLeader: production.jigLeader || '',
        jigHelper1: production.jigHelper1 || '',
        jigHelper2: production.jigHelper2 || '',
        jigHelper3: production.jigHelper3 || '',
        jigHelper4: production.jigHelper4 || '',
        pickStart: production.pickStart || '',
        pickEnd: production.pickEnd || '',
        pickingMaster: production.pickingMaster || '',
        pickingHelper1: production.pickingHelper1 || '',
        pickingHelper2: production.pickingHelper2 || '',
        pickingHelper3: production.pickingHelper3 || '',
        sawStart: production.sawStart || '',
        sawEnd: production.sawEnd || '',
        sawOperator: production.sawOperator || '',
        sawHelper1: production.sawHelper1 || '',
        sawHelper2: production.sawHelper2 || '',
        productionComplete: production.productionComplete || false,
        productionPlannedDate: production.productionPlannedDate || '',
        totalCuts: production.totalCuts || 0,
        totalTimberCubes: production.totalTimberCubes || 0,
        trussCost: production.trussCost || 0,
        trussSelling: production.trussSelling || 0,
        workUnitsEfinks: production.workUnitsEfinks || 0,
        newEstimateDefinks: production.newEstimateDefinks || 0,
      });
    }
    setError(null);
  }, [production]);

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      if (production) {
        await productionService.update(production.id, formData);
      } else {
        await productionService.create(formData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save production');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      if (production) {
        await productionService.update(production.id, formData);
      } else {
        await productionService.create(formData);
      }

      setFormData({
        name: '',
        customer: '',
        orderNo: '',
        jigStart: '',
        jigEnd: '',
        jigLeader: '',
        jigHelper1: '',
        jigHelper2: '',
        jigHelper3: '',
        jigHelper4: '',
        pickStart: '',
        pickEnd: '',
        pickingMaster: '',
        pickingHelper1: '',
        pickingHelper2: '',
        pickingHelper3: '',
        sawStart: '',
        sawEnd: '',
        sawOperator: '',
        sawHelper1: '',
        sawHelper2: '',
        productionComplete: false,
        productionPlannedDate: '',
        totalCuts: 0,
        totalTimberCubes: 0,
        trussCost: 0,
        trussSelling: 0,
        workUnitsEfinks: 0,
        newEstimateDefinks: 0,
      });
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save production');
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
    ...(production && onDelete
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
        {production ? 'Edit Production' : 'New Production'}
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
              text="Basic Info"
              iconProps={{ iconName: 'Info' }}
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
              text="Jig Team"
              iconProps={{ iconName: 'People' }}
              onClick={() => setActiveTab('jig')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'jig' ? '#0078d4' : 'transparent',
                  color: activeTab === 'jig' ? 'white' : '#323130',
                  fontWeight: activeTab === 'jig' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'jig' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'jig' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Picking Team"
              iconProps={{ iconName: 'People' }}
              onClick={() => setActiveTab('picking')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'picking' ? '#0078d4' : 'transparent',
                  color: activeTab === 'picking' ? 'white' : '#323130',
                  fontWeight: activeTab === 'picking' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'picking' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'picking' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Saw Team"
              iconProps={{ iconName: 'People' }}
              onClick={() => setActiveTab('saw')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'saw' ? '#0078d4' : 'transparent',
                  color: activeTab === 'saw' ? 'white' : '#323130',
                  fontWeight: activeTab === 'saw' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'saw' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'saw' ? 'white' : '#323130',
                },
              }}
            />
            <DefaultButton
              text="Production Metrics"
              iconProps={{ iconName: 'Chart' }}
              onClick={() => setActiveTab('metrics')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: activeTab === 'metrics' ? '#0078d4' : 'transparent',
                  color: activeTab === 'metrics' ? 'white' : '#323130',
                  fontWeight: activeTab === 'metrics' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: activeTab === 'metrics' ? '#106ebe' : '#f3f2f1',
                  color: activeTab === 'metrics' ? 'white' : '#323130',
                },
              }}
            />
          </Stack>

          <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '20px 0' } }}>
            {activeTab === 'basic' && (
              <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16, maxWidth: 600 } }}>
                <TextField
                  label="Name"
                  required
                  value={formData.name}
                  onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
                />

                <Dropdown
                  label="Customer"
                  options={customerOptions}
                  selectedKey={formData.customer || ''}
                  onChange={(_, option) =>
                    setFormData({ ...formData, customer: option?.key as string || '' })
                  }
                />

                <TextField
                  label="Order No"
                  value={formData.orderNo}
                  onChange={(_, value) => setFormData({ ...formData, orderNo: value || '' })}
                />

                <DatePicker
                  label="Production Planned Date"
                  value={formData.productionPlannedDate ? new Date(formData.productionPlannedDate) : undefined}
                  onSelectDate={(date) =>
                    setFormData({ ...formData, productionPlannedDate: date?.toISOString() || '' })
                  }
                />

                <Checkbox
                  label="Production Complete"
                  checked={formData.productionComplete}
                  onChange={(_, checked) =>
                    setFormData({ ...formData, productionComplete: checked || false })
                  }
                />
              </Stack>
            )}

            {activeTab === 'jig' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16 } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <DatePicker
                    label="Jig Start"
                    value={formData.jigStart ? new Date(formData.jigStart) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, jigStart: date?.toISOString() || '' })
                    }
                  />

                  <DatePicker
                    label="Jig End"
                    value={formData.jigEnd ? new Date(formData.jigEnd) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, jigEnd: date?.toISOString() || '' })
                    }
                  />

                  <TextField
                    label="Jig Leader"
                    value={formData.jigLeader}
                    onChange={(_, value) => setFormData({ ...formData, jigLeader: value || '' })}
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Jig Helper 1"
                    value={formData.jigHelper1}
                    onChange={(_, value) => setFormData({ ...formData, jigHelper1: value || '' })}
                  />

                  <TextField
                    label="Jig Helper 2"
                    value={formData.jigHelper2}
                    onChange={(_, value) => setFormData({ ...formData, jigHelper2: value || '' })}
                  />

                  <TextField
                    label="Jig Helper 3"
                    value={formData.jigHelper3}
                    onChange={(_, value) => setFormData({ ...formData, jigHelper3: value || '' })}
                  />

                  <TextField
                    label="Jig Helper 4"
                    value={formData.jigHelper4}
                    onChange={(_, value) => setFormData({ ...formData, jigHelper4: value || '' })}
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'picking' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16 } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <DatePicker
                    label="Pick Start"
                    value={formData.pickStart ? new Date(formData.pickStart) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, pickStart: date?.toISOString() || '' })
                    }
                  />

                  <DatePicker
                    label="Pick End"
                    value={formData.pickEnd ? new Date(formData.pickEnd) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, pickEnd: date?.toISOString() || '' })
                    }
                  />

                  <TextField
                    label="Picking Master"
                    value={formData.pickingMaster}
                    onChange={(_, value) =>
                      setFormData({ ...formData, pickingMaster: value || '' })
                    }
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Picking Helper 1"
                    value={formData.pickingHelper1}
                    onChange={(_, value) =>
                      setFormData({ ...formData, pickingHelper1: value || '' })
                    }
                  />

                  <TextField
                    label="Picking Helper 2"
                    value={formData.pickingHelper2}
                    onChange={(_, value) =>
                      setFormData({ ...formData, pickingHelper2: value || '' })
                    }
                  />

                  <TextField
                    label="Picking Helper 3"
                    value={formData.pickingHelper3}
                    onChange={(_, value) =>
                      setFormData({ ...formData, pickingHelper3: value || '' })
                    }
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'saw' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16 } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <DatePicker
                    label="Saw Start"
                    value={formData.sawStart ? new Date(formData.sawStart) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, sawStart: date?.toISOString() || '' })
                    }
                  />

                  <DatePicker
                    label="Saw End"
                    value={formData.sawEnd ? new Date(formData.sawEnd) : undefined}
                    onSelectDate={(date) =>
                      setFormData({ ...formData, sawEnd: date?.toISOString() || '' })
                    }
                  />

                  <TextField
                    label="Saw Operator"
                    value={formData.sawOperator}
                    onChange={(_, value) => setFormData({ ...formData, sawOperator: value || '' })}
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Saw Helper 1"
                    value={formData.sawHelper1}
                    onChange={(_, value) => setFormData({ ...formData, sawHelper1: value || '' })}
                  />

                  <TextField
                    label="Saw Helper 2"
                    value={formData.sawHelper2}
                    onChange={(_, value) => setFormData({ ...formData, sawHelper2: value || '' })}
                  />
                </Stack>
              </Stack>
            )}

            {activeTab === 'metrics' && (
              <Stack
                horizontal
                tokens={{ childrenGap: 32 }}
                styles={{ root: { marginTop: 16 } }}
              >
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Total Cuts"
                    type="number"
                    value={String(formData.totalCuts || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, totalCuts: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Total Timber Cubes"
                    type="number"
                    value={String(formData.totalTimberCubes || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, totalTimberCubes: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Truss Cost"
                    type="number"
                    prefix="R"
                    value={String(formData.trussCost || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, trussCost: Number(value) || 0 })
                    }
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                  <TextField
                    label="Truss Selling"
                    type="number"
                    prefix="R"
                    value={String(formData.trussSelling || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, trussSelling: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Work Units Efinks"
                    type="number"
                    value={String(formData.workUnitsEfinks || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, workUnitsEfinks: Number(value) || 0 })
                    }
                  />

                  <TextField
                    label="Estimate Definks"
                    type="number"
                    value={String(formData.newEstimateDefinks || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, newEstimateDefinks: Number(value) || 0 })
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
