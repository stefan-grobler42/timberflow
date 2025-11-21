/**
 * RelatedSubGrid Component - Example Usage
 * 
 * This file demonstrates how to use the RelatedSubGrid component
 * to display related records from different entities in the Order form.
 */

import { RelatedSubGrid } from './RelatedSubGrid';
import { productionService, installationProgressService, deliveryService } from '../services/millenniumServices';
import type { Production, InstallationProgress, Delivery } from '../types/millennium';
import type { IColumn } from '@fluentui/react';

// Example 1: Productions SubGrid
export function ProductionsSubGrid({ orderId }: { orderId: string }) {
  const columns: IColumn[] = [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'customer',
      name: 'Customer',
      fieldName: 'customer',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'productionPlannedDate',
      name: 'Planned Date',
      fieldName: 'productionPlannedDate',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: Production) => {
        return item.productionPlannedDate
          ? new Date(item.productionPlannedDate).toLocaleDateString()
          : '';
      },
    },
    {
      key: 'productionComplete',
      name: 'Complete',
      fieldName: 'productionComplete',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
      onRender: (item: Production) => (item.productionComplete ? 'Yes' : 'No'),
    },
  ];

  const fetchProductions = async (orderNo: string): Promise<Production[]> => {
    return await productionService.getByOrderNo(orderNo);
  };

  const handleRowClick = (item: Production) => {
    // Navigate to production detail page
    window.location.href = `/production/${item.id}`;
  };

  return (
    <RelatedSubGrid<Production>
      title="Productions"
      entityName="production"
      orderId={orderId}
      columns={columns}
      fetchData={fetchProductions}
      onRowClick={handleRowClick}
      emptyMessage="No productions found for this order"
    />
  );
}

// Example 2: Installation Progress SubGrid
export function InstallationSubGrid({ orderId, orderNumber }: { orderId: string; orderNumber?: string }) {
  const columns: IColumn[] = [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'newInstallationOrderNo',
      name: 'Order No',
      fieldName: 'newInstallationOrderNo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'newPercentageComplete',
      name: 'Progress %',
      fieldName: 'newPercentageComplete',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      onRender: (item: InstallationProgress) => {
        return item.newPercentageComplete
          ? `${item.newPercentageComplete}%`
          : '0%';
      },
    },
  ];

  const fetchInstallation = async (orderNo: string): Promise<InstallationProgress[]> => {
    // InstallationProgress uses orderNumber (string) not orderId (Guid)
    return await installationProgressService.getByOrderNo(orderNo);
  };

  const handleRowClick = (item: InstallationProgress) => {
    // Navigate to installation detail page
    window.location.href = `/installation/${item.id}`;
  };

  return (
    <RelatedSubGrid<InstallationProgress>
      title="Installation Progress"
      entityName="installation"
      orderId={orderNumber || orderId}
      columns={columns}
      fetchData={fetchInstallation}
      onRowClick={handleRowClick}
      emptyMessage="No installation records found for this order"
    />
  );
}

// Example 3: Deliveries/Dispatch SubGrid
export function DeliveriesSubGrid({ orderId }: { orderId: string }) {
  const columns: IColumn[] = [
    {
      key: 'deliveryNo',
      name: 'Delivery No',
      fieldName: 'deliveryNo',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
    },
    {
      key: 'loadingDate',
      name: 'Loading Date',
      fieldName: 'loadingDate',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      onRender: (item: Delivery) => {
        return item.loadingDate
          ? new Date(item.loadingDate).toLocaleDateString()
          : '';
      },
    },
    {
      key: 'driver',
      name: 'Driver',
      fieldName: 'driver',
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: 'partLoad',
      name: 'Part Load',
      fieldName: 'partLoad',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
      onRender: (item: Delivery) => (item.partLoad ? 'Yes' : 'No'),
    },
  ];

  const fetchDeliveries = async (orderNo: string): Promise<Delivery[]> => {
    return await deliveryService.getByOrderNo(orderNo);
  };

  const handleRowClick = (item: Delivery) => {
    // Navigate to delivery detail page
    window.location.href = `/delivery/${item.id}`;
  };

  return (
    <RelatedSubGrid<Delivery>
      title="Deliveries / Dispatch"
      entityName="delivery"
      orderId={orderId}
      columns={columns}
      fetchData={fetchDeliveries}
      onRowClick={handleRowClick}
      emptyMessage="No deliveries found for this order"
    />
  );
}

// Example 4: Usage in Order Form
export function OrderFormWithSubGrids({ orderId, orderNumber }: { orderId: string; orderNumber?: string }) {
  return (
    <div>
      {/* Tab 1: Productions */}
      <ProductionsSubGrid orderId={orderId} />

      {/* Tab 2: Installation */}
      <InstallationSubGrid orderId={orderId} orderNumber={orderNumber} />

      {/* Tab 3: Deliveries/Dispatch */}
      <DeliveriesSubGrid orderId={orderId} />
    </div>
  );
}
