import { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  ConstrainMode,
  Selection,
  Spinner,
  SpinnerSize,
  MessageBar,
  MessageBarType,
  SearchBox,
  SelectionMode,
} from '@fluentui/react';
import type { IColumn } from '@fluentui/react';

export interface RelatedSubGridProps<T> {
  title: string;
  entityName: string;
  orderId: string;
  columns: IColumn[];
  fetchData: (orderId: string) => Promise<T[]>;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function RelatedSubGrid<T extends { id: string }>({
  title,
  entityName,
  orderId,
  columns: initialColumns,
  fetchData,
  onRowClick,
  emptyMessage = 'No records found',
}: RelatedSubGridProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [filteredItems, setFilteredItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [isSortedDescending, setIsSortedDescending] = useState(false);

  const [selection] = useState(
    new Selection({
      onSelectionChanged: () => {
        const selected = selection.getSelection()[0] as T | undefined;
        if (selected && onRowClick) {
          onRowClick(selected);
        }
      },
    })
  );

  useEffect(() => {
    loadData();
  }, [orderId]);

  useEffect(() => {
    applyFilters();
  }, [items, searchText, sortColumn, isSortedDescending]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchData(orderId);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to load ${entityName}`);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...items];

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(search)
        )
      );
    }

    if (sortColumn) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortColumn as keyof T];
        let bValue: any = b[sortColumn as keyof T];

        if (aValue === undefined || aValue === null) {
          aValue = typeof bValue === 'boolean' ? false : typeof bValue === 'number' ? 0 : '';
        }
        if (bValue === undefined || bValue === null) {
          bValue = typeof aValue === 'boolean' ? false : typeof aValue === 'number' ? 0 : '';
        }

        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          comparison = (aValue ? 1 : 0) - (bValue ? 1 : 0);
        }

        return isSortedDescending ? -comparison : comparison;
      });
    }

    setFilteredItems(filtered);
  };

  const onColumnClick = (_ev?: React.MouseEvent<HTMLElement>, column?: IColumn) => {
    if (!column || !column.fieldName) return;

    const newColumns = initialColumns.map((col) => {
      if (col.key === column.key) {
        const newIsSortedDescending =
          sortColumn === column.fieldName ? !isSortedDescending : false;
        setSortColumn(column.fieldName!);
        setIsSortedDescending(newIsSortedDescending);
        return {
          ...col,
          isSorted: true,
          isSortedDescending: newIsSortedDescending,
        };
      }
      return { ...col, isSorted: false };
    });

    return newColumns;
  };

  const columnsWithSort = initialColumns.map((col) => ({
    ...col,
    onColumnClick: col.fieldName ? onColumnClick : undefined,
    isSorted: col.fieldName === sortColumn,
    isSortedDescending: col.fieldName === sortColumn ? isSortedDescending : false,
  }));

  const handleRowDoubleClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  return (
    <Stack tokens={{ childrenGap: 12 }} styles={{ root: { height: '100%', padding: 16 } }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge" styles={{ root: { fontWeight: 600 } }}>
          {title}
        </Text>
        <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
          {filteredItems.length} {filteredItems.length === 1 ? 'record' : 'records'}
        </Text>
      </Stack>

      <SearchBox
        placeholder={`Search ${entityName}...`}
        value={searchText}
        onChange={(_, newValue) => setSearchText(newValue || '')}
        styles={{ root: { maxWidth: 400 } }}
      />

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      {loading ? (
        <Stack
          horizontalAlign="center"
          verticalAlign="center"
          styles={{ root: { flex: 1, minHeight: 200 } }}
        >
          <Spinner size={SpinnerSize.large} label={`Loading ${entityName}...`} />
        </Stack>
      ) : filteredItems.length === 0 ? (
        <Stack
          horizontalAlign="center"
          verticalAlign="center"
          styles={{
            root: {
              flex: 1,
              minHeight: 200,
              backgroundColor: '#f3f2f1',
              borderRadius: 4,
              border: '1px solid #edebe9',
            },
          }}
        >
          <Text variant="large" styles={{ root: { color: '#605e5c' } }}>
            {emptyMessage}
          </Text>
        </Stack>
      ) : (
        <Stack styles={{ root: { flex: 1, overflowY: 'auto' } }}>
          <DetailsList
            items={filteredItems}
            columns={columnsWithSort}
            selection={selection}
            selectionMode={SelectionMode.single}
            layoutMode={DetailsListLayoutMode.justified}
            constrainMode={ConstrainMode.unconstrained}
            onItemInvoked={handleRowDoubleClick}
            styles={{
              root: {
                '& [role=grid]': {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'start',
                  height: '100%',
                },
              },
            }}
          />
        </Stack>
      )}
    </Stack>
  );
}
