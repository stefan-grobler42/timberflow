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
import { d365AppointmentService } from '../services/d365Services';
import type { D365Appointment } from '../types/millennium';
import type { GridView, GridFilter } from '../types/gridView';
import { D365AppointmentForm } from '../components/D365AppointmentForm';
import { DeleteDialog } from '../components/DeleteDialog';
import { ViewManager } from '../components/ViewManager';
import { FilterBuilder } from '../components/FilterBuilder';
import * as XLSX from 'xlsx';

export const D365AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<D365Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<D365Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<D365Appointment | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<D365Appointment | undefined>();
  const [searchText, setSearchText] = useState('');
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);
  
  const defaultVisibleColumns: { [key: string]: boolean } = {
    subject: true,
    location: true,
    scheduledStart: true,
    scheduledEnd: true,
    scheduledDurationMinutes: true,
    description: false,
    actualDurationMinutes: false,
  };

  const defaultColumnOrder = [
    'subject', 'location', 'scheduledStart', 'scheduledEnd', 'scheduledDurationMinutes',
    'description', 'actualDurationMinutes'
  ];

  const defaultView: GridView = {
    id: 'default-view',
    name: 'All Appointments',
    isDefault: true,
    entityType: 'd365appointment',
    columnVisibility: defaultVisibleColumns,
    columnOrder: defaultColumnOrder,
    filters: [],
  };

  const loadViews = (): GridView[] => {
    try {
      const saved = localStorage.getItem('d365appointments-views');
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
        const selected = selection.getSelection()[0] as D365Appointment | undefined;
        setSelectedAppointment(selected);
      },
    })
  );

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [appointments, searchText, currentView, sortColumn, isSortedDescending]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365AppointmentService.getAll();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...appointments];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((appointment) => {
        return Object.values(appointment).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    if (currentView.filters && currentView.filters.length > 0) {
      filtered = filtered.filter((appointment) => {
        let result = true;
        let currentLogic: 'AND' | 'OR' = 'AND';

        for (let i = 0; i < currentView.filters.length; i++) {
          const filter = currentView.filters[i];
          const fieldValue = appointment[filter.field as keyof D365Appointment];
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
        let aValue: any = a[sortColumn as keyof D365Appointment];
        let bValue: any = b[sortColumn as keyof D365Appointment];

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

    setFilteredAppointments(filtered);
  };

  const handleNew = () => {
    setSelectedAppointment(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedAppointment) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (appointment: D365Appointment) => {
    setSelectedAppointment(appointment);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedAppointment) {
      setAppointmentToDelete(selectedAppointment);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (appointmentToDelete) {
      try {
        await d365AppointmentService.delete(appointmentToDelete.id);
        setIsDeleteDialogOpen(false);
        setAppointmentToDelete(undefined);
        await loadAppointments();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete appointment');
      }
    }
  };

  const exportToExcel = (appointmentsToExport: D365Appointment[]) => {
    const exportData = appointmentsToExport.map((appointment) => ({
      'Subject': appointment.subject || '',
      'Location': appointment.location || '',
      'Scheduled Start': appointment.scheduledStart || '',
      'Scheduled End': appointment.scheduledEnd || '',
      'Scheduled Duration (min)': appointment.scheduledDurationMinutes || 0,
      'Actual Duration (min)': appointment.actualDurationMinutes || 0,
      'Description': appointment.description || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Appointments');
    XLSX.writeFile(wb, `D365_Appointments_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as D365Appointment[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredAppointments);
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
    localStorage.setItem('d365appointments-views', JSON.stringify(updatedViews));
  };

  const handleDeleteView = (viewId: string) => {
    const updatedViews = views.filter(v => v.id !== viewId);
    setViews(updatedViews);
    localStorage.setItem('d365appointments-views', JSON.stringify(updatedViews));
  };

  const handleSetDefaultView = (viewId: string) => {
    const updatedViews = views.map(v => ({
      ...v,
      isDefault: v.id === viewId,
    }));
    setViews(updatedViews);
    localStorage.setItem('d365appointments-views', JSON.stringify(updatedViews));
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
    { key: 'subject', name: 'Subject', type: 'text' as const },
    { key: 'location', name: 'Location', type: 'text' as const },
    { key: 'scheduledStart', name: 'Scheduled Start', type: 'text' as const },
    { key: 'scheduledDurationMinutes', name: 'Duration (min)', type: 'number' as const },
  ];

  const allColumns: IColumn[] = [
    {
      key: 'subject',
      name: 'Subject',
      fieldName: 'subject',
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
      isSorted: sortColumn === 'subject',
      isSortedDescending: sortColumn === 'subject' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'location',
      name: 'Location',
      fieldName: 'location',
      minWidth: 120,
      maxWidth: 200,
      isResizable: true,
      isSorted: sortColumn === 'location',
      isSortedDescending: sortColumn === 'location' && isSortedDescending,
      onColumnClick: onColumnClick,
    },
    {
      key: 'scheduledStart',
      name: 'Scheduled Start',
      fieldName: 'scheduledStart',
      minWidth: 130,
      maxWidth: 160,
      isResizable: true,
      isSorted: sortColumn === 'scheduledStart',
      isSortedDescending: sortColumn === 'scheduledStart' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: D365Appointment) => <Text>{item.scheduledStart ? new Date(item.scheduledStart).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'scheduledEnd',
      name: 'Scheduled End',
      fieldName: 'scheduledEnd',
      minWidth: 130,
      maxWidth: 160,
      isResizable: true,
      isSorted: sortColumn === 'scheduledEnd',
      isSortedDescending: sortColumn === 'scheduledEnd' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: D365Appointment) => <Text>{item.scheduledEnd ? new Date(item.scheduledEnd).toLocaleDateString() : '-'}</Text>,
    },
    {
      key: 'scheduledDurationMinutes',
      name: 'Duration (min)',
      fieldName: 'scheduledDurationMinutes',
      minWidth: 110,
      maxWidth: 130,
      isResizable: true,
      isSorted: sortColumn === 'scheduledDurationMinutes',
      isSortedDescending: sortColumn === 'scheduledDurationMinutes' && isSortedDescending,
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
      key: 'actualDurationMinutes',
      name: 'Actual Duration (min)',
      fieldName: 'actualDurationMinutes',
      minWidth: 130,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'actualDurationMinutes',
      isSortedDescending: sortColumn === 'actualDurationMinutes' && isSortedDescending,
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
      disabled: !selectedAppointment,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedAppointment,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadAppointments,
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
      onClick: () => document.getElementById('appointments-import-input')?.click(),
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
        <D365AppointmentForm
          appointment={selectedAppointment}
          onDismiss={() => {
            setIsFormOpen(false);
            setSelectedAppointment(undefined);
          }}
          onSave={() => {
            loadAppointments();
            setIsFormOpen(false);
            setSelectedAppointment(undefined);
          }}
          onDelete={selectedAppointment ? () => {
            setIsFormOpen(false);
            handleDelete();
          } : undefined}
        />
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">D365 Appointments</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="appointments-import-input"
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
          {filteredAppointments.length} {filteredAppointments.length === 1 ? 'appointment' : 'appointments'}
        </Text>
      </Stack>

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading appointments..." />
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <DetailsList
            items={filteredAppointments}
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
                Export All ({filteredAppointments.length} appointments)
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
                Export Selected ({selection.getSelectedCount()} appointments)
              </button>
            </Stack>
          </Stack>
        </Panel>
      )}

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Appointment"
        message={`Are you sure you want to delete "${appointmentToDelete?.subject}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </Stack>
  );
};
