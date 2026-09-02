import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { TaskStatus } from '../types/task';
import { STATUS_LABELS } from '../types/task';

const STATUS_META: Record<TaskStatus, { light: { bg: string; color: string }; dark: { bg: string; color: string } }> = {
  PENDING: {
    light: { bg: '#fef3c7', color: '#92400e' },
    dark: { bg: 'rgba(251,191,36,0.15)', color: '#fcd34d' },
  },
  IN_PROGRESS: {
    light: { bg: '#dbeafe', color: '#1e40af' },
    dark: { bg: 'rgba(96,165,250,0.15)', color: '#93c5fd' },
  },
  DONE: {
    light: { bg: '#d1fae5', color: '#065f46' },
    dark: { bg: 'rgba(52,211,153,0.15)', color: '#6ee7b7' },
  },
  ARCHIVED: {
    light: { bg: '#f1f5f9', color: '#475569' },
    dark: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8' },
  },
};

interface StatusChipProps {
  status: TaskStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const meta = STATUS_META[status];
  const style = isDark ? meta.dark : meta.light;

  return (
    <Chip
      label={STATUS_LABELS[status]}
      size="small"
      sx={{
        height: 20,
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        bgcolor: style.bg,
        color: style.color,
        border: 'none',
      }}
    />
  );
}
