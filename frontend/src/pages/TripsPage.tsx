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
import { deliveryService } from '../services/d365Services';
import type { Delivery } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import * as XLSX from 'xlsx';

export const TripsPage = () => {
  const [trips, setTrips] = useState<Delivery[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Delivery | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);

  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedTrips,
    setCurrentPage,
    setPageSize,
  } = usePagination({ items: filteredTrips, initialPageSize: 50 });
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    deliveryNo: true,
    customer: true,
    orderNo: true,
    loadingDate: true,
    driver: true,
    loadMaster: true,
    actualStart: true,
    actualEnd: true,
  };

  const defaultColumnOrder = [
    'deliveryNo', 'customer', 'orderNo', 'loadingDate', 'driver', 'loadMaster', 'actualStart', 'actualEnd'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Trips',
    isDefault: true,
    entityType: 'trip',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('trips-views');
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
        const selected = selection.getSelection()[0] as Delivery | undefined;
        setSelectedTrip(selected);
      },
    })
  );

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trips, searchText, currentView, sortColumn, isSortedDescending]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, currentView.filters, pageSize, setCurrentPage]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryService.getAll();
      setTrips(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trips];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((trip) => {
        return Object.values(trip).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((trip) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = trip[filter.field as keyof Delivery];
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
        let aValue: any = a[sortColumn as keyof Delivery];
        let bValue: any = b[sortColumn as keyof Delivery];

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

    setFilteredTrips(filtered);
  };

  const handleNew = () => {
    console.log('New trip - form not implemented yet');
  };

  const handleEdit = () => {
    if (selectedTrip) {
      console.log('Edit trip - form not implemented yet');
    }
  };

  const handleRowDoubleClick = (trip: Delivery) => {
    setSelectedTrip(trip);
    console.log('Edit trip - form not implemented yet');
  };

  const handleDelete = async () => {
    if (selectedTrip && window.confirm(`Are you sure you want to delete trip "${selectedTrip.deliveryNo}"?`)) {
      try {
        await deliveryService.delete(selectedTrip.id);
        await loadTrips();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete trip');
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredTrips.map((trip) => ({
      'Trip No': trip.deliveryNo || '',
      'Customer': trip.customer || '',
      'Order No': trip.orderNo || '',
      'Loading Date': trip.loadingDate ? new Date(trip.loadingDate).toLocaleDateString() : '',
      'Driver': trip.driver || '',
      'Load Master': trip.loadMaster || '',
      'Actual Start': trip.actualStart ? new Date(trip.actualStart).toLocaleDateString() : '',
      'Actual End': trip.actualEnd ? new Date(trip.actualEnd).toLocaleDateString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trips');
    XLSX.writeFile(wb, `Trips_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    localStorage.setItem('trips-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter((v) => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('trips-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map((v) => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('trips-views', JSON.stringify(updatedViews));
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
      name: 'Trip No',
      fieldName: 'deliveryNo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'deliveryNo',
      isSortedDescending: sortColumn === 'deliveryNo' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Delivery) => <Text>{item.deliveryNo || '-'}</Text>,
    },
    {
      key: 'customer',
      name: 'Customer',
      fieldName: 'customer',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
      isSorted: sortColumn === 'customer',
      isSortedDescending: sortColumn === 'customer' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Delivery) => <Text>{item.customer || '-'}</Text>,
    },
    {
      key: 'orderNo',
      name: 'Order No',
      fieldName: 'orderNo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'orderNo',
      isSortedDescending: sortColumn === 'orderNo' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Delivery) => <Text>{item.orderNo || '-'}</Text>,
    },
    {
      key: 'loadingDate',
      name: 'Loading Date',
      fieldName: 'loadingDate',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'loadingDate',
      isSortedDescending: sortColumn === 'loadingDate' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Delivery) => <Text>{item.loadingDate ? new Date(item.loadingDate).toLocaleDateString() : '-'}</Text>,
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
      onRender: (item: Delivery) => <Text>{item.driver || '-'}</Text>,
    },
    {
      key: 'loadMaster',
      name: 'Load Master',
      fieldName: 'loadMaster',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'loadMaster',
      isSortedDescending: sortColumn === 'loadMaster' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Delivery) => <Text>{item.loadMaster || '-'}</Text>,
    },
    {
      key: 'actualStart',
      name: 'Actual Start',
      fieldName: 'actualStart',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'actualStart',
      isSortedDescending: sortColumn === 'actualStart' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Delivery) => <Text>{item.actualStart ? new Date(item.actualStart).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'actualEnd',
      name: 'Actual End',
      fieldName: 'actualEnd',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'actualEnd',
      isSortedDescending: sortColumn === 'actualEnd' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Delivery) => <Text>{item.actualEnd ? new Date(item.actualEnd).toLocaleDateString() : '-'}</Text>,
    },
  ];

  const visibleColumns = allColumnDefinitions.filter(
    (col) => currentView.columnVisibility[col.key] !== false
  );

  const availableFilterFields = [
    { key: 'deliveryNo', name: 'Trip No', type: 'text' as const },
    { key: 'customer', name: 'Customer', type: 'text' as const },
    { key: 'orderNo', name: 'Order No', type: 'text' as const },
    { key: 'driver', name: 'Driver', type: 'text' as const },
    { key: 'loadMaster', name: 'Load Master', type: 'text' as const },
    { key: 'loadingDate', name: 'Loading Date', type: 'date' as const },
    { key: 'actualStart', name: 'Actual Start', type: 'date' as const },
    { key: 'actualEnd', name: 'Actual End', type: 'date' as const },
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
      disabled: !selectedTrip,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedTrip,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadTrips,
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
          entityType="trip"
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
        <Text variant="xxLarge">Trips</Text>
        <Text variant="medium">{filteredTrips.length} items</Text>
      </Stack>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      {loading ? (
        <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { padding: 50 } }}>
          <Spinner size={SpinnerSize.large} label="Loading trips..." />
        </Stack>
      ) : (
        <>
          <DetailsList
            items={paginatedTrips}
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
            totalItems={filteredTrips.length}
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
