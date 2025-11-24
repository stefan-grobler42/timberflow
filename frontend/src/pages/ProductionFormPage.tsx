import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner, SpinnerSize, Stack, Text } from '@fluentui/react';
import { D365ProductionForm } from '../components/D365ProductionForm';
import { productionService } from '../services/d365Services';
import type { Production } from '../types/millennium';

export const ProductionFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [production, setProduction] = useState<Production | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProduction();
  }, [id]);

  const loadProduction = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await productionService.getById(id);
      setProduction(data);
    } catch (err) {
      console.error('Error loading production:', err);
      setError('Failed to load production record');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await loadProduction();
    navigate('/production-planner');
  };

  const handleDismiss = () => {
    navigate('/production-planner');
  };

  const handleDelete = async () => {
    if (id) {
      try {
        await productionService.delete(id);
        navigate('/production-planner');
      } catch (err) {
        console.error('Error deleting production:', err);
        setError('Failed to delete production record');
      }
    }
  };

  if (loading) {
    return (
      <Stack verticalAlign="center" horizontalAlign="center" styles={{ root: { height: '100vh' } }}>
        <Spinner size={SpinnerSize.large} label="Loading production..." />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack styles={{ root: { padding: 20 } }}>
        <Text variant="large" styles={{ root: { color: '#a4262c' } }}>
          {error}
        </Text>
      </Stack>
    );
  }

  return (
    <D365ProductionForm
      production={production}
      onDismiss={handleDismiss}
      onSave={handleSave}
      onDelete={id ? handleDelete : undefined}
    />
  );
};
