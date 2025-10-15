import React, { useState, useEffect, useMemo } from 'react';
import {
  Stack,
  Text,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  Selection,
  CommandBar,
  MessageBar,
  MessageBarType,
  ShimmeredDetailsList,
  IconButton,
  Dropdown
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps, IDropdownOption } from '@fluentui/react';

export interface SubGridColumn {
  key: string;
  name: string;
  fieldName: string;
  minWidth: number;
  maxWidth?: number;
  isResizable?: boolean;
  onRender?: (item: any) => React.ReactNode;
}

interface SubGridProps {
  title: string;
  items: any[];
  columns: SubGridColumn[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onAdd?: () => void;
  onItemClick?: (item: any) => void;
  onDelete?: (item: any) => void;
  emptyMessage?: string;
  maxHeight?: number;
  pageSize?: number;
}

export const SubGrid: React.FC<SubGridProps> = ({
  title,
  items,
  columns,
  loading = false,
  error,
  onRefresh,
  onAdd,
  onItemClick,
  onDelete,
  emptyMessage = 'No records found',
  maxHeight = 300,
  pageSize = 10
}) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedPageSize, setSelectedPageSize] = useState<number>(pageSize);

  // Memoized Selection object for stable selection handling
  const selection = useMemo(
    () =>
      new Selection({
        onSelectionChanged: () => {
          const selected = selection.getSelection()[0];
          setSelectedItem(selected || null);
        }
      }),
    []
  );

  // Reset to first page when items change
  useEffect(() => {
    setCurrentPage(0);
    selection.setAllSelected(false);
    setSelectedItem(null);
  }, [items.length, selectedPageSize, selection]);

  // Clear selection when page changes
  useEffect(() => {
    selection.setAllSelected(false);
    setSelectedItem(null);
  }, [currentPage, selection]);

  const commandBarItems: ICommandBarItemProps[] = [
    ...(onAdd ? [{
      key: 'add',
      text: 'Add',
      iconProps: { iconName: 'Add' },
      onClick: onAdd
    }] : []),
    ...(onRefresh ? [{
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: onRefresh
    }] : []),
    ...(onDelete && selectedItem ? [{
      key: 'delete',
      text: 'Remove',
      iconProps: { iconName: 'Delete' },
      onClick: () => {
        if (selectedItem && onDelete) {
          onDelete(selectedItem);
          setSelectedItem(null);
        }
      }
    }] : [])
  ];

  const handleRowClick = (item: any) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  const gridColumns: IColumn[] = columns.map((col, index) => ({
    key: col.key,
    name: col.name,
    fieldName: col.fieldName,
    minWidth: col.minWidth,
    maxWidth: col.maxWidth,
    isResizable: col.isResizable !== false,
    onRender: col.onRender || ((item: any) => {
      const value = item[col.fieldName];
      // Add single-click navigation to first column
      if (index === 0 && onItemClick) {
        return (
          <span
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick(item);
            }}
            style={{ 
              cursor: 'pointer', 
              color: '#0078d4',
              textDecoration: 'underline'
            }}
          >
            {value}
          </span>
        );
      }
      return <span>{value}</span>;
    })
  }));

  const pageSizeOptions: IDropdownOption[] = [
    { key: 5, text: '5' },
    { key: 10, text: '10' },
    { key: 25, text: '25' },
    { key: 50, text: '50' },
    { key: 100, text: '100' }
  ];

  const effectivePageSize = selectedPageSize;
  const effectiveTotalPages = Math.ceil(items.length / effectivePageSize);
  const effectiveStartIndex = currentPage * effectivePageSize;
  const effectiveEndIndex = Math.min(effectiveStartIndex + effectivePageSize, items.length);
  const effectivePaginatedItems = items.slice(effectiveStartIndex, effectiveEndIndex);

  return (
    <Stack 
      tokens={{ childrenGap: 8 }} 
      styles={{ 
        root: { 
          border: '1px solid #edebe9',
          borderRadius: 4,
          padding: 16,
          backgroundColor: '#ffffff'
        } 
      }}
    >
      {/* Header with title and count */}
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, color: '#323130' } }}>
          {title} ({items.length})
        </Text>
      </Stack>

      {/* Command bar */}
      {commandBarItems.length > 0 && (
        <CommandBar
          items={commandBarItems}
          styles={{
            root: {
              padding: 0,
              height: 44
            }
          }}
        />
      )}

      {/* Error message */}
      {error && (
        <MessageBar messageBarType={MessageBarType.error}>
          {error}
        </MessageBar>
      )}

      {/* Grid */}
      <div style={{ 
        maxHeight, 
        overflowY: 'auto',
        overflowX: 'auto',
        border: '1px solid #edebe9',
        borderRadius: 4
      }}>
        {loading ? (
          <ShimmeredDetailsList
            items={[]}
            columns={gridColumns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.single}
            enableShimmer={true}
            shimmerLines={5}
          />
        ) : items.length === 0 ? (
          <Stack
            horizontalAlign="center"
            verticalAlign="center"
            tokens={{ padding: 40 }}
          >
            <Text variant="medium" styles={{ root: { color: '#605e5c' } }}>
              {emptyMessage}
            </Text>
          </Stack>
        ) : (
          <DetailsList
            items={effectivePaginatedItems}
            columns={gridColumns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.single}
            selection={selection}
            onItemInvoked={handleRowClick}
            onActiveItemChanged={(item) => {
              if (item) {
                setSelectedItem(item);
              }
            }}
            styles={{
              root: {
                '& [role=grid]': {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'start'
                }
              }
            }}
          />
        )}
      </div>

      {/* Pagination controls */}
      {items.length > 0 && (
        <Stack horizontal horizontalAlign="space-between" verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Text variant="small">Rows per page:</Text>
            <Dropdown
              options={pageSizeOptions}
              selectedKey={selectedPageSize}
              onChange={(_, option) => option && setSelectedPageSize(option.key as number)}
              styles={{ dropdown: { width: 70 } }}
            />
          </Stack>

          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Text variant="small">
              {effectiveStartIndex + 1}-{effectiveEndIndex} of {items.length}
            </Text>
            <IconButton
              iconProps={{ iconName: 'ChevronLeft' }}
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(currentPage - 1)}
              title="Previous page"
            />
            <Text variant="small">
              Page {currentPage + 1} of {effectiveTotalPages}
            </Text>
            <IconButton
              iconProps={{ iconName: 'ChevronRight' }}
              disabled={currentPage >= effectiveTotalPages - 1}
              onClick={() => setCurrentPage(currentPage + 1)}
              title="Next page"
            />
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};
