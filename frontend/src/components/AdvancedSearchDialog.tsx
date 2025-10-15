import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  Stack,
  DetailsList,
  DetailsListLayoutMode,
  Selection,
  SelectionMode,
  SearchBox,
  Spinner,
  SpinnerSize,
  Text
} from '@fluentui/react';
import type { IColumn } from '@fluentui/react';
import type { LookupOption } from './LookupField';

interface AdvancedSearchDialogProps {
  isOpen: boolean;
  onDismiss: () => void;
  onSelect: (option: LookupOption) => void;
  entityName: string;
  columns: IColumn[];
  items: any[];
  onSearch?: (query: string) => void;
  isLoading?: boolean;
}

export const AdvancedSearchDialog: React.FC<AdvancedSearchDialogProps> = ({
  isOpen,
  onDismiss,
  onSelect,
  entityName,
  columns,
  items,
  onSearch,
  isLoading = false
}) => {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const selection = new Selection({
    onSelectionChanged: () => {
      const selected = selection.getSelection()[0];
      setSelectedItem(selected || null);
    }
  });

  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect({
        id: selectedItem.id,
        text: selectedItem.text || selectedItem.name || selectedItem.id,
        record: selectedItem
      });
      onDismiss();
    }
  };

  const handleSearchChange = (_event?: React.ChangeEvent<HTMLInputElement>, newValue?: string) => {
    setSearchQuery(newValue || '');
    if (onSearch) {
      onSearch(newValue || '');
    }
  };

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{
        type: DialogType.largeHeader,
        title: `Advanced Search: ${entityName}`,
        subText: `Search and select a ${entityName.toLowerCase()} record`
      }}
      modalProps={{
        isBlocking: false,
        styles: { main: { maxWidth: 800, minWidth: 600 } }
      }}
    >
      <Stack tokens={{ childrenGap: 16 }}>
        <SearchBox
          placeholder={`Search ${entityName}...`}
          value={searchQuery}
          onChange={handleSearchChange}
          autoFocus
        />

        {isLoading ? (
          <Stack horizontal horizontalAlign="center" tokens={{ padding: 40 }}>
            <Spinner size={SpinnerSize.large} label={`Loading ${entityName}...`} />
          </Stack>
        ) : items.length === 0 ? (
          <Stack horizontalAlign="center" tokens={{ padding: 40 }}>
            <Text variant="mediumPlus" styles={{ root: { color: '#605e5c' } }}>
              No {entityName.toLowerCase()} records found
            </Text>
          </Stack>
        ) : (
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            <DetailsList
              items={items}
              columns={columns}
              selection={selection}
              selectionMode={SelectionMode.single}
              layoutMode={DetailsListLayoutMode.justified}
              isHeaderVisible={true}
              selectionPreservedOnEmptyClick={true}
            />
          </div>
        )}

        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <Text variant="small" styles={{ root: { color: '#605e5c', marginTop: 8 } }}>
            {items.length} record{items.length !== 1 ? 's' : ''} found
            {selectedItem && ` • Selected: ${selectedItem.text || selectedItem.name || selectedItem.id}`}
          </Text>
        </Stack>
      </Stack>

      <DialogFooter>
        <PrimaryButton
          onClick={handleSelect}
          text="Select"
          disabled={!selectedItem}
        />
        <DefaultButton onClick={onDismiss} text="Cancel" />
      </DialogFooter>
    </Dialog>
  );
};
