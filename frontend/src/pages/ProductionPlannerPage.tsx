import { useState, useEffect, useMemo } from 'react';
import { 
  Stack, Text, CommandBar, IconButton, Spinner, MessageBar, MessageBarType
} from '@fluentui/react';
import type { ICommandBarItemProps } from '@fluentui/react';
import { productionService } from '../services/d365Services';
import { ProductionForm } from '../components/ProductionForm';
import type { Production } from '../types/millennium';

export const ProductionPlannerPage = () => {
  const [loading, setLoading] = useState(false); // Start as NOT loading
  const [jobs, setJobs] = useState<any[]>([]);
  
  console.log('ProductionPlannerPage rendering, loading:', loading, 'jobs:', jobs.length);

  return (
    <Stack styles={{ root: { height: '100%', padding: 20 } }}>
      <Text variant="xxLarge" styles={{ root: { marginBottom: 20 } }}>
        Production Planner - Test
      </Text>
      
      <Text>Loading state: {loading ? 'Loading...' : 'Ready'}</Text>
      <Text>Jobs loaded: {jobs.length}</Text>
      
      <button onClick={async () => {
        console.log('Loading jobs...');
        setLoading(true);
        try {
          const data = await productionService.getAll();
          console.log('Loaded jobs:', data.length);
          setJobs(data);
        } catch (err) {
          console.error('Error:', err);
        } finally {
          setLoading(false);
        }
      }}>
        Load Jobs Manually
      </button>
    </Stack>
  );
};
