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
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { userService } from '../services';
import type { User } from '../types';
import { UserForm } from '../components/UserForm';
import { DeleteDialog } from '../components/DeleteDialog';

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | undefined>();

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

  const handleNew = () => {
    setSelectedUser(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedUser) {
      setIsFormOpen(true);
    }
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

  const columns: IColumn[] = [
    {
      key: 'userCode',
      name: 'User Code',
      fieldName: 'userCode',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'firstName',
      name: 'First Name',
      fieldName: 'firstName',
      minWidth: 120,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'lastName',
      name: 'Last Name',
      fieldName: 'lastName',
      minWidth: 120,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'email',
      name: 'Email',
      fieldName: 'email',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'department',
      name: 'Department',
      fieldName: 'department',
      minWidth: 120,
      maxWidth: 180,
      isResizable: true,
    },
    {
      key: 'position',
      name: 'Position',
      fieldName: 'position',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'role',
      name: 'Role',
      fieldName: 'role',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
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
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Users</Text>

      <CommandBar items={commandBarItems} />

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
          items={users}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selection={selection}
          selectionPreservedOnEmptyClick={true}
          isHeaderVisible={true}
        />
      )}

      <UserForm
        isOpen={isFormOpen}
        user={selectedUser}
        onDismiss={() => setIsFormOpen(false)}
        onSave={loadUsers}
      />

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
