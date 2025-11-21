import { useState } from 'react';
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
  SearchBox,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';

export const ProcurementPage = () => {
  const [searchText, setSearchText] = useState('');

  const [selection] = useState(new Selection());

  const columns: IColumn[] = [
    {
      key: 'name',
      name: 'Name',
      fieldName: 'name',
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
    },
  ];

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'new',
      text: 'New',
      iconProps: { iconName: 'Add' },
      disabled: true,
    },
    {
      key: 'edit',
      text: 'Edit',
      iconProps: { iconName: 'Edit' },
      disabled: true,
    },
    {
      key: 'delete',
      text: 'Delete',
      iconProps: { iconName: 'Delete' },
      disabled: true,
    },
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      disabled: true,
    },
    {
      key: 'export',
      text: 'Export to Excel',
      iconProps: { iconName: 'ExcelDocument' },
      disabled: true,
    },
  ];

  const commandBarFarItems: ICommandBarItemProps[] = [
    {
      key: 'search',
      onRender: () => (
        <SearchBox
          placeholder="Search all columns..."
          value={searchText}
          onChange={(_, value) => setSearchText(value || '')}
          onClear={() => setSearchText('')}
          styles={{ root: { width: 250, marginRight: 10 } }}
          disabled={true}
        />
      ),
    },
  ];

  return (
    <Stack styles={{ root: { padding: 20, height: '100%' } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" styles={{ root: { marginBottom: 20 } }}>
        <Text variant="xxLarge">Procurement</Text>
        <Text variant="medium">0 items</Text>
      </Stack>

      <MessageBar messageBarType={MessageBarType.info}>
        Procurement module coming soon
      </MessageBar>

      <CommandBar items={commandBarItems} farItems={commandBarFarItems} />

      <DetailsList
        items={[]}
        columns={columns}
        layoutMode={DetailsListLayoutMode.justified}
        constrainMode={ConstrainMode.unconstrained}
        selection={selection}
        selectionMode={1}
        setKey="set"
        isHeaderVisible={true}
      />
    </Stack>
  );
};
