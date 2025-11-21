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
  PanelType,
  Checkbox,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  IconButton,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { productionService } from '../services/millenniumServices';
import type { Production } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { D365ProductionForm } from '../components/D365ProductionForm';
import { DeleteDialog } from '../components/DeleteDialog';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import { useLookupData, resolveLookup } from '../hooks/useLookupData';
import * as XLSX from 'xlsx';

export const ProductionPage = () => {
  const [production, setProduction] = useState<Production[]>([]);
  const [filteredProduction, setFilteredProduction] = useState<Production[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduction, setSelectedProduction] = useState<Production | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productionToDelete, setProductionToDelete] = useState<Production | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);
  const lookupData = useLookupData();
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    name: true,
    customer: true,
    sawOperator: true,
    jigLeader: true,
    orderNo: false,
    jigStart: false,
    jigEnd: false,
    productionComplete: true,
    productionPlannedDate: false,
  };

  const defaultColumnOrder = [
    'name', 'customer', 'sawOperator', 'jigLeader', 'orderNo', 'jigStart', 'jigEnd', 'productionComplete', 'productionPlannedDate'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Production',
    isDefault: true,
    entityType: 'production',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('production-views');
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
        const selected = selection.getSelection()[0] as Production | undefined;
        setSelectedProduction(selected);
      },
    })
  );

  useEffect(() => {
    loadProduction();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [production, searchText, currentView, sortColumn, isSortedDescending]);

  const loadProduction = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productionService.getAll();
      setProduction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load production');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...production];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(search)
        )
      );
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((item) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = item[filter.field as keyof Production];
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
        let aValue: any = a[sortColumn as keyof Production];
        let bValue: any = b[sortColumn as keyof Production];

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

    setFilteredProduction(filtered);
  };

  const handleNew = () => {
    setSelectedProduction(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedProduction) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (item: Production) => {
    setSelectedProduction(item);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedProduction) {
      setProductionToDelete(selectedProduction);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (productionToDelete) {
      try {
        await productionService.delete(productionToDelete.id);
        setIsDeleteDialogOpen(false);
        setProductionToDelete(undefined);
        await loadProduction();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete production');
      }
    }
  };

  const exportToExcel = (itemsToExport: Production[]) => {
    const exportData = itemsToExport.map((item) => ({
      'Name': item.name || '',
      'Order No': item.orderNo || '',
      'Jig Start': item.jigStart ? new Date(item.jigStart).toLocaleDateString() : '',
      'Jig End': item.jigEnd ? new Date(item.jigEnd).toLocaleDateString() : '',
      'Complete': item.productionComplete ? 'Yes' : 'No',
      'Planned Date': item.productionPlannedDate ? new Date(item.productionPlannedDate).toLocaleDateString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Production');
    XLSX.writeFile(wb, `Production_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as Production[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredProduction);
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
    localStorage.setItem('production-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('production-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map(v => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('production-views', JSON.stringify(updatedViews));
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

  const onColumnClick = (_ev?: React.MouseEvent<HTMLElement>, column?: IColumn) => {
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
    { key: 'orderNo', name: 'Order No', type: 'text' as const },
    { key: 'productionComplete', name: 'Complete', type: 'boolean' as const },
  ];

  const allColumns: IColumn[] = [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'name',
      isSortedDescending: sortColumn === 'name' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'customer',
      name: 'Customer',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
      isSorted: sortColumn === 'customer',
      isSortedDescending: sortColumn === 'customer' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Production) => <Text>{resolveLookup(item.customer, lookupData.customers)}</Text>,
    },
    {
      key: 'sawOperator',
      name: 'Saw Operator',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'sawOperator',
      isSortedDescending: sortColumn === 'sawOperator' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Production) => <Text>{resolveLookup(item.sawOperator, lookupData.employees)}</Text>,
    },
    {
      key: 'jigLeader',
      name: 'Jig Leader',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'jigLeader',
      isSortedDescending: sortColumn === 'jigLeader' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Production) => <Text>{resolveLookup(item.jigLeader, lookupData.employees)}</Text>,
    },
    {
      key: 'orderNo',
      name: 'Order No',
      fieldName: 'orderNo',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'orderNo',
      isSortedDescending: sortColumn === 'orderNo' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'jigStart',
      name: 'Jig Start',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'jigStart',
      isSortedDescending: sortColumn === 'jigStart' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Production) => <Text>{item.jigStart ? new Date(item.jigStart).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'jigEnd',
      name: 'Jig End',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'jigEnd',
      isSortedDescending: sortColumn === 'jigEnd' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Production) => <Text>{item.jigEnd ? new Date(item.jigEnd).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'productionComplete',
      name: 'Complete',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
      isSorted: sortColumn === 'productionComplete',
      isSortedDescending: sortColumn === 'productionComplete' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Production) => <Text>{item.productionComplete ? 'Yes' : 'No'}</Text>,
    },
    {
      key: 'productionPlannedDate',
      name: 'Planned Date',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'productionPlannedDate',
      isSortedDescending: sortColumn === 'productionPlannedDate' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Production) => <Text>{item.productionPlannedDate ? new Date(item.productionPlannedDate).toLocaleDateString() : '-'}</Text>,
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
      disabled: !selectedProduction,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedProduction,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadProduction,
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
      onClick: () => document.getElementById('production-import-input')?.click(),
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

  const handleFormDelete = () => {
    setIsFormOpen(false);
    if (selectedProduction) {
      setProductionToDelete(selectedProduction);
      setIsDeleteDialogOpen(true);
    }
  };

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Production</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="production-import-input"
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
            padding: '8px 16px',
            backgroundColor: '#f3f2f1',
            borderRadius: 4,
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
          onClick={() => setIsColumnPanelOpen(true)}
        />
        <IconButton
          iconProps={{ iconName: 'Filter' }}
          title="Filter"
          onClick={() => setIsFilterBuilderOpen(true)}
        />
        {currentView.filters && currentView.filters.length > 0 && (
          <Text variant="small" styles={{ root: { color: '#0078d4' } }}>
            ({currentView.filters.length} filter{currentView.filters.length !== 1 ? 's' : ''} applied)
          </Text>
        )}
      </Stack>

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading production..." />
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <DetailsList
            items={filteredProduction}
            columns={columns}
            selection={selection}
            selectionMode={1}
            layoutMode={DetailsListLayoutMode.justified}
            constrainMode={ConstrainMode.unconstrained}
            onItemInvoked={handleRowDoubleClick}
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
          <Text variant="medium" styles={{ root: { fontWeight: 600, marginTop: 16 } }}>
            Show/Hide Columns
          </Text>
          {currentView.columnOrder.map((columnKey) => {
            const column = allColumns.find((col) => col.key === columnKey);
            if (!column) return null;

            return (
              <Stack key={columnKey} horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <Checkbox
                  label={column.name}
                  checked={currentView.columnVisibility[columnKey]}
                  onChange={(_, checked) => {
                    const newVisibility = { ...currentView.columnVisibility, [columnKey]: !!checked };
                    updateCurrentViewColumns(newVisibility, currentView.columnOrder);
                  }}
                  styles={{ root: { flex: 1 } }}
                />
                <IconButton
                  iconProps={{ iconName: 'Up' }}
                  title="Move Up"
                  onClick={() => moveColumnUp(columnKey)}
                  disabled={currentView.columnOrder.indexOf(columnKey) === 0}
                />
                <IconButton
                  iconProps={{ iconName: 'Down' }}
                  title="Move Down"
                  onClick={() => moveColumnDown(columnKey)}
                  disabled={currentView.columnOrder.indexOf(columnKey) === currentView.columnOrder.length - 1}
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

      <Dialog
        hidden={!isExportDialogOpen}
        onDismiss={() => setIsExportDialogOpen(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Export to Excel',
          subText: 'Choose what to export:',
        }}
      >
        <DialogFooter>
          <PrimaryButton
            onClick={handleExportSelected}
            text="Export Selected"
            disabled={selection.getSelectedCount() === 0}
          />
          <DefaultButton onClick={handleExportAll} text="Export All" />
          <DefaultButton onClick={() => setIsExportDialogOpen(false)} text="Cancel" />
        </DialogFooter>
      </Dialog>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Production"
        message={`Are you sure you want to delete "${productionToDelete?.name || ''}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />

      <Panel
        isOpen={isFormOpen}
        type={PanelType.custom}
        customWidth="85%"
        onDismiss={() => {
          setIsFormOpen(false);
          setSelectedProduction(undefined);
        }}
        isBlocking={false}
        closeButtonAriaLabel="Close"
      >
        <D365ProductionForm
          production={selectedProduction}
          onDismiss={() => {
            setIsFormOpen(false);
            setSelectedProduction(undefined);
          }}
          onSave={() => {
            loadProduction();
            setIsFormOpen(false);
            setSelectedProduction(undefined);
          }}
          onDelete={selectedProduction ? handleFormDelete : undefined}
        />
      </Panel>
    </Stack>
  );
};
