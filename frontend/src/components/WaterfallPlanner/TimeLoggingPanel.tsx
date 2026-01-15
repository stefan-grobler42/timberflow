import React, { useState, useEffect, useCallback } from 'react';
import {
  Panel,
  PanelType,
  Stack,
  Text,
  TextField,
  SpinButton,
  PrimaryButton,
  DefaultButton,
  Dropdown,
  MessageBar,
  MessageBarType,
  Spinner,
  Separator
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import { jobWorkLogService } from '../../services/jobWorkLogService';
import type { JobWorkLogDto, CreateJobWorkLogDto, UpdateJobWorkLogDto } from '../../services/jobWorkLogService';
import type { JobAllocationDto } from '../../services/jobAllocationService';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../services/employeeService';

interface TimeLoggingPanelProps {
  isOpen: boolean;
  onDismiss: () => void;
  allocation: JobAllocationDto | null;
  workDate: string;
  onSaved?: () => void;
}

const formatTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const generateTimeOptions = (): IDropdownOption[] => {
  const options: IDropdownOption[] = [];
  for (let h = 5; h <= 21; h++) {
    for (let m = 0; m < 60; m += 15) {
      const minutes = h * 60 + m;
      options.push({
        key: minutes.toString(),
        text: formatTime(minutes)
      });
    }
  }
  return options;
};

export const TimeLoggingPanel: React.FC<TimeLoggingPanelProps> = ({
  isOpen,
  onDismiss,
  allocation,
  workDate,
  onSaved
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingLog, setExistingLog] = useState<JobWorkLogDto | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [actualStartMinutes, setActualStartMinutes] = useState<number | undefined>(undefined);
  const [actualEndMinutes, setActualEndMinutes] = useState<number | undefined>(undefined);
  const [efinksCompleted, setEfinksCompleted] = useState<number | undefined>(undefined);
  const [leaderId, setLeaderId] = useState<string | undefined>(undefined);
  const [helper1Id, setHelper1Id] = useState<string | undefined>(undefined);
  const [helper2Id, setHelper2Id] = useState<string | undefined>(undefined);
  const [helper3Id, setHelper3Id] = useState<string | undefined>(undefined);
  const [helper4Id, setHelper4Id] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');

  const timeOptions = generateTimeOptions();

  const loadData = useCallback(async () => {
    if (!allocation || !isOpen) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [logs, emps] = await Promise.all([
        jobWorkLogService.getByAllocation(allocation.id),
        employeeService.getAll()
      ]);
      
      setEmployees(emps);
      
      const logForDate = logs.find((l: JobWorkLogDto) => l.workDate.startsWith(workDate));
      
      if (logForDate) {
        setExistingLog(logForDate);
        setActualStartMinutes(logForDate.actualStartMinutes);
        setActualEndMinutes(logForDate.actualEndMinutes);
        setEfinksCompleted(logForDate.efinksCompleted);
        setLeaderId(logForDate.leaderId);
        setHelper1Id(logForDate.helper1Id);
        setHelper2Id(logForDate.helper2Id);
        setHelper3Id(logForDate.helper3Id);
        setHelper4Id(logForDate.helper4Id);
        setNotes(logForDate.notes || '');
      } else {
        setExistingLog(null);
        setActualStartMinutes(allocation.spanStartMinutes);
        const duration = allocation.estimatedDurationMinutes || 60;
        setActualEndMinutes((allocation.spanStartMinutes || 420) + duration);
        setEfinksCompleted(undefined);
        setLeaderId(undefined);
        setHelper1Id(undefined);
        setHelper2Id(undefined);
        setHelper3Id(undefined);
        setHelper4Id(undefined);
        setNotes('');
      }
    } catch (err) {
      console.error('Failed to load work log data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [allocation, workDate, isOpen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!allocation) return;
    
    setSaving(true);
    setError(null);
    
    try {
      const actualDuration = actualStartMinutes !== undefined && actualEndMinutes !== undefined
        ? actualEndMinutes - actualStartMinutes
        : undefined;
      
      if (existingLog) {
        const updateDto: UpdateJobWorkLogDto = {
          actualStartMinutes,
          actualEndMinutes,
          actualDurationMinutes: actualDuration,
          efinksCompleted,
          leaderId,
          helper1Id,
          helper2Id,
          helper3Id,
          helper4Id,
          notes
        };
        await jobWorkLogService.update(existingLog.id, updateDto);
      } else {
        const createDto: CreateJobWorkLogDto = {
          allocationId: allocation.id,
          workDate,
          plannedStartMinutes: allocation.spanStartMinutes || 420,
          plannedEndMinutes: (allocation.spanStartMinutes || 420) + (allocation.estimatedDurationMinutes || 60),
          plannedDurationMinutes: allocation.estimatedDurationMinutes || 60,
          breakAdjustmentMinutes: 0,
          actualStartMinutes,
          actualEndMinutes,
          actualDurationMinutes: actualDuration,
          efinksCompleted,
          leaderId,
          helper1Id,
          helper2Id,
          helper3Id,
          helper4Id,
          notes
        };
        await jobWorkLogService.create(createDto);
      }
      
      onSaved?.();
      onDismiss();
    } catch (err) {
      console.error('Failed to save work log:', err);
      setError('Failed to save work log');
    } finally {
      setSaving(false);
    }
  };

  const employeeOptions: IDropdownOption[] = [
    { key: '', text: 'Select employee...' },
    ...employees.map(e => ({
      key: e.id,
      text: e.fullName || `${e.firstName} ${e.lastName}`
    }))
  ];

  const renderFooter = () => (
    <Stack horizontal tokens={{ childrenGap: 8 }}>
      <PrimaryButton text="Save" onClick={handleSave} disabled={saving} />
      <DefaultButton text="Cancel" onClick={onDismiss} disabled={saving} />
    </Stack>
  );

  if (!allocation) return null;

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      headerText={`Log Time: ${allocation.orderNumber}`}
      type={PanelType.medium}
      onRenderFooterContent={renderFooter}
      isFooterAtBottom
    >
      {loading ? (
        <Stack horizontalAlign="center" styles={{ root: { padding: 40 } }}>
          <Spinner label="Loading..." />
        </Stack>
      ) : (
        <Stack tokens={{ childrenGap: 16 }} styles={{ root: { padding: '16px 0' } }}>
          {error && (
            <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
              {error}
            </MessageBar>
          )}

          <Stack styles={{ root: { padding: 12, backgroundColor: '#f3f2f1', borderRadius: 4 } }}>
            <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
              {allocation.customerName}
            </Text>
            <Text variant="small" styles={{ root: { color: '#666' } }}>
              {allocation.productionName || allocation.siteAddress}
            </Text>
            <Text variant="small" styles={{ root: { color: '#666' } }}>
              Date: {workDate}
            </Text>
            <Text variant="small" styles={{ root: { color: '#666', marginTop: 4 } }}>
              Estimated: {allocation.estimatedEfinks} E-Finks
            </Text>
          </Stack>

          <Separator>Time Worked</Separator>

          <Stack horizontal tokens={{ childrenGap: 16 }}>
            <Dropdown
              label="Start Time"
              selectedKey={actualStartMinutes?.toString() || ''}
              options={timeOptions}
              onChange={(_, option) => setActualStartMinutes(option ? parseInt(option.key as string) : undefined)}
              styles={{ root: { width: 120 } }}
            />
            <Dropdown
              label="End Time"
              selectedKey={actualEndMinutes?.toString() || ''}
              options={timeOptions}
              onChange={(_, option) => setActualEndMinutes(option ? parseInt(option.key as string) : undefined)}
              styles={{ root: { width: 120 } }}
            />
            <Stack styles={{ root: { paddingTop: 29 } }}>
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                Duration: {actualStartMinutes !== undefined && actualEndMinutes !== undefined
                  ? `${Math.floor((actualEndMinutes - actualStartMinutes) / 60)}h ${(actualEndMinutes - actualStartMinutes) % 60}m`
                  : '-'}
              </Text>
            </Stack>
          </Stack>

          <SpinButton
            label="E-Finks Completed"
            value={efinksCompleted?.toString() || ''}
            onChange={(_, value) => setEfinksCompleted(value ? parseFloat(value) : undefined)}
            min={0}
            max={1000}
            step={0.5}
            incrementButtonAriaLabel="Increase"
            decrementButtonAriaLabel="Decrease"
            styles={{ root: { width: 200 } }}
          />

          <Separator>Staff Assigned</Separator>

          <Dropdown
            label="Team Leader"
            selectedKey={leaderId || ''}
            options={employeeOptions}
            onChange={(_, option) => setLeaderId(option?.key === '' ? undefined : option?.key as string)}
          />

          <Stack horizontal tokens={{ childrenGap: 16 }}>
            <Dropdown
              label="Helper 1"
              selectedKey={helper1Id || ''}
              options={employeeOptions}
              onChange={(_, option) => setHelper1Id(option?.key === '' ? undefined : option?.key as string)}
              styles={{ root: { flex: 1 } }}
            />
            <Dropdown
              label="Helper 2"
              selectedKey={helper2Id || ''}
              options={employeeOptions}
              onChange={(_, option) => setHelper2Id(option?.key === '' ? undefined : option?.key as string)}
              styles={{ root: { flex: 1 } }}
            />
          </Stack>

          <Stack horizontal tokens={{ childrenGap: 16 }}>
            <Dropdown
              label="Helper 3"
              selectedKey={helper3Id || ''}
              options={employeeOptions}
              onChange={(_, option) => setHelper3Id(option?.key === '' ? undefined : option?.key as string)}
              styles={{ root: { flex: 1 } }}
            />
            <Dropdown
              label="Helper 4"
              selectedKey={helper4Id || ''}
              options={employeeOptions}
              onChange={(_, option) => setHelper4Id(option?.key === '' ? undefined : option?.key as string)}
              styles={{ root: { flex: 1 } }}
            />
          </Stack>

          <Separator>Notes</Separator>

          <TextField
            multiline
            rows={4}
            value={notes}
            onChange={(_, value) => setNotes(value || '')}
            placeholder="Add notes about the work done, issues encountered, etc."
          />
        </Stack>
      )}
    </Panel>
  );
};
