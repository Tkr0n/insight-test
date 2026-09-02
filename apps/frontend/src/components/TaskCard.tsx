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
  CheckCircle as DoneIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Share as ShareIcon,
  DragIndicator as DragIcon,
  Label as TagIcon,
  Flag as UrgencyIcon,
  Star as ImportanceIcon,
  ArrowBack as PrevIcon,
  ArrowForward as NextIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { StatusChip } from './StatusChip';
import type { Task, TaskStatus } from '../types/task';
import { VALID_TRANSITIONS, STATUS_ORDER } from '../types/task';
import { getDeadlineColor } from '../utils/deadline';
import { getPriorityLabel, getUrgencyMeta, getImportanceMeta } from '../utils/priority';
import { formatDateISO } from '../utils/formatDate';

interface TaskCardProps {
  task: Task;
  assigneeEmail?: string | null;
  onTransition: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  isTransitioning?: boolean;
  isDeleting?: boolean;
  isDraggable?: boolean;
  currentUserId?: string;
  onShare?: (task: Task) => void;
  isMobile?: boolean;
  onMove?: (taskId: string, status: TaskStatus) => void;
}

function getTransitionAction(status: TaskStatus): { label: string; icon: React.ReactNode } | null {
  switch (status) {
    case 'PENDING':
      return null;
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
  assigneeEmail,
  onTransition,
  onDelete,
  onEdit,
  isTransitioning = false,
  isDeleting = false,
  isDraggable = false,
  currentUserId,
  onShare,
  isMobile = false,
  onMove,
}: TaskCardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const transitionAction = getTransitionAction(task.status);
  const deadlineColor = getDeadlineColor(task.dueDate);
  // Only the owner or the assignee can modify the task; a task shared with the
  // user (and no other role) is view-only.
  const canManage =
    currentUserId != null &&
    (task.ownerId === currentUserId || task.assigneeId === currentUserId);
  const tags = task.tags ?? [];
  const visibleTags = tags.slice(0, 3);
  const remainingCount = tags.length - 3;

  const urgencyMeta = getUrgencyMeta(task.urgency ?? 2, isDark);
  const importanceMeta = getImportanceMeta(task.importance ?? 2, isDark);
  const accent = deadlineColor ? DEADLINE_ACCENT[deadlineColor] : 'transparent';

  const startLabel = formatDateISO(task.startDate);
  const dueLabel = formatDateISO(task.dueDate);

  const currentIdx = STATUS_ORDER.indexOf(task.status);
  const prevStatus = currentIdx > 0 ? STATUS_ORDER[currentIdx - 1] : null;
  const nextStatus = currentIdx < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIdx + 1] : null;
  const canGoPrev = prevStatus ? (VALID_TRANSITIONS[task.status]?.includes(prevStatus) ?? false) : false;
  const canGoNext = nextStatus ? (VALID_TRANSITIONS[task.status]?.includes(nextStatus) ?? false) : false;
  const mobileMoveHandler = onMove ?? onTransition;

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

        {/* Urgency vs Importance — differentiated labels + distinct palettes */}
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
          <Chip
            icon={<UrgencyIcon sx={{ fontSize: 12 }} />}
            label={`Urgency: ${getPriorityLabel(task.urgency ?? 2)}`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              bgcolor: urgencyMeta.bg,
              color: urgencyMeta.color,
              border: `1px solid ${urgencyMeta.border}`,
              '& .MuiChip-icon': { color: urgencyMeta.color, ml: '6px', fontSize: 12 },
            }}
          />
          <Chip
            icon={<ImportanceIcon sx={{ fontSize: 12 }} />}
            label={`Importance: ${getPriorityLabel(task.importance ?? 2)}`}
            size="small"
            sx={{
              height: 22,
              fontSize: '0.68rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              bgcolor: importanceMeta.bg,
              color: importanceMeta.color,
              border: `1px solid ${importanceMeta.border}`,
              '& .MuiChip-icon': { color: importanceMeta.color, ml: '6px', fontSize: 12 },
            }}
          />
        </Stack>

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

        {(task.assigneeId ?? null) !== null || startLabel || dueLabel ? (
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
                    title={assigneeEmail ?? task.assigneeId}
                  >
                    {assigneeEmail ?? task.assigneeId}
                  </Typography>
                </Stack>
              )}
              {startLabel && (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: isDark ? '#94a3b8' : '#64748b' }}>
                  {startLabel}
                </Typography>
              )}
              {dueLabel && (
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
                  Due {dueLabel}
                </Typography>
              )}
            </Stack>
          </>
        ) : null}
      </CardContent>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          gap: 0.25,
          px: 1,
          py: 0.5,
          bgcolor: isDark ? 'rgba(15,23,42,0.5)' : '#f8fafc',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)'}`,
        }}
      >
        {canManage && isMobile && (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Tooltip title={prevStatus ? `Move to ${prevStatus}` : 'No previous state'}>
              <span>
                <IconButton
                  size="small"
                  disabled={!prevStatus || !canGoPrev || isTransitioning}
                  onClick={() => prevStatus && mobileMoveHandler(task.id, prevStatus)}
                  sx={{
                    width: 28,
                    height: 28,
                    color: isDark ? '#94a3b8' : '#64748b',
                    bgcolor: canGoPrev ? (isDark ? 'rgba(255,255,255,0.06)' : '#eef2ff') : 'transparent',
                  }}
                  aria-label="Move to previous"
                >
                  <PrevIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={nextStatus ? `Move to ${nextStatus}` : 'No next state'}>
              <span>
                <IconButton
                  size="small"
                  disabled={!nextStatus || !canGoNext || isTransitioning}
                  onClick={() => nextStatus && mobileMoveHandler(task.id, nextStatus)}
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: canGoNext ? '#4f46e5' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)',
                    color: canGoNext ? '#fff' : isDark ? '#475569' : '#94a3b8',
                    '&:hover': { bgcolor: canGoNext ? '#4338ca' : undefined },
                  }}
                  aria-label="Move to next"
                >
                  {isTransitioning ? <CircularProgress size={14} sx={{ color: canGoNext ? '#fff' : undefined }} /> : <NextIcon sx={{ fontSize: 15 }} />}
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}

        {canManage ? (
          <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center', ml: isMobile ? 0 : 'auto' }}>
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
                  disabled={task.status === 'ARCHIVED' || isTransitioning}
                  sx={{ width: 28, height: 28, color: isDark ? '#94a3b8' : '#64748b' }}
                >
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </span>
            </Tooltip>
            {!isMobile && transitionAction && (
              <Tooltip title={transitionAction.label}>
                <span>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const nextStat = VALID_TRANSITIONS[task.status]?.find((s) => s === nextStatus) ?? VALID_TRANSITIONS[task.status]?.[0];
                      if (nextStat) onTransition(task.id, nextStat);
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
          </Stack>
        ) : (
          <Typography
            variant="caption"
            sx={{ fontSize: '0.7rem', color: isDark ? '#64748b' : '#94a3b8', ml: 'auto' }}
          >
            Read-only
          </Typography>
        )}
      </Box>
    </Card>
  );
}
