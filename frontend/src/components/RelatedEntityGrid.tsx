import React, { useState } from 'react';
import {
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  CommandBar,
  Panel,
  PanelType,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  Stack,
  Text,
  Selection,
  Spinner,
  SpinnerSize,
} from '@fluentui/react';
import type { IColumn, ICommandBarItemProps } from '@fluentui/react';

interface RelatedEntityGridProps<T> {
  title: string;
  items: T[];
  columns: IColumn[];
  entityName: string;
  parentId?: string;
  onRefresh: () => void;
  FormComponent: React.ComponentType<{
    entityId?: string;
    parentId?: string;
    onDismiss: () => void;
    onSaved: () => void;
  }>;
  onDelete?: (id: string) => Promise<void>;
  getItemId: (item: T) => string;
  onLinkExisting?: (selectedIds: string[]) => Promise<void>;
  linkButtonText?: string;
  getAllAvailableItems?: () => Promise<T[]>;
}

export function RelatedEntityGrid<T>({
  title,
  items,
  columns,
  entityName,
  parentId,
  onRefresh,
  FormComponent,
  onDelete,
  getItemId,
  onLinkExisting,
  linkButtonText = 'Add Existing',
  getAllAvailableItems,
}: RelatedEntityGridProps<T>) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [availableItems, setAvailableItems] = useState<T[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [linking, setLinking] = useState(false);
  const [selection] = useState(
    () =>
      new Selection({
        onSelectionChanged: () => {
          // Selection state is managed by the Selection object
        },
      })
  );

  const handleNewClick = () => {
    setSelectedItemId(undefined);
    setIsPanelOpen(true);
  };

  const handleRowClick = (item?: T) => {
    if (item) {
      setSelectedItemId(getItemId(item));
      setIsPanelOpen(true);
    }
  };

  const handlePanelDismiss = () => {
    setIsPanelOpen(false);
    setSelectedItemId(undefined);
  };

  const handleSaved = () => {
    setIsPanelOpen(false);
    setSelectedItemId(undefined);
    onRefresh();
  };

  const handleDeleteClick = (item: T) => {
    setItemToDelete(getItemId(item));
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete && onDelete) {
      setDeleting(true);
      try {
        await onDelete(itemToDelete);
        setDeleteDialogOpen(false);
        setItemToDelete(undefined);
        onRefresh();
      } catch (error) {
        console.error('Error deleting item:', error);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setItemToDelete(undefined);
  };

  const handleLinkExistingClick = async () => {
    if (!getAllAvailableItems) return;
    
    setLinkDialogOpen(true);
    setLoadingAvailable(true);
    try {
      const allItems = await getAllAvailableItems();
      setAvailableItems(allItems);
    } catch (error) {
      console.error('Error loading available items:', error);
      setAvailableItems([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleLinkConfirm = async () => {
    if (!onLinkExisting) return;
    
    const selectedItems = selection.getSelection() as T[];
    const selectedIds = selectedItems.map(getItemId);
    
    if (selectedIds.length === 0) return;
    
    setLinking(true);
    try {
      await onLinkExisting(selectedIds);
      setLinkDialogOpen(false);
      selection.setAllSelected(false);
      onRefresh();
    } catch (error) {
      console.error('Error linking items:', error);
    } finally {
      setLinking(false);
    }
  };

  const handleLinkCancel = () => {
    setLinkDialogOpen(false);
    selection.setAllSelected(false);
    setAvailableItems([]);
  };

  const commandBarItems: ICommandBarItemProps[] = [
    {
      key: 'new',
      text: 'New',
      iconProps: { iconName: 'Add' },
      onClick: handleNewClick,
    },
    ...(onLinkExisting && getAllAvailableItems
      ? [
          {
            key: 'linkExisting',
            text: linkButtonText,
            iconProps: { iconName: 'Link' },
            onClick: handleLinkExistingClick,
          },
        ]
      : []),
    {
      key: 'refresh',
      text: 'Refresh',
      iconProps: { iconName: 'Refresh' },
      onClick: onRefresh,
    },
  ];

  // Add delete column if onDelete is provided
  const gridColumns: IColumn[] = onDelete
    ? [
        ...columns,
        {
          key: 'actions',
          name: 'Actions',
          minWidth: 50,
          maxWidth: 50,
          onRender: (item: T) => (
            <DefaultButton
              iconProps={{ iconName: 'Delete' }}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick(item);
              }}
              title="Delete"
              styles={{ root: { minWidth: 32, padding: '0 4px' } }}
            />
          ),
        },
      ]
    : columns;

  return (
    <Stack styles={{ root: { marginTop: 24 } }}>
      <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 12 } }}>
        {title.toUpperCase()} ({items.length})
      </Text>
      
      <CommandBar items={commandBarItems} styles={{ root: { padding: 0 } }} />
      
      <DetailsList
        items={items}
        columns={gridColumns}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
        onActiveItemChanged={handleRowClick}
        styles={{
          root: {
            border: '1px solid #edebe9',
            '.ms-DetailsRow': {
              cursor: 'pointer',
            },
            '.ms-DetailsRow:hover': {
              backgroundColor: '#f3f2f1',
            },
          },
        }}
      />

      <Panel
        isOpen={isPanelOpen}
        onDismiss={handlePanelDismiss}
        type={PanelType.medium}
        headerText={selectedItemId ? `Edit ${entityName}` : `New ${entityName}`}
        closeButtonAriaLabel="Close"
      >
        <FormComponent
          entityId={selectedItemId}
          parentId={parentId}
          onDismiss={handlePanelDismiss}
          onSaved={handleSaved}
        />
      </Panel>

      <Dialog
        hidden={!deleteDialogOpen}
        onDismiss={handleDeleteCancel}
        dialogContentProps={{
          type: DialogType.normal,
          title: `Delete ${entityName}`,
          subText: `Are you sure you want to delete this ${entityName.toLowerCase()}? This action cannot be undone.`,
        }}
      >
        <DialogFooter>
          <PrimaryButton
            onClick={handleDeleteConfirm}
            text="Delete"
            disabled={deleting}
          />
          <DefaultButton onClick={handleDeleteCancel} text="Cancel" />
        </DialogFooter>
      </Dialog>

      <Dialog
        hidden={!linkDialogOpen}
        onDismiss={handleLinkCancel}
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: `Add Existing ${entityName}s`,
          subText: `Select ${entityName.toLowerCase()}s to link to this record.`,
        }}
        modalProps={{
          isBlocking: true,
          styles: { main: { minWidth: 600, maxWidth: 800 } },
        }}
      >
        <Stack tokens={{ childrenGap: 12 }} styles={{ root: { marginTop: 12, marginBottom: 12 } }}>
          {loadingAvailable ? (
            <Stack horizontalAlign="center" styles={{ root: { padding: 40 } }}>
              <Spinner size={SpinnerSize.large} label="Loading available items..." />
            </Stack>
          ) : (
            <DetailsList
              items={availableItems}
              columns={columns}
              layoutMode={DetailsListLayoutMode.justified}
              selectionMode={SelectionMode.multiple}
              selection={selection}
              styles={{
                root: {
                  maxHeight: 400,
                  overflowY: 'auto',
                  border: '1px solid #edebe9',
                },
              }}
            />
          )}
          {!loadingAvailable && availableItems.length === 0 && (
            <Text styles={{ root: { padding: 20, textAlign: 'center', color: '#605e5c' } }}>
              No available {entityName.toLowerCase()}s to link.
            </Text>
          )}
        </Stack>
        <DialogFooter>
          <PrimaryButton
            onClick={handleLinkConfirm}
            text="Add Selected"
            disabled={linking || loadingAvailable}
          />
          <DefaultButton onClick={handleLinkCancel} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
}
