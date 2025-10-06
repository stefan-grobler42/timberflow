import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  CommandBar,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  SearchBox,
  Panel,
  Checkbox,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { userService } from '../services';
import type { User } from '../types';
import { UserFormFullScreen } from '../components/UserFormFullScreen';
import { DeleteDialog } from '../components/DeleteDialog';
import * as XLSX from 'xlsx';

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | undefined>();
  const [searchText, setSearchText] = useState('');
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});
  const [isColumnPanelOpen, setIsColumnPanelOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<{ [key: string]: boolean }>({
    userCode: true,
    firstName: true,
    lastName: true,
    email: true,
    department: true,
    position: true,
    role: true,
    isActive: true,
  });

  const [selection] = useState(
    new Selection({
      onSelectionChanged: () => {
        const selected = selection.getSelection()[0] as User | undefined;
        setSelectedUser(selected);
      },
    })
  );

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchText, columnFilters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((user) => {
        return Object.values(user).some((value) =>
          String(value).toLowerCase().includes(search)
        );
      });
    }

    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter((user) => {
          const fieldValue = user[key as keyof User];
          return String(fieldValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    setFilteredUsers(filtered);
  };

  const handleNew = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedUser) {
      setIsFormOpen(true);
    }
  };

  const handleRowDoubleClick = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    if (selectedUser) {
      setUserToDelete(selectedUser);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (userToDelete) {
      try {
        await userService.delete(userToDelete.id);
        setIsDeleteDialogOpen(false);
        setUserToDelete(undefined);
        await loadUsers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete user');
      }
    }
  };

  const handleExport = () => {
    const exportData = filteredUsers.map((user) => ({
      'User Code': user.userCode,
      'First Name': user.firstName,
      'Last Name': user.lastName,
      'Email': user.email,
      'Phone': user.phone || '',
      'Department': user.department || '',
      'Position': user.position || '',
      'Role': user.role,
      'Hire Date': user.hireDate || '',
      'Address': user.address || '',
      'Emergency Contact': user.emergencyContact || '',
      'Emergency Phone': user.emergencyPhone || '',
      'Active': user.isActive ? 'Yes' : 'No',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');
    XLSX.writeFile(wb, `Users_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const handleColumnFilterChange = (columnKey: string, value: string) => {
    setColumnFilters({ ...columnFilters, [columnKey]: value });
  };

  const allColumns: IColumn[] = [
    {
      key: 'userCode',
      name: 'User Code',
      fieldName: 'userCode',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
      isFiltered: !!columnFilters['userCode'],
      onRenderHeader: () => (
        <Stack>
          <Text>User Code</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['userCode'] || ''}
            onChange={(_, value) => handleColumnFilterChange('userCode', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'firstName',
      name: 'First Name',
      fieldName: 'firstName',
      minWidth: 120,
      maxWidth: 200,
      isResizable: true,
      isFiltered: !!columnFilters['firstName'],
      onRenderHeader: () => (
        <Stack>
          <Text>First Name</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['firstName'] || ''}
            onChange={(_, value) => handleColumnFilterChange('firstName', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'lastName',
      name: 'Last Name',
      fieldName: 'lastName',
      minWidth: 120,
      maxWidth: 200,
      isResizable: true,
      isFiltered: !!columnFilters['lastName'],
      onRenderHeader: () => (
        <Stack>
          <Text>Last Name</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['lastName'] || ''}
            onChange={(_, value) => handleColumnFilterChange('lastName', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'email',
      name: 'Email',
      fieldName: 'email',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
      isFiltered: !!columnFilters['email'],
      onRenderHeader: () => (
        <Stack>
          <Text>Email</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['email'] || ''}
            onChange={(_, value) => handleColumnFilterChange('email', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'department',
      name: 'Department',
      fieldName: 'department',
      minWidth: 120,
      maxWidth: 180,
      isResizable: true,
      isFiltered: !!columnFilters['department'],
      onRenderHeader: () => (
        <Stack>
          <Text>Department</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['department'] || ''}
            onChange={(_, value) => handleColumnFilterChange('department', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'position',
      name: 'Position',
      fieldName: 'position',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      isFiltered: !!columnFilters['position'],
      onRenderHeader: () => (
        <Stack>
          <Text>Position</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['position'] || ''}
            onChange={(_, value) => handleColumnFilterChange('position', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'role',
      name: 'Role',
      fieldName: 'role',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
      isFiltered: !!columnFilters['role'],
      onRenderHeader: () => (
        <Stack>
          <Text>Role</Text>
          <SearchBox
            placeholder="Filter..."
            value={columnFilters['role'] || ''}
            onChange={(_, value) => handleColumnFilterChange('role', value || '')}
            styles={{ root: { width: '100%', marginTop: 4 } }}
          />
        </Stack>
      ),
    },
    {
      key: 'isActive',
      name: 'Active',
      fieldName: 'isActive',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
      onRender: (item: User) => <Text>{item.isActive ? 'Yes' : 'No'}</Text>,
    },
  ];

  const columns = allColumns.filter((col) => visibleColumns[col.key]);

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
      disabled: !selectedUser,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedUser,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadUsers,
    },
    {
      key: 'export',
      text: 'Export to Excel',
      iconProps: { iconName: 'ExcelDocument' },
      onClick: handleExport,
    },
    {
      key: 'import',
      text: 'Import from Excel',
      iconProps: { iconName: 'ExcelLogoInverse' },
      onClick: () => document.getElementById('users-import-input')?.click(),
    },
    {
      key: 'columns',
      text: 'Columns',
      iconProps: { iconName: 'ColumnOptions' },
      onClick: () => setIsColumnPanelOpen(true),
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
      <UserFormFullScreen
        user={selectedUser}
        onDismiss={() => {
          setIsFormOpen(false);
          setSelectedUser(undefined);
        }}
        onSave={() => {
          loadUsers();
          setIsFormOpen(false);
          setSelectedUser(undefined);
        }}
      />
    );
  }

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Users</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <input
        id="users-import-input"
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

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading users..." />
        </Stack>
      ) : (
        <DetailsList
          items={filteredUsers}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selection={selection}
          selectionPreservedOnEmptyClick={true}
          isHeaderVisible={true}
          onItemInvoked={handleRowDoubleClick}
        />
      )}

      <Panel
        isOpen={isColumnPanelOpen}
        onDismiss={() => setIsColumnPanelOpen(false)}
        headerText="Show/Hide Columns"
      >
        <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 16 } }}>
          {allColumns.map((col) => (
            <Checkbox
              key={col.key}
              label={col.name}
              checked={visibleColumns[col.key]}
              onChange={(_, checked) =>
                setVisibleColumns({ ...visibleColumns, [col.key]: checked || false })
              }
            />
          ))}
        </Stack>
      </Panel>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete User"
        message={`Are you sure you want to delete ${userToDelete?.firstName} ${userToDelete?.lastName}?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </Stack>
  );
};
