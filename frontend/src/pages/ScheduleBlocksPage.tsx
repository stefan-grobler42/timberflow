import { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  ConstrainMode,
  Selection,
  CommandBar,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  SearchBox,
  Dropdown,
  DatePicker,
  IconButton,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps, IDropdownOption } from '@fluentui/react';
import { scheduleBlockService, jigService } from '../services/millenniumServices';
import type { ScheduleBlock, ScheduleBlockType } from '../services/millenniumServices';
import type { Jig } from '../types/millennium';
import { ScheduleBlockPanel } from '../components/ProductionPlanner/ScheduleBlockPanel';
import { DeleteDialog } from '../components/DeleteDialog';
import * as XLSX from 'xlsx';

const SCHEDULE_BLOCK_COLORS: Record<ScheduleBlockType, string> = {
  PublicHoliday: '#B3E5FC',
  Breakdown: '#F28B82',
  Maintenance: '#C58AF9',
  MaterialShortage: '#FDD663',
  GeneralDelay: '#9AA0A6'
};

const SCHEDULE_BLOCK_LABELS: Record<ScheduleBlockType, string> = {
  PublicHoliday: 'Public Holiday',
  Breakdown: 'Breakdown',
  Maintenance: 'Maintenance',
  MaterialShortage: 'Material Shortage',
  GeneralDelay: 'General Delay'
};

const blockTypeOptions: IDropdownOption[] = [
  { key: 'all', text: 'All Types' },
  { key: 'PublicHoliday', text: 'Public Holiday' },
  { key: 'Breakdown', text: 'Breakdown' },
  { key: 'Maintenance', text: 'Maintenance' },
  { key: 'MaterialShortage', text: 'Material Shortage' },
  { key: 'GeneralDelay', text: 'General Delay' }
];

const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

const formatDateStr = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const ScheduleBlocksPage = () => {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [filteredBlocks, setFilteredBlocks] = useState<ScheduleBlock[]>([]);
  const [teams, setTeams] = useState<Jig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | undefined>();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<ScheduleBlock | undefined>();
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterBlockType, setFilterBlockType] = useState<string>('all');
  const [filterTeamId, setFilterTeamId] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();
  const [sortColumn, setSortColumn] = useState<string>('dateStr');
  const [isSortedDescending, setIsSortedDescending] = useState(true);
  const [defaultBlockType, setDefaultBlockType] = useState<ScheduleBlockType | undefined>();

  const [selection] = useState(
    new Selection({
      onSelectionChanged: () => {
        const selected = selection.getSelection()[0] as ScheduleBlock | undefined;
        setSelectedBlock(selected);
      },
    })
  );

  const teamOptions: IDropdownOption[] = useMemo(() => {
    return [
      { key: 'all', text: 'All Teams' },
      ...teams.map(t => ({ key: t.id, text: t.name }))
    ];
  }, [teams]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [scheduleBlocks, searchText, filterBlockType, filterTeamId, filterDateFrom, filterDateTo, sortColumn, isSortedDescending]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [blocksData, teamsData] = await Promise.all([
        scheduleBlockService.getAll(),
        jigService.getAll()
      ]);
      setScheduleBlocks(blocksData);
      setTeams(teamsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...scheduleBlocks];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((block) =>
        Object.values(block).some((value) =>
          String(value ?? '').toLowerCase().includes(search)
        )
      );
    }

    if (filterBlockType !== 'all') {
      filtered = filtered.filter((block) => block.blockType === filterBlockType);
    }

    if (filterTeamId !== 'all') {
      filtered = filtered.filter((block) => block.teamId === filterTeamId || (!block.teamId && filterTeamId === 'noTeam'));
    }

    if (filterDateFrom) {
      const fromStr = filterDateFrom.toISOString().split('T')[0];
      filtered = filtered.filter((block) => block.dateStr >= fromStr);
    }

    if (filterDateTo) {
      const toStr = filterDateTo.toISOString().split('T')[0];
      filtered = filtered.filter((block) => block.dateStr <= toStr);
    }

    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: string | number | null | undefined;
        let bValue: string | number | null | undefined;

        switch (sortColumn) {
          case 'dateStr':
            aValue = a.dateStr;
            bValue = b.dateStr;
            break;
          case 'blockType':
            aValue = SCHEDULE_BLOCK_LABELS[a.blockType];
            bValue = SCHEDULE_BLOCK_LABELS[b.blockType];
            break;
          case 'teamName':
            aValue = a.teamName || 'All Teams';
            bValue = b.teamName || 'All Teams';
            break;
          case 'startTimeMinutes':
            aValue = a.startTimeMinutes;
            bValue = b.startTimeMinutes;
            break;
          case 'endTimeMinutes':
            aValue = a.endTimeMinutes;
            bValue = b.endTimeMinutes;
            break;
          case 'description':
            aValue = a.description || '';
            bValue = b.description || '';
            break;
          default:
            aValue = '';
            bValue = '';
        }

        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue ?? '').localeCompare(String(bValue ?? ''));
        }

        return isSortedDescending ? -comparison : comparison;
      });
    }

    setFilteredBlocks(filtered);
  };

  const handleNew = (blockType?: ScheduleBlockType) => {
    setSelectedBlock(undefined);
    setDefaultBlockType(blockType);
    setIsPanelOpen(true);
  };

  const handleEdit = () => {
    if (selectedBlock) {
      setDefaultBlockType(undefined);
      setIsPanelOpen(true);
    }
  };

  const handleRowDoubleClick = (block: ScheduleBlock) => {
    setSelectedBlock(block);
    setDefaultBlockType(undefined);
    setIsPanelOpen(true);
  };

  const handleDelete = () => {
    if (selectedBlock) {
      setBlockToDelete(selectedBlock);
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (blockToDelete) {
      try {
        await scheduleBlockService.delete(blockToDelete.id);
        setIsDeleteDialogOpen(false);
        setBlockToDelete(undefined);
        await loadData();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete schedule block');
      }
    }
  };

  const clearFilters = () => {
    setSearchText('');
    setFilterBlockType('all');
    setFilterTeamId('all');
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
  };

  const exportToExcel = (blocksToExport: ScheduleBlock[]) => {
    const exportData = blocksToExport.map((block) => ({
      'Date': formatDateStr(block.dateStr),
      'Block Type': SCHEDULE_BLOCK_LABELS[block.blockType],
      'Team': block.teamName || 'All Teams',
      'Start Time': formatMinutesToTime(block.startTimeMinutes),
      'End Time': formatMinutesToTime(block.endTimeMinutes),
      'Description': block.description || '',
      'Created On': block.createdOn ? new Date(block.createdOn).toLocaleString('en-ZA') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule Blocks');
    XLSX.writeFile(wb, `ScheduleBlocks_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportSelected = () => {
    const selected = selection.getSelection() as ScheduleBlock[];
    if (selected.length > 0) {
      exportToExcel(selected);
    }
    setIsExportDialogOpen(false);
  };

  const handleExportAll = () => {
    exportToExcel(filteredBlocks);
    setIsExportDialogOpen(false);
  };

  const onColumnClick = (_ev?: React.MouseEvent<HTMLElement>, column?: IColumn) => {
    if (!column || !column.fieldName) return;

    const columnKey = column.fieldName;
    if (sortColumn === columnKey) {
      setIsSortedDescending(!isSortedDescending);
    } else {
      setSortColumn(columnKey);
      setIsSortedDescending(false);
    }
  };

  const columns: IColumn[] = [
    {
      key: 'dateStr',
      name: 'Date',
      fieldName: 'dateStr',
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
      isSorted: sortColumn === 'dateStr',
      isSortedDescending: sortColumn === 'dateStr' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: ScheduleBlock) => formatDateStr(item.dateStr),
    },
    {
      key: 'blockType',
      name: 'Block Type',
      fieldName: 'blockType',
      minWidth: 130,
      maxWidth: 160,
      isResizable: true,
      isSorted: sortColumn === 'blockType',
      isSortedDescending: sortColumn === 'blockType' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: ScheduleBlock) => (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: 2,
            backgroundColor: SCHEDULE_BLOCK_COLORS[item.blockType],
            border: '1px solid rgba(0,0,0,0.1)'
          }} />
          <Text>{SCHEDULE_BLOCK_LABELS[item.blockType]}</Text>
        </Stack>
      ),
    },
    {
      key: 'teamName',
      name: 'Team',
      fieldName: 'teamName',
      minWidth: 120,
      maxWidth: 150,
      isResizable: true,
      isSorted: sortColumn === 'teamName',
      isSortedDescending: sortColumn === 'teamName' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: ScheduleBlock) => (
        <Text styles={{ root: { fontStyle: item.teamName ? 'normal' : 'italic', color: item.teamName ? 'inherit' : '#666' } }}>
          {item.teamName || 'All Teams'}
        </Text>
      ),
    },
    {
      key: 'startTimeMinutes',
      name: 'Start Time',
      fieldName: 'startTimeMinutes',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
      isSorted: sortColumn === 'startTimeMinutes',
      isSortedDescending: sortColumn === 'startTimeMinutes' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: ScheduleBlock) => formatMinutesToTime(item.startTimeMinutes),
    },
    {
      key: 'endTimeMinutes',
      name: 'End Time',
      fieldName: 'endTimeMinutes',
      minWidth: 80,
      maxWidth: 100,
      isResizable: true,
      isSorted: sortColumn === 'endTimeMinutes',
      isSortedDescending: sortColumn === 'endTimeMinutes' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: ScheduleBlock) => formatMinutesToTime(item.endTimeMinutes),
    },
    {
      key: 'description',
      name: 'Description',
      fieldName: 'description',
      minWidth: 200,
      maxWidth: 400,
      isResizable: true,
      isSorted: sortColumn === 'description',
      isSortedDescending: sortColumn === 'description' && isSortedDescending,
      onColumnClick: onColumnClick,
      onRender: (item: ScheduleBlock) => (
        <Text styles={{ root: { color: item.description ? 'inherit' : '#999' } }}>
          {item.description || '-'}
        </Text>
      ),
    },
  ];

  const hasActiveFilters = searchText || filterBlockType !== 'all' || filterTeamId !== 'all' || filterDateFrom || filterDateTo;

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'new',
      text: 'New',
      iconProps: { iconName: 'Add' },
      split: true,
      subMenuProps: {
        items: [
          { key: 'newGeneral', text: 'General Block', onClick: () => handleNew() },
          { key: 'divider1', itemType: 1 },
          { key: 'newPublicHoliday', text: 'Public Holiday', onClick: () => handleNew('PublicHoliday') },
          { key: 'newBreakdown', text: 'Breakdown', onClick: () => handleNew('Breakdown') },
          { key: 'newMaintenance', text: 'Maintenance', onClick: () => handleNew('Maintenance') },
          { key: 'newMaterialShortage', text: 'Material Shortage', onClick: () => handleNew('MaterialShortage') },
          { key: 'newGeneralDelay', text: 'General Delay', onClick: () => handleNew('GeneralDelay') },
        ],
      },
      onClick: () => handleNew(),
    },
    {
      key: 'edit',
      text: 'Edit',
      iconProps: { iconName: 'Edit' },
      disabled: !selectedBlock,
      onClick: handleEdit,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: !selectedBlock,
      onClick: handleDelete,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: loadData,
    },
    {
      key: 'export',
      text: 'Export to Excel',
      iconProps: { iconName: 'ExcelDocument' },
      onClick: () => setIsExportDialogOpen(true),
    },
  ];

  const commandBarFarItems: ICommandBarItemProps[] = [
    {
      key: 'search',
      onRender: () => (
        <SearchBox
          placeholder="Search..."
          value={searchText}
          onChange={(_, value) => setSearchText(value || '')}
          onClear={() => setSearchText('')}
          styles={{ root: { width: 200 } }}
        />
      ),
    },
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">Schedule Blocks</Text>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      <Stack
        horizontal
        verticalAlign="end"
        wrap
        tokens={{ childrenGap: 16 }}
        styles={{
          root: {
            padding: '12px 16px',
            backgroundColor: '#f3f2f1',
            borderRadius: 4,
          },
        }}
      >
        <Stack.Item>
          <Dropdown
            label="Block Type"
            options={blockTypeOptions}
            selectedKey={filterBlockType}
            onChange={(_, option) => option && setFilterBlockType(option.key as string)}
            styles={{ root: { minWidth: 150 } }}
          />
        </Stack.Item>
        <Stack.Item>
          <Dropdown
            label="Team"
            options={teamOptions}
            selectedKey={filterTeamId}
            onChange={(_, option) => option && setFilterTeamId(option.key as string)}
            styles={{ root: { minWidth: 150 } }}
          />
        </Stack.Item>
        <Stack.Item>
          <DatePicker
            label="From Date"
            value={filterDateFrom}
            onSelectDate={(date) => setFilterDateFrom(date || undefined)}
            placeholder="Select start date..."
            styles={{ root: { minWidth: 150 } }}
          />
        </Stack.Item>
        <Stack.Item>
          <DatePicker
            label="To Date"
            value={filterDateTo}
            onSelectDate={(date) => setFilterDateTo(date || undefined)}
            placeholder="Select end date..."
            styles={{ root: { minWidth: 150 } }}
          />
        </Stack.Item>
        {hasActiveFilters && (
          <Stack.Item>
            <IconButton
              iconProps={{ iconName: 'ClearFilter' }}
              title="Clear Filters"
              onClick={clearFilters}
              styles={{ root: { marginTop: 28 } }}
            />
          </Stack.Item>
        )}
        <Stack.Item grow>
          <Text styles={{ root: { marginTop: 28, color: '#666', textAlign: 'right' } }}>
            {filteredBlocks.length} of {scheduleBlocks.length} blocks
          </Text>
        </Stack.Item>
      </Stack>

      {loading ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Spinner size={SpinnerSize.large} label="Loading schedule blocks..." />
        </Stack>
      ) : filteredBlocks.length === 0 ? (
        <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
          <Text styles={{ root: { color: '#666' } }}>
            {scheduleBlocks.length === 0
              ? 'No schedule blocks found. Click "New" to create one.'
              : 'No schedule blocks match the current filters.'}
          </Text>
          {hasActiveFilters && (
            <DefaultButton
              text="Clear Filters"
              onClick={clearFilters}
              styles={{ root: { marginTop: 16 } }}
            />
          )}
        </Stack>
      ) : (
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <DetailsList
            items={filteredBlocks}
            columns={columns}
            selection={selection}
            selectionMode={1}
            layoutMode={DetailsListLayoutMode.justified}
            constrainMode={ConstrainMode.unconstrained}
            onItemInvoked={handleRowDoubleClick}
            getKey={(item) => (item as ScheduleBlock).id}
          />
        </div>
      )}

      <ScheduleBlockPanel
        isOpen={isPanelOpen}
        onDismiss={() => {
          setIsPanelOpen(false);
          setSelectedBlock(undefined);
          setDefaultBlockType(undefined);
        }}
        onSave={() => {
          loadData();
          setIsPanelOpen(false);
          setSelectedBlock(undefined);
          setDefaultBlockType(undefined);
        }}
        block={selectedBlock}
        teams={teams}
        defaultBlockType={defaultBlockType}
      />

      <Dialog
        hidden={!isExportDialogOpen}
        onDismiss={() => setIsExportDialogOpen(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Export to Excel',
          subText: 'Choose what to export:',
        }}
      >
        <DialogFooter>
          <PrimaryButton
            onClick={handleExportSelected}
            text="Export Selected"
            disabled={selection.getSelectedCount() === 0}
          />
          <DefaultButton onClick={handleExportAll} text="Export All" />
          <DefaultButton onClick={() => setIsExportDialogOpen(false)} text="Cancel" />
        </DialogFooter>
      </Dialog>

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Schedule Block"
        message={blockToDelete ? `Are you sure you want to delete the ${SCHEDULE_BLOCK_LABELS[blockToDelete.blockType]} block on ${formatDateStr(blockToDelete.dateStr)}?` : ''}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </Stack>
  );
};
