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
import { activityService } from '../services/d365Services';
import type { Activity } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import * as XLSX from 'xlsx';

export const ActivitiesPage = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);

  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedActivities,
    setCurrentPage,
    setPageSize,
  } = usePagination({ items: filteredActivities, initialPageSize: 50 });
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    activityType: true,
    subject: true,
    description: true,
    activityDate: true,
    dueDate: true,
    status: true,
    priority: true,
  };

  const defaultColumnOrder = [
    'activityType', 'subject', 'description', 'activityDate', 'dueDate', 'status', 'priority'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Activities',
    isDefault: true,
    entityType: 'activity',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('activities-views');
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
        const selected = selection.getSelection()[0] as Activity | undefined;
        setSelectedActivity(selected);
      },
    })
  );

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [activities, searchText, currentView, sortColumn, isSortedDescending]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, currentView.filters, pageSize, setCurrentPage]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await activityService.getAll();
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...activities];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((activity) => {
        return Object.values(activity).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((activity) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = activity[filter.field as keyof Activity];
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
        let aValue: any = a[sortColumn as keyof Activity];
        let bValue: any = b[sortColumn as keyof Activity];

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

        if (comparison === 0 && sortColumn !== 'subject') {
          const aSubject = a.subject || '';
          const bSubject = b.subject || '';
          comparison = aSubject.localeCompare(bSubject);
        }

        return isSortedDescending ? -comparison : comparison;
      });
    }

    setFilteredActivities(filtered);
  };

  const handleNew = () => {
    console.log('New activity - form not implemented yet');
  };

  const handleEdit = () => {
    if (selectedActivity) {
      console.log('Edit activity - form not implemented yet');
    }
  };

  const handleRowDoubleClick = (activity: Activity) => {
    setSelectedActivity(activity);
    console.log('Edit activity - form not implemented yet');
  };

  const handleDelete = async () => {
    if (selectedActivity && window.confirm(`Are you sure you want to delete activity "${selectedActivity.subject}"?`)) {
      try {
        await activityService.delete(selectedActivity.id);
        await loadActivities();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete activity');
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredActivities.map((activity) => ({
      'Activity Type': activity.activityType || '',
      'Subject': activity.subject || '',
      'Description': activity.description || '',
      'Activity Date': activity.activityDate ? new Date(activity.activityDate).toLocaleDateString() : '',
      'Due Date': activity.dueDate ? new Date(activity.dueDate).toLocaleDateString() : '',
      'Status': activity.status || '',
      'Priority': activity.priority || '',
      'Completed': activity.isCompleted ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Activities');
    XLSX.writeFile(wb, `Activities_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    localStorage.setItem('activities-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter((v) => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('activities-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map((v) => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('activities-views', JSON.stringify(updatedViews));
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
      key: 'activityType',
      name: 'Activity Type',
      fieldName: 'activityType',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'activityType',
      isSortedDescending: sortColumn === 'activityType' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
    },
    {
      key: 'subject',
      name: 'Subject',
      fieldName: 'subject',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
      isSorted: sortColumn === 'subject',
      isSortedDescending: sortColumn === 'subject' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
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
      onRender: (item: Activity) => <Text>{item.description || '-'}</Text>,
    },
    {
      key: 'activityDate',
      name: 'Activity Date',
      fieldName: 'activityDate',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'activityDate',
      isSortedDescending: sortColumn === 'activityDate' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Activity) => <Text>{item.activityDate ? new Date(item.activityDate).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'dueDate',
      name: 'Due Date',
      fieldName: 'dueDate',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'dueDate',
      isSortedDescending: sortColumn === 'dueDate' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: Activity) => <Text>{item.dueDate ? new Date(item.dueDate).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'status',
      name: 'Status',
      fieldName: 'status',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'status',
      isSortedDescending: sortColumn === 'status' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
    },
    {
      key: 'priority',
      name: 'Priority',
      fieldName: 'priority',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'priority',
      isSortedDescending: sortColumn === 'priority' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
    },
  ];

  const visibleColumns = allColumnDefinitions.filter(
    (col) => currentView.columnVisibility[col.key] !== false
  );

  const availableFilterFields = [
    { key: 'activityType', name: 'Activity Type', type: 'text' as const },
    { key: 'subject', name: 'Subject', type: 'text' as const },
    { key: 'description', name: 'Description', type: 'text' as const },
    { key: 'status', name: 'Status', type: 'text' as const },
    { key: 'priority', name: 'Priority', type: 'text' as const },
    { key: 'activityDate', name: 'Activity Date', type: 'date' as const },
    { key: 'dueDate', name: 'Due Date', type: 'date' as const },
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
      disabled: !selectedActivity,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedActivity,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadActivities,
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
          entityType="activity"
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
        <Text variant="xxLarge">Activities</Text>
        <Text variant="medium">{filteredActivities.length} items</Text>
      </Stack>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      {loading ? (
        <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { padding: 50 } }}>
          <Spinner size={SpinnerSize.large} label="Loading activities..." />
        </Stack>
      ) : (
        <>
          <DetailsList
            items={paginatedActivities}
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
            totalItems={filteredActivities.length}
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
