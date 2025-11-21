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
import { d365QuoteService } from '../services/d365Services';
import type { D365Quote } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { D365QuoteForm } from '../components/D365QuoteForm';
import { DeleteDialog } from '../components/DeleteDialog';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import { Pagination } from '../components/Pagination';
import { usePagination } from '../hooks/usePagination';
import * as XLSX from 'xlsx';

export const D365QuotesPage = () => {
  const [quotes, setQuotes] = useState<D365Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<D365Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<D365Quote | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<D365Quote | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
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
    totalAmount: true,
    effectiveFrom: true,
    effectiveTo: true,
    description: false,
    totalDiscountAmount: false,
    totalLineItemAmount: false,
  };

  const defaultColumnOrder = [
    'quoteNumber', 'name', 'totalAmount', 'effectiveFrom', 'effectiveTo',
    'description', 'totalDiscountAmount', 'totalLineItemAmount'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Quotes',
    isDefault: true,
    entityType: 'd365quote',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('d365quotes-views');
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
    setSelectedQuote(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedQuote) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (quote: D365Quote) => {
    setSelectedQuote(quote);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedQuote) {
      setQuoteToDelete(selectedQuote);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (quoteToDelete) {
      try {
        await d365QuoteService.delete(quoteToDelete.id);
        setIsDeleteDialogOpen(false);
        setQuoteToDelete(undefined);
        await loadQuotes();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete quote');
      }
    }
  };

  const exportToExcel = (quotesToExport: D365Quote[]) => {
    const exportData = quotesToExport.map((quote) => ({
      'Quote Number': quote.quoteNumber || '',
      'Name': quote.name || '',
      'Total Amount': quote.totalAmount || 0,
      'Total Discount': quote.totalDiscountAmount || 0,
      'Total Line Items': quote.totalLineItemAmount || 0,
      'Effective From': quote.effectiveFrom || '',
      'Effective To': quote.effectiveTo || '',
      'Description': quote.description || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotes');
    XLSX.writeFile(wb, `D365_Quotes_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as D365Quote[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredQuotes);
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
    localStorage.setItem('d365quotes-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('d365quotes-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map(v => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('d365quotes-views', JSON.stringify(updatedViews));
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
    { key: 'quoteNumber', name: 'Quote Number', type: 'text' as const },
    { key: 'name', name: 'Name', type: 'text' as const },
    { key: 'totalAmount', name: 'Total Amount', type: 'number' as const },
    { key: 'effectiveFrom', name: 'Effective From', type: 'text' as const },
    { key: 'effectiveTo', name: 'Effective To', type: 'text' as const },
  ];

  const allColumns: IColumn[] = [
    {
      key: 'quoteNumber',
      name: 'Quote Number',
      fieldName: 'quoteNumber',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'quoteNumber',
      isSortedDescending: sortColumn === 'quoteNumber' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
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
      key: 'totalAmount',
      name: 'Total Amount',
      fieldName: 'totalAmount',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'totalAmount',
      isSortedDescending: sortColumn === 'totalAmount' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: D365Quote) => <Text>{item.totalAmount ? `R ${item.totalAmount.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'effectiveFrom',
      name: 'Effective From',
      fieldName: 'effectiveFrom',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'effectiveFrom',
      isSortedDescending: sortColumn === 'effectiveFrom' && isSortedDescending,
      onColumnClick: onColumnClick,
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
      isSortedDescending: sortColumn === 'effectiveTo' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: D365Quote) => <Text>{item.effectiveTo ? new Date(item.effectiveTo).toLocaleDateString() : '-'}</Text>,
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
      key: 'totalDiscountAmount',
      name: 'Total Discount',
      fieldName: 'totalDiscountAmount',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'totalDiscountAmount',
      isSortedDescending: sortColumn === 'totalDiscountAmount' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: D365Quote) => <Text>{item.totalDiscountAmount ? `R ${item.totalDiscountAmount.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'totalLineItemAmount',
      name: 'Total Line Items',
      fieldName: 'totalLineItemAmount',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'totalLineItemAmount',
      isSortedDescending: sortColumn === 'totalLineItemAmount' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: D365Quote) => <Text>{item.totalLineItemAmount ? `R ${item.totalLineItemAmount.toFixed(2)}` : '-'}</Text>,
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
      onClick: () => setIsExportDialogOpen(true),
    },
    {
      key: 'import',
      text: 'Import from Excel',
      iconProps: { iconName: 'ExcelLogoInverse' },
      onClick: () => document.getElementById('quotes-import-input')?.click(),
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
        <D365QuoteForm
          quote={selectedQuote}
          onDismiss={() => {
            setIsFormOpen(false);
            setSelectedQuote(undefined);
          }}
          onSave={() => {
            loadQuotes();
            setIsFormOpen(false);
            setSelectedQuote(undefined);
          }}
          onDelete={selectedQuote ? () => {
            setIsFormOpen(false);
            handleDelete();
          } : undefined}
        />
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">D365 Quotes</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="quotes-import-input"
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
          
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredQuotes.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </>
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
                Export All ({filteredQuotes.length} quotes)
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
                Export Selected ({selection.getSelectedCount()} quotes)
              </button>
            </Stack>
          </Stack>
        </Panel>
      )}

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Quote"
        message={`Are you sure you want to delete "${quoteToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </Stack>
  );
};
