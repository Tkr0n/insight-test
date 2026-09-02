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
  Chip,
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  CheckCircle as DoneIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { StatusChip } from './StatusChip';
import type { Task, TaskStatus } from '../types/task';
import { VALID_TRANSITIONS } from '../types/task';
import { getDeadlineColor, deadlineBorder } from '../utils/deadline';

interface TaskCardProps {
  task: Task;
  onTransition: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  isTransitioning?: boolean;
  isDeleting?: boolean;
  isDraggable?: boolean;
  currentUserId?: string;
  onShare?: (task: Task) => void;
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

function getPriorityColor(
  level: number
): 'default' | 'info' | 'warning' | 'error' {
  if (level >= 4) return 'error';
  if (level === 3) return 'warning';
  if (level === 2) return 'info';
  return 'default';
}

export function TaskCard({
  task,
  onTransition,
  onDelete,
  onEdit,
  isTransitioning = false,
  isDeleting = false,
  isDraggable = false,
  currentUserId,
  onShare,
}: TaskCardProps) {
  void currentUserId;
  const transitionAction = getTransitionAction(task.status);
  const deadlineColor = getDeadlineColor(task.dueDate);
  const tags = task.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const remainingCount = tags.length - 3;

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1.5,
        borderLeft: deadlineColor ? deadlineBorder[deadlineColor] : undefined,
        cursor: isDraggable ? 'grab' : undefined,
      }}
    >
      <CardContent sx={{ pb: 1 }}>
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

        <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
          <Chip label={`U:${task.urgency ?? 2}`} size="small" color={getPriorityColor(task.urgency ?? 2)} variant="outlined" />
          <Chip label={`I:${task.importance ?? 2}`} size="small" color={getPriorityColor(task.importance ?? 2)} variant="outlined" />
        </Stack>

        {tags.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {visibleTags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
            {remainingCount > 0 && <Chip label={`+${remainingCount}`} size="small" />}
          </Stack>
        )}

        {(task.assigneeId ?? null) !== null || task.dueDate ? (
          <Stack direction="row" spacing={1.5} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            {task.assigneeId && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" noWrap>
                  {task.assigneeId}
                </Typography>
              </Stack>
            )}
            {task.dueDate && (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {task.dueDate}
                </Typography>
              </Stack>
            )}
          </Stack>
        ) : null}
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        {onShare && (
          <Tooltip title="Share">
            <IconButton size="small" onClick={() => onShare(task)} aria-label="Share">
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
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
                onClick={() => {
                  const nextStatus = VALID_TRANSITIONS[task.status]?.[0];
                  if (nextStatus) {
                    onTransition(task.id, nextStatus);
                  }
                }}
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
