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
import { d365ProductService } from '../services/d365Services';
import type { D365Product } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { D365ProductForm } from '../components/D365ProductForm';
import { DeleteDialog } from '../components/DeleteDialog';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import * as XLSX from 'xlsx';

export const D365ProductsPage = () => {
  const [products, setProducts] = useState<D365Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<D365Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<D365Product | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<D365Product | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    productNumber: true,
    name: true,
    price: true,
    quantityOnHand: true,
    vendorName: true,
    description: false,
    currentCost: false,
    standardCost: false,
    stockWeight: false,
    stockVolume: false,
  };

  const defaultColumnOrder = [
    'productNumber', 'name', 'price', 'quantityOnHand', 'vendorName',
    'description', 'currentCost', 'standardCost', 'stockWeight', 'stockVolume'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Products',
    isDefault: true,
    entityType: 'd365product',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('d365products-views');
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
        const selected = selection.getSelection()[0] as D365Product | undefined;
        setSelectedProduct(selected);
      },
    })
  );

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, searchText, currentView, sortColumn, isSortedDescending]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365ProductService.getAll();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((product) => {
        return Object.values(product).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((product) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = product[filter.field as keyof D365Product];
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
        let aValue: any = a[sortColumn as keyof D365Product];
        let bValue: any = b[sortColumn as keyof D365Product];

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

    setFilteredProducts(filtered);
  };

  const handleNew = () => {
    setSelectedProduct(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedProduct) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (product: D365Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedProduct) {
      setProductToDelete(selectedProduct);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      try {
        await d365ProductService.delete(productToDelete.id);
        setIsDeleteDialogOpen(false);
        setProductToDelete(undefined);
        await loadProducts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete product');
      }
    }
  };

  const exportToExcel = (productsToExport: D365Product[]) => {
    const exportData = productsToExport.map((product) => ({
      'Product Number': product.productNumber || '',
      'Name': product.name || '',
      'Description': product.description || '',
      'Price': product.price || 0,
      'Quantity On Hand': product.quantityOnHand || 0,
      'Current Cost': product.currentCost || 0,
      'Standard Cost': product.standardCost || 0,
      'Stock Weight': product.stockWeight || 0,
      'Stock Volume': product.stockVolume || 0,
      'Vendor Name': product.vendorName || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, `D365_Products_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as D365Product[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredProducts);
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
    localStorage.setItem('d365products-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('d365products-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map(v => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('d365products-views', JSON.stringify(updatedViews));
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
    { key: 'productNumber', name: 'Product Number', type: 'text' as const },
    { key: 'name', name: 'Name', type: 'text' as const },
    { key: 'description', name: 'Description', type: 'text' as const },
    { key: 'price', name: 'Price', type: 'number' as const },
    { key: 'quantityOnHand', name: 'Quantity On Hand', type: 'number' as const },
    { key: 'vendorName', name: 'Vendor Name', type: 'text' as const },
  ];

  const allColumns: IColumn[] = [
    {
      key: 'productNumber',
      name: 'Product Number',
      fieldName: 'productNumber',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'productNumber',
      isSortedDescending: sortColumn === 'productNumber' && isSortedDescending,
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
      key: 'price',
      name: 'Price',
      fieldName: 'price',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'price',
      isSortedDescending: sortColumn === 'price' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: D365Product) => <Text>{item.price ? `$${item.price.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'quantityOnHand',
      name: 'Quantity On Hand',
      fieldName: 'quantityOnHand',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'quantityOnHand',
      isSortedDescending: sortColumn === 'quantityOnHand' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'vendorName',
      name: 'Vendor Name',
      fieldName: 'vendorName',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'vendorName',
      isSortedDescending: sortColumn === 'vendorName' && isSortedDescending,
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
      key: 'currentCost',
      name: 'Current Cost',
      fieldName: 'currentCost',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'currentCost',
      isSortedDescending: sortColumn === 'currentCost' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: D365Product) => <Text>{item.currentCost ? `$${item.currentCost.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'standardCost',
      name: 'Standard Cost',
      fieldName: 'standardCost',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'standardCost',
      isSortedDescending: sortColumn === 'standardCost' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: D365Product) => <Text>{item.standardCost ? `$${item.standardCost.toFixed(2)}` : '-'}</Text>,
    },
    {
      key: 'stockWeight',
      name: 'Stock Weight',
      fieldName: 'stockWeight',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'stockWeight',
      isSortedDescending: sortColumn === 'stockWeight' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'stockVolume',
      name: 'Stock Volume',
      fieldName: 'stockVolume',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'stockVolume',
      isSortedDescending: sortColumn === 'stockVolume' && isSortedDescending,
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
      disabled: !selectedProduct,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedProduct,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadProducts,
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
      onClick: () => document.getElementById('products-import-input')?.click(),
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
        <D365ProductForm
          product={selectedProduct}
          onDismiss={() => {
            setIsFormOpen(false);
            setSelectedProduct(undefined);
          }}
          onSave={() => {
            loadProducts();
            setIsFormOpen(false);
            setSelectedProduct(undefined);
          }}
          onDelete={selectedProduct ? () => {
            setIsFormOpen(false);
            handleDelete();
          } : undefined}
        />
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">D365 Products</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="products-import-input"
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
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
        </Text>
      </Stack>

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading products..." />
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <DetailsList
            items={filteredProducts}
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
                Export All ({filteredProducts.length} products)
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
                Export Selected ({selection.getSelectedCount()} products)
              </button>
            </Stack>
          </Stack>
        </Panel>
      )}

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Product"
        message={`Are you sure you want to delete "${productToDelete?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </Stack>
  );
};
