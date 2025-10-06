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
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { customerService } from '../services';
import type { Customer } from '../types';
import { CustomerFormFullScreen } from '../components/CustomerFormFullScreen';
import { DeleteDialog } from '../components/DeleteDialog';
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
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<{ [key: string]: boolean }>({
    accountNo: true,
    accountName: true,
    companyType: true,
    email: true,
    phone: true,
    city: true,
    customerStatus: true,
    isActive: true,
  });

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
  }, [customers, searchText, columnFilters]);

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

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((customer) => {
          if (key === 'companyType') {
            return (customer.companyType?.name?.toLowerCase() || '').includes(value.toLowerCase());
          }
          const fieldValue = customer[key as keyof Customer];
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

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

  const handleExport = () => {
    const exportData = filteredCustomers.map((customer) => ({
      'Account No': customer.accountNo,
      'Account Name': customer.accountName,
      'Company Type': customer.companyType?.name || '',
      'Email': customer.email || '',
      'Phone': customer.phone || '',
      'Mobile': customer.mobile || '',
      'Website': customer.website || '',
      'VAT No': customer.vatRegistrationNo || '',
      'Registration No': customer.companyRegistrationNo || '',
      'Street Address': customer.streetAddress || '',
      'City': customer.city || '',
      'Province': customer.province || '',
      'Postal Code': customer.postalCode || '',
      'Country': customer.country || '',
      'Status': customer.customerStatus,
      'Payment Terms': customer.paymentTerms || '',
      'Credit Limit': customer.creditLimit || 0,
      'Current Balance': customer.currentBalance || 0,
      'Discount': customer.discount || 0,
      'Tax Exempt': customer.taxExempt ? 'Yes' : 'No',
      'Active': customer.isActive ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `Customers_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const handleColumnFilterChange = (columnKey: string, value: string) => {
    setColumnFilters({ ...columnFilters, [columnKey]: value });
  };

  const allColumns: IColumn[] = [
    {
      key: 'accountNo',
      name: 'Account No',
      fieldName: 'accountNo',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
      isFiltered: !!columnFilters['accountNo'],
      onRenderHeader: () => (
        <Stack>
          <Text>Account No</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['accountNo'] || ''}
            onChange={(_, value) => handleColumnFilterChange('accountNo', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'accountName',
      name: 'Account Name',
      fieldName: 'accountName',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
      isFiltered: !!columnFilters['accountName'],
      onRenderHeader: () => (
        <Stack>
          <Text>Account Name</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['accountName'] || ''}
            onChange={(_, value) => handleColumnFilterChange('accountName', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'companyType',
      name: 'Company Type',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isFiltered: !!columnFilters['companyType'],
      onRender: (item: Customer) => <Text>{item.companyType?.name || '-'}</Text>,
      onRenderHeader: () => (
        <Stack>
          <Text>Company Type</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['companyType'] || ''}
            onChange={(_, value) => handleColumnFilterChange('companyType', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'email',
      name: 'Email',
      fieldName: 'email',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
      isFiltered: !!columnFilters['email'],
      onRenderHeader: () => (
        <Stack>
          <Text>Email</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['email'] || ''}
            onChange={(_, value) => handleColumnFilterChange('email', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'phone',
      name: 'Phone',
      fieldName: 'phone',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isFiltered: !!columnFilters['phone'],
      onRenderHeader: () => (
        <Stack>
          <Text>Phone</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['phone'] || ''}
            onChange={(_, value) => handleColumnFilterChange('phone', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'city',
      name: 'City',
      fieldName: 'city',
      minWidth: 120,
      maxWidth: 180,
      isResizable: true,
      isFiltered: !!columnFilters['city'],
      onRenderHeader: () => (
        <Stack>
          <Text>City</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['city'] || ''}
            onChange={(_, value) => handleColumnFilterChange('city', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'customerStatus',
      name: 'Status',
      fieldName: 'customerStatus',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isFiltered: !!columnFilters['customerStatus'],
      onRenderHeader: () => (
        <Stack>
          <Text>Status</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['customerStatus'] || ''}
            onChange={(_, value) => handleColumnFilterChange('customerStatus', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
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
  ];

  const columns = allColumns.filter((col) => visibleColumns[col.key]);

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
      onClick: handleExport,
    },
    {
      key: 'import',
      text: 'Import from Excel',
      iconProps: { iconName: 'ExcelLogoInverse' },
      onClick: () => document.getElementById('customers-import-input')?.click(),
    },
    {
      key: 'columns',
      text: 'Columns',
      iconProps: { iconName: 'ColumnOptions' },
      onClick: () => setIsColumnPanelOpen(true),
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

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading customers..." />
        </Stack>
      ) : (
        <DetailsList
          items={filteredCustomers}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selection={selection}
          selectionPreservedOnEmptyClick={true}
          isHeaderVisible={true}
          onItemInvoked={handleRowDoubleClick}
        />
      )}

      <Panel
        isOpen={isColumnPanelOpen}
        onDismiss={() => setIsColumnPanelOpen(false)}
        headerText="Show/Hide Columns"
      >
        <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 16 } }}>
          {allColumns.map((col) => (
            <Checkbox
              key={col.key}
              label={col.name}
              checked={visibleColumns[col.key]}
              onChange={(_, checked) =>
                setVisibleColumns({ ...visibleColumns, [col.key]: checked || false })
              }
            />
          ))}
        </Stack>
      </Panel>

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
