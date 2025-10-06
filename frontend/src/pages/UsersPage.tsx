import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  CommandBar,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';
import { userService } from '../services';
import type { User } from '../types';

export const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      onClick: () => console.log('New user'),
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
          selectionMode={SelectionMode.multiple}
          isHeaderVisible={true}
        />
      )}
    </Stack>
  );
};
