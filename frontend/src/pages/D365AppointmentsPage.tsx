import { useState, useEffect } from 'react';
import type { IColumn } from '@fluentui/react';
import { EntityList } from '../components/EntityList';
import { d365AppointmentService } from '../services/d365Services';
import type { D365Appointment } from '../types/millennium';

export const D365AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<D365Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns: IColumn[] = [
    { key: 'subject', name: 'Subject', fieldName: 'subject', minWidth: 150, maxWidth: 200 },
    { key: 'location', name: 'Location', fieldName: 'location', minWidth: 120, maxWidth: 150 },
    { 
      key: 'scheduledStart', 
      name: 'Scheduled Start', 
      fieldName: 'scheduledStart', 
      minWidth: 130, 
      maxWidth: 160,
      onRender: (item: D365Appointment) => item.scheduledStart ? new Date(item.scheduledStart).toLocaleDateString() : '-'
    },
    { 
      key: 'scheduledEnd', 
      name: 'Scheduled End', 
      fieldName: 'scheduledEnd', 
      minWidth: 130, 
      maxWidth: 160,
      onRender: (item: D365Appointment) => item.scheduledEnd ? new Date(item.scheduledEnd).toLocaleDateString() : '-'
    },
    { key: 'scheduledDurationMinutes', name: 'Duration (min)', fieldName: 'scheduledDurationMinutes', minWidth: 110, maxWidth: 130 },
  ];

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await d365AppointmentService.getAll();
      setAppointments(data);
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  return (
    <EntityList
      title="D365 Appointments"
      items={appointments}
      columns={columns}
      loading={loading}
      error={error}
      onRefresh={loadAppointments}
      searchPlaceholder="Search appointments..."
    />
  );
};
