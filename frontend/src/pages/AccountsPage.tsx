import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  ConstrainMode,
  Selection,
  CommandBar,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  SearchBox,
  Panel,
  Checkbox,
  IconButton,
  Separator,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { accountService } from '../services/d365Services';
import type { Account } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { AccountForm } from '../components/AccountForm';
import { DeleteDialog } from '../components/DeleteDialog';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import * as XLSX from 'xlsx';

export const AccountsPage = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    name: true,
    accountNumber: true,
    telephone1: true,
    emailAddress1: true,
    address1City: true,
    address1StateOrProvince: false,
    address1PostalCode: false,
    address1Country: false,
    websiteUrl: false,
    revenue: false,
    numberOfEmployees: false,
  };

  const defaultColumnOrder = [
    'name', 'accountNumber', 'telephone1', 'emailAddress1', 'address1City',
    'address1StateOrProvince', 'address1PostalCode', 'address1Country',
    'websiteUrl', 'revenue', 'numberOfEmployees'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Accounts',
    isDefault: true,
    entityType: 'account',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('accounts-views');
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
        const selected = selection.getSelection()[0] as Account | undefined;
        setSelectedAccount(selected);
      },
    })
  );

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [accounts, searchText, currentView, sortColumn, isSortedDescending]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountService.getAll();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...accounts];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((account) => {
        return Object.values(account).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((account) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = account[filter.field as keyof Account];
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

          if (i === 0) {
            result = filterResult;
          } else {
            if (currentLogic === 'AND') {
              result = result && filterResult;
            } else {
              result = result || filterResult;
            }
          }

          currentLogic = filter.logicOperator || 'AND';
        }

        return result;
      });
    }

    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortColumn as keyof Account];
        let bValue: any = b[sortColumn as keyof Account];

        if (aValue === undefined || aValue === null) {
          aValue = typeof bValue === 'boolean' ? false : typeof bValue === 'number' ? 0 : '';
        }
        if (bValue === undefined || bValue === null) {
          bValue = typeof aValue === 'boolean' ? false : typeof aValue === 'number' ? 0 : '';
        }

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          comparison = (aValue ? 1 : 0) - (bValue ? 1 : 0);
        }

        if (comparison === 0 && sortColumn !== 'name') {
          const aName = a.name || '';
          const bName = b.name || '';
          comparison = aName.localeCompare(bName);
        }

        return isSortedDescending ? -comparison : comparison;
      });
    }

    setFilteredAccounts(filtered);
  };

  const handleNew = () => {
    setSelectedAccount(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedAccount) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (account: Account) => {
    setSelectedAccount(account);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedAccount) {
      setAccountToDelete(selectedAccount);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (accountToDelete) {
      try {
        await accountService.delete(accountToDelete.id);
        setIsDeleteDialogOpen(false);
        setAccountToDelete(undefined);
        await loadAccounts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete account');
      }
    }
  };

  const exportToExcel = (accountsToExport: Account[]) => {
    const exportData = accountsToExport.map((account) => ({
      'Name': account.name || '',
      'Account Number': account.accountNumber || '',
      'Phone': account.telephone1 || '',
      'Email': account.emailAddress1 || '',
      'Website': account.websiteUrl || '',
      'City': account.address1City || '',
      'State/Province': account.address1StateOrProvince || '',
      'Postal Code': account.address1PostalCode || '',
      'Country': account.address1Country || '',
      'Revenue': account.revenue || 0,
      'Employees': account.numberOfEmployees || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accounts');
    XLSX.writeFile(wb, `Accounts_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as Account[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredAccounts);
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
    localStorage.setItem('accounts-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('accounts-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map(v => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('accounts-views', JSON.stringify(updatedViews));
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

  const onColumnClick = (ev?: React.MouseEvent<HTMLElement>, column?: IColumn) => {
    if (!column) return;
    
    const columnKey = column.key;
    if (sortColumn === columnKey) {
      setIsSortedDescending(!isSortedDescending);
    } else {
      setSortColumn(columnKey);
      setIsSortedDescending(false);
    }
  };

  const availableFields = [
    { key: 'name', name: 'Name', type: 'text' as const },
    { key: 'accountNumber', name: 'Account Number', type: 'text' as const },
    { key: 'telephone1', name: 'Phone', type: 'text' as const },
    { key: 'emailAddress1', name: 'Email', type: 'text' as const },
    { key: 'address1City', name: 'City', type: 'text' as const },
    { key: 'address1StateOrProvince', name: 'State/Province', type: 'text' as const },
    { key: 'websiteUrl', name: 'Website', type: 'text' as const },
  ];

  const allColumns: IColumn[] = [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
      isSorted: sortColumn === 'name',
      isSortedDescending: sortColumn === 'name' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'accountNumber',
      name: 'Account Number',
      fieldName: 'accountNumber',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'accountNumber',
      isSortedDescending: sortColumn === 'accountNumber' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'telephone1',
      name: 'Phone',
      fieldName: 'telephone1',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'telephone1',
      isSortedDescending: sortColumn === 'telephone1' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'emailAddress1',
      name: 'Email',
      fieldName: 'emailAddress1',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
      isSorted: sortColumn === 'emailAddress1',
      isSortedDescending: sortColumn === 'emailAddress1' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'address1City',
      name: 'City',
      fieldName: 'address1City',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'address1City',
      isSortedDescending: sortColumn === 'address1City' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'address1StateOrProvince',
      name: 'State/Province',
      fieldName: 'address1StateOrProvince',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'address1StateOrProvince',
      isSortedDescending: sortColumn === 'address1StateOrProvince' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'address1PostalCode',
      name: 'Postal Code',
      fieldName: 'address1PostalCode',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'address1PostalCode',
      isSortedDescending: sortColumn === 'address1PostalCode' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'address1Country',
      name: 'Country',
      fieldName: 'address1Country',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'address1Country',
      isSortedDescending: sortColumn === 'address1Country' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'websiteUrl',
      name: 'Website',
      fieldName: 'websiteUrl',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
      isSorted: sortColumn === 'websiteUrl',
      isSortedDescending: sortColumn === 'websiteUrl' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'revenue',
      name: 'Revenue',
      fieldName: 'revenue',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'revenue',
      isSortedDescending: sortColumn === 'revenue' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Account) => <Text>{item.revenue ? `$${item.revenue.toLocaleString()}` : '-'}</Text>,
    },
    {
      key: 'numberOfEmployees',
      name: 'Employees',
      fieldName: 'numberOfEmployees',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'numberOfEmployees',
      isSortedDescending: sortColumn === 'numberOfEmployees' && isSortedDescending,
      onColumnClick: onColumnClick,
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
      disabled: !selectedAccount,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedAccount,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadAccounts,
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
      onClick: () => document.getElementById('accounts-import-input')?.click(),
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
      <Stack styles={{ root: { height: '100vh', overflow: 'hidden' } }}>
        <AccountForm
          account={selectedAccount}
          onDismiss={() => {
            setIsFormOpen(false);
            setSelectedAccount(undefined);
          }}
          onSave={() => {
            loadAccounts();
            setIsFormOpen(false);
            setSelectedAccount(undefined);
          }}
          onDelete={selectedAccount ? () => {
            setIsFormOpen(false);
            handleDelete();
          } : undefined}
        />
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Accounts</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="accounts-import-input"
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

      <Stack
        horizontal
        verticalAlign="center"
        tokens={{ childrenGap: 8 }}
        styles={{
          root: {
            padding: '8px 12px',
            backgroundColor: '#faf9f8',
            borderBottom: '1px solid #edebe9',
          },
        }}
      >
        <ViewManager
          views={views}
          currentView={currentView}
          onViewChange={handleViewChange}
          onSaveView={handleSaveView}
          onDeleteView={handleDeleteView}
          onSetDefaultView={handleSetDefaultView}
        />

        <IconButton
          iconProps={{ iconName: 'ColumnOptions' }}
          title="Column Settings"
          ariaLabel="Column Settings"
          onClick={() => setIsColumnPanelOpen(true)}
        />

        <IconButton
          iconProps={{ iconName: 'Filter' }}
          title="Filter"
          ariaLabel="Filter"
          onClick={() => setIsFilterBuilderOpen(true)}
        />

        <Separator vertical styles={{ root: { height: 24 } }} />

        <Text variant="medium" styles={{ root: { marginLeft: 8 } }}>
          {filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'}
        </Text>
      </Stack>

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading accounts..." />
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <DetailsList
            items={filteredAccounts}
            columns={columns}
            layoutMode={DetailsListLayoutMode.justified}
            constrainMode={ConstrainMode.unconstrained}
            selection={selection}
            selectionPreservedOnEmptyClick
            onItemInvoked={handleRowDoubleClick}
            styles={{
              root: {
                selectors: {
                  '.ms-DetailsRow': {
                    cursor: 'pointer',
                  },
                },
              },
            }}
          />
        </div>
      )}

      <Panel
        isOpen={isColumnPanelOpen}
        onDismiss={() => setIsColumnPanelOpen(false)}
        headerText="Column Settings"
        closeButtonAriaLabel="Close"
      >
        <Stack tokens={{ childrenGap: 16 }}>
          <Text variant="medium">Show/Hide Columns</Text>
          {currentView.columnOrder.map((columnKey) => {
            const column = allColumns.find((col) => col.key === columnKey);
            if (!column) return null;

            return (
              <Stack key={columnKey} horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <Checkbox
                  label={column.name}
                  checked={currentView.columnVisibility[columnKey]}
                  onChange={(_, checked) => {
                    updateCurrentViewColumns(
                      { ...currentView.columnVisibility, [columnKey]: !!checked },
                      currentView.columnOrder
                    );
                  }}
                  styles={{ root: { flex: 1 } }}
                />
                <IconButton
                  iconProps={{ iconName: 'Up' }}
                  title="Move up"
                  ariaLabel="Move up"
                  onClick={() => moveColumnUp(columnKey)}
                  disabled={currentView.columnOrder.indexOf(columnKey) === 0}
                />
                <IconButton
                  iconProps={{ iconName: 'Down' }}
                  title="Move down"
                  ariaLabel="Move down"
                  onClick={() => moveColumnDown(columnKey)}
                  disabled={
                    currentView.columnOrder.indexOf(columnKey) ===
                    currentView.columnOrder.length - 1
                  }
                />
              </Stack>
            );
          })}
        </Stack>
      </Panel>

      <FilterBuilder
        isOpen={isFilterBuilderOpen}
        onDismiss={() => setIsFilterBuilderOpen(false)}
        filters={currentView.filters || []}
        onFiltersChange={handleFiltersChange}
        availableFields={availableFields}
      />

      {isExportDialogOpen && (
        <Panel
          isOpen={isExportDialogOpen}
          onDismiss={() => setIsExportDialogOpen(false)}
          headerText="Export to Excel"
          closeButtonAriaLabel="Close"
        >
          <Stack tokens={{ childrenGap: 16 }}>
            <Text>Choose what to export:</Text>
            <Stack tokens={{ childrenGap: 8 }}>
              <button
                onClick={handleExportAll}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#0078d4',
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: 'pointer',
                }}
              >
                Export All ({filteredAccounts.length} accounts)
              </button>
              <button
                onClick={handleExportSelected}
                disabled={selection.getSelectedCount() === 0}
                style={{
                  padding: '10px 16px',
                  backgroundColor:
                    selection.getSelectedCount() === 0 ? '#f3f2f1' : '#0078d4',
                  color: selection.getSelectedCount() === 0 ? '#a19f9d' : 'white',
                  border: 'none',
                  borderRadius: '2px',
                  cursor: selection.getSelectedCount() === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Export Selected ({selection.getSelectedCount()} accounts)
              </button>
            </Stack>
          </Stack>
        </Panel>
      )}

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Account"
        message={`Are you sure you want to delete "${accountToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </Stack>
  );
};
