import { useState, useEffect, useMemo } from 'react';
import {
  Panel,
  PanelType,
  Stack,
  TextField,
  Dropdown,
  PrimaryButton,
  DefaultButton,
  Label,
  MessageBar,
  MessageBarType,
  TimePicker,
  Text,
  Toggle
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import type { Jig } from '../../types/millennium';
import type { ScheduleBlock, ScheduleBlockType, CreateScheduleBlockDto } from '../../services/millenniumServices';
import { scheduleBlockService } from '../../services/millenniumServices';

interface ScheduleBlockPanelProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSave: () => void;
  block?: ScheduleBlock | null;
  teams: Jig[];
  defaultDate?: string;
  defaultTeamId?: string;
  defaultBlockType?: ScheduleBlockType;
}

const blockTypeOptions: IDropdownOption[] = [
  { key: 'PublicHoliday', text: 'Public Holiday' },
  { key: 'Breakdown', text: 'Breakdown' },
  { key: 'Maintenance', text: 'Maintenance' },
  { key: 'MaterialShortage', text: 'Material Shortage' },
  { key: 'GeneralDelay', text: 'General Delay' }
];

const formatMinutesToTime = (minutes: number): Date => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const date = new Date();
  date.setHours(hours, mins, 0, 0);
  return date;
};

const parseTimeToMinutes = (date: Date | null | undefined): number => {
  if (!date) return 420;
  return date.getHours() * 60 + date.getMinutes();
};

const formatTimeDisplay = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const ScheduleBlockPanel = ({
  isOpen,
  onDismiss,
  onSave,
  block,
  teams,
  defaultDate,
  defaultTeamId,
  defaultBlockType
}: ScheduleBlockPanelProps) => {
  const [blockType, setBlockType] = useState<ScheduleBlockType>('Maintenance');
  const [dateStr, setDateStr] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [teamId, setTeamId] = useState<string | null>(defaultTeamId || null);
  const [startTime, setStartTime] = useState<Date>(formatMinutesToTime(420));
  const [endTime, setEndTime] = useState<Date>(formatMinutesToTime(510));
  const [description, setDescription] = useState('');
  const [isFullDay, setIsFullDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!block;

  useEffect(() => {
    if (block) {
      setBlockType(block.blockType);
      setDateStr(block.dateStr);
      setTeamId(block.teamId || null);
      setStartTime(formatMinutesToTime(block.startTimeMinutes));
      setEndTime(formatMinutesToTime(block.endTimeMinutes));
      setDescription(block.description || '');
      setIsFullDay(block.startTimeMinutes === 420 && block.endTimeMinutes === 1020);
    } else {
      setBlockType(defaultBlockType || 'Maintenance');
      setDateStr(defaultDate || new Date().toISOString().split('T')[0]);
      setTeamId(defaultTeamId || null);
      setStartTime(formatMinutesToTime(420));
      setEndTime(formatMinutesToTime(510));
      setDescription('');
      setIsFullDay(defaultBlockType === 'PublicHoliday');
    }
  }, [block, defaultDate, defaultTeamId, defaultBlockType, isOpen]);

  useEffect(() => {
    if (blockType === 'PublicHoliday') {
      setTeamId(null);
      setIsFullDay(true);
      setStartTime(formatMinutesToTime(420));
      setEndTime(formatMinutesToTime(1020));
    }
  }, [blockType]);

  useEffect(() => {
    if (isFullDay) {
      setStartTime(formatMinutesToTime(420));
      setEndTime(formatMinutesToTime(1020));
    }
  }, [isFullDay]);

  const teamOptions = useMemo((): IDropdownOption[] => {
    if (blockType === 'PublicHoliday') {
      return [{ key: '', text: 'All Teams (Public Holiday)' }];
    }
    return [
      { key: '', text: 'Select Team...' },
      ...teams.map(t => ({ key: t.id, text: t.name }))
    ];
  }, [teams, blockType]);

  const handleSave = async () => {
    setError(null);

    if (!blockType) {
      setError('Please select a block type');
      return;
    }

    if (!dateStr) {
      setError('Please select a date');
      return;
    }

    if (blockType !== 'PublicHoliday' && !teamId) {
      setError('Please select a team');
      return;
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return;
    }

    setSaving(true);

    try {
      const data: CreateScheduleBlockDto = {
        blockType,
        dateStr,
        teamId: blockType === 'PublicHoliday' ? null : teamId,
        startTimeMinutes: startMinutes,
        endTimeMinutes: endMinutes,
        description: description || null
      };

      if (isEditing && block) {
        await scheduleBlockService.update(block.id, data);
      } else {
        await scheduleBlockService.create(data);
      }

      onSave();
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save schedule block');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!block) return;

    if (!window.confirm('Are you sure you want to delete this schedule block?')) {
      return;
    }

    setSaving(true);
    try {
      await scheduleBlockService.delete(block.id);
      onSave();
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule block');
    } finally {
      setSaving(false);
    }
  };

  const getBlockTypeColor = (type: ScheduleBlockType): string => {
    switch (type) {
      case 'PublicHoliday': return '#e74c3c';
      case 'Breakdown': return '#e67e22';
      case 'Maintenance': return '#9b59b6';
      case 'MaterialShortage': return '#f39c12';
      case 'GeneralDelay': return '#95a5a6';
      default: return '#7f8c8d';
    }
  };

  const getBlockTypeDescription = (type: ScheduleBlockType): string => {
    switch (type) {
      case 'PublicHoliday':
        return 'Marks the entire day as a public holiday for all teams. Use this when you need to swap working days.';
      case 'Breakdown':
        return 'Used when equipment breaks down during production. This extends the affected job to accommodate the delay.';
      case 'Maintenance':
        return 'Scheduled maintenance time where no jobs can be booked. Blocks time on the timeline.';
      case 'MaterialShortage':
        return 'Time blocked due to material shortage. No jobs can be scheduled during this period.';
      case 'GeneralDelay':
        return 'Any other delay that blocks production time. Use description to explain the reason.';
      default:
        return '';
    }
  };

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      type={PanelType.medium}
      headerText={isEditing ? 'Edit Schedule Block' : 'Add Schedule Block'}
      closeButtonAriaLabel="Close"
    >
      <Stack tokens={{ childrenGap: 16, padding: '16px 0' }}>
        {error && (
          <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
            {error}
          </MessageBar>
        )}

        <Dropdown
          label="Block Type"
          options={blockTypeOptions}
          selectedKey={blockType}
          onChange={(_, option) => option && setBlockType(option.key as ScheduleBlockType)}
          required
        />

        <Stack
          horizontal
          tokens={{ childrenGap: 8 }}
          styles={{
            root: {
              backgroundColor: getBlockTypeColor(blockType),
              padding: 12,
              borderRadius: 4
            }
          }}
        >
          <Text styles={{ root: { color: 'white', fontSize: 12 } }}>
            {getBlockTypeDescription(blockType)}
          </Text>
        </Stack>

        <TextField
          label="Date"
          type="date"
          value={dateStr}
          onChange={(_, val) => val && setDateStr(val)}
          required
        />

        {blockType !== 'PublicHoliday' && (
          <Dropdown
            label="Team"
            options={teamOptions}
            selectedKey={teamId || ''}
            onChange={(_, option) => option && setTeamId(option.key as string || null)}
            required
          />
        )}

        <Toggle
          label="Full Day"
          checked={isFullDay || blockType === 'PublicHoliday'}
          onChange={(_, checked) => setIsFullDay(!!checked)}
          disabled={blockType === 'PublicHoliday'}
        />

        {!isFullDay && blockType !== 'PublicHoliday' && (
          <Stack horizontal tokens={{ childrenGap: 16 }}>
            <Stack.Item grow>
              <Label>Start Time</Label>
              <TimePicker
                value={startTime}
                onChange={(_, time) => time && setStartTime(time)}
                increments={15}
                useHour12={false}
              />
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                {formatTimeDisplay(parseTimeToMinutes(startTime))}
              </Text>
            </Stack.Item>
            <Stack.Item grow>
              <Label>End Time</Label>
              <TimePicker
                value={endTime}
                onChange={(_, time) => time && setEndTime(time)}
                increments={15}
                useHour12={false}
              />
              <Text variant="small" styles={{ root: { color: '#666' } }}>
                {formatTimeDisplay(parseTimeToMinutes(endTime))}
              </Text>
            </Stack.Item>
          </Stack>
        )}

        <TextField
          label="Description"
          multiline
          rows={4}
          value={description}
          onChange={(_, val) => setDescription(val || '')}
          placeholder={
            blockType === 'GeneralDelay'
              ? 'Please describe why this delay occurred...'
              : 'Optional notes about this block...'
          }
          required={blockType === 'GeneralDelay'}
        />

        <Stack horizontal tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 24 } }}>
          <PrimaryButton
            text={isEditing ? 'Update' : 'Add Block'}
            onClick={handleSave}
            disabled={saving}
          />
          {isEditing && (
            <DefaultButton
              text="Delete"
              onClick={handleDelete}
              disabled={saving}
              styles={{ root: { color: '#e74c3c' } }}
            />
          )}
          <DefaultButton text="Cancel" onClick={onDismiss} disabled={saving} />
        </Stack>
      </Stack>
    </Panel>
  );
};
