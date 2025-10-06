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
import { customerService } from '../services';
import type { Customer } from '../types';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const columns: IColumn[] = [
    {
      key: 'accountNo',
      name: 'Account No',
      fieldName: 'accountNo',
      minWidth: 100,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'accountName',
      name: 'Account Name',
      fieldName: 'accountName',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
    {
      key: 'companyType',
      name: 'Company Type',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      onRender: (item: Customer) => <Text>{item.companyType?.name || '-'}</Text>,
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
      key: 'phone',
      name: 'Phone',
      fieldName: 'phone',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'city',
      name: 'City',
      fieldName: 'city',
      minWidth: 120,
      maxWidth: 180,
      isResizable: true,
    },
    {
      key: 'customerStatus',
      name: 'Status',
      fieldName: 'customerStatus',
      minWidth: 120,
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
      onRender: (item: Customer) => <Text>{item.isActive ? 'Yes' : 'No'}</Text>,
    },
  ];

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'new',
      text: 'New',
      iconProps: { iconName: 'Add' },
      onClick: () => console.log('New customer'),
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadCustomers,
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Customers</Text>

      <CommandBar items={commandBarItems} />

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading customers..." />
        </Stack>
      ) : (
        <DetailsList
          items={customers}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.multiple}
          isHeaderVisible={true}
        />
      )}
    </Stack>
  );
};
