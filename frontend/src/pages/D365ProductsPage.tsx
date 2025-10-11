import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { d365ProductService } from '../services/d365Services';
import type { D365Product } from '../types/millennium';

export const D365ProductsPage = () => {
  const [products, setProducts] = useState<D365Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'productNumber', name: 'Product Number', fieldName: 'productNumber', minWidth: 120, maxWidth: 150 },
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'price', name: 'Price', fieldName: 'price', minWidth: 100, maxWidth: 120 },
    { key: 'quantityOnHand', name: 'Quantity on Hand', fieldName: 'quantityOnHand', minWidth: 120, maxWidth: 150 },
    { key: 'vendorName', name: 'Vendor Name', fieldName: 'vendorName', minWidth: 120, maxWidth: 150 },
  ];

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365ProductService.getAll();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <EntityList
      title="D365 Products"
      items={products}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadProducts}
      searchPlaceholder="Search products..."
    />
  );
};
