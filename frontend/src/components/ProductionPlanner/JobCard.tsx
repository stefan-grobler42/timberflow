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
  createdOn?: string;
  plannedStartTime?: number | null;
  plannedEndTime?: number | null;
  plannedDurationMinutes?: number | null;
  breakAdjustmentMinutes?: number | null;
  actualStartTime?: string | null;
  actualEndTime?: string | null;
  actualDurationMinutes?: number | null;
  stageDurations?: {
    pickingMinutes: number;
    sawingMinutes: number;
    productionMinutes: number;
    totalLabourMinutes: number;
  } | null;
  totalJobDuration?: number | null;
  segmentIndex?: number | null;
  totalSegments?: number | null;
  segmentEfinks?: number | null;
  segmentDuration?: number | null;
  segmentBreakMinutes?: number | null;
  isLastSegment?: boolean;
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
  isStaged: boolean;
  isPrimary: boolean;
  hasManualResize: boolean;
  isResizing: boolean;
  canInteract: boolean;
  isDraggedOver?: boolean;
  onDragStart: (jobId: string) => void;
  onDoubleClick: (jobId: string) => void;
  onClick: (jobId: string) => void;
  onResizeStart: (e: React.MouseEvent, jobId: string, baseHeight: number) => void;
  onResetDuration?: (jobId: string) => void;
  onSaveJob?: (jobId: string) => void;
  onEditJob?: (jobId: string) => void;
  onDropOnJob?: (targetJobId: string) => void;
  onDragOverJob?: (jobId: string | null) => void;
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
  isStaged,
  isPrimary,
  hasManualResize,
  isResizing,
  canInteract,
  isDraggedOver = false,
  onDragStart,
  onDoubleClick,
  onClick,
  onResizeStart,
  onResetDuration,
  onSaveJob,
  onEditJob,
  onDropOnJob,
  onDragOverJob,
  formatDuration,
  getBaseDurationMinutes,
  formatBreakAdditions
}) => {
  const isMultiDay = job.totalSegments && job.totalSegments > 1;
  const isFirstSegment = job.segmentIndex === 0;
  const formatClockTime = (value?: string | null): string => {
    if (!value) return '-';
    return new Date(value).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };
  const formatEfficiency = (plannedMinutes?: number | null, actualMinutes?: number | null): string => {
    if (!plannedMinutes || !actualMinutes) return '-';
    return `${Math.round((plannedMinutes / actualMinutes) * 100)}%`;
  };
  const hasStageDurations = Boolean(job.stageDurations && job.stageDurations.totalLabourMinutes > 0);
  const getBackground = () => {
    if (isStaged) return 'linear-gradient(135deg, rgba(255, 185, 0, 0.95), rgba(200, 140, 0, 0.85))';
    if (job.productionComplete) return 'linear-gradient(135deg, rgba(180, 180, 180, 0.85), rgba(200, 200, 200, 0.75))';
    return 'linear-gradient(135deg, rgba(0, 120, 212, 0.85), rgba(0, 90, 180, 0.75))';
  };
  
  const getBorder = () => {
    if (isPrimary) return '3px solid #ffb900';
    if (isStaged) return '2px dashed #ffb900';
    if (job.productionComplete) return '1px solid rgba(180, 180, 180, 0.6)';
    return '1px solid rgba(255, 255, 255, 0.3)';
  };
  
  const getBoxShadow = () => {
    if (isDraggedOver) return '0 0 0 3px #107c10, 0 4px 16px rgba(16, 124, 16, 0.5)';
    if (isStaged) return '0 4px 16px rgba(255, 185, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)';
    if (job.productionComplete) return '0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)';
    return '0 4px 12px rgba(0, 120, 212, 0.35), inset 0 1px 0 rgba(255,255,255,0.25)';
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!job.productionComplete && !isStaged) {
      e.preventDefault();
      e.stopPropagation();
      onDragOverJob?.(job.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragOverJob?.(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOverJob?.(null);
    if (!job.productionComplete && !isStaged && onDropOnJob) {
      onDropOnJob(job.id);
    }
  };

  return (
    <div
      draggable={canInteract}
      onDragStart={() => canInteract && onDragStart(job.id)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
        cursor: isResizing ? 'ns-resize' : 'grab',
        zIndex: isStaged ? 200 : (isResizing ? 100 : 10),
        boxShadow: getBoxShadow(),
        opacity: job.productionComplete ? 0.7 : 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(4px)'
      }}
    >
      {isDraggedOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#107c10',
          color: 'white',
          padding: '8px 16px',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 700,
          zIndex: 400,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          + COMBINE
        </div>
      )}
      {isStaged && !isDraggedOver && (
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
      
      {/* Multi-day span indicator */}
      {job.totalSegments && job.totalSegments > 1 && (
        <div style={{
          position: 'absolute',
          top: 2,
          right: hasManualResize && onResetDuration && !job.productionComplete ? 26 : 4,
          backgroundColor: 'rgba(255, 140, 0, 0.9)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: 4,
          fontSize: 9,
          fontWeight: 600,
          zIndex: 300
        }}>
          Day {(job.segmentIndex ?? 0) + 1}/{job.totalSegments}
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
      
      <Stack horizontal horizontalAlign="space-between" verticalAlign="start">
        <Stack>
          <Text variant="small" styles={{ root: { color: job.productionComplete ? '#666' : 'white', fontWeight: 600 } }}>
            {job.orderNumber}{job.name?.includes('(Rollover)') || job.name?.includes('(Roll Over)') ? ' (Rollover)' : ''}{job.productionComplete ? ' (Complete)' : ''}
          </Text>
          <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'white' } }}>
            {job.customer}
          </Text>
          {job.name && !job.name.includes('(Rollover)') && !job.name.includes('(Roll Over)') && (
            <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#888' : 'rgba(255,255,255,0.85)', fontSize: 11, fontStyle: 'italic' } }}>
              {job.name}
            </Text>
          )}
        </Stack>
      </Stack>
      
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }} wrap>
        <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.8)', fontWeight: 600 } }}>
          {job.estimatedEFinks} E-Finks
        </Text>
        <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,255,255,0.7)' } }}>
          ({formatDuration(getBaseDurationMinutes(job))}{job.totalSegments && job.totalSegments > 1 ? ' total' : ''})
        </Text>
        {breakAdditions.length > 0 && (
          <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#b87333' : '#ffd700', fontWeight: 600 } }}>
            {formatBreakAdditions(breakAdditions)}
          </Text>
        )}
      </Stack>
      
      {/* Per-day segment details for multi-day jobs */}
      {job.totalSegments && job.totalSegments > 1 && job.segmentEfinks !== undefined && (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }} wrap style={{ marginTop: 2 }}>
          <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,200,100,0.95)', fontWeight: 600 } }}>
            Day {(job.segmentIndex ?? 0) + 1}:
          </Text>
          <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#999' : 'rgba(255,200,100,0.9)' } }}>
            {job.segmentEfinks?.toFixed(2)} E-Finks ({formatDuration(job.segmentDuration ?? 0)} work
            {(job.segmentBreakMinutes ?? 0) > 0 && ` + ${job.segmentBreakMinutes}m breaks`})
          </Text>
        </Stack>
      )}

      {job.productionComplete && job.actualDurationMinutes != null && (
        <Stack tokens={{ childrenGap: 1 }} style={{ marginTop: 4 }}>
          <Text variant="tiny" styles={{ root: { color: '#555', fontSize: 10, fontWeight: 700 } }}>
            Actual {formatClockTime(job.actualStartTime)} - {formatClockTime(job.actualEndTime)} ({formatDuration(job.actualDurationMinutes)})
          </Text>
          <Text variant="tiny" styles={{ root: { color: '#666', fontSize: 10 } }}>
            Planned {formatDuration(job.plannedDurationMinutes ?? getBaseDurationMinutes(job))} · Efficiency {formatEfficiency(job.plannedDurationMinutes ?? getBaseDurationMinutes(job), job.actualDurationMinutes)}
          </Text>
        </Stack>
      )}

      {hasStageDurations && job.stageDurations && (
        <Stack tokens={{ childrenGap: 1 }} style={{ marginTop: 4 }}>
          <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#555' : 'rgba(255,255,255,0.95)', fontSize: 10, fontWeight: 700 } }}>
            Picking {formatDuration(job.stageDurations.pickingMinutes)} · Sawing {formatDuration(job.stageDurations.sawingMinutes)}
          </Text>
          <Text variant="tiny" styles={{ root: { color: job.productionComplete ? '#666' : 'rgba(255,255,255,0.85)', fontSize: 10 } }}>
            Production {formatDuration(job.stageDurations.productionMinutes)} · Total labour {formatDuration(job.stageDurations.totalLabourMinutes)}
          </Text>
        </Stack>
      )}
      
      {/* Save/Edit buttons for multi-day jobs - only show on first segment */}
      {isMultiDay && isFirstSegment && !job.productionComplete && (onSaveJob || onEditJob) && (
        <Stack horizontal tokens={{ childrenGap: 6 }} style={{ marginTop: 4 }}>
          {onEditJob && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditJob(job.id);
              }}
              style={{
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: 4,
                cursor: 'pointer'
              }}
              title="Recalculate segments based on current OT/weekend settings"
            >
              Edit
            </button>
          )}
          {onSaveJob && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSaveJob(job.id);
              }}
              style={{
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: 'rgba(40, 167, 69, 0.9)',
                color: 'white',
                border: '1px solid rgba(40, 167, 69, 1)',
                borderRadius: 4,
                cursor: 'pointer'
              }}
              title="Persist segments to database"
            >
              Save
            </button>
          )}
        </Stack>
      )}
      
      {/* Only allow resize on last segment or single-day jobs */}
      {!job.productionComplete && (job.isLastSegment !== false) && (
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
    prevProps.hasManualResize === nextProps.hasManualResize &&
    prevProps.isResizing === nextProps.isResizing &&
    prevProps.job.plannedStartTime === nextProps.job.plannedStartTime &&
    prevProps.job.plannedEndTime === nextProps.job.plannedEndTime &&
    prevProps.job.actualStartTime === nextProps.job.actualStartTime &&
    prevProps.job.actualEndTime === nextProps.job.actualEndTime &&
    prevProps.job.actualDurationMinutes === nextProps.job.actualDurationMinutes &&
    prevProps.job.stageDurations?.pickingMinutes === nextProps.job.stageDurations?.pickingMinutes &&
    prevProps.job.stageDurations?.sawingMinutes === nextProps.job.stageDurations?.sawingMinutes &&
    prevProps.job.stageDurations?.productionMinutes === nextProps.job.stageDurations?.productionMinutes &&
    prevProps.job.stageDurations?.totalLabourMinutes === nextProps.job.stageDurations?.totalLabourMinutes &&
    prevProps.job.productionComplete === nextProps.job.productionComplete &&
    prevProps.job.totalSegments === nextProps.job.totalSegments &&
    prevProps.job.segmentIndex === nextProps.job.segmentIndex &&
    prevProps.job.segmentEfinks === nextProps.job.segmentEfinks &&
    prevProps.job.segmentDuration === nextProps.job.segmentDuration &&
    prevProps.job.isLastSegment === nextProps.job.isLastSegment
  );
});
