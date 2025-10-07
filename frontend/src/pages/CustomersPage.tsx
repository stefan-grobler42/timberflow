import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  CommandBar,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  SearchBox,
  Panel,
  Checkbox,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  IconButton,
  Separator,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { customerService } from '../services';
import type { Customer } from '../types';
import type { GridView, GridFilter } from '../types/gridView';
import { CustomerFormFullScreen } from '../components/CustomerFormFullScreen';
import { DeleteDialog } from '../components/DeleteDialog';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import * as XLSX from 'xlsx';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    accountNo: true,
    accountName: true,
    companyType: true,
    email: true,
    phone: true,
    city: true,
    customerStatus: true,
    isActive: true,
    mobile: false,
    website: false,
    vatRegistrationNo: false,
    companyRegistrationNo: false,
    streetAddress: false,
    province: false,
    postalCode: false,
    country: false,
  };

  const defaultColumnOrder = [
    'accountNo', 'accountName', 'companyType', 'email', 'phone', 
    'city', 'customerStatus', 'isActive', 'mobile', 'website', 
    'vatRegistrationNo', 'companyRegistrationNo', 'streetAddress', 
    'province', 'postalCode', 'country'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Customers',
    isDefault: true,
    entityType: 'customer',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('customers-views');
      if (saved) {
        const views = JSON.parse(saved);
        return views.length > 0 ? views : [defaultView];
      }
    } catch (err) {
      console.warn('Failed to load views:', err);
    }
    return [defaultView];
  };

  const [views, setViews] = useState<GridView[]>(loadViews());
  const [currentView, setCurrentView] = useState<GridView>(
    views.find(v => v.isDefault) || defaultView
  );

  const [selection] = useState(
    new Selection({
      onSelectionChanged: () => {
        const selected = selection.getSelection()[0] as Customer | undefined;
        setSelectedCustomer(selected);
      },
    })
  );

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [customers, searchText, currentView]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // Apply global search
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((customer) => {
        return (
          Object.values(customer).some((value) =>
            String(value).toLowerCase().includes(search)
          ) ||
          (customer.companyType?.name?.toLowerCase() || '').includes(search)
        );
      });
    }

    // Apply view filters with proper AND/OR logic
    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((customer) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = filter.field === 'companyType'
            ? customer.companyType?.name
            : customer[filter.field as keyof Customer];
          
          const value = String(fieldValue ?? '').toLowerCase();
          const filterValue = filter.value.toLowerCase();

          let filterResult = false;
          switch (filter.operator) {
            case 'equals':
              filterResult = value === filterValue;
              break;
            case 'notEquals':
              filterResult = value !== filterValue;
              break;
            case 'contains':
              filterResult = value.includes(filterValue);
              break;
            case 'notContains':
              filterResult = !value.includes(filterValue);
              break;
            case 'beginsWith':
              filterResult = value.startsWith(filterValue);
              break;
            case 'endsWith':
              filterResult = value.endsWith(filterValue);
              break;
            case 'isEmpty':
              filterResult = !value;
              break;
            case 'isNotEmpty':
              filterResult = !!value;
              break;
            default:
              filterResult = true;
          }

          // Apply the filter result based on the previous logic operator
          if (i === 0) {
            result = filterResult;
          } else {
            if (currentLogic === 'AND') {
              result = result && filterResult;
            } else {
              result = result || filterResult;
            }
          }

          // Set the logic operator for the next iteration
          currentLogic = filter.logicOperator || 'AND';
        }

        return result;
      });
    }

    setFilteredCustomers(filtered);
  };

  const handleNew = () => {
    setSelectedCustomer(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedCustomer) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedCustomer) {
      setCustomerToDelete(selectedCustomer);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await customerService.delete(customerToDelete.id);
        setIsDeleteDialogOpen(false);
        setCustomerToDelete(undefined);
        await loadCustomers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete customer');
      }
    }
  };

  const exportToExcel = (customersToExport: Customer[]) => {
    const exportData = customersToExport.map((customer) => ({
      'Account No': customer.accountNo,
      'Account Name': customer.accountName,
      'Company Type': customer.companyType?.name || '',
      'Email': customer.email || '',
      'Phone': customer.phone || '',
      'City': customer.city || '',
      'Province': customer.province || '',
      'Status': customer.customerStatus,
      'Active': customer.isActive ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `Customers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as Customer[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredCustomers);
    setIsExportDialogOpen(false);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('Imported data:', jsonData);
      } catch (err) {
        setError('Failed to import Excel file');
      }
    };
    reader.readAsBinaryString(file);
    event.target.value = '';
  };

  const handleViewChange = (view: GridView) => {
    setCurrentView(view);
  };

  const handleSaveView = (view: GridView) => {
    const updatedViews = views.find(v => v.id === view.id)
      ? views.map(v => v.id === view.id ? view : v)
      : [...views, view];
    
    setViews(updatedViews);
    setCurrentView(view);
    localStorage.setItem('customers-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('customers-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map(v => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('customers-views', JSON.stringify(updatedViews));
  };

  const handleFiltersChange = (filters: GridFilter[]) => {
    const updatedView = { ...currentView, filters };
    setCurrentView(updatedView);
  };

  const updateCurrentViewColumns = (visibility: { [key: string]: boolean }, order: string[]) => {
    const updatedView = {
      ...currentView,
      columnVisibility: visibility,
      columnOrder: order,
    };
    setCurrentView(updatedView);
  };

  const moveColumnUp = (columnKey: string) => {
    const currentIndex = currentView.columnOrder.indexOf(columnKey);
    if (currentIndex > 0) {
      const newOrder = [...currentView.columnOrder];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      updateCurrentViewColumns(currentView.columnVisibility, newOrder);
    }
  };

  const moveColumnDown = (columnKey: string) => {
    const currentIndex = currentView.columnOrder.indexOf(columnKey);
    if (currentIndex < currentView.columnOrder.length - 1) {
      const newOrder = [...currentView.columnOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      updateCurrentViewColumns(currentView.columnVisibility, newOrder);
    }
  };

  const availableFields = [
    { key: 'accountNo', name: 'Account No', type: 'text' as const },
    { key: 'accountName', name: 'Account Name', type: 'text' as const },
    { key: 'companyType', name: 'Company Type', type: 'text' as const },
    { key: 'email', name: 'Email', type: 'text' as const },
    { key: 'phone', name: 'Phone', type: 'text' as const },
    { key: 'mobile', name: 'Mobile', type: 'text' as const },
    { key: 'city', name: 'City', type: 'text' as const },
    { key: 'province', name: 'Province', type: 'text' as const },
    { key: 'customerStatus', name: 'Status', type: 'text' as const },
    { key: 'isActive', name: 'Active', type: 'boolean' as const },
  ];

  const allColumns: IColumn[] = [
    {
      key: 'accountNo',
      name: 'Account No',
      fieldName: 'accountNo',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'accountName',
      name: 'Account Name',
      fieldName: 'accountName',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'companyType',
      name: 'Company Type',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      onRender: (item: Customer) => <Text>{item.companyType?.name || '-'}</Text>,
    },
    {
      key: 'email',
      name: 'Email',
      fieldName: 'email',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'phone',
      name: 'Phone',
      fieldName: 'phone',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'city',
      name: 'City',
      fieldName: 'city',
      minWidth: 120,
      maxWidth: 180,
      isResizable: true,
    },
    {
      key: 'customerStatus',
      name: 'Status',
      fieldName: 'customerStatus',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'isActive',
      name: 'Active',
      fieldName: 'isActive',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
      onRender: (item: Customer) => <Text>{item.isActive ? 'Yes' : 'No'}</Text>,
    },
    {
      key: 'mobile',
      name: 'Mobile',
      fieldName: 'mobile',
      minWidth: 120,
      maxWidth: 180,
      isResizable: true,
    },
    {
      key: 'website',
      name: 'Website',
      fieldName: 'website',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'vatRegistrationNo',
      name: 'VAT No',
      fieldName: 'vatRegistrationNo',
      minWidth: 120,
      maxWidth: 180,
      isResizable: true,
    },
    {
      key: 'companyRegistrationNo',
      name: 'Company Reg No',
      fieldName: 'companyRegistrationNo',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'streetAddress',
      name: 'Street Address',
      fieldName: 'streetAddress',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'province',
      name: 'Province',
      fieldName: 'province',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'postalCode',
      name: 'Postal Code',
      fieldName: 'postalCode',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
    },
    {
      key: 'country',
      name: 'Country',
      fieldName: 'country',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
    },
  ];

  const orderedColumns = currentView.columnOrder.map(key => allColumns.find(col => col.key === key)).filter(Boolean) as IColumn[];
  const columns = orderedColumns.filter((col) => currentView.columnVisibility[col.key]);

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'new',
      text: 'New',
      iconProps: { iconName: 'Add' },
      onClick: handleNew,
    },
    {
      key: 'edit',
      text: 'Edit',
      iconProps: { iconName: 'Edit' },
      disabled: !selectedCustomer,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedCustomer,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadCustomers,
    },
    {
      key: 'export',
      text: 'Export to Excel',
      iconProps: { iconName: 'ExcelDocument' },
      onClick: () => setIsExportDialogOpen(true),
    },
    {
      key: 'import',
      text: 'Import from Excel',
      iconProps: { iconName: 'ExcelLogoInverse' },
      onClick: () => document.getElementById('customers-import-input')?.click(),
    },
  ];

  const commandBarFarItems: ICommandBarItemProps[] = [
    {
      key: 'search',
      onRender: () => (
        <SearchBox
          placeholder="Search all columns..."
          value={searchText}
          onChange={(_, value) => setSearchText(value || '')}
          onClear={() => setSearchText('')}
          styles={{ root: { width: 300 } }}
        />
      ),
    },
  ];

  if (isFormOpen) {
    return (
      <CustomerFormFullScreen
        customer={selectedCustomer}
        onDismiss={() => {
          setIsFormOpen(false);
          setSelectedCustomer(undefined);
        }}
        onSave={() => {
          loadCustomers();
          setIsFormOpen(false);
          setSelectedCustomer(undefined);
        }}
      />
    );
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Customers</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="customers-import-input"
        type="file"
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
        onChange={handleImport}
      />

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      {/* Power Apps-style Grid Header */}
      <Stack
        horizontal
        verticalAlign="center"
        tokens={{ childrenGap: 12 }}
        styles={{
          root: {
            padding: 12,
            backgroundColor: '#faf9f8',
            borderRadius: 4,
            border: '1px solid #edebe9',
          },
        }}
      >
        <ViewManager
          currentView={currentView}
          views={views}
          onViewChange={handleViewChange}
          onSaveView={handleSaveView}
          onDeleteView={handleDeleteView}
          onSetDefaultView={handleSetDefaultView}
        />
        <Separator vertical styles={{ root: { height: 32 } }} />
        <IconButton
          iconProps={{ iconName: 'ColumnOptions' }}
          title="Edit columns"
          onClick={() => setIsColumnPanelOpen(true)}
        />
        <IconButton
          iconProps={{ iconName: 'Filter' }}
          title="Edit filters"
          onClick={() => setIsFilterBuilderOpen(true)}
        />
      </Stack>

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading customers..." />
        </Stack>
      ) : (
        <DetailsList
          items={filteredCustomers}
          columns={columns}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          selection={selection}
          selectionPreservedOnEmptyClick={true}
          isHeaderVisible={true}
          onItemInvoked={handleRowDoubleClick}
        />
      )}

      {/* Column Settings Panel */}
      <Panel
        isOpen={isColumnPanelOpen}
        onDismiss={() => setIsColumnPanelOpen(false)}
        headerText="Column Settings"
      >
        <Stack tokens={{ childrenGap: 12 }} styles={{ root: { marginTop: 16 } }}>
          {currentView.columnOrder.map((key, index) => {
            const col = allColumns.find(c => c.key === key);
            if (!col) return null;
            return (
              <Stack key={col.key} horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <Checkbox
                  label={col.name}
                  checked={currentView.columnVisibility[col.key]}
                  onChange={(_, checked) =>
                    updateCurrentViewColumns(
                      { ...currentView.columnVisibility, [col.key]: checked || false },
                      currentView.columnOrder
                    )
                  }
                  styles={{ root: { flex: 1 } }}
                />
                <Stack horizontal tokens={{ childrenGap: 4 }}>
                  <DefaultButton
                    iconProps={{ iconName: 'Up' }}
                    disabled={index === 0}
                    onClick={() => moveColumnUp(col.key)}
                    styles={{ root: { minWidth: 32, padding: '0 8px' } }}
                  />
                  <DefaultButton
                    iconProps={{ iconName: 'Down' }}
                    disabled={index === currentView.columnOrder.length - 1}
                    onClick={() => moveColumnDown(col.key)}
                    styles={{ root: { minWidth: 32, padding: '0 8px' } }}
                  />
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      </Panel>

      {/* Filter Builder Panel */}
      <FilterBuilder
        isOpen={isFilterBuilderOpen}
        onDismiss={() => setIsFilterBuilderOpen(false)}
        filters={currentView.filters}
        onFiltersChange={handleFiltersChange}
        availableFields={availableFields}
      />

      <Dialog
        hidden={!isExportDialogOpen}
        onDismiss={() => setIsExportDialogOpen(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Export to Excel',
          subText: 'Choose which records to export',
        }}
      >
        <DialogFooter>
          <PrimaryButton
            onClick={handleExportSelected}
            text={`Export Selected (${selection.getSelectedCount()})`}
            disabled={selection.getSelectedCount() === 0}
          />
          <DefaultButton onClick={handleExportAll} text={`Export All (${filteredCustomers.length})`} />
          <DefaultButton onClick={() => setIsExportDialogOpen(false)} text="Cancel" />
        </DialogFooter>
      </Dialog>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customerToDelete?.accountName}?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </Stack>
  );
};
