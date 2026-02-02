import React from 'react';
import {
  Panel,
  PanelType,
  Stack,
  Text,
  DefaultButton,
  IconButton,
  Separator,
  MessageBar,
  MessageBarType
} from '@fluentui/react';

export interface BatchProduction {
  id: string;
  orderNumber?: string;
  name?: string;
  estimatedEfinks?: number;
}

interface BatchManagePanelProps {
  isOpen: boolean;
  batchId: string;
  productions: BatchProduction[];
  customerName: string;
  totalEfinks: number;
  combinedDurationMinutes: number;
  onDismiss: () => void;
  onRemoveProduction: (batchId: string, productionId: string) => void;
  onDissolveBatch: (batchId: string) => void;
  formatDuration: (minutes: number) => string;
  isLoading?: boolean;
}

export const BatchManagePanel: React.FC<BatchManagePanelProps> = ({
  isOpen,
  batchId,
  productions,
  customerName,
  totalEfinks,
  combinedDurationMinutes,
  onDismiss,
  onRemoveProduction,
  onDissolveBatch,
  formatDuration,
  isLoading = false
}) => {
  const individualDurationSum = productions.reduce((sum, p) => {
    const efinks = p.estimatedEfinks ?? 0;
    return sum + (efinks * 60);
  }, 0);

  const efficiencySavingsMinutes = Math.max(0, individualDurationSum - combinedDurationMinutes);
  const efficiencySavingsPercent = individualDurationSum > 0 
    ? ((efficiencySavingsMinutes / individualDurationSum) * 100).toFixed(1)
    : '0';

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      type={PanelType.medium}
      headerText="Manage Batch"
      closeButtonAriaLabel="Close"
      styles={{
        main: { backgroundColor: '#fafafa' },
        headerText: { fontWeight: 600 }
      }}
    >
      <Stack tokens={{ childrenGap: 16 }} style={{ padding: '8px 0' }}>
        <Stack
          styles={{
            root: {
              backgroundColor: 'rgba(16, 124, 16, 0.1)',
              border: '1px solid rgba(16, 124, 16, 0.3)',
              borderRadius: 8,
              padding: 16
            }
          }}
        >
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            <Text variant="large" styles={{ root: { fontWeight: 600, color: '#107c10' } }}>
              Batch Summary
            </Text>
            <Text variant="small" styles={{ root: { color: '#666' } }}>
              {productions.length} jobs batched
            </Text>
          </Stack>
          
          <Separator styles={{ root: { marginTop: 8, marginBottom: 8 } }} />
          
          <Stack tokens={{ childrenGap: 8 }}>
            <Stack horizontal horizontalAlign="space-between">
              <Text variant="medium">Customer:</Text>
              <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>{customerName}</Text>
            </Stack>
            <Stack horizontal horizontalAlign="space-between">
              <Text variant="medium">Total E-Finks:</Text>
              <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>{totalEfinks.toFixed(2)}</Text>
            </Stack>
            <Stack horizontal horizontalAlign="space-between">
              <Text variant="medium">Combined Duration:</Text>
              <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>{formatDuration(combinedDurationMinutes)}</Text>
            </Stack>
            {efficiencySavingsMinutes > 0 && (
              <Stack horizontal horizontalAlign="space-between">
                <Text variant="medium" styles={{ root: { color: '#107c10' } }}>Efficiency Savings:</Text>
                <Text variant="medium" styles={{ root: { fontWeight: 600, color: '#107c10' } }}>
                  {formatDuration(efficiencySavingsMinutes)} ({efficiencySavingsPercent}%)
                </Text>
              </Stack>
            )}
          </Stack>
        </Stack>

        <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
          Productions in Batch
        </Text>

        <Stack tokens={{ childrenGap: 8 }}>
          {productions.map((production) => (
            <Stack
              key={production.id}
              horizontal
              verticalAlign="center"
              horizontalAlign="space-between"
              styles={{
                root: {
                  backgroundColor: 'white',
                  border: '1px solid #e1e1e1',
                  borderRadius: 6,
                  padding: '12px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack tokens={{ childrenGap: 4 }} style={{ flex: 1, minWidth: 0 }}>
                <Text 
                  variant="medium" 
                  styles={{ 
                    root: { 
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    } 
                  }}
                >
                  {production.orderNumber || 'No Order #'}
                </Text>
                {production.name && (
                  <Text 
                    variant="small" 
                    styles={{ 
                      root: { 
                        color: '#666',
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      } 
                    }}
                  >
                    {production.name}
                  </Text>
                )}
                <Text variant="small" styles={{ root: { color: '#107c10', fontWeight: 500 } }}>
                  {production.estimatedEfinks?.toFixed(2) ?? '0.00'} E-Finks
                </Text>
              </Stack>
              
              <IconButton
                iconProps={{ iconName: 'Remove' }}
                title="Remove from batch"
                ariaLabel="Remove from batch"
                disabled={isLoading || productions.length <= 2}
                onClick={() => onRemoveProduction(batchId, production.id)}
                styles={{
                  root: {
                    marginLeft: 12,
                    backgroundColor: 'rgba(164, 38, 44, 0.1)',
                    borderRadius: 4
                  },
                  icon: { color: '#a4262c' },
                  rootHovered: { backgroundColor: 'rgba(164, 38, 44, 0.2)' },
                  rootDisabled: { backgroundColor: 'transparent' }
                }}
              />
            </Stack>
          ))}
        </Stack>

        {productions.length <= 2 && (
          <MessageBar messageBarType={MessageBarType.info}>
            A batch requires at least 2 productions. Removing more will dissolve the batch.
          </MessageBar>
        )}

        <Separator />

        <Stack horizontal tokens={{ childrenGap: 12 }} horizontalAlign="end">
          <DefaultButton
            text="Close"
            onClick={onDismiss}
          />
          <DefaultButton
            text="Dissolve Batch"
            iconProps={{ iconName: 'Delete' }}
            disabled={isLoading}
            onClick={() => onDissolveBatch(batchId)}
            styles={{
              root: {
                backgroundColor: '#a4262c',
                borderColor: '#a4262c',
                color: 'white'
              },
              rootHovered: {
                backgroundColor: '#8b1d22',
                borderColor: '#8b1d22',
                color: 'white'
              },
              rootPressed: {
                backgroundColor: '#751a1e',
                borderColor: '#751a1e',
                color: 'white'
              }
            }}
          />
        </Stack>
      </Stack>
    </Panel>
  );
};
