import { useEffect, useState, type CSSProperties } from 'react';

const getElapsedSeconds = (startedAt: string): number => {
  const startedMs = Date.parse(startedAt);
  if (Number.isNaN(startedMs)) return 0;
  return Math.max(0, Math.floor((Date.now() - startedMs) / 1000));
};

export const formatElapsedTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    seconds.toString().padStart(2, '0')
  ].join(':');
};

export const formatDurationMinutesAsTime = (minutes?: number | null): string => {
  if (minutes == null) return '-';
  return formatElapsedTime(minutes * 60);
};

interface JobStopwatchProps {
  startedAt: string;
  label?: string;
  compact?: boolean;
}

const shellStyle: CSSProperties = {
  marginTop: 14,
  padding: '12px 14px',
  borderRadius: 8,
  backgroundColor: '#fff8dd',
  border: '1px solid #f3d36b'
};

const labelStyle: CSSProperties = {
  color: '#6b5300',
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'uppercase'
};

const timeStyle: CSSProperties = {
  marginTop: 4,
  color: '#1f2933',
  fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  fontSize: 28,
  fontWeight: 800,
  lineHeight: 1.15,
  letterSpacing: 0
};

export const JobStopwatch = ({ startedAt, label = 'Live Time', compact = false }: JobStopwatchProps) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => getElapsedSeconds(startedAt));

  useEffect(() => {
    const updateElapsed = () => setElapsedSeconds(getElapsedSeconds(startedAt));

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 1000);

    return () => window.clearInterval(intervalId);
  }, [startedAt]);

  return (
    <div style={shellStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...timeStyle, fontSize: compact ? 20 : timeStyle.fontSize }}>
        {formatElapsedTime(elapsedSeconds)}
      </div>
    </div>
  );
};
