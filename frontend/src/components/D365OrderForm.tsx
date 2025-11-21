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
  Text,
} from '@fluentui/react';
import type { IDropdownOption, IColumn } from '@fluentui/react';
import { 
  d365OrderService, 
  accountService, 
  d365QuoteService,
  productionService,
  deliveryService,
  installationProgressService,
} from '../services/d365Services';
import { StandardLookupField, StandardFormHeader, type LookupOption } from './standards';
import { RelatedSubGrid } from './RelatedSubGrid';
import type { D365Order, Production, Delivery, InstallationProgress } from '../types/millennium';

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

  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return 'R 0.00';
    return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const productionColumns: IColumn[] = [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'customer',
      name: 'Customer',
      fieldName: 'customer',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'productionPlannedDate',
      name: 'Production Planned Date',
      fieldName: 'productionPlannedDate',
      minWidth: 150,
      maxWidth: 180,
      isResizable: true,
      onRender: (item: Production) => item.productionPlannedDate ? new Date(item.productionPlannedDate).toLocaleDateString() : '',
    },
    {
      key: 'productionComplete',
      name: 'Production Complete',
      fieldName: 'productionComplete',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: Production) => item.productionComplete ? 'Yes' : 'No',
    },
  ];

  const deliveryColumns: IColumn[] = [
    {
      key: 'deliveryNo',
      name: 'Delivery No',
      fieldName: 'deliveryNo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'customer',
      name: 'Customer',
      fieldName: 'customer',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'loadingDate',
      name: 'Delivery Date',
      fieldName: 'loadingDate',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: Delivery) => item.loadingDate ? new Date(item.loadingDate).toLocaleDateString() : '',
    },
    {
      key: 'driver',
      name: 'Driver',
      fieldName: 'driver',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
    },
  ];

  const installationColumns: IColumn[] = [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'newInstallationOrderNo',
      name: 'Installation Order No',
      fieldName: 'newInstallationOrderNo',
      minWidth: 150,
      maxWidth: 180,
      isResizable: true,
    },
    {
      key: 'newPercentageComplete',
      name: 'Progress %',
      fieldName: 'newPercentageComplete',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      onRender: (item: InstallationProgress) => 
        item.newPercentageComplete !== undefined ? `${item.newPercentageComplete}%` : '0%',
    },
  ];

  const fetchProductionData = async (orderId: string): Promise<Production[]> => {
    return await productionService.getByOrderNo(orderId);
  };

  const fetchDeliveryData = async (orderId: string): Promise<Delivery[]> => {
    return await deliveryService.getByOrderNo(orderId);
  };

  const fetchInstallationData = async (orderId: string): Promise<InstallationProgress[]> => {
    const order = await d365OrderService.getAll();
    const currentOrder = order.find(o => o.id === orderId);
    if (!currentOrder?.orderNumber) return [];
    return await installationProgressService.getByOrderNo(currentOrder.orderNumber);
  };

  return (
    <Stack styles={{ root: { height: '100%', overflow: 'hidden' } }}>
      <StandardFormHeader
        title={order ? `Order: ${order.orderNumber || order.name || 'Untitled'}` : 'New Order'}
        onBack={onDismiss}
        onSave={() => handleSubmit(false)}
        onSaveAndNew={order ? undefined : () => handleSubmit(true)}
        onCancel={onDismiss}
        onDelete={order && onDelete ? onDelete : undefined}
        saving={saving}
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
          <PivotItem headerText="Financial" itemKey="financial" />
          <PivotItem headerText="Production" itemKey="production" />
          <PivotItem headerText="Ordering" itemKey="ordering" />
          <PivotItem headerText="Dispatch" itemKey="dispatch" />
          <PivotItem headerText="Installation" itemKey="installation" />
          <PivotItem headerText="Details" itemKey="details" />
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
                  value={formData.customerId || ''}
                  selectedText={selectedCustomerText}
                  entityName="Customer"
                  onSearch={handleCustomerSearch}
                  onChange={(id) => {
                    setFormData({ ...formData, customerId: id });
                    if (!id) setSelectedCustomerText('');
                  }}
                  disabled={saving}
                />

                <StandardLookupField
                  label="Quote"
                  value={formData.quoteId || ''}
                  selectedText={selectedQuoteText}
                  entityName="Quote"
                  onSearch={handleQuoteSearch}
                  onChange={(id) => {
                    setFormData({ ...formData, quoteId: id });
                    if (!id) setSelectedQuoteText('');
                  }}
                  disabled={saving}
                />
              </Stack>

              <Stack tokens={{ childrenGap: 12 }}>
                <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>Dates</Label>
                
                <DatePicker
                  label="Date Fulfilled"
                  value={parseDate(formData.dateFulfilled)}
                  onSelectDate={(date) => 
                    setFormData({ ...formData, dateFulfilled: formatDateForInput(date || undefined) })
                  }
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
                <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>Status</Label>
                
                <Dropdown
                  label="State Code"
                  selectedKey={formData.stateCode ?? 0}
                  options={stateCodeOptions}
                  onChange={(_, option) => 
                    setFormData({ ...formData, stateCode: option?.key as number })
                  }
                  disabled={saving}
                />

                <Dropdown
                  label="Status Code"
                  selectedKey={formData.statusCode ?? 1}
                  options={statusCodeOptions}
                  onChange={(_, option) => 
                    setFormData({ ...formData, statusCode: option?.key as number })
                  }
                  disabled={saving}
                />
              </Stack>

              <Stack tokens={{ childrenGap: 12 }}>
                <Label styles={{ root: { fontWeight: 600, fontSize: 16 } }}>Description</Label>
                
                <TextField
                  multiline
                  rows={4}
                  value={formData.description || ''}
                  onChange={(_, value) => setFormData({ ...formData, description: value })}
                  disabled={saving}
                />
              </Stack>

              <Stack 
                horizontal 
                tokens={{ childrenGap: 20 }}
                styles={{ 
                  root: { 
                    padding: 16, 
                    backgroundColor: '#f3f2f1', 
                    borderRadius: 4,
                    border: '1px solid #edebe9'
                  } 
                }}
              >
                <Stack styles={{ root: { flex: 1 } }}>
                  <Text variant="small" styles={{ root: { color: '#605e5c', marginBottom: 4 } }}>
                    Total Amount
                  </Text>
                  <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                    {formatCurrency(formData.totalAmount)}
                  </Text>
                </Stack>
                <Stack styles={{ root: { flex: 1 } }}>
                  <Text variant="small" styles={{ root: { color: '#605e5c', marginBottom: 4 } }}>
                    Discount
                  </Text>
                  <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                    {formatCurrency(formData.totalDiscountAmount)}
                  </Text>
                </Stack>
                <Stack styles={{ root: { flex: 1 } }}>
                  <Text variant="small" styles={{ root: { color: '#605e5c', marginBottom: 4 } }}>
                    Line Item Total
                  </Text>
                  <Text variant="large" styles={{ root: { fontWeight: 600 } }}>
                    {formatCurrency(formData.totalLineItemAmount)}
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          )}

          {activeTab === 'financial' && (
            <Stack tokens={{ childrenGap: 16 }}>
              <Label styles={{ root: { fontWeight: 600, fontSize: 18 } }}>Financial Information</Label>
              
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

              <Stack 
                tokens={{ childrenGap: 12 }}
                styles={{ 
                  root: { 
                    padding: 20, 
                    backgroundColor: '#f3f2f1', 
                    borderRadius: 4,
                    marginTop: 20 
                  } 
                }}
              >
                <Text variant="xLarge" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                  Summary
                </Text>
                <Stack horizontal horizontalAlign="space-between">
                  <Text variant="medium">Total Amount:</Text>
                  <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                    {formatCurrency(formData.totalAmount)}
                  </Text>
                </Stack>
                <Stack horizontal horizontalAlign="space-between">
                  <Text variant="medium">Total Discount:</Text>
                  <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                    {formatCurrency(formData.totalDiscountAmount)}
                  </Text>
                </Stack>
                <Stack horizontal horizontalAlign="space-between">
                  <Text variant="medium">Line Item Total:</Text>
                  <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
                    {formatCurrency(formData.totalLineItemAmount)}
                  </Text>
                </Stack>
              </Stack>
            </Stack>
          )}

          {activeTab === 'production' && order && (
            <RelatedSubGrid<Production>
              title="Production Records"
              entityName="Production"
              orderId={order.id}
              columns={productionColumns}
              fetchData={fetchProductionData}
              emptyMessage="No production records found for this order"
            />
          )}

          {activeTab === 'production' && !order && (
            <Stack 
              horizontalAlign="center" 
              verticalAlign="center" 
              styles={{ root: { minHeight: 200, padding: 40 } }}
            >
              <Text variant="large" styles={{ root: { color: '#605e5c' } }}>
                Save the order first to view related production records
              </Text>
            </Stack>
          )}

          {activeTab === 'ordering' && (
            <Stack 
              horizontalAlign="center" 
              verticalAlign="center" 
              styles={{ 
                root: { 
                  minHeight: 200, 
                  padding: 40,
                  backgroundColor: '#f3f2f1',
                  borderRadius: 4 
                } 
              }}
            >
              <Text variant="large" styles={{ root: { color: '#605e5c', marginBottom: 12 } }}>
                Order Products / Line Items
              </Text>
              <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
                This section will display products and line items associated with this order
              </Text>
            </Stack>
          )}

          {activeTab === 'dispatch' && order && (
            <RelatedSubGrid<Delivery>
              title="Deliveries / Trips"
              entityName="Delivery"
              orderId={order.id}
              columns={deliveryColumns}
              fetchData={fetchDeliveryData}
              emptyMessage="No delivery records found for this order"
            />
          )}

          {activeTab === 'dispatch' && !order && (
            <Stack 
              horizontalAlign="center" 
              verticalAlign="center" 
              styles={{ root: { minHeight: 200, padding: 40 } }}
            >
              <Text variant="large" styles={{ root: { color: '#605e5c' } }}>
                Save the order first to view related delivery records
              </Text>
            </Stack>
          )}

          {activeTab === 'installation' && order && (
            <RelatedSubGrid<InstallationProgress>
              title="Installation Progress"
              entityName="Installation Progress"
              orderId={order.id}
              columns={installationColumns}
              fetchData={fetchInstallationData}
              emptyMessage="No installation progress records found for this order"
            />
          )}

          {activeTab === 'installation' && !order && (
            <Stack 
              horizontalAlign="center" 
              verticalAlign="center" 
              styles={{ root: { minHeight: 200, padding: 40 } }}
            >
              <Text variant="large" styles={{ root: { color: '#605e5c' } }}>
                Save the order first to view installation progress records
              </Text>
            </Stack>
          )}

          {activeTab === 'details' && (
            <Stack tokens={{ childrenGap: 16 }}>
              <Label styles={{ root: { fontWeight: 600, fontSize: 18 } }}>Audit Trail</Label>
              
              <TextField
                label="Description"
                multiline
                rows={6}
                value={formData.description || ''}
                onChange={(_, value) => setFormData({ ...formData, description: value })}
                disabled={saving}
              />

              {order && (
                <Stack 
                  tokens={{ childrenGap: 12 }}
                  styles={{ 
                    root: { 
                      padding: 20, 
                      backgroundColor: '#f3f2f1', 
                      borderRadius: 4,
                      marginTop: 20 
                    } 
                  }}
                >
                  <Text variant="large" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                    Record Information
                  </Text>
                  
                  <Stack horizontal tokens={{ childrenGap: 40 }}>
                    <Stack styles={{ root: { flex: 1 } }}>
                      <Text variant="small" styles={{ root: { color: '#605e5c', marginBottom: 4 } }}>
                        Created On
                      </Text>
                      <Text variant="medium">
                        {order.createdOn ? new Date(order.createdOn).toLocaleString() : 'N/A'}
                      </Text>
                    </Stack>
                    <Stack styles={{ root: { flex: 1 } }}>
                      <Text variant="small" styles={{ root: { color: '#605e5c', marginBottom: 4 } }}>
                        Created By
                      </Text>
                      <Text variant="medium">
                        {order.createdBy || 'N/A'}
                      </Text>
                    </Stack>
                  </Stack>

                  <Stack horizontal tokens={{ childrenGap: 40 }} styles={{ root: { marginTop: 12 } }}>
                    <Stack styles={{ root: { flex: 1 } }}>
                      <Text variant="small" styles={{ root: { color: '#605e5c', marginBottom: 4 } }}>
                        Modified On
                      </Text>
                      <Text variant="medium">
                        {order.modifiedOn ? new Date(order.modifiedOn).toLocaleString() : 'N/A'}
                      </Text>
                    </Stack>
                    <Stack styles={{ root: { flex: 1 } }}>
                      <Text variant="small" styles={{ root: { color: '#605e5c', marginBottom: 4 } }}>
                        Modified By
                      </Text>
                      <Text variant="medium">
                        {order.modifiedBy || 'N/A'}
                      </Text>
                    </Stack>
                  </Stack>
                </Stack>
              )}

              {!order && (
                <Stack 
                  horizontalAlign="center" 
                  verticalAlign="center" 
                  styles={{ 
                    root: { 
                      minHeight: 150, 
                      padding: 40,
                      backgroundColor: '#f3f2f1',
                      borderRadius: 4,
                      marginTop: 20
                    } 
                  }}
                >
                  <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
                    Audit information will be available after saving the order
                  </Text>
                </Stack>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
};
