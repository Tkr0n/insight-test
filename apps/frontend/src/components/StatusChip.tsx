import { Chip } from '@mui/material';
import type { TaskStatus } from '../types/task';
import { STATUS_LABELS } from '../types/task';

const STATUS_COLOR: Record<TaskStatus, 'warning' | 'info' | 'success' | 'default'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  DONE: 'success',
  ARCHIVED: 'default',
};

interface StatusChipProps {
  status: TaskStatus;
}

export function StatusChip({ status }: StatusChipProps) {
  return (
    <Chip
      label={STATUS_LABELS[status]}
      color={STATUS_COLOR[status]}
      size="small"
      variant="outlined"
    />
  );
}
