import { useState } from 'react';
import {
  Panel,
  Stack,
  Dropdown,
  TextField,
  IconButton,
  PrimaryButton,
  DefaultButton,
  Text,
  Separator,
} from '@fluentui/react';
import type { IDropdownOption } from '@fluentui/react';
import type { GridFilter } from '../types/gridView';

interface FilterBuilderProps {
  isOpen: boolean;
  onDismiss: () => void;
  filters: GridFilter[];
  onFiltersChange: (filters: GridFilter[]) => void;
  availableFields: { key: string; name: string; type: 'text' | 'number' | 'date' | 'boolean' }[];
}

const operatorOptions: IDropdownOption[] = [
  { key: 'equals', text: 'Equals' },
  { key: 'notEquals', text: 'Does not equal' },
  { key: 'contains', text: 'Contains' },
  { key: 'notContains', text: 'Does not contain' },
  { key: 'beginsWith', text: 'Begins with' },
  { key: 'endsWith', text: 'Ends with' },
  { key: 'greaterThan', text: 'Greater than' },
  { key: 'lessThan', text: 'Less than' },
  { key: 'greaterThanOrEqual', text: 'Greater than or equal to' },
  { key: 'lessThanOrEqual', text: 'Less than or equal to' },
  { key: 'isEmpty', text: 'Is empty' },
  { key: 'isNotEmpty', text: 'Is not empty' },
];

export const FilterBuilder = ({
  isOpen,
  onDismiss,
  filters,
  onFiltersChange,
  availableFields,
}: FilterBuilderProps) => {
  const [localFilters, setLocalFilters] = useState<GridFilter[]>(filters);

  const addFilter = () => {
    setLocalFilters([
      ...localFilters,
      {
        field: availableFields[0]?.key || '',
        operator: 'equals',
        value: '',
        logicOperator: 'AND',
      },
    ]);
  };

  const updateFilter = (index: number, updates: Partial<GridFilter>) => {
    const updated = [...localFilters];
    updated[index] = { ...updated[index], ...updates };
    setLocalFilters(updated);
  };

  const removeFilter = (index: number) => {
    setLocalFilters(localFilters.filter((_, i) => i !== index));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    onDismiss();
  };

  const resetFilters = () => {
    setLocalFilters([]);
    onFiltersChange([]);
  };

  const fieldOptions: IDropdownOption[] = availableFields.map((field) => ({
    key: field.key,
    text: field.name,
  }));

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      headerText="Edit filters"
      isFooterAtBottom={true}
      onRenderFooterContent={() => (
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <PrimaryButton text="Apply" onClick={applyFilters} />
          <DefaultButton text="Reset to default" onClick={resetFilters} />
          <DefaultButton text="Cancel" onClick={onDismiss} />
        </Stack>
      )}
    >
      <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 16 } }}>
        <Text variant="small">Showing live data</Text>

        {localFilters.map((filter, index) => (
          <Stack key={index} tokens={{ childrenGap: 8 }}>
            {index > 0 && (
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <Dropdown
                  selectedKey={filter.logicOperator || 'AND'}
                  options={[
                    { key: 'AND', text: 'AND' },
                    { key: 'OR', text: 'OR' },
                  ]}
                  onChange={(_, option) =>
                    updateFilter(index, { logicOperator: option?.key as 'AND' | 'OR' })
                  }
                  styles={{ root: { width: 80 } }}
                />
              </Stack>
            )}

            <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 8 }}>
              <Dropdown
                label={index === 0 ? 'Field' : undefined}
                selectedKey={filter.field}
                options={fieldOptions}
                onChange={(_, option) => updateFilter(index, { field: option?.key as string })}
                styles={{ root: { flex: 1 } }}
              />

              <Dropdown
                label={index === 0 ? 'Operator' : undefined}
                selectedKey={filter.operator}
                options={operatorOptions}
                onChange={(_, option) =>
                  updateFilter(index, {
                    operator: option?.key as GridFilter['operator'],
                  })
                }
                styles={{ root: { flex: 1 } }}
              />

              {filter.operator !== 'isEmpty' && filter.operator !== 'isNotEmpty' && (
                <TextField
                  label={index === 0 ? 'Value' : undefined}
                  value={filter.value}
                  onChange={(_, value) => updateFilter(index, { value: value || '' })}
                  styles={{ root: { flex: 1 } }}
                />
              )}

              <IconButton
                iconProps={{ iconName: 'Delete' }}
                title="Remove filter"
                onClick={() => removeFilter(index)}
                styles={{ root: { marginBottom: index === 0 ? 0 : undefined } }}
              />
            </Stack>

            {index < localFilters.length - 1 && <Separator />}
          </Stack>
        ))}

        <DefaultButton
          text="Add"
          iconProps={{ iconName: 'Add' }}
          onClick={addFilter}
          styles={{ root: { width: 'fit-content' } }}
        />
      </Stack>
    </Panel>
  );
};
