import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  TextField,
  MessageBar,
  MessageBarType,
  DefaultButton,
  DatePicker,
  Dropdown,
  Label,
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { productionService } from '../services/millenniumServices';
import { lookupService, accountService, d365OrderService } from '../services/d365Services';
import { StandardLookupField, StandardFormHeader, type LookupOption } from './standards';
import type { Production } from '../types/millennium';

interface D365ProductionFormProps {
  production?: Production;
  onDismiss: () => void;
  onSave: () => void;
  onDelete?: () => void;
}

const productionCompleteOptions: IDropdownOption[] = [
  { key: 'yes', text: 'Yes' },
  { key: 'no', text: 'No' },
];

export const D365ProductionForm = ({
  production,
  onDismiss,
  onSave,
  onDelete,
}: D365ProductionFormProps) => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [formData, setFormData] = useState<Partial<Production>>({
    name: '',
    customer: '',
    orderNo: '',
    productionPlannedDate: '',
    newEstimateDefinks: 0,
    productionComplete: false,
    trussCost: 0,
    trussSelling: 0,
    totalTimberCubes: 0,
    workUnitsEfinks: 0,
    pickStart: '',
    pickEnd: '',
    sawStart: '',
    sawEnd: '',
    jigStart: '',
    jigEnd: '',
    pickingMaster: '',
    pickingHelper1: '',
    pickingHelper2: '',
    pickingHelper3: '',
    sawOperator: '',
    sawHelper1: '',
    sawHelper2: '',
    jigLeader: '',
    jigHelper1: '',
    jigHelper2: '',
    jigHelper3: '',
    jigHelper4: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [selectedOrderText, setSelectedOrderText] = useState<string>('');
  const [selectedCustomerText, setSelectedCustomerText] = useState<string>('');
  const [selectedPickingMasterText, setSelectedPickingMasterText] = useState<string>('');
  const [selectedPickingHelper1Text, setSelectedPickingHelper1Text] = useState<string>('');
  const [selectedPickingHelper2Text, setSelectedPickingHelper2Text] = useState<string>('');
  const [selectedPickingHelper3Text, setSelectedPickingHelper3Text] = useState<string>('');
  const [selectedSawOperatorText, setSelectedSawOperatorText] = useState<string>('');
  const [selectedSawHelper1Text, setSelectedSawHelper1Text] = useState<string>('');
  const [selectedSawHelper2Text, setSelectedSawHelper2Text] = useState<string>('');
  const [selectedJigLeaderText, setSelectedJigLeaderText] = useState<string>('');
  const [selectedJigHelper1Text, setSelectedJigHelper1Text] = useState<string>('');
  const [selectedJigHelper2Text, setSelectedJigHelper2Text] = useState<string>('');
  const [selectedJigHelper3Text, setSelectedJigHelper3Text] = useState<string>('');
  const [selectedJigHelper4Text, setSelectedJigHelper4Text] = useState<string>('');

  useEffect(() => {
    if (production) {
      setFormData({
        name: production.name || '',
        customer: production.customer || '',
        orderNo: production.orderNo || '',
        productionPlannedDate: production.productionPlannedDate || '',
        newEstimateDefinks: production.newEstimateDefinks || 0,
        productionComplete: production.productionComplete || false,
        trussCost: production.trussCost || 0,
        trussSelling: production.trussSelling || 0,
        totalTimberCubes: production.totalTimberCubes || 0,
        workUnitsEfinks: production.workUnitsEfinks || 0,
        pickStart: production.pickStart || '',
        pickEnd: production.pickEnd || '',
        sawStart: production.sawStart || '',
        sawEnd: production.sawEnd || '',
        jigStart: production.jigStart || '',
        jigEnd: production.jigEnd || '',
        pickingMaster: production.pickingMaster || '',
        pickingHelper1: production.pickingHelper1 || '',
        pickingHelper2: production.pickingHelper2 || '',
        pickingHelper3: production.pickingHelper3 || '',
        sawOperator: production.sawOperator || '',
        sawHelper1: production.sawHelper1 || '',
        sawHelper2: production.sawHelper2 || '',
        jigLeader: production.jigLeader || '',
        jigHelper1: production.jigHelper1 || '',
        jigHelper2: production.jigHelper2 || '',
        jigHelper3: production.jigHelper3 || '',
        jigHelper4: production.jigHelper4 || '',
      });
      
      loadLookupTexts(production);
    }
    setError(null);
  }, [production]);

  const loadLookupTexts = async (prod: Production) => {
    try {
      if (prod.orderNo) {
        const orders = await d365OrderService.getAll();
        const order = orders.find(o => o.id === prod.orderNo);
        if (order) {
          setSelectedOrderText(order.orderNumber ? `${order.orderNumber} - ${order.name || ''}` : (order.name || ''));
        }
      }
      
      if (prod.customer) {
        const accounts = await accountService.getAll();
        const account = accounts.find(a => a.id === prod.customer);
        if (account) {
          setSelectedCustomerText(account.name || '');
        }
      }
      
      const loadEmployee = async (id: string | undefined, setter: (text: string) => void) => {
        if (id) {
          const results = await lookupService.searchEmployees('');
          const employee = results.find(e => e.id === id);
          if (employee) setter(employee.text);
        }
      };
      
      await Promise.all([
        loadEmployee(prod.pickingMaster, setSelectedPickingMasterText),
        loadEmployee(prod.pickingHelper1, setSelectedPickingHelper1Text),
        loadEmployee(prod.pickingHelper2, setSelectedPickingHelper2Text),
        loadEmployee(prod.pickingHelper3, setSelectedPickingHelper3Text),
        loadEmployee(prod.sawOperator, setSelectedSawOperatorText),
        loadEmployee(prod.sawHelper1, setSelectedSawHelper1Text),
        loadEmployee(prod.sawHelper2, setSelectedSawHelper2Text),
        loadEmployee(prod.jigLeader, setSelectedJigLeaderText),
        loadEmployee(prod.jigHelper1, setSelectedJigHelper1Text),
        loadEmployee(prod.jigHelper2, setSelectedJigHelper2Text),
        loadEmployee(prod.jigHelper3, setSelectedJigHelper3Text),
        loadEmployee(prod.jigHelper4, setSelectedJigHelper4Text),
      ]);
    } catch (err) {
      console.error('Failed to load lookup texts:', err);
    }
  };

  const searchOrders = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await d365OrderService.searchOrders(searchTerm);
      return results;
    } catch (error) {
      console.error('Error searching orders:', error);
      return [];
    }
  };

  const searchAccounts = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await lookupService.searchAccounts(searchTerm);
      return results;
    } catch (error) {
      console.error('Error searching accounts:', error);
      return [];
    }
  };

  const searchEmployees = async (searchTerm: string): Promise<LookupOption[]> => {
    try {
      const results = await lookupService.searchEmployees(searchTerm);
      return results;
    } catch (error) {
      console.error('Error searching employees:', error);
      return [];
    }
  };

  const cleanFormData = (data: Partial<Production>): Partial<Production> => {
    const cleaned = { ...data };
    
    // Convert empty strings to undefined for date fields
    const dateFields: (keyof Production)[] = [
      'pickStart', 'pickEnd', 'sawStart', 'sawEnd', 'jigStart', 'jigEnd', 'productionPlannedDate'
    ];
    
    dateFields.forEach(field => {
      if (cleaned[field] === '') {
        cleaned[field] = undefined as any;
      }
    });
    
    // Convert empty strings to undefined for lookup/ID fields
    const idFields: (keyof Production)[] = [
      'orderNo', 'customer', 'pickingMaster', 'pickingHelper1', 'pickingHelper2', 'pickingHelper3',
      'sawOperator', 'sawHelper1', 'sawHelper2', 'jigLeader', 'jigHelper1', 'jigHelper2', 'jigHelper3', 'jigHelper4'
    ];
    
    idFields.forEach(field => {
      if (cleaned[field] === '') {
        cleaned[field] = undefined as any;
      }
    });
    
    return cleaned;
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const cleanedData = cleanFormData(formData);

      if (production) {
        await productionService.update(production.id, cleanedData);
      } else {
        await productionService.create(cleanedData);
      }

      onSave();
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save production');
      setSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    try {
      setSaving(true);
      setError(null);

      const cleanedData = cleanFormData(formData);

      if (production) {
        await productionService.update(production.id, cleanedData);
      } else {
        await productionService.create(cleanedData);
      }

      onSave();
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save production');
      setSaving(false);
    }
  };

  const handleSaveAndNew = async () => {
    try {
      setSaving(true);
      setError(null);

      const cleanedData = cleanFormData(formData);

      if (production) {
        await productionService.update(production.id, cleanedData);
      } else {
        await productionService.create(cleanedData);
      }

      setFormData({
        name: '',
        customer: '',
        orderNo: '',
        productionPlannedDate: '',
        newEstimateDefinks: 0,
        productionComplete: false,
        trussCost: 0,
        trussSelling: 0,
        totalTimberCubes: 0,
        workUnitsEfinks: 0,
        pickStart: '',
        pickEnd: '',
        sawStart: '',
        sawEnd: '',
        jigStart: '',
        jigEnd: '',
        pickingMaster: '',
        pickingHelper1: '',
        pickingHelper2: '',
        pickingHelper3: '',
        sawOperator: '',
        sawHelper1: '',
        sawHelper2: '',
        jigLeader: '',
        jigHelper1: '',
        jigHelper2: '',
        jigHelper3: '',
        jigHelper4: '',
      });
      
      setSelectedOrderText('');
      setSelectedCustomerText('');
      setSelectedPickingMasterText('');
      setSelectedPickingHelper1Text('');
      setSelectedPickingHelper2Text('');
      setSelectedPickingHelper3Text('');
      setSelectedSawOperatorText('');
      setSelectedSawHelper1Text('');
      setSelectedSawHelper2Text('');
      setSelectedJigLeaderText('');
      setSelectedJigHelper1Text('');
      setSelectedJigHelper2Text('');
      setSelectedJigHelper3Text('');
      setSelectedJigHelper4Text('');
      
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save production');
      setSaving(false);
    }
  };

  const parseDate = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  };

  const formatDateForDisplay = (date?: Date): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const getFormTitle = (): string => {
    if (production && formData.name) {
      return `${formData.name}${production ? ' - Saved' : ''}`;
    }
    return production ? 'Edit Production' : 'New Production';
  };

  return (
    <Stack tokens={{ childrenGap: 0 }} styles={{ root: { height: '100%' } }}>
      <StandardFormHeader
        title={getFormTitle()}
        onBack={onDismiss}
        onSave={handleSubmit}
        onSaveAndExit={handleSaveAndExit}
        onDelete={production && onDelete ? onDelete : undefined}
        onCancel={onDismiss}
        saving={saving}
        isNew={!production}
        onSaveAndNew={handleSaveAndNew}
      />

      <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '0 20px 20px 20px' } }}>
        {error && (
          <MessageBar 
            messageBarType={MessageBarType.error} 
            onDismiss={() => setError(null)}
            styles={{ root: { marginTop: 16 } }}
          >
            {error}
          </MessageBar>
        )}

        <Stack styles={{ root: { flex: 1, display: 'flex', flexDirection: 'column', marginTop: 16 } }}>
          <Stack horizontal styles={{ root: { borderBottom: '1px solid #edebe9' } }}>
            <DefaultButton
              text="General"
              iconProps={{ iconName: 'PageHeaderEdit' }}
              onClick={() => setActiveTab('general')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: activeTab === 'general' ? '2px solid #0078d4' : '2px solid transparent',
                  color: '#323130',
                  fontWeight: activeTab === 'general' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: '#f3f2f1',
                },
              }}
            />
            <DefaultButton
              text="Related"
              iconProps={{ iconName: 'Relationship' }}
              onClick={() => setActiveTab('related')}
              styles={{
                root: {
                  height: 48,
                  padding: '0 24px',
                  borderRadius: 0,
                  border: 'none',
                  backgroundColor: 'transparent',
                  borderBottom: activeTab === 'related' ? '2px solid #0078d4' : '2px solid transparent',
                  color: '#323130',
                  fontWeight: activeTab === 'related' ? 600 : 400,
                },
                rootHovered: {
                  backgroundColor: '#f3f2f1',
                },
              }}
            />
          </Stack>

          <Stack styles={{ root: { flex: 1, overflowY: 'auto', padding: '20px 0' } }}>
            {activeTab === 'general' && (
              <Stack tokens={{ childrenGap: 32 }}>
                <Stack tokens={{ childrenGap: 16 }}>
                  <Text variant="large" styles={{ root: { fontWeight: 600, color: '#323130' } }}>
                    Details
                  </Text>
                  
                  <Stack horizontal tokens={{ childrenGap: 32 }}>
                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <StandardLookupField
                        label="Order No."
                        value={formData.orderNo}
                        selectedText={selectedOrderText}
                        entityName="Order"
                        onChange={(id) => {
                          setFormData({ ...formData, orderNo: id });
                          if (!id) setSelectedOrderText('');
                        }}
                        onTextChange={(text) => setSelectedOrderText(text)}
                        onSearch={searchOrders}
                        disabled={saving}
                      />

                      <StandardLookupField
                        label="Customer"
                        value={formData.customer}
                        selectedText={selectedCustomerText}
                        entityName="Customer"
                        onChange={(id) => {
                          setFormData({ ...formData, customer: id });
                          if (!id) setSelectedCustomerText('');
                        }}
                        onTextChange={(text) => setSelectedCustomerText(text)}
                        onSearch={searchAccounts}
                        disabled={saving}
                      />

                      <TextField
                        label="Description"
                        multiline
                        rows={3}
                        value={formData.name}
                        onChange={(_, value) => setFormData({ ...formData, name: value || '' })}
                        disabled={saving}
                      />
                    </Stack>

                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <DatePicker
                        label="Production Planned Date"
                        value={parseDate(formData.productionPlannedDate)}
                        onSelectDate={(date) =>
                          setFormData({ ...formData, productionPlannedDate: date?.toISOString() || '' })
                        }
                        formatDate={formatDateForDisplay}
                        disabled={saving}
                      />

                      <TextField
                        label="Estimated E-Finks"
                        type="number"
                        value={String(formData.newEstimateDefinks || '')}
                        onChange={(_, value) =>
                          setFormData({ ...formData, newEstimateDefinks: Number(value) || 0 })
                        }
                        disabled={saving}
                      />

                      <Dropdown
                        label="Production Complete"
                        options={productionCompleteOptions}
                        selectedKey={formData.productionComplete ? 'yes' : 'no'}
                        onChange={(_, option) =>
                          setFormData({ ...formData, productionComplete: option?.key === 'yes' })
                        }
                        disabled={saving}
                      />
                    </Stack>
                  </Stack>
                </Stack>

                <Stack tokens={{ childrenGap: 16 }}>
                  <Text variant="large" styles={{ root: { fontWeight: 600, color: '#323130' } }}>
                    Tracking
                  </Text>
                  
                  <Stack horizontal tokens={{ childrenGap: 32 }}>
                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <TextField
                        label="Truss Cost"
                        value={formData.trussCost ? String(formData.trussCost) : '---'}
                        readOnly
                        disabled={saving}
                      />
                      <DatePicker
                        label="Pick Start"
                        value={parseDate(formData.pickStart)}
                        onSelectDate={(date) =>
                          setFormData({ ...formData, pickStart: date?.toISOString() || '' })
                        }
                        formatDate={formatDateForDisplay}
                        disabled={saving}
                      />
                      <DatePicker
                        label="Pick End"
                        value={parseDate(formData.pickEnd)}
                        onSelectDate={(date) =>
                          setFormData({ ...formData, pickEnd: date?.toISOString() || '' })
                        }
                        formatDate={formatDateForDisplay}
                        disabled={saving}
                      />
                    </Stack>

                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <TextField
                        label="Total Timber Cubes"
                        value={formData.totalTimberCubes ? String(formData.totalTimberCubes) : '---'}
                        readOnly
                        disabled={saving}
                      />
                      <DatePicker
                        label="Saw Start"
                        value={parseDate(formData.sawStart)}
                        onSelectDate={(date) =>
                          setFormData({ ...formData, sawStart: date?.toISOString() || '' })
                        }
                        formatDate={formatDateForDisplay}
                        disabled={saving}
                      />
                      <DatePicker
                        label="Saw End"
                        value={parseDate(formData.sawEnd)}
                        onSelectDate={(date) =>
                          setFormData({ ...formData, sawEnd: date?.toISOString() || '' })
                        }
                        formatDate={formatDateForDisplay}
                        disabled={saving}
                      />
                    </Stack>

                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <TextField
                        label="Work Units (E-Finks)"
                        value={formData.workUnitsEfinks ? String(formData.workUnitsEfinks) : '---'}
                        readOnly
                        disabled={saving}
                      />
                      <DatePicker
                        label="Jig Start"
                        value={parseDate(formData.jigStart)}
                        onSelectDate={(date) =>
                          setFormData({ ...formData, jigStart: date?.toISOString() || '' })
                        }
                        formatDate={formatDateForDisplay}
                        disabled={saving}
                      />
                      <DatePicker
                        label="Jig End"
                        value={parseDate(formData.jigEnd)}
                        onSelectDate={(date) =>
                          setFormData({ ...formData, jigEnd: date?.toISOString() || '' })
                        }
                        formatDate={formatDateForDisplay}
                        disabled={saving}
                      />
                    </Stack>
                  </Stack>
                  
                  <TextField
                    label="Truss Selling"
                    type="number"
                    value={String(formData.trussSelling || '')}
                    onChange={(_, value) =>
                      setFormData({ ...formData, trussSelling: Number(value) || 0 })
                    }
                    disabled={saving}
                    styles={{ root: { maxWidth: '300px' } }}
                  />
                </Stack>

                <Stack tokens={{ childrenGap: 16 }}>
                  <Text variant="large" styles={{ root: { fontWeight: 600, color: '#323130' } }}>
                    Assignment
                  </Text>
                  
                  <Stack horizontal tokens={{ childrenGap: 32 }}>
                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <Label styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>Picking Team</Label>
                      <StandardLookupField
                        label="Picking - Master"
                        value={formData.pickingMaster}
                        selectedText={selectedPickingMasterText}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, pickingMaster: id });
                          if (!id) setSelectedPickingMasterText('');
                        }}
                        onTextChange={(text) => setSelectedPickingMasterText(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                      <StandardLookupField
                        label="Picking - Helper 1"
                        value={formData.pickingHelper1}
                        selectedText={selectedPickingHelper1Text}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, pickingHelper1: id });
                          if (!id) setSelectedPickingHelper1Text('');
                        }}
                        onTextChange={(text) => setSelectedPickingHelper1Text(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                      <StandardLookupField
                        label="Picking - Helper 2"
                        value={formData.pickingHelper2}
                        selectedText={selectedPickingHelper2Text}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, pickingHelper2: id });
                          if (!id) setSelectedPickingHelper2Text('');
                        }}
                        onTextChange={(text) => setSelectedPickingHelper2Text(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                      <StandardLookupField
                        label="Picking - Helper 3"
                        value={formData.pickingHelper3}
                        selectedText={selectedPickingHelper3Text}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, pickingHelper3: id });
                          if (!id) setSelectedPickingHelper3Text('');
                        }}
                        onTextChange={(text) => setSelectedPickingHelper3Text(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                    </Stack>

                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <Label styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>Saw Team</Label>
                      <StandardLookupField
                        label="Saw - Operator"
                        value={formData.sawOperator}
                        selectedText={selectedSawOperatorText}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, sawOperator: id });
                          if (!id) setSelectedSawOperatorText('');
                        }}
                        onTextChange={(text) => setSelectedSawOperatorText(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                      <StandardLookupField
                        label="Saw - Helper 1"
                        value={formData.sawHelper1}
                        selectedText={selectedSawHelper1Text}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, sawHelper1: id });
                          if (!id) setSelectedSawHelper1Text('');
                        }}
                        onTextChange={(text) => setSelectedSawHelper1Text(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                      <StandardLookupField
                        label="Saw - Helper 2"
                        value={formData.sawHelper2}
                        selectedText={selectedSawHelper2Text}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, sawHelper2: id });
                          if (!id) setSelectedSawHelper2Text('');
                        }}
                        onTextChange={(text) => setSelectedSawHelper2Text(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                    </Stack>

                    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { flex: 1 } }}>
                      <Label styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>Jig Team</Label>
                      <StandardLookupField
                        label="Jig - Leader"
                        value={formData.jigLeader}
                        selectedText={selectedJigLeaderText}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, jigLeader: id });
                          if (!id) setSelectedJigLeaderText('');
                        }}
                        onTextChange={(text) => setSelectedJigLeaderText(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                      <StandardLookupField
                        label="Jig - Helper 1"
                        value={formData.jigHelper1}
                        selectedText={selectedJigHelper1Text}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, jigHelper1: id });
                          if (!id) setSelectedJigHelper1Text('');
                        }}
                        onTextChange={(text) => setSelectedJigHelper1Text(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                      <StandardLookupField
                        label="Jig - Helper 2"
                        value={formData.jigHelper2}
                        selectedText={selectedJigHelper2Text}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, jigHelper2: id });
                          if (!id) setSelectedJigHelper2Text('');
                        }}
                        onTextChange={(text) => setSelectedJigHelper2Text(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                      <StandardLookupField
                        label="Jig - Helper 3"
                        value={formData.jigHelper3}
                        selectedText={selectedJigHelper3Text}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, jigHelper3: id });
                          if (!id) setSelectedJigHelper3Text('');
                        }}
                        onTextChange={(text) => setSelectedJigHelper3Text(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                      <StandardLookupField
                        label="Jig - Helper 4"
                        value={formData.jigHelper4}
                        selectedText={selectedJigHelper4Text}
                        entityName="Employee"
                        onChange={(id) => {
                          setFormData({ ...formData, jigHelper4: id });
                          if (!id) setSelectedJigHelper4Text('');
                        }}
                        onTextChange={(text) => setSelectedJigHelper4Text(text)}
                        onSearch={searchEmployees}
                        disabled={saving}
                      />
                    </Stack>
                  </Stack>
                </Stack>
              </Stack>
            )}

            {activeTab === 'related' && (
              <Stack 
                horizontalAlign="center" 
                verticalAlign="center" 
                styles={{ root: { minHeight: 300 } }}
              >
                <Text variant="large" styles={{ root: { color: '#605e5c' } }}>
                  Related records coming soon
                </Text>
              </Stack>
            )}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};
