import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Text,
  Dropdown,
  TextField,
  Slider,
  PrimaryButton,
  DefaultButton,
  IconButton,
  MessageBar,
  MessageBarType,
  Spinner,
  SpinnerSize,
  Panel,
  Dialog,
  DialogType,
  DialogFooter,
  Checkbox,
  Separator,
  Label,
  ChoiceGroup,
} from '@fluentui/react';
import type { IChoiceGroupOption } from '@fluentui/react';
import { duplicateService } from '../services';
import type {
  DuplicateMatchRule,
  DuplicateDetectionRequest,
  DuplicateGroup,
  DuplicateMergeRequest,
} from '../types/duplicates';
import { ENTITY_TYPES, ENTITY_FIELDS, MATCH_TYPES } from '../types/duplicates';

export const DuplicateDetectionPage = () => {
  const [searchParams] = useSearchParams();
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [matchRules, setMatchRules] = useState<DuplicateMatchRule[]>([
    { fieldName: '', matchType: 'CaseInsensitive', weight: 5 },
  ]);
  const [minimumScore, setMinimumScore] = useState<number>(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [totalDuplicates, setTotalDuplicates] = useState<number>(0);

  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [selectedDuplicateIds, setSelectedDuplicateIds] = useState<string[]>([]);
  const [isMergePanelOpen, setIsMergePanelOpen] = useState(false);
  const [merging, setMerging] = useState(false);
  const [fieldSelections, setFieldSelections] = useState<Record<string, string>>({});
  const [mergeSuccess, setMergeSuccess] = useState<string | null>(null);
  const [confirmMergeDialog, setConfirmMergeDialog] = useState(false);
  const [weightErrors, setWeightErrors] = useState<Record<number, string>>({});

  const availableFields = selectedEntityType ? ENTITY_FIELDS[selectedEntityType] || [] : [];

  useEffect(() => {
    const entityParam = searchParams.get('entity');
    if (entityParam) {
      setSelectedEntityType(entityParam);
    }
  }, [searchParams]);

  useEffect(() => {
    setDuplicateGroups([]);
    setTotalDuplicates(0);
    setError(null);
    setMergeSuccess(null);
  }, [selectedEntityType]);

  const addMatchRule = () => {
    setMatchRules([
      ...matchRules,
      { fieldName: '', matchType: 'CaseInsensitive', weight: 5 },
    ]);
  };

  const removeMatchRule = (index: number) => {
    setMatchRules(matchRules.filter((_, i) => i !== index));
  };

  const updateMatchRule = (index: number, field: keyof DuplicateMatchRule, value: any) => {
    const updated = [...matchRules];
    updated[index] = { ...updated[index], [field]: value };
    setMatchRules(updated);

    if (field === 'weight') {
      const weight = typeof value === 'number' ? value : parseInt(value);
      const newWeightErrors = { ...weightErrors };
      
      if (isNaN(weight) || weight < 1 || weight > 10) {
        newWeightErrors[index] = 'Weight must be between 1 and 10';
      } else {
        delete newWeightErrors[index];
      }
      
      setWeightErrors(newWeightErrors);
    }
  };

  const handleFindDuplicates = async () => {
    if (!selectedEntityType) {
      setError('Please select an entity type');
      return;
    }

    const validRules = matchRules.filter((rule) => rule.fieldName);
    if (validRules.length === 0) {
      setError('Please add at least one valid match rule');
      return;
    }

    if (Object.keys(weightErrors).length > 0) {
      setError('Please fix weight validation errors before continuing');
      return;
    }

    setLoading(true);
    setError(null);
    setDuplicateGroups([]);
    setTotalDuplicates(0);

    try {
      const request: DuplicateDetectionRequest = {
        entityType: selectedEntityType,
        matchRules: validRules,
        minimumScore,
      };

      const response = await duplicateService.findDuplicates(request);
      setDuplicateGroups(response.duplicateGroups);
      setTotalDuplicates(response.totalDuplicates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find duplicates');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group: DuplicateGroup) => {
    setSelectedGroup(group);
    setSelectedDuplicateIds([]);
    setFieldSelections({});
  };

  const handleDuplicateCheckbox = (duplicateId: string, checked: boolean) => {
    if (checked) {
      setSelectedDuplicateIds([...selectedDuplicateIds, duplicateId]);
    } else {
      setSelectedDuplicateIds(selectedDuplicateIds.filter((id) => id !== duplicateId));
    }
  };

  const handleMergeSelected = () => {
    if (!selectedGroup || selectedDuplicateIds.length === 0) return;

    const initialSelections: Record<string, string> = {};
    Object.keys(selectedGroup.masterRecord.fields).forEach((fieldKey) => {
      initialSelections[fieldKey] = selectedGroup.masterRecord.id;
    });
    setFieldSelections(initialSelections);
    setIsMergePanelOpen(true);
  };

  const handleFieldSelection = (fieldName: string, recordId: string) => {
    setFieldSelections({
      ...fieldSelections,
      [fieldName]: recordId,
    });
  };

  const handleConfirmMerge = async () => {
    if (!selectedGroup) return;

    setMerging(true);
    setError(null);

    try {
      const request: DuplicateMergeRequest = {
        entityType: selectedEntityType,
        masterRecordId: selectedGroup.masterRecord.id,
        duplicateRecordIds: selectedDuplicateIds,
        fieldSelections,
      };

      const response = await duplicateService.mergeDuplicates(request);
      setMergeSuccess(
        `Merge successful! Deleted ${response.deletedRecordCount} record(s), relinked ${response.relinkedRecordCount} record(s).`
      );
      setIsMergePanelOpen(false);
      setConfirmMergeDialog(false);
      setSelectedGroup(null);
      setSelectedDuplicateIds([]);
      setFieldSelections({});
      
      handleFindDuplicates();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge duplicates');
    } finally {
      setMerging(false);
    }
  };

  const getAllRecordsForField = (fieldName: string): IChoiceGroupOption[] => {
    if (!selectedGroup) return [];

    const options: IChoiceGroupOption[] = [
      {
        key: selectedGroup.masterRecord.id,
        text: `Master: ${selectedGroup.masterRecord.fields[fieldName] ?? '(empty)'}`,
      },
    ];

    selectedGroup.duplicateRecords
      .filter((dup) => selectedDuplicateIds.includes(dup.id))
      .forEach((dup) => {
        options.push({
          key: dup.id,
          text: `Duplicate: ${dup.fields[fieldName] ?? '(empty)'}`,
        });
      });

    return options;
  };

  return (
    <Stack tokens={{ childrenGap: 20 }}>
      <Text variant="xxLarge">Duplicate Detection & Merge</Text>

      {error && (
        <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
          {error}
        </MessageBar>
      )}

      {mergeSuccess && (
        <MessageBar
          messageBarType={MessageBarType.success}
          onDismiss={() => setMergeSuccess(null)}
        >
          {mergeSuccess}
        </MessageBar>
      )}

      <Stack
        styles={{
          root: {
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 4,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        }}
        tokens={{ childrenGap: 16 }}
      >
        <Text variant="xLarge">Configuration</Text>

        <Dropdown
          label="Entity Type"
          placeholder="Select entity type"
          options={ENTITY_TYPES}
          selectedKey={selectedEntityType}
          onChange={(_, option) => {
            setSelectedEntityType(option?.key as string || '');
            setMatchRules([{ fieldName: '', matchType: 'CaseInsensitive', weight: 5 }]);
          }}
          required
        />

        <Stack tokens={{ childrenGap: 12 }}>
          <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 8 }}>
            <Text variant="large">Match Rules</Text>
            <DefaultButton
              text="Add Rule"
              iconProps={{ iconName: 'Add' }}
              onClick={addMatchRule}
            />
          </Stack>

          {matchRules.map((rule, index) => (
            <Stack
              key={index}
              horizontal
              verticalAlign="end"
              tokens={{ childrenGap: 12 }}
              styles={{
                root: {
                  padding: 12,
                  backgroundColor: '#f3f2f1',
                  borderRadius: 4,
                },
              }}
            >
              <Dropdown
                label="Field"
                placeholder="Select field"
                options={availableFields.map((f) => ({ key: f.key, text: f.name }))}
                selectedKey={rule.fieldName}
                onChange={(_, option) =>
                  updateMatchRule(index, 'fieldName', option?.key as string)
                }
                styles={{ root: { width: 200 } }}
                disabled={!selectedEntityType}
              />

              <Dropdown
                label="Match Type"
                options={MATCH_TYPES}
                selectedKey={rule.matchType}
                onChange={(_, option) =>
                  updateMatchRule(index, 'matchType', option?.key as string)
                }
                styles={{ root: { width: 180 } }}
              />

              <TextField
                label="Weight (1-10)"
                type="number"
                min={1}
                max={10}
                value={rule.weight.toString()}
                onChange={(_, value) =>
                  updateMatchRule(index, 'weight', parseInt(value || '1'))
                }
                errorMessage={weightErrors[index]}
                styles={{ root: { width: 100 } }}
              />

              <IconButton
                iconProps={{ iconName: 'Delete' }}
                title="Remove rule"
                ariaLabel="Remove rule"
                onClick={() => removeMatchRule(index)}
                disabled={matchRules.length === 1}
                styles={{ root: { marginBottom: 4 } }}
              />
            </Stack>
          ))}
        </Stack>

        <Stack>
          <Label>Minimum Match Score: {minimumScore}%</Label>
          <Slider
            min={0}
            max={100}
            step={5}
            value={minimumScore}
            onChange={(value) => setMinimumScore(value)}
            showValue={false}
          />
        </Stack>

        <PrimaryButton
          text="Find Duplicates"
          iconProps={{ iconName: 'Search' }}
          onClick={handleFindDuplicates}
          disabled={loading || !selectedEntityType}
          styles={{ root: { maxWidth: 200 } }}
        />
      </Stack>

      {loading && (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 16 }}>
          <Spinner size={SpinnerSize.large} label="Finding duplicates..." />
        </Stack>
      )}

      {!loading && duplicateGroups.length > 0 && (
        <Stack
          styles={{
            root: {
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 4,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            },
          }}
          tokens={{ childrenGap: 16 }}
        >
          <Text variant="xLarge">
            Results: {duplicateGroups.length} duplicate group(s) found ({totalDuplicates} total
            duplicates)
          </Text>

          {duplicateGroups.map((group, groupIndex) => (
            <Stack
              key={groupIndex}
              styles={{
                root: {
                  padding: 16,
                  backgroundColor: '#faf9f8',
                  borderRadius: 4,
                  border: selectedGroup === group ? '2px solid #59AAD5' : '1px solid #e1dfdd',
                  cursor: 'pointer',
                },
              }}
              tokens={{ childrenGap: 12 }}
              onClick={() => handleGroupClick(group)}
            >
              <Text variant="large">
                Group {groupIndex + 1} ({group.duplicateRecords.length} duplicate
                {group.duplicateRecords.length !== 1 ? 's' : ''})
              </Text>

              <Stack horizontal tokens={{ childrenGap: 20 }}>
                <Stack
                  styles={{
                    root: {
                      flex: 1,
                      padding: 12,
                      backgroundColor: '#e6f4ea',
                      borderRadius: 4,
                      border: '2px solid #34a853',
                    },
                  }}
                >
                  <Text variant="medium" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                    Master Record (ID: {group.masterRecord.id})
                  </Text>
                  {Object.entries(group.masterRecord.fields).map(([key, value]) => (
                    <Text key={key} variant="small">
                      <strong>{key}:</strong> {value ?? '(empty)'}
                    </Text>
                  ))}
                </Stack>

                <Stack tokens={{ childrenGap: 12 }} styles={{ root: { flex: 1 } }}>
                  {group.duplicateRecords.map((duplicate) => (
                    <Stack
                      key={duplicate.id}
                      styles={{
                        root: {
                          padding: 12,
                          backgroundColor: 'white',
                          borderRadius: 4,
                          border: '1px solid #e1dfdd',
                        },
                      }}
                    >
                      <Stack 
                        horizontal 
                        verticalAlign="center" 
                        tokens={{ childrenGap: 8 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={selectedDuplicateIds.includes(duplicate.id)}
                          onChange={(_, checked) =>
                            handleDuplicateCheckbox(duplicate.id, checked || false)
                          }
                        />
                        <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                          Duplicate (ID: {duplicate.id}, Match: {duplicate.matchScore}%)
                        </Text>
                      </Stack>
                      {Object.entries(duplicate.fields).map(([key, value]) => (
                        <Text key={key} variant="small">
                          <strong>{key}:</strong> {value ?? '(empty)'}
                        </Text>
                      ))}
                    </Stack>
                  ))}
                </Stack>
              </Stack>

              {selectedGroup === group && selectedDuplicateIds.length > 0 && (
                <PrimaryButton
                  text={`Merge ${selectedDuplicateIds.length} Selected Duplicate${selectedDuplicateIds.length !== 1 ? 's' : ''}`}
                  iconProps={{ iconName: 'Merge' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMergeSelected();
                  }}
                  styles={{ root: { maxWidth: 300 } }}
                />
              )}
            </Stack>
          ))}
        </Stack>
      )}

      {!loading && duplicateGroups.length === 0 && totalDuplicates === 0 && matchRules.some(r => r.fieldName) && (
        <MessageBar messageBarType={MessageBarType.info}>
          No duplicates found with the current configuration.
        </MessageBar>
      )}

      <Panel
        isOpen={isMergePanelOpen}
        onDismiss={() => setIsMergePanelOpen(false)}
        headerText="Configure Merge"
        closeButtonAriaLabel="Close"
        type={4}
        isLightDismiss
      >
        <Stack tokens={{ childrenGap: 20 }} styles={{ root: { marginTop: 20 } }}>
          <Text>Select which field values to keep in the merged record:</Text>

          {selectedGroup &&
            Object.keys(selectedGroup.masterRecord.fields).map((fieldName) => (
              <Stack key={fieldName} tokens={{ childrenGap: 8 }}>
                <Label>{fieldName}</Label>
                <ChoiceGroup
                  selectedKey={fieldSelections[fieldName]}
                  options={getAllRecordsForField(fieldName)}
                  onChange={(_, option) =>
                    handleFieldSelection(fieldName, option?.key as string)
                  }
                />
              </Stack>
            ))}

          <Separator />

          <Stack tokens={{ childrenGap: 8 }}>
            <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
              Preview of Merged Record:
            </Text>
            {selectedGroup &&
              Object.keys(selectedGroup.masterRecord.fields).map((fieldName) => {
                const selectedRecordId = fieldSelections[fieldName];
                let selectedValue = '(not selected)';

                if (selectedRecordId === selectedGroup.masterRecord.id) {
                  selectedValue = selectedGroup.masterRecord.fields[fieldName] ?? '(empty)';
                } else {
                  const duplicate = selectedGroup.duplicateRecords.find(
                    (d) => d.id === selectedRecordId
                  );
                  if (duplicate) {
                    selectedValue = duplicate.fields[fieldName] ?? '(empty)';
                  }
                }

                return (
                  <Text key={fieldName} variant="small">
                    <strong>{fieldName}:</strong> {selectedValue}
                  </Text>
                );
              })}
          </Stack>

          <Separator />

          <MessageBar messageBarType={MessageBarType.warning}>
            The selected duplicate records will be deleted, and any related records will be
            relinked to the master record.
          </MessageBar>

          <Stack horizontal tokens={{ childrenGap: 12 }}>
            <PrimaryButton
              text="Confirm Merge"
              onClick={() => setConfirmMergeDialog(true)}
              disabled={merging}
            />
            <DefaultButton
              text="Cancel"
              onClick={() => setIsMergePanelOpen(false)}
              disabled={merging}
            />
          </Stack>
        </Stack>
      </Panel>

      <Dialog
        hidden={!confirmMergeDialog}
        onDismiss={() => setConfirmMergeDialog(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Confirm Merge',
          subText: `Are you sure you want to merge ${selectedDuplicateIds.length} duplicate record(s)? This action cannot be undone.`,
        }}
      >
        <DialogFooter>
          <PrimaryButton
            onClick={handleConfirmMerge}
            text="Yes, Merge"
            disabled={merging}
          />
          <DefaultButton onClick={() => setConfirmMergeDialog(false)} text="Cancel" />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};
