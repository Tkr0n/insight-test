import {
  Card,
  CardContent,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  Box,
  Chip,
  Divider,
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
  DragIndicator as DragIcon,
  Label as TagIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { StatusChip } from './StatusChip';
import type { Task, TaskStatus } from '../types/task';
import { VALID_TRANSITIONS } from '../types/task';
import { getDeadlineColor } from '../utils/deadline';
import { getPriorityLabel, getPriorityMeta } from '../utils/priority';

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
      return { label: 'Start', icon: <StartIcon fontSize="small" /> };
    case 'IN_PROGRESS':
      return { label: 'Mark Done', icon: <DoneIcon fontSize="small" /> };
    case 'DONE':
      return { label: 'Archive', icon: <ArchiveIcon fontSize="small" /> };
    case 'ARCHIVED':
      return null;
  }
}

const DEADLINE_ACCENT: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
};

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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const transitionAction = getTransitionAction(task.status);
  const deadlineColor = getDeadlineColor(task.dueDate);
  const tags = task.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const remainingCount = tags.length - 3;

  const urgencyMeta = getPriorityMeta(task.urgency ?? 2, isDark);
  const importanceMeta = getPriorityMeta(task.importance ?? 2, isDark);
  const accent = deadlineColor ? DEADLINE_ACCENT[deadlineColor] : 'transparent';

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2.5,
        borderLeft: `3px solid ${accent}`,
        bgcolor: isDark ? 'rgba(30,41,59,0.9)' : '#ffffff',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
        boxShadow: isDark
          ? '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(15,23,42,0.08), 0 4px 12px rgba(15,23,42,0.04)',
        cursor: isDraggable ? 'grab' : 'default',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        '&:hover': {
          boxShadow: isDark
            ? '0 4px 12px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.4)'
            : '0 4px 16px rgba(15,23,42,0.1), 0 2px 8px rgba(15,23,42,0.06)',
          transform: 'translateY(-1px)',
          borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(79,70,229,0.15)',
        },
        '&:active': isDraggable ? { cursor: 'grabbing', transform: 'rotate(1deg) scale(1.02)' } : {},
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 2, pb: '12px !important' }}>
        {/* Header: title + status + drag handle */}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          {isDraggable && (
            <Box sx={{ pt: 0.3, color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(15,23,42,0.2)', display: 'flex' }}>
              <DragIcon sx={{ fontSize: 16 }} />
            </Box>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                lineHeight: 1.35,
                fontSize: '0.875rem',
                color: isDark ? '#f1f5f9' : '#0f172a',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {task.title}
            </Typography>
            {task.description && (
              <Typography
                variant="body2"
                sx={{
                  mt: 0.6,
                  fontSize: '0.78rem',
                  lineHeight: 1.5,
                  color: isDark ? '#94a3b8' : '#64748b',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {task.description}
              </Typography>
            )}
          </Box>
          <StatusChip status={task.status} />
        </Stack>

        {/* Priority labels — replaces U:1 / I:2 */}
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label={getPriorityLabel(task.urgency ?? 2)}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              bgcolor: urgencyMeta.bg,
              color: urgencyMeta.color,
              border: `1px solid ${urgencyMeta.border}`,
            }}
          />
          <Chip
            label={getPriorityLabel(task.importance ?? 2)}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              bgcolor: importanceMeta.bg,
              color: importanceMeta.color,
              border: `1px solid ${importanceMeta.border}`,
            }}
          />
        </Stack>

        {/* Tags */}
        {tags.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.5 }}>
            {visibleTags.map((tag) => (
              <Chip
                key={tag}
                icon={<TagIcon sx={{ fontSize: 12 }} />}
                label={tag}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                  color: isDark ? '#cbd5e1' : '#475569',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
                  '& .MuiChip-icon': { color: isDark ? '#64748b' : '#94a3b8', ml: '6px' },
                }}
              />
            ))}
            {remainingCount > 0 && (
              <Chip
                label={`+${remainingCount}`}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  bgcolor: isDark ? 'rgba(79,70,229,0.15)' : '#eef2ff',
                  color: '#6366f1',
                }}
              />
            )}
          </Stack>
        )}

        {/* Meta row: assignee • dates */}
        {(task.assigneeId ?? null) !== null || task.dueDate || task.startDate ? (
          <>
            <Divider sx={{ mt: 1.5, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)' }} />
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ mt: 1.25, alignItems: 'center', flexWrap: 'wrap', gap: 1 }}
            >
              {task.assigneeId && (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: '#4f46e5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 12, color: '#fff' }} />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}
                    noWrap
                  >
                    {task.assigneeId.slice(0, 8)}
                  </Typography>
                </Stack>
              )}
              {task.startDate && (
                <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center' }}>
                  <CalendarIcon sx={{ fontSize: 13, color: isDark ? '#64748b' : '#94a3b8' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {task.startDate}
                  </Typography>
                </Stack>
              )}
              {task.dueDate && (
                <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center' }}>
                  <CalendarIcon
                    sx={{
                      fontSize: 13,
                      color: deadlineColor === 'red' ? '#ef4444' : deadlineColor === 'orange' ? '#f97316' : isDark ? '#64748b' : '#94a3b8',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: deadlineColor ? 600 : 400,
                      color:
                        deadlineColor === 'red'
                          ? '#ef4444'
                          : deadlineColor === 'orange'
                            ? '#f97316'
                            : isDark
                              ? '#94a3b8'
                              : '#64748b',
                    }}
                  >
                    Due {task.dueDate}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </>
        ) : null}
      </CardContent>

      {/* Actions bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 0.25,
          px: 1,
          py: 0.5,
          bgcolor: isDark ? 'rgba(15,23,42,0.5)' : '#f8fafc',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
        }}
      >
        {onShare && (
          <Tooltip title="Share">
            <IconButton
              size="small"
              onClick={() => onShare(task)}
              aria-label="Share"
              sx={{ width: 28, height: 28, color: isDark ? '#94a3b8' : '#64748b' }}
            >
              <ShareIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Edit">
          <span>
            <IconButton
              size="small"
              onClick={() => onEdit(task)}
              disabled={task.status === 'DONE' || task.status === 'ARCHIVED' || isTransitioning}
              sx={{ width: 28, height: 28, color: isDark ? '#94a3b8' : '#64748b' }}
            >
              <EditIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </span>
        </Tooltip>
        {transitionAction && (
          <Tooltip title={transitionAction.label}>
            <span>
              <IconButton
                size="small"
                onClick={() => {
                  const nextStatus = VALID_TRANSITIONS[task.status]?.[0];
                  if (nextStatus) onTransition(task.id, nextStatus);
                }}
                disabled={isTransitioning}
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: '#4f46e5',
                  color: '#fff',
                  '&:hover': { bgcolor: '#4338ca' },
                  '&.Mui-disabled': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)' },
                }}
              >
                {isTransitioning ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : transitionAction.icon}
              </IconButton>
            </span>
          </Tooltip>
        )}
        <Tooltip title="Delete">
          <span>
            <IconButton
              size="small"
              onClick={() => onDelete(task.id)}
              disabled={isDeleting}
              sx={{
                width: 28,
                height: 28,
                color: isDark ? '#64748b' : '#94a3b8',
                '&:hover': { color: '#ef4444', bgcolor: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2' },
              }}
            >
              {isDeleting ? <CircularProgress size={14} /> : <DeleteIcon sx={{ fontSize: 15 }} />}
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Card>
  );
}
