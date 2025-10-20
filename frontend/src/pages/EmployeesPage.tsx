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
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  IconButton,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { employeeService } from '../services/millenniumServices';
import type { Employee } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { EmployeeForm } from '../components/EmployeeForm';
import { DeleteDialog } from '../components/DeleteDialog';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import * as XLSX from 'xlsx';

export const EmployeesPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    name: true,
    employeeNo: true,
    newCellNo: true,
    newEmailAddress: true,
    jobDescription: true,
    newActiveEmployee: true,
    newStartDate: false,
    idNo: false,
    hourlyRate: false,
  };

  const defaultColumnOrder = [
    'name', 'employeeNo', 'newCellNo', 'newEmailAddress', 'jobDescription',
    'newActiveEmployee', 'newStartDate', 'idNo', 'hourlyRate'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Employees',
    isDefault: true,
    entityType: 'employee',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('employees-views');
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
        const selected = selection.getSelection()[0] as Employee | undefined;
        setSelectedEmployee(selected);
      },
    })
  );

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [employees, searchText, currentView, sortColumn, isSortedDescending]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...employees];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((employee) =>
        Object.values(employee).some((value) =>
          String(value).toLowerCase().includes(search)
        )
      );
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((employee) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = employee[filter.field as keyof Employee];
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
        let aValue: any = a[sortColumn as keyof Employee];
        let bValue: any = b[sortColumn as keyof Employee];

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

    setFilteredEmployees(filtered);
  };

  const handleNew = () => {
    setSelectedEmployee(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedEmployee) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedEmployee) {
      setEmployeeToDelete(selectedEmployee);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (employeeToDelete) {
      try {
        await employeeService.delete(employeeToDelete.id);
        setIsDeleteDialogOpen(false);
        setEmployeeToDelete(undefined);
        await loadEmployees();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete employee');
      }
    }
  };

  const exportToExcel = (employeesToExport: Employee[]) => {
    const exportData = employeesToExport.map((employee) => ({
      'Name': employee.name || '',
      'Employee No': employee.employeeNo || '',
      'Cell No': employee.newCellNo || '',
      'Email': employee.newEmailAddress || '',
      'Job Description': employee.jobDescription || '',
      'Active': employee.newActiveEmployee ? 'Yes' : 'No',
      'Start Date': employee.newStartDate ? new Date(employee.newStartDate).toLocaleDateString() : '',
      'ID No': employee.idNo || '',
      'Hourly Rate': employee.hourlyRate || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, `Employees_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as Employee[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredEmployees);
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
    localStorage.setItem('employees-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('employees-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map(v => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('employees-views', JSON.stringify(updatedViews));
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
    { key: 'employeeNo', name: 'Employee No', type: 'text' as const },
    { key: 'newCellNo', name: 'Cell No', type: 'text' as const },
    { key: 'newEmailAddress', name: 'Email', type: 'text' as const },
    { key: 'jobDescription', name: 'Job Description', type: 'text' as const },
    { key: 'newActiveEmployee', name: 'Active', type: 'boolean' as const },
    { key: 'idNo', name: 'ID No', type: 'text' as const },
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
      key: 'employeeNo',
      name: 'Employee No',
      fieldName: 'employeeNo',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'employeeNo',
      isSortedDescending: sortColumn === 'employeeNo' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'newCellNo',
      name: 'Cell No',
      fieldName: 'newCellNo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'newCellNo',
      isSortedDescending: sortColumn === 'newCellNo' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'newEmailAddress',
      name: 'Email',
      fieldName: 'newEmailAddress',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'newEmailAddress',
      isSortedDescending: sortColumn === 'newEmailAddress' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'jobDescription',
      name: 'Job Description',
      fieldName: 'jobDescription',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'jobDescription',
      isSortedDescending: sortColumn === 'jobDescription' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'newActiveEmployee',
      name: 'Active',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
      isSorted: sortColumn === 'newActiveEmployee',
      isSortedDescending: sortColumn === 'newActiveEmployee' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Employee) => <Text>{item.newActiveEmployee ? 'Yes' : 'No'}</Text>,
    },
    {
      key: 'newStartDate',
      name: 'Start Date',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'newStartDate',
      isSortedDescending: sortColumn === 'newStartDate' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Employee) => <Text>{item.newStartDate ? new Date(item.newStartDate).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'idNo',
      name: 'ID No',
      fieldName: 'idNo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'idNo',
      isSortedDescending: sortColumn === 'idNo' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'hourlyRate',
      name: 'Hourly Rate',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'hourlyRate',
      isSortedDescending: sortColumn === 'hourlyRate' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: Employee) => <Text>{item.hourlyRate ? `R ${item.hourlyRate.toLocaleString()}` : '-'}</Text>,
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
      disabled: !selectedEmployee,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedEmployee,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadEmployees,
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
      onClick: () => document.getElementById('employees-import-input')?.click(),
    },
    {
      key: 'mergeDuplicates',
      text: 'Merge Duplicates',
      iconProps: { iconName: 'Merge' },
      onClick: () => navigate('/duplicates?entity=Employees'),
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
        <EmployeeForm
          employee={selectedEmployee}
          onDismiss={() => {
            setIsFormOpen(false);
            setSelectedEmployee(undefined);
          }}
          onSave={() => {
            loadEmployees();
            setIsFormOpen(false);
            setSelectedEmployee(undefined);
          }}
          onDelete={selectedEmployee ? () => handleDelete() : undefined}
        />
      </div>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Employees</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="employees-import-input"
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
          <Spinner size={SpinnerSize.large} label="Loading employees..." />
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <DetailsList
            items={filteredEmployees}
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
        title="Delete Employee"
        message={`Are you sure you want to delete ${employeeToDelete?.name || 'this employee'}?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </Stack>
  );
};
