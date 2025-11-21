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
  PanelType,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { logisticsService } from '../services/d365Services';
import type { Logistics } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import * as XLSX from 'xlsx';

export const LoadsPage = () => {
  const [loads, setLoads] = useState<Logistics[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<Logistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLoad, setSelectedLoad] = useState<Logistics | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);

  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedLoads,
    setCurrentPage,
    setPageSize,
  } = usePagination({ items: filteredLoads, initialPageSize: 50 });
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    deliveryNo: true,
    description: true,
    driver: true,
    vehicle: true,
    plannedLoadDate: true,
    newLoadCompleted: true,
    newLoadDuration: true,
  };

  const defaultColumnOrder = [
    'deliveryNo', 'description', 'driver', 'vehicle', 'plannedLoadDate', 'newLoadCompleted', 'newLoadDuration'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Loads',
    isDefault: true,
    entityType: 'load',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('loads-views');
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
        const selected = selection.getSelection()[0] as Logistics | undefined;
        setSelectedLoad(selected);
      },
    })
  );

  useEffect(() => {
    loadLoads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [loads, searchText, currentView, sortColumn, isSortedDescending]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, currentView.filters, pageSize, setCurrentPage]);

  const loadLoads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await logisticsService.getAll();
      setLoads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load loads');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...loads];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((load) => {
        return Object.values(load).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((load) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = load[filter.field as keyof Logistics];
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
        let aValue: any = a[sortColumn as keyof Logistics];
        let bValue: any = b[sortColumn as keyof Logistics];

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

        if (comparison === 0 && sortColumn !== 'deliveryNo') {
          const aNo = a.deliveryNo || '';
          const bNo = b.deliveryNo || '';
          comparison = aNo.localeCompare(bNo);
        }

        return isSortedDescending ? -comparison : comparison;
      });
    }

    setFilteredLoads(filtered);
  };

  const handleNew = () => {
    console.log('New load - form not implemented yet');
  };

  const handleEdit = () => {
    if (selectedLoad) {
      console.log('Edit load - form not implemented yet');
    }
  };

  const handleRowDoubleClick = (load: Logistics) => {
    setSelectedLoad(load);
    console.log('Edit load - form not implemented yet');
  };

  const handleDelete = async () => {
    if (selectedLoad && window.confirm(`Are you sure you want to delete load "${selectedLoad.deliveryNo}"?`)) {
      try {
        await logisticsService.delete(selectedLoad.id);
        await loadLoads();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete load');
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredLoads.map((load) => ({
      'Delivery No': load.deliveryNo || '',
      'Description': load.description || '',
      'Driver': load.driver || '',
      'Vehicle': load.vehicle || '',
      'Planned Load Date': load.plannedLoadDate ? new Date(load.plannedLoadDate).toLocaleDateString() : '',
      'Load Completed': load.newLoadCompleted ? 'Yes' : 'No',
      'Load Duration': load.newLoadDuration || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Loads');
    XLSX.writeFile(wb, `Loads_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleViewChange = (view: GridView) => {
    setCurrentView(view);
  };

  const handleSaveView = (view: GridView) => {
    const updatedViews = views.map((v) => (v.id === view.id ? view : v));
    if (!updatedViews.find((v) => v.id === view.id)) {
      updatedViews.push(view);
    }
    setViews(updatedViews);
    setCurrentView(view);
    localStorage.setItem('loads-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter((v) => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('loads-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map((v) => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('loads-views', JSON.stringify(updatedViews));
  };

  const handleColumnVisibilityChange = (columnKey: string, isVisible: boolean) => {
    const updatedView = {
      ...currentView,
      columnVisibility: {
        ...currentView.columnVisibility,
        [columnKey]: isVisible,
      },
    };
    setCurrentView(updatedView);
  };

  const handleFiltersChange = (filters: GridFilter[]) => {
    const updatedView = {
      ...currentView,
      filters,
    };
    setCurrentView(updatedView);
  };

  const handleColumnClick = (_ev?: React.MouseEvent<HTMLElement>, column?: IColumn) => {
    if (!column) return;

    const newSortColumn = column.fieldName || column.key;
    const newIsSortedDescending = sortColumn === newSortColumn ? !isSortedDescending : false;

    setSortColumn(newSortColumn);
    setIsSortedDescending(newIsSortedDescending);
  };

  const allColumnDefinitions: IColumn[] = [
    {
      key: 'deliveryNo',
      name: 'Delivery No',
      fieldName: 'deliveryNo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'deliveryNo',
      isSortedDescending: sortColumn === 'deliveryNo' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Logistics) => <Text>{item.deliveryNo || '-'}</Text>,
    },
    {
      key: 'description',
      name: 'Description',
      fieldName: 'description',
      minWidth: 200,
      maxWidth: 350,
      isResizable: true,
      isSorted: sortColumn === 'description',
      isSortedDescending: sortColumn === 'description' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Logistics) => <Text>{item.description || '-'}</Text>,
    },
    {
      key: 'driver',
      name: 'Driver',
      fieldName: 'driver',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'driver',
      isSortedDescending: sortColumn === 'driver' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Logistics) => <Text>{item.driver || '-'}</Text>,
    },
    {
      key: 'vehicle',
      name: 'Vehicle',
      fieldName: 'vehicle',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'vehicle',
      isSortedDescending: sortColumn === 'vehicle' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Logistics) => <Text>{item.vehicle || '-'}</Text>,
    },
    {
      key: 'plannedLoadDate',
      name: 'Planned Load Date',
      fieldName: 'plannedLoadDate',
      minWidth: 150,
      maxWidth: 180,
      isResizable: true,
      isSorted: sortColumn === 'plannedLoadDate',
      isSortedDescending: sortColumn === 'plannedLoadDate' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Logistics) => <Text>{item.plannedLoadDate ? new Date(item.plannedLoadDate).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'newLoadCompleted',
      name: 'Load Completed',
      fieldName: 'newLoadCompleted',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'newLoadCompleted',
      isSortedDescending: sortColumn === 'newLoadCompleted' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Logistics) => <Text>{item.newLoadCompleted ? 'Yes' : 'No'}</Text>,
    },
    {
      key: 'newLoadDuration',
      name: 'Load Duration',
      fieldName: 'newLoadDuration',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'newLoadDuration',
      isSortedDescending: sortColumn === 'newLoadDuration' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Logistics) => <Text>{item.newLoadDuration || '-'}</Text>,
    },
  ];

  const visibleColumns = allColumnDefinitions.filter(
    (col) => currentView.columnVisibility[col.key] !== false
  );

  const availableFilterFields = [
    { key: 'deliveryNo', name: 'Delivery No', type: 'text' as const },
    { key: 'description', name: 'Description', type: 'text' as const },
    { key: 'driver', name: 'Driver', type: 'text' as const },
    { key: 'vehicle', name: 'Vehicle', type: 'text' as const },
    { key: 'plannedLoadDate', name: 'Planned Load Date', type: 'date' as const },
    { key: 'newLoadDuration', name: 'Load Duration', type: 'number' as const },
  ];

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
      disabled: !selectedLoad,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedLoad,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadLoads,
    },
    {
      key: 'export',
      text: 'Export to Excel',
      iconProps: { iconName: 'ExcelDocument' },
      onClick: exportToExcel,
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
          styles={{ root: { width: 250, marginRight: 10 } }}
        />
      ),
    },
    {
      key: 'viewManager',
      onRender: () => (
        <ViewManager
          views={views}
          currentView={currentView}
          onViewChange={handleViewChange}
          onSaveView={handleSaveView}
          onDeleteView={handleDeleteView}
          onSetDefaultView={handleSetDefaultView}
          entityType="load"
        />
      ),
    },
    {
      key: 'columns',
      text: 'Columns',
      iconProps: { iconName: 'ColumnOptions' },
      onClick: () => setIsColumnPanelOpen(true),
    },
    {
      key: 'filter',
      text: 'Filter',
      iconProps: { iconName: 'Filter' },
      onClick: () => setIsFilterBuilderOpen(true),
    },
  ];

  return (
    <Stack styles={{ root: { padding: 20, height: '100%' } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { marginBottom: 20 } }}>
        <Text variant="xxLarge">Loads</Text>
        <Text variant="medium">{filteredLoads.length} items</Text>
      </Stack>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      {loading ? (
        <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { padding: 50 } }}>
          <Spinner size={SpinnerSize.large} label="Loading loads..." />
        </Stack>
      ) : (
        <>
          <DetailsList
            items={paginatedLoads}
            columns={visibleColumns}
            layoutMode={DetailsListLayoutMode.justified}
            constrainMode={ConstrainMode.unconstrained}
            selection={selection}
            selectionMode={1}
            onItemInvoked={handleRowDoubleClick}
            setKey="set"
            isHeaderVisible={true}
          />

          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredLoads.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Panel
        isOpen={isColumnPanelOpen}
        onDismiss={() => setIsColumnPanelOpen(false)}
        headerText="Customize Columns"
        type={PanelType.medium}
      >
        <Stack tokens={{ childrenGap: 10 }}>
          {allColumnDefinitions.map((col) => (
            <Checkbox
              key={col.key}
              label={col.name}
              checked={currentView.columnVisibility[col.key] !== false}
              onChange={(_, checked) => handleColumnVisibilityChange(col.key, checked || false)}
            />
          ))}
        </Stack>
      </Panel>

      <FilterBuilder
        isOpen={isFilterBuilderOpen}
        onDismiss={() => setIsFilterBuilderOpen(false)}
        filters={currentView.filters}
        onFiltersChange={handleFiltersChange}
        availableFields={availableFilterFields}
      />
    </Stack>
  );
};
