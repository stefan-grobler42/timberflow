import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { d365QuoteService } from '../services/d365Services';
import type { D365Quote } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import * as XLSX from 'xlsx';

export const QuotesList = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<D365Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<D365Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<D365Quote | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);

  const {
    currentPage,
    pageSize,
    paginatedItems: paginatedQuotes,
    setCurrentPage,
    setPageSize,
  } = usePagination({ items: filteredQuotes, initialPageSize: 50 });
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    quoteNumber: true,
    name: true,
    customerId: true,
    totalAmount: true,
    statusCode: true,
    effectiveFrom: true,
    effectiveTo: false,
  };

  const defaultColumnOrder = [
    'quoteNumber', 'name', 'customerId', 'totalAmount', 'statusCode',
    'effectiveFrom', 'effectiveTo'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Quotes',
    isDefault: true,
    entityType: 'quote',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('quotes-views');
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
        const selected = selection.getSelection()[0] as D365Quote | undefined;
        setSelectedQuote(selected);
      },
    })
  );

  useEffect(() => {
    loadQuotes();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [quotes, searchText, currentView, sortColumn, isSortedDescending]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, currentView.filters, pageSize, setCurrentPage]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365QuoteService.getAll();
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...quotes];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((quote) => {
        return Object.values(quote).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((quote) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = quote[filter.field as keyof D365Quote];
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
        let aValue: any = a[sortColumn as keyof D365Quote];
        let bValue: any = b[sortColumn as keyof D365Quote];

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

    setFilteredQuotes(filtered);
  };

  const handleNew = () => {
    navigate('/quotes/new');
  };

  const handleEdit = () => {
    if (selectedQuote) {
      navigate(`/quotes/${selectedQuote.id}`);
    }
  };

  const handleRowDoubleClick = (quote: D365Quote) => {
    navigate(`/quotes/${quote.id}`);
  };

  const handleDelete = async () => {
    if (selectedQuote && window.confirm(`Are you sure you want to delete quote "${selectedQuote.name}"?`)) {
      try {
        await d365QuoteService.delete(selectedQuote.id);
        await loadQuotes();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete quote');
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredQuotes.map((quote) => ({
      'Quote Number': quote.quoteNumber || '',
      'Name': quote.name || '',
      'Customer ID': quote.customerId || '',
      'Total Amount': quote.totalAmount || 0,
      'Status': getStatusText(quote.statusCode),
      'Effective From': quote.effectiveFrom ? new Date(quote.effectiveFrom).toLocaleDateString() : '',
      'Effective To': quote.effectiveTo ? new Date(quote.effectiveTo).toLocaleDateString() : '',
      'Created On': quote.createdOn ? new Date(quote.createdOn).toLocaleDateString() : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotes');
    XLSX.writeFile(wb, `D365_Quotes_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusText = (statusCode?: number): string => {
    switch (statusCode) {
      case 1: return 'Draft';
      case 2: return 'Active';
      case 3: return 'Won';
      case 4: return 'Lost';
      case 5: return 'Closed';
      default: return 'Unknown';
    }
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
    localStorage.setItem('quotes-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter((v) => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('quotes-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map((v) => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('quotes-views', JSON.stringify(updatedViews));
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
      key: 'quoteNumber',
      name: 'Quote Number',
      fieldName: 'quoteNumber',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'quoteNumber',
      isSortedDescending: sortColumn === 'quoteNumber' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
    },
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
      key: 'customerId',
      name: 'Customer',
      fieldName: 'customerId',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
      isSorted: sortColumn === 'customerId',
      isSortedDescending: sortColumn === 'customerId' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: D365Quote) => <Text>{item.customerId || '-'}</Text>,
    },
    {
      key: 'totalAmount',
      name: 'Total Amount',
      fieldName: 'totalAmount',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'totalAmount',
      isSortedDescending: sortColumn === 'totalAmount' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: D365Quote) => <Text>{item.totalAmount ? `R ${item.totalAmount.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'statusCode',
      name: 'Status',
      fieldName: 'statusCode',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'statusCode',
      isSortedDescending: sortColumn === 'statusCode' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: D365Quote) => <Text>{getStatusText(item.statusCode)}</Text>,
    },
    {
      key: 'effectiveFrom',
      name: 'Effective From',
      fieldName: 'effectiveFrom',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'effectiveFrom',
      isSortedDescending: sortColumn === 'effectiveFrom' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: D365Quote) => <Text>{item.effectiveFrom ? new Date(item.effectiveFrom).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'effectiveTo',
      name: 'Effective To',
      fieldName: 'effectiveTo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'effectiveTo',
      isSortedDescending: sortColumn === 'effectiveTo' ? isSortedDescending : false,
      onColumnClick: handleColumnClick,
      onRender: (item: D365Quote) => <Text>{item.effectiveTo ? new Date(item.effectiveTo).toLocaleDateString() : '-'}</Text>,
    },
  ];

  const visibleColumns = allColumnDefinitions.filter(
    (col) => currentView.columnVisibility[col.key] !== false
  );

  const availableFilterFields = [
    { key: 'quoteNumber', name: 'Quote Number', type: 'text' as const },
    { key: 'name', name: 'Name', type: 'text' as const },
    { key: 'customerId', name: 'Customer', type: 'text' as const },
    { key: 'totalAmount', name: 'Total Amount', type: 'number' as const },
    { key: 'statusCode', name: 'Status', type: 'number' as const },
    { key: 'effectiveFrom', name: 'Effective From', type: 'date' as const },
    { key: 'effectiveTo', name: 'Effective To', type: 'date' as const },
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
      disabled: !selectedQuote,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedQuote,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadQuotes,
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
          styles={{ root: { width: 300 } }}
        />
      ),
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: 20 } }}>
      <Text variant="xxLarge">Quotes</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

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
          title="Column options"
          onClick={() => setIsColumnPanelOpen(true)}
        />

        <IconButton
          iconProps={{ iconName: 'Filter' }}
          title="Edit filters"
          onClick={() => setIsFilterBuilderOpen(true)}
        />

        <div style={{ flex: 1 }} />

        <Text variant="medium" styles={{ root: { marginLeft: 8 } }}>
          {filteredQuotes.length} {filteredQuotes.length === 1 ? 'quote' : 'quotes'}
        </Text>
      </Stack>

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading quotes..." />
        </Stack>
      ) : (
        <>
          <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
            <DetailsList
              items={paginatedQuotes}
              columns={visibleColumns}
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

          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalRecords={filteredQuotes.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
      )}

      <Panel
        isOpen={isColumnPanelOpen}
        onDismiss={() => setIsColumnPanelOpen(false)}
        headerText="Column options"
        isFooterAtBottom={true}
      >
        <Stack tokens={{ childrenGap: 12 }} styles={{ root: { marginTop: 16 } }}>
          <Text variant="small">Select columns to display</Text>
          {allColumnDefinitions.map((col) => (
            <Checkbox
              key={col.key}
              label={col.name}
              checked={currentView.columnVisibility[col.key] !== false}
              onChange={(_, checked) => handleColumnVisibilityChange(col.key, !!checked)}
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
