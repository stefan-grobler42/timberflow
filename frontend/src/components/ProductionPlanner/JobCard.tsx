import React, { memo } from 'react';
import { Stack, Text, IconButton } from '@fluentui/react';

interface Job {
  id: string;
  name: string;
  orderNumber: string;
  customer: string;
  estimatedEFinks: number;
  plannedDateStr: string | null;
  jigId: string | null;
  productionComplete: boolean;
  customDurationMinutes?: number;
  parentProductionId?: string | null;
  rolloverSequence?: number;
  createdOn?: string;
  plannedStartTime?: number | null;
  plannedEndTime?: number | null;
  plannedDurationMinutes?: number | null;
  breakAdjustmentMinutes?: number | null;
}

interface BreakAddition {
  label: string;
  minutes: number;
}

interface JobCardProps {
  job: Job;
  top: number;
  height: number;
  baseHeight: number;
  breakAdditions: BreakAddition[];
  isOverflowing: boolean;
  overflowMinutes: number;
  isStaged: boolean;
  isPrimary: boolean;
  hasManualResize: boolean;
  isResizing: boolean;
  canInteract: boolean;
  onDragStart: (jobId: string) => void;
  onDoubleClick: (jobId: string) => void;
  onClick: (jobId: string) => void;
  onResizeStart: (e: React.MouseEvent, jobId: string, baseHeight: number) => void;
  onResetDuration?: (jobId: string) => void;
  formatDuration: (minutes: number) => string;
  getBaseDurationMinutes: (job: Job) => number;
  formatBreakAdditions: (breaks: BreakAddition[]) => string;
}

const JobCardComponent: React.FC<JobCardProps> = ({
  job,
  top,
  height,
  baseHeight,
  breakAdditions,
  isOverflowing,
  overflowMinutes,
  isStaged,
  isPrimary,
  hasManualResize,
  isResizing,
  canInteract,
  onDragStart,
  onDoubleClick,
  onClick,
  onResizeStart,
  onResetDuration,
  formatDuration,
  getBaseDurationMinutes,
  formatBreakAdditions
}) => {
  const getBackground = () => {
    if (isStaged) return 'linear-gradient(135deg, rgba(255, 185, 0, 0.95), rgba(200, 140, 0, 0.85))';
    if (isOverflowing) return 'linear-gradient(135deg, rgba(198, 40, 40, 0.95), rgba(160, 30, 30, 0.85))';
    if (job.productionComplete) return 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))';
    return 'linear-gradient(135deg, rgba(0, 120, 212, 0.85), rgba(0, 90, 180, 0.75))';
  };
  
  const getBorder = () => {
    if (isPrimary) return '3px solid #ffb900';
    if (isStaged) return '2px dashed #ffb900';
    if (isOverflowing) return '2px solid #ff4444';
    if (job.productionComplete) return '1px solid rgba(180, 180, 180, 0.6)';
    return '1px solid rgba(255, 255, 255, 0.3)';
  };
  
  const getBoxShadow = () => {
    if (isStaged) return '0 4px 16px rgba(255, 185, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
    if (isOverflowing) return '0 4px 12px rgba(198, 40, 40, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
    if (job.productionComplete) return '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)';
    return '0 4px 12px rgba(0, 120, 212, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)';
  };

  return (
    <div
      draggable={canInteract}
      onDragStart={() => canInteract && onDragStart(job.id)}
      onDoubleClick={() => onDoubleClick(job.id)}
      onClick={() => onClick(job.id)}
      style={{
        position: 'absolute',
        top: top + 4,
        left: 4,
        right: 4,
        height: height,
        padding: 8,
        background: getBackground(),
        color: isStaged ? '#333' : (job.productionComplete ? '#555' : 'white'),
        borderRadius: 6,
        border: getBorder(),
        cursor: isOverflowing ? 'pointer' : (isResizing ? 'ns-resize' : 'grab'),
        zIndex: isStaged ? 200 : (isResizing ? 100 : 10),
        boxShadow: getBoxShadow(),
        opacity: job.productionComplete ? 0.7 : 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(4px)'
      }}
    >
      {isStaged && (
        <div style={{
          position: 'absolute',
          top: 2,
          left: 2,
          backgroundColor: '#fff4ce',
          color: '#996600',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 600,
          zIndex: 300
        }}>
          {isPrimary ? 'PRIMARY' : 'STAGED'}
        </div>
      )}
      
      {hasManualResize && onResetDuration && !job.productionComplete && (
        <IconButton
          iconProps={{ iconName: 'Refresh' }}
          title="Reset to calculated size"
          ariaLabel="Reset to calculated size"
          onClick={(e) => {
            e.stopPropagation();
            onResetDuration(job.id);
          }}
          styles={{
            root: {
              position: 'absolute',
              top: 2,
              right: 2,
              width: 20,
              height: 20,
              minWidth: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 4
            },
            icon: { fontSize: 10, color: 'white' },
            rootHovered: { backgroundColor: 'rgba(255,255,255,0.4)' }
          }}
        />
      )}
      
      {isOverflowing && (
        <Text styles={{ 
          root: { 
            position: 'absolute',
            top: 2,
            right: hasManualResize && onResetDuration ? 26 : 4,
            color: '#ffff00', 
            fontWeight: 700, 
            fontSize: 18, 
            lineHeight: 1 
          } 
        }}>!</Text>
      )}
      
      <Stack horizontal horizontalAlign="space-between" verticalAlign="start">
        <Stack>
          <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600 } }}>
            {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (Rollover)' : ''}{job.productionComplete ? ' (Complete)' : ''}
          </Text>
          <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'white' } }}>
            {job.customer}
          </Text>
        </Stack>
      </Stack>
      
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }} wrap>
        <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.8)', fontWeight: 600 } }}>
          {job.estimatedEFinks} E-Finks
        </Text>
        <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.7)' } }}>
          ({formatDuration(getBaseDurationMinutes(job))})
        </Text>
        {breakAdditions.length > 0 && (
          <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#b87333' : '#ffd700', fontWeight: 600 } }}>
            {formatBreakAdditions(breakAdditions)}
          </Text>
        )}
        {isOverflowing && (
          <Text variant="tiny" styles={{ root: { color: '#ffff00', fontWeight: 600 } }}>
            Overflow: {formatDuration(overflowMinutes)}
          </Text>
        )}
      </Stack>
      
      {!job.productionComplete && (
        <div
          onMouseDown={(e) => onResizeStart(e, job.id, baseHeight)}
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

export const JobCard = memo(JobCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.job.id === nextProps.job.id &&
    prevProps.top === nextProps.top &&
    prevProps.height === nextProps.height &&
    prevProps.isStaged === nextProps.isStaged &&
    prevProps.isPrimary === nextProps.isPrimary &&
    prevProps.isOverflowing === nextProps.isOverflowing &&
    prevProps.hasManualResize === nextProps.hasManualResize &&
    prevProps.isResizing === nextProps.isResizing &&
    prevProps.job.plannedStartTime === nextProps.job.plannedStartTime &&
    prevProps.job.plannedEndTime === nextProps.job.plannedEndTime &&
    prevProps.job.productionComplete === nextProps.job.productionComplete
  );
});
