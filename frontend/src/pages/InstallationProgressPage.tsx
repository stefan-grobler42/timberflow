import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { installationProgressService } from '../services/millenniumServices';
import type { InstallationProgress } from '../types/millennium';

export const InstallationProgressPage = () => {
  const [progress, setProgress] = useState<InstallationProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'name', name: 'Name', fieldName: 'name', minWidth: 150, maxWidth: 200 },
    { key: 'newInstallationOrderNo', name: 'Order No', fieldName: 'newInstallationOrderNo', minWidth: 120, maxWidth: 150 },
    { 
      key: 'newPercentageComplete', 
      name: 'Progress', 
      fieldName: 'newPercentageComplete', 
      minWidth: 100, 
      maxWidth: 120,
      onRender: (item: InstallationProgress) => item.newPercentageComplete ? `${item.newPercentageComplete}%` : '-'
    },
  ];

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await installationProgressService.getAll();
      setProgress(data);
    } catch (err) {
      setError('Failed to load installation progress');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, []);

  return (
    <EntityList
      title="Installation Progress"
      items={progress}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadProgress}
      searchPlaceholder="Search installation progress..."
    />
  );
};
