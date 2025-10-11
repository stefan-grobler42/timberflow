import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { pricingCalculationService } from '../services/millenniumServices';
import type { PricingCalculation } from '../types/millennium';

export const PricingCalculationsPage = () => {
  const [calculations, setCalculations] = useState<PricingCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'productName', name: 'Product Name', fieldName: 'productName', minWidth: 150, maxWidth: 200 },
    { 
      key: 'unitPrice', 
      name: 'Unit Price', 
      fieldName: 'unitPrice', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: PricingCalculation) => item.unitPrice ? `R ${item.unitPrice.toLocaleString()}` : '-'
    },
    { 
      key: 'installedCost', 
      name: 'Installed Cost', 
      fieldName: 'installedCost', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: PricingCalculation) => item.installedCost ? `R ${item.installedCost.toLocaleString()}` : '-'
    },
    { 
      key: 'totalPrice', 
      name: 'Total Price', 
      fieldName: 'totalPrice', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: PricingCalculation) => item.totalPrice ? `R ${item.totalPrice.toLocaleString()}` : '-'
    },
    { 
      key: 'discount', 
      name: 'Discount', 
      fieldName: 'discount', 
      minWidth: 80, 
      maxWidth: 100,
      onRender: (item: PricingCalculation) => item.discount ? `${item.discount}%` : '-'
    },
  ];

  const loadCalculations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pricingCalculationService.getAll();
      setCalculations(data);
    } catch (err) {
      setError('Failed to load pricing calculations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalculations();
  }, []);

  return (
    <EntityList
      title="Pricing Calculations"
      items={calculations}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadCalculations}
      searchPlaceholder="Search pricing calculations..."
    />
  );
};
