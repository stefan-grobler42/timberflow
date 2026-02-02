import React, { memo } from 'react';
import { Stack, Text, IconButton } from '@fluentui/react';

export interface BatchedProduction {
  id: string;
  orderNumber?: string;
  name?: string;
  estimatedEfinks?: number;
}

interface BatchedJobCardProps {
  batchId: string;
  productions: BatchedProduction[];
  customerName: string;
  totalEfinks: number;
  combinedDurationMinutes: number;
  top: number;
  height: number;
  isResizing?: boolean;
  canInteract?: boolean;
  onDragStart: (batchId: string) => void;
  onDoubleClick?: (batchId: string) => void;
  onClick?: (batchId: string) => void;
  onExpandClick: (batchId: string) => void;
  onResizeStart?: (e: React.MouseEvent, batchId: string, baseHeight: number) => void;
  formatDuration: (minutes: number) => string;
}

const BatchedJobCardComponent: React.FC<BatchedJobCardProps> = ({
  batchId,
  productions,
  customerName,
  totalEfinks,
  combinedDurationMinutes,
  top,
  height,
  isResizing = false,
  canInteract = true,
  onDragStart,
  onDoubleClick,
  onClick,
  onExpandClick,
  onResizeStart,
  formatDuration
}) => {
  const orderNumbers = productions
    .map(p => p.orderNumber)
    .filter(Boolean)
    .join(', ');

  const descriptions = productions
    .map(p => p.name)
    .filter(Boolean);

  return (
    <div
      draggable={canInteract}
      onDragStart={() => canInteract && onDragStart(batchId)}
      onDoubleClick={() => onDoubleClick?.(batchId)}
      onClick={() => onClick?.(batchId)}
      style={{
        position: 'absolute',
        top: top + 4,
        left: 4,
        right: 4,
        height: height,
        padding: 8,
        background: 'linear-gradient(135deg, rgba(16, 124, 16, 0.9), rgba(0, 100, 0, 0.8))',
        color: 'white',
        borderRadius: 6,
        border: '2px solid rgba(34, 177, 76, 0.8)',
        cursor: isResizing ? 'ns-resize' : 'grab',
        zIndex: isResizing ? 100 : 15,
        boxShadow: `
          0 4px 12px rgba(16, 124, 16, 0.4),
          inset 0 1px 0 rgba(255,255,255,0.25),
          4px 4px 0 -2px rgba(16, 124, 16, 0.3),
          6px 6px 0 -4px rgba(16, 124, 16, 0.2)
        `,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: 2,
        left: 2,
        backgroundColor: 'rgba(34, 177, 76, 0.9)',
        color: 'white',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 9,
        fontWeight: 600,
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        gap: 4
      }}>
        <span style={{ fontSize: 10 }}>📦</span>
        BATCH ({productions.length})
      </div>

      <IconButton
        iconProps={{ iconName: 'OpenPane' }}
        title="Manage batch"
        ariaLabel="Manage batch"
        onClick={(e) => {
          e.stopPropagation();
          onExpandClick(batchId);
        }}
        styles={{
          root: {
            position: 'absolute',
            top: 2,
            right: 2,
            width: 24,
            height: 24,
            minWidth: 24,
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 4
          },
          icon: { fontSize: 12, color: 'white' },
          rootHovered: { backgroundColor: 'rgba(255,255,255,0.4)' }
        }}
      />

      <Stack style={{ marginTop: 18 }}>
        <Text variant="small" styles={{ root: { color: 'white', fontWeight: 600 } }}>
          {orderNumbers || 'No order numbers'}
        </Text>
        <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.9)' } }}>
          {customerName}
        </Text>
        
        {descriptions.length > 0 && (
          <Stack style={{ marginTop: 4, maxHeight: height > 100 ? 40 : 20, overflow: 'hidden' }}>
            {descriptions.slice(0, height > 100 ? 3 : 1).map((desc, idx) => (
              <Text 
                key={idx} 
                variant="tiny" 
                styles={{ 
                  root: { 
                    color: 'rgba(255,255,255,0.8)', 
                    fontSize: 10,
                    fontStyle: 'italic',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  } 
                }}
              >
                {desc}
              </Text>
            ))}
            {descriptions.length > (height > 100 ? 3 : 1) && (
              <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.6)', fontSize: 9 } }}>
                +{descriptions.length - (height > 100 ? 3 : 1)} more...
              </Text>
            )}
          </Stack>
        )}
      </Stack>

      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }} wrap style={{ marginTop: 'auto' }}>
        <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.95)', fontWeight: 600 } }}>
          {totalEfinks.toFixed(2)} E-Finks (total)
        </Text>
        <Text variant="tiny" styles={{ root: { color: 'rgba(255,255,255,0.8)' } }}>
          ({formatDuration(combinedDurationMinutes)})
        </Text>
      </Stack>

      {onResizeStart && (
        <div
          onMouseDown={(e) => onResizeStart(e, batchId, height)}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 10,
            cursor: 'ns-resize',
            backgroundColor: isResizing ? 'rgba(255,255,255,0.3)' : 'transparent',
            borderTop: isResizing ? '2px dashed rgba(255,255,255,0.5)' : 'none'
          }}
          title="Drag to resize"
        >
          <div style={{
            position: 'absolute',
            bottom: 2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 30,
            height: 3,
            backgroundColor: 'rgba(255,255,255,0.4)',
            borderRadius: 2
          }} />
        </div>
      )}
    </div>
  );
};

export const BatchedJobCard = memo(BatchedJobCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.batchId === nextProps.batchId &&
    prevProps.top === nextProps.top &&
    prevProps.height === nextProps.height &&
    prevProps.isResizing === nextProps.isResizing &&
    prevProps.totalEfinks === nextProps.totalEfinks &&
    prevProps.combinedDurationMinutes === nextProps.combinedDurationMinutes &&
    prevProps.productions.length === nextProps.productions.length &&
    prevProps.customerName === nextProps.customerName
  );
});
