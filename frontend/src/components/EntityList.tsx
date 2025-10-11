import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  CommandBar,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  SearchBox,
  Selection,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';

interface EntityListProps<T> {
  title: string;
  items: T[];
  columns: IColumn[];
  loading: boolean;
  error: string | null;
  onAdd?: () => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRefresh?: () => void;
  searchPlaceholder?: string;
}

export function EntityList<T extends { id: string }>({
  title,
  items,
  columns,
  loading,
  error,
  onAdd,
  onEdit,
  onDelete,
  onRefresh,
  searchPlaceholder = 'Search...',
}: EntityListProps<T>) {
  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState<T[]>(items);
  const [selectedItem, setSelectedItem] = useState<T | undefined>();

  const [selection] = useState(
    new Selection({
      onSelectionChanged: () => {
        const selected = selection.getSelection()[0] as T | undefined;
        setSelectedItem(selected);
      },
    })
  );

  useEffect(() => {
    if (!searchText) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchText.toLowerCase())
      )
    );
    setFilteredItems(filtered);
  }, [items, searchText]);

  const commandBarItems: ICommandBarItemProps[] = [
    ...(onAdd
      ? [
          {
            key: 'new',
            text: 'New',
            iconProps: { iconName: 'Add' },
            onClick: onAdd,
          },
        ]
      : []),
    ...(onEdit && selectedItem
      ? [
          {
            key: 'edit',
            text: 'Edit',
            iconProps: { iconName: 'Edit' },
            onClick: () => onEdit(selectedItem),
          },
        ]
      : []),
    ...(onDelete && selectedItem
      ? [
          {
            key: 'delete',
            text: 'Delete',
            iconProps: { iconName: 'Delete' },
            onClick: () => onDelete(selectedItem),
          },
        ]
      : []),
    ...(onRefresh
      ? [
          {
            key: 'refresh',
            text: 'Refresh',
            iconProps: { iconName: 'Refresh' },
            onClick: onRefresh,
          },
        ]
      : []),
  ];

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="xxLarge">{title}</Text>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => {}}>
          {error}
        </MessageBar>
      )}

      <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
        <Stack.Item grow>
          <SearchBox
            placeholder={searchPlaceholder}
            value={searchText}
            onChange={(_, newValue) => setSearchText(newValue || '')}
            styles={{ root: { maxWidth: 400 } }}
          />
        </Stack.Item>
      </Stack>

      <CommandBar items={commandBarItems} />

      {loading ? (
        <Spinner size={SpinnerSize.large} label="Loading..." />
      ) : (
        <DetailsList
          items={filteredItems}
          columns={columns}
          selection={selection}
          selectionMode={1}
          layoutMode={DetailsListLayoutMode.justified}
          isHeaderVisible={true}
        />
      )}

      <Text variant="medium">
        Showing {filteredItems.length} of {items.length} items
      </Text>
    </Stack>
  );
}
