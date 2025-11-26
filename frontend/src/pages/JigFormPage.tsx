import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Spinner, SpinnerSize, Stack, Text } from '@fluentui/react';
import { JigForm } from '../components/JigForm';
import { jigService } from '../services/millenniumServices';
import type { Jig } from '../types/millennium';

export const JigFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [jig, setJig] = useState<Jig | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJig();
  }, [id]);

  const loadJig = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await jigService.getById(id);
      setJig(data);
    } catch (err) {
      console.error('Error loading jig:', err);
      setError('Failed to load jig record');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    await loadJig();
    navigate(-1);
  };

  const handleDismiss = () => {
    navigate(-1);
  };

  const handleDelete = async () => {
    if (id) {
      try {
        await jigService.delete(id);
        navigate(-1);
      } catch (err) {
        console.error('Error deleting jig:', err);
        setError('Failed to delete jig record');
      }
    }
  };

  if (loading) {
    return (
      <Stack verticalAlign="center" horizontalAlign="center" styles={{ root: { height: '100vh' } }}>
        <Spinner size={SpinnerSize.large} label="Loading jig..." />
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
    <JigForm
      jig={jig}
      onDismiss={handleDismiss}
      onSave={handleSave}
      onDelete={id ? handleDelete : undefined}
    />
  );
};
