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
  DefaultButton,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { sawService } from '../services/millenniumServices';
import type { Saw } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { SawForm } from '../components/SawForm';
import { DeleteDialog } from '../components/DeleteDialog';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import * as XLSX from 'xlsx';

export const SawsPage = () => {
  const [saws, setSaws] = useState<Saw[]>([]);
  const [filteredSaws, setFilteredSaws] = useState<Saw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSaw, setSelectedSaw] = useState<Saw | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sawToDelete, setSawToDelete] = useState<Saw | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    name: true,
    description: true,
    operator: true,
    averageTimePerCut: true,
    lastServiceDate: false,
    serialNumber: true,
    assetNumber: true,
    lastBladeChange: false,
  };

  const defaultColumnOrder = [
    'name', 'description', 'operator', 'averageTimePerCut', 'lastServiceDate',
    'serialNumber', 'assetNumber', 'lastBladeChange'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Saws',
    isDefault: true,
    entityType: 'saw',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('saws-views');
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
        const selected = selection.getSelection()[0] as Saw | undefined;
        setSelectedSaw(selected);
      },
    })
  );

  useEffect(() => {
    loadSaws();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [saws, searchText, currentView, sortColumn, isSortedDescending]);

  const loadSaws = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await sawService.getAll();
      setSaws(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saws');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...saws];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((saw) =>
        Object.values(saw).some((value) =>
          String(value).toLowerCase().includes(search)
        )
      );
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((saw) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = saw[filter.field as keyof Saw];
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
        let aValue: any = a[sortColumn as keyof Saw];
        let bValue: any = b[sortColumn as keyof Saw];

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

    setFilteredSaws(filtered);
  };

  const handleNew = () => {
    setSelectedSaw(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedSaw) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (saw: Saw) => {
    setSelectedSaw(saw);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedSaw) {
      setSawToDelete(selectedSaw);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (sawToDelete) {
      try {
        await sawService.delete(sawToDelete.id);
        setIsDeleteDialogOpen(false);
        setSawToDelete(undefined);
        await loadSaws();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete saw');
      }
    }
  };

  const exportToExcel = (sawsToExport: Saw[]) => {
    const exportData = sawsToExport.map((saw) => ({
      'Name': saw.name || '',
      'Description': saw.description || '',
      'Operator': saw.operator || '',
      'Average Time /Cut': saw.averageTimePerCut || 0,
      'Last Service Date': saw.lastServiceDate ? new Date(saw.lastServiceDate).toLocaleDateString() : '',
      'Serial Number': saw.serialNumber || '',
      'Asset Number': saw.assetNumber || '',
      'Last Blade Change': saw.lastBladeChange ? new Date(saw.lastBladeChange).toLocaleDateString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Saws');
    XLSX.writeFile(wb, `Saws_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as Saw[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredSaws);
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
    localStorage.setItem('saws-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('saws-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map(v => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('saws-views', JSON.stringify(updatedViews));
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

  const onColumnClick = (_?: React.MouseEvent<HTMLElement>, column?: IColumn) => {
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
    { key: 'description', name: 'Description', type: 'text' as const },
    { key: 'operator', name: 'Operator', type: 'text' as const },
    { key: 'averageTimePerCut', name: 'Average Time /Cut', type: 'number' as const },
    { key: 'serialNumber', name: 'Serial Number', type: 'text' as const },
    { key: 'assetNumber', name: 'Asset Number', type: 'text' as const },
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
      key: 'description',
      name: 'Description',
      fieldName: 'description',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
      isSorted: sortColumn === 'description',
      isSortedDescending: sortColumn === 'description' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'operator',
      name: 'Operator',
      fieldName: 'operator',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'operator',
      isSortedDescending: sortColumn === 'operator' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'averageTimePerCut',
      name: 'Average Time /Cut',
      minWidth: 140,
      maxWidth: 170,
      isResizable: true,
      isSorted: sortColumn === 'averageTimePerCut',
      isSortedDescending: sortColumn === 'averageTimePerCut' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Saw) => <Text>{item.averageTimePerCut ? item.averageTimePerCut.toFixed(2) : '-'}</Text>,
    },
    {
      key: 'lastServiceDate',
      name: 'Last Service Date',
      minWidth: 130,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'lastServiceDate',
      isSortedDescending: sortColumn === 'lastServiceDate' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Saw) => <Text>{item.lastServiceDate ? new Date(item.lastServiceDate).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'serialNumber',
      name: 'Serial Number',
      fieldName: 'serialNumber',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'serialNumber',
      isSortedDescending: sortColumn === 'serialNumber' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'assetNumber',
      name: 'Asset Number',
      fieldName: 'assetNumber',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'assetNumber',
      isSortedDescending: sortColumn === 'assetNumber' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'lastBladeChange',
      name: 'Last Blade Change',
      minWidth: 140,
      maxWidth: 170,
      isResizable: true,
      isSorted: sortColumn === 'lastBladeChange',
      isSortedDescending: sortColumn === 'lastBladeChange' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Saw) => <Text>{item.lastBladeChange ? new Date(item.lastBladeChange).toLocaleDateString() : '-'}</Text>,
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
      disabled: !selectedSaw,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedSaw,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadSaws,
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
      onClick: () => document.getElementById('saws-import-input')?.click(),
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
      <div style={{ height: '100vh', overflow: 'auto' }}>
        <SawForm
          saw={selectedSaw}
          onDismiss={() => {
            setIsFormOpen(false);
            setSelectedSaw(undefined);
          }}
          onSave={() => {
            loadSaws();
            setIsFormOpen(false);
            setSelectedSaw(undefined);
          }}
          onDelete={selectedSaw ? () => handleDelete() : undefined}
        />
      </div>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Saws</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="saws-import-input"
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
          <Spinner size={SpinnerSize.large} label="Loading saws..." />
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <DetailsList
            items={filteredSaws}
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

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Saw"
        message={`Are you sure you want to delete ${sawToDelete?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setSawToDelete(undefined);
        }}
      />

      {isExportDialogOpen && (
        <Panel
          isOpen={isExportDialogOpen}
          onDismiss={() => setIsExportDialogOpen(false)}
          headerText="Export to Excel"
          closeButtonAriaLabel="Close"
        >
          <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16 } }}>
            <DefaultButton
              text={`Export Selected (${selection.getSelectedCount()})`}
              onClick={handleExportSelected}
              disabled={selection.getSelectedCount() === 0}
            />
            <DefaultButton
              text={`Export All (${filteredSaws.length})`}
              onClick={handleExportAll}
            />
          </Stack>
        </Panel>
      )}
    </Stack>
  );
};
