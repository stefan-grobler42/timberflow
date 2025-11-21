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
import { jigService } from '../services/millenniumServices';
import type { Jig } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { JigForm } from '../components/JigForm';
import { DeleteDialog } from '../components/DeleteDialog';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import * as XLSX from 'xlsx';

export const JigsPage = () => {
  const [jigs, setJigs] = useState<Jig[]>([]);
  const [filteredJigs, setFilteredJigs] = useState<Jig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJig, setSelectedJig] = useState<Jig | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [jigToDelete, setJigToDelete] = useState<Jig | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    name: true,
    description: true,
    leader: true,
    proficiency: true,
    reliabilityScore: true,
    strengths: false,
  };

  const defaultColumnOrder = [
    'name', 'description', 'leader', 'proficiency', 'reliabilityScore', 'strengths'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Jigs',
    isDefault: true,
    entityType: 'jig',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('jigs-views');
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
        const selected = selection.getSelection()[0] as Jig | undefined;
        setSelectedJig(selected);
      },
    })
  );

  useEffect(() => {
    loadJigs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jigs, searchText, currentView, sortColumn, isSortedDescending]);

  const loadJigs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await jigService.getAll();
      setJigs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jigs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jigs];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((jig) =>
        Object.values(jig).some((value) =>
          String(value).toLowerCase().includes(search)
        )
      );
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((jig) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = jig[filter.field as keyof Jig];
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
        let aValue: any = a[sortColumn as keyof Jig];
        let bValue: any = b[sortColumn as keyof Jig];

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

    setFilteredJigs(filtered);
  };

  const handleNew = () => {
    setSelectedJig(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedJig) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (jig: Jig) => {
    setSelectedJig(jig);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedJig) {
      setJigToDelete(selectedJig);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (jigToDelete) {
      try {
        await jigService.delete(jigToDelete.id);
        setIsDeleteDialogOpen(false);
        setJigToDelete(undefined);
        await loadJigs();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete jig');
      }
    }
  };

  const exportToExcel = (jigsToExport: Jig[]) => {
    const exportData = jigsToExport.map((jig) => ({
      'Name': jig.name || '',
      'Description': jig.description || '',
      'Leader': jig.leader || '',
      'Proficiency': jig.proficiency || '',
      'Reliability Score': jig.reliabilityScore || 0,
      'Strengths': jig.strengths || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jigs');
    XLSX.writeFile(wb, `Jigs_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as Jig[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredJigs);
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
    localStorage.setItem('jigs-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('jigs-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map(v => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('jigs-views', JSON.stringify(updatedViews));
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
    { key: 'leader', name: 'Leader', type: 'text' as const },
    { key: 'proficiency', name: 'Proficiency', type: 'text' as const },
    { key: 'reliabilityScore', name: 'Reliability Score', type: 'number' as const },
    { key: 'strengths', name: 'Strengths', type: 'text' as const },
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
      key: 'leader',
      name: 'Leader',
      fieldName: 'leader',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'leader',
      isSortedDescending: sortColumn === 'leader' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'proficiency',
      name: 'Proficiency',
      fieldName: 'proficiency',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'proficiency',
      isSortedDescending: sortColumn === 'proficiency' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'reliabilityScore',
      name: 'Reliability Score',
      minWidth: 130,
      maxWidth: 160,
      isResizable: true,
      isSorted: sortColumn === 'reliabilityScore',
      isSortedDescending: sortColumn === 'reliabilityScore' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Jig) => <Text>{item.reliabilityScore ? item.reliabilityScore.toFixed(2) : '-'}</Text>,
    },
    {
      key: 'strengths',
      name: 'Strengths',
      fieldName: 'strengths',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
      isSorted: sortColumn === 'strengths',
      isSortedDescending: sortColumn === 'strengths' && isSortedDescending,
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
      disabled: !selectedJig,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedJig,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadJigs,
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
      onClick: () => document.getElementById('jigs-import-input')?.click(),
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
        <JigForm
          jig={selectedJig}
          onDismiss={() => {
            setIsFormOpen(false);
            setSelectedJig(undefined);
          }}
          onSave={() => {
            loadJigs();
            setIsFormOpen(false);
            setSelectedJig(undefined);
          }}
          onDelete={selectedJig ? () => handleDelete() : undefined}
        />
      </div>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Jigs</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="jigs-import-input"
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
          <Spinner size={SpinnerSize.large} label="Loading jigs..." />
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <DetailsList
            items={filteredJigs}
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
        title="Delete Jig"
        message={`Are you sure you want to delete ${jigToDelete?.name}?`}
        onConfirm={confirmDelete}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setJigToDelete(undefined);
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
              text={`Export All (${filteredJigs.length})`}
              onClick={handleExportAll}
            />
          </Stack>
        </Panel>
      )}
    </Stack>
  );
};
