import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as DoneIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { StatusChip } from './StatusChip';
import type { Task, TaskStatus } from '../types/task';
import { VALID_TRANSITIONS } from '../types/task';

interface TaskCardProps {
  task: Task;
  onTransition: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  isTransitioning?: boolean;
  isDeleting?: boolean;
}

function getTransitionAction(status: TaskStatus): { label: string; icon: React.ReactNode } | null {
  switch (status) {
    case 'PENDING':
      return { label: 'Start', icon: <StartIcon /> };
    case 'IN_PROGRESS':
      return { label: 'Mark Done', icon: <DoneIcon /> };
    case 'DONE':
      return { label: 'Archive', icon: <ArchiveIcon /> };
    case 'ARCHIVED':
      return null;
  }
}

export function TaskCard({
  task,
  onTransition,
  onDelete,
  onEdit,
  isTransitioning = false,
  isDeleting = false,
}: TaskCardProps) {
  const transitionAction = getTransitionAction(task.status);

  return (
    <Card variant="outlined" sx={{ mb: 1.5 }}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {task.title}
            </Typography>
            {task.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {task.description}
              </Typography>
            )}
          </Box>
          <StatusChip status={task.status} />
        </Stack>
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <Tooltip title="Edit">
          <span>
            <IconButton
              size="small"
              onClick={() => onEdit(task)}
              disabled={task.status === 'DONE' || task.status === 'ARCHIVED' || isTransitioning}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        {transitionAction && (
          <Tooltip title={transitionAction.label}>
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onTransition(task.id, VALID_TRANSITIONS[task.status][0])}
                disabled={isTransitioning}
              >
                {isTransitioning ? (
                  <CircularProgress size={18} />
                ) : (
                  transitionAction.icon
                )}
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip title="Delete">
          <span>
            <IconButton
              size="small"
              color="error"
              onClick={() => onDelete(task.id)}
              disabled={isDeleting}
            >
              {isDeleting ? <CircularProgress size={18} /> : <DeleteIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
