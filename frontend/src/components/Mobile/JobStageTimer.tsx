import { useEffect, useState, type CSSProperties } from 'react';
import type { JobStageSummaryDto } from '../../services/jobTimeTrackingService';
import { formatDurationMinutesAsTime, formatElapsedTime } from './JobStopwatch';

interface JobStageTimerProps {
  label: string;
  summary: JobStageSummaryDto;
  saving: boolean;
  onStart: () => void;
  onStop: () => void;
}

const statusLabel = (status: string): string => {
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    default:
      return 'Not Started';
  }
};

const buttonStyle: CSSProperties = {
  width: '100%',
  minHeight: 44,
  borderRadius: 6,
  border: 'none',
  color: '#ffffff',
  fontSize: 15,
  fontWeight: 800
};

const getElapsedSeconds = (startedAt?: string | null): number => {
  if (!startedAt) return 0;
  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
};

export const JobStageTimer = ({ label, summary, saving, onStart, onStop }: JobStageTimerProps) => {
  const isActive = summary.status === 'in_progress';
  const activeStartedAt = summary.activeEntry?.startedAt;
  const hasCompletedTime = summary.totalDurationMinutes > 0;
  const [currentSessionSeconds, setCurrentSessionSeconds] = useState(() => getElapsedSeconds(activeStartedAt));
  const totalSeconds = (summary.totalDurationMinutes * 60) + (isActive ? currentSessionSeconds : 0);

  useEffect(() => {
    if (!isActive || !activeStartedAt) {
      setCurrentSessionSeconds(0);
      return;
    }

    const updateElapsed = () => setCurrentSessionSeconds(getElapsedSeconds(activeStartedAt));
    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(intervalId);
  }, [activeStartedAt, isActive]);

  return (
    <div style={{
      border: '1px solid #d6dbe1',
      borderRadius: 8,
      padding: 12,
      backgroundColor: '#ffffff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#1f2933' }}>{label}</div>
        <div style={{
          padding: '3px 7px',
          borderRadius: 4,
          backgroundColor: isActive ? '#fff4ce' : summary.status === 'completed' ? '#dff6dd' : '#eff6fc',
          color: isActive ? '#8a6100' : summary.status === 'completed' ? '#0b6a0b' : '#005a9e',
          fontSize: 11,
          fontWeight: 800,
          whiteSpace: 'nowrap'
        }}>
          {statusLabel(summary.status)}
        </div>
      </div>

      {isActive && activeStartedAt && (
        <div style={{
          marginTop: 10,
          padding: '10px 12px',
          borderRadius: 8,
          backgroundColor: '#fff8dd',
          border: '1px solid #f3d36b'
        }}>
          <div style={{ color: '#6b5300', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
            Current Session
          </div>
          <div style={{
            marginTop: 3,
            color: '#1f2933',
            fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
            fontSize: 20,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: 0
          }}>
            {formatElapsedTime(currentSessionSeconds)}
          </div>
        </div>
      )}

      <div style={{
        marginTop: 10,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        color: '#52606d',
        fontSize: 13,
        fontWeight: 700
      }}>
        <span>Total Time</span>
        <span style={{
          color: '#1f2933',
          fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
          fontSize: 15,
          fontWeight: 800,
          letterSpacing: 0
        }}>
          {isActive ? formatElapsedTime(totalSeconds) : formatDurationMinutesAsTime(summary.totalDurationMinutes)}
        </span>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={isActive ? onStop : onStart}
        style={{
          ...buttonStyle,
          marginTop: 10,
          backgroundColor: isActive ? '#a4262c' : '#0078d4'
        }}
      >
        {saving
          ? isActive ? `Stopping ${label}...` : hasCompletedTime ? `Continuing ${label}...` : `Starting ${label}...`
          : isActive ? `Stop ${label}` : hasCompletedTime ? `Continue ${label}` : `Start ${label}`}
      </button>
    </div>
  );
};
