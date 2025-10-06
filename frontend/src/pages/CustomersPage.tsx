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
import { customerService } from '../services';
import type { Customer } from '../types';
import { CustomerForm } from '../components/CustomerForm';
import { DeleteDialog } from '../components/DeleteDialog';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | undefined>();

  const [selection] = useState(
    new Selection({
      onSelectionChanged: () => {
        const selected = selection.getSelection()[0] as Customer | undefined;
        setSelectedCustomer(selected);
      },
    })
  );

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

  const handleNew = () => {
    setSelectedCustomer(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = () => {
    if (selectedCustomer) {
      setIsFormOpen(true);
    }
  };

  const handleDelete = () => {
    if (selectedCustomer) {
      setCustomerToDelete(selectedCustomer);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (customerToDelete) {
      try {
        await customerService.delete(customerToDelete.id);
        setIsDeleteDialogOpen(false);
        setCustomerToDelete(undefined);
        await loadCustomers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete customer');
      }
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
      onClick: handleNew,
    },
    {
      key: 'edit',
      text: 'Edit',
      iconProps: { iconName: 'Edit' },
      disabled: !selectedCustomer,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedCustomer,
      onClick: handleDelete,
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
          selection={selection}
          selectionPreservedOnEmptyClick={true}
          isHeaderVisible={true}
        />
      )}

      <CustomerForm
        isOpen={isFormOpen}
        customer={selectedCustomer}
        onDismiss={() => setIsFormOpen(false)}
        onSave={loadCustomers}
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customerToDelete?.accountName}?`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </Stack>
  );
};
