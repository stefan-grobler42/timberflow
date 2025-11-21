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
  IconButton,
  Separator,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { installationProgressService } from '../services/d365Services';
import type { InstallationProgress } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import * as XLSX from 'xlsx';

export const InstallationsPage = () => {
  const [installations, setInstallations] = useState<InstallationProgress[]>([]);
  const [filteredInstallations, setFilteredInstallations] = useState<InstallationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInstallation, setSelectedInstallation] = useState<InstallationProgress | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);

  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedInstallations,
    setCurrentPage,
    setPageSize,
  } = usePagination({ items: filteredInstallations, initialPageSize: 50 });
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    name: true,
    newInstallationOrderNo: true,
    newPercentageComplete: true,
    createdOn: true,
  };

  const defaultColumnOrder = [
    'name', 'newInstallationOrderNo', 'newPercentageComplete', 'createdOn'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Installations',
    isDefault: true,
    entityType: 'installation',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('installations-views');
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
        const selected = selection.getSelection()[0] as InstallationProgress | undefined;
        setSelectedInstallation(selected);
      },
    })
  );

  useEffect(() => {
    loadInstallations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [installations, searchText, currentView, sortColumn, isSortedDescending]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, currentView.filters, pageSize, setCurrentPage]);

  const loadInstallations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await installationProgressService.getAll();
      setInstallations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load installations');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...installations];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((installation) => {
        return Object.values(installation).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((installation) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = installation[filter.field as keyof InstallationProgress];
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
        let aValue: any = a[sortColumn as keyof InstallationProgress];
        let bValue: any = b[sortColumn as keyof InstallationProgress];

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

    setFilteredInstallations(filtered);
  };

  const handleNew = () => {
    console.log('New installation - form not implemented yet');
  };

  const handleEdit = () => {
    if (selectedInstallation) {
      console.log('Edit installation - form not implemented yet');
    }
  };

  const handleRowDoubleClick = (installation: InstallationProgress) => {
    setSelectedInstallation(installation);
    console.log('Edit installation - form not implemented yet');
  };

  const handleDelete = async () => {
    if (selectedInstallation && window.confirm(`Are you sure you want to delete installation "${selectedInstallation.name}"?`)) {
      try {
        await installationProgressService.delete(selectedInstallation.id);
        await loadInstallations();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete installation');
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredInstallations.map((installation) => ({
      'Name': installation.name || '',
      'Installation Order No': installation.newInstallationOrderNo || '',
      'Percentage Complete': installation.newPercentageComplete || 0,
      'Created On': installation.createdOn ? new Date(installation.createdOn).toLocaleDateString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Installations');
    XLSX.writeFile(wb, `Installations_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
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
    localStorage.setItem('installations-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter((v) => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('installations-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map((v) => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('installations-views', JSON.stringify(updatedViews));
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
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
      isSorted: sortColumn === 'name',
      isSortedDescending: sortColumn === 'name' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
    },
    {
      key: 'newInstallationOrderNo',
      name: 'Installation Order No',
      fieldName: 'newInstallationOrderNo',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'newInstallationOrderNo',
      isSortedDescending: sortColumn === 'newInstallationOrderNo' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: InstallationProgress) => <Text>{item.newInstallationOrderNo || '-'}</Text>,
    },
    {
      key: 'newPercentageComplete',
      name: 'Percentage Complete',
      fieldName: 'newPercentageComplete',
      minWidth: 150,
      maxWidth: 180,
      isResizable: true,
      isSorted: sortColumn === 'newPercentageComplete',
      isSortedDescending: sortColumn === 'newPercentageComplete' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: InstallationProgress) => <Text>{item.newPercentageComplete ? `${item.newPercentageComplete}%` : '-'}</Text>,
    },
    {
      key: 'createdOn',
      name: 'Created On',
      fieldName: 'createdOn',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'createdOn',
      isSortedDescending: sortColumn === 'createdOn' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: InstallationProgress) => <Text>{item.createdOn ? new Date(item.createdOn).toLocaleDateString() : '-'}</Text>,
    },
  ];

  const visibleColumns = allColumnDefinitions.filter(
    (col) => currentView.columnVisibility[col.key] !== false
  );

  const availableFilterFields = [
    { key: 'name', name: 'Name', type: 'text' as const },
    { key: 'newInstallationOrderNo', name: 'Installation Order No', type: 'text' as const },
    { key: 'newPercentageComplete', name: 'Percentage Complete', type: 'number' as const },
    { key: 'createdOn', name: 'Created On', type: 'date' as const },
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
      disabled: !selectedInstallation,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedInstallation,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadInstallations,
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
          entityType="installation"
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
        <Text variant="xxLarge">Installation Progress</Text>
        <Text variant="medium">{filteredInstallations.length} items</Text>
      </Stack>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      {loading ? (
        <Stack horizontalAlign="center" verticalAlign="center" styles={{ root: { padding: 50 } }}>
          <Spinner size={SpinnerSize.large} label="Loading installations..." />
        </Stack>
      ) : (
        <>
          <DetailsList
            items={paginatedInstallations}
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
            totalItems={filteredInstallations.length}
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
