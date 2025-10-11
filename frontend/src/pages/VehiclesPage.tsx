import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { vehicleService } from '../services/millenniumServices';
import type { Vehicle } from '../types/millennium';

export const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'registrationNumber', name: 'Registration', fieldName: 'registrationNumber', minWidth: 120, maxWidth: 150 },
    { key: 'yearModel', name: 'Year Model', fieldName: 'yearModel', minWidth: 100, maxWidth: 120 },
    { key: 'approvedDriver', name: 'Approved Driver', fieldName: 'approvedDriver', minWidth: 120, maxWidth: 150 },
    { 
      key: 'cofInOrder', 
      name: 'COF In Order', 
      fieldName: 'cofInOrder', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: Vehicle) => (item.cofInOrder ? 'Yes' : 'No')
    },
    { 
      key: 'licenseRenewalDate', 
      name: 'License Renewal', 
      fieldName: 'licenseRenewalDate', 
      minWidth: 120, 
      maxWidth: 150,
      onRender: (item: Vehicle) => item.licenseRenewalDate ? new Date(item.licenseRenewalDate).toLocaleDateString() : '-'
    },
  ];

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.getAll();
      setVehicles(data);
    } catch (err) {
      setError('Failed to load vehicles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  return (
    <EntityList
      title="Vehicles"
      items={vehicles}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadVehicles}
      searchPlaceholder="Search vehicles..."
    />
  );
};
