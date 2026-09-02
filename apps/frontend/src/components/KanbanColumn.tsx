import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Paper, Typography, Stack, Box, Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../types/task';
import { STATUS_LABELS } from '../types/task';
import { hexToRgba } from '../utils/priority';

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  DONE: '#10b981',
  ARCHIVED: '#64748b',
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  currentUserId?: string;
  assigneeEmailMap?: Map<string, string>;
  onTransition: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onShare?: (task: Task) => void;
}

interface SortableTaskCardProps {
  task: Task;
  currentUserId?: string;
  assigneeEmail?: string | null;
  onTransition: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onShare?: (task: Task) => void;
}

function SortableTaskCard({
  task,
  currentUserId,
  assigneeEmail,
  onTransition,
  onEdit,
  onDelete,
  onShare,
}: SortableTaskCardProps) {
  const fallbackDraggable = !currentUserId;
  const isDraggable = fallbackDraggable
    ? true
    : task.ownerId === currentUserId || task.assigneeId === currentUserId || !task.assigneeId;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !isDraggable,
    data: { status: task.status },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        assigneeEmail={assigneeEmail}
        onTransition={onTransition}
        onEdit={onEdit}
        onDelete={onDelete}
        onShare={onShare}
        isDraggable={isDraggable}
        currentUserId={currentUserId}
      />
    </Box>
  );
}

export function KanbanColumn({
  status,
  tasks,
  currentUserId,
  assigneeEmailMap,
  onTransition,
  onEdit,
  onDelete,
  onShare,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const accent = COLUMN_ACCENT[status];

  const accentBg = hexToRgba(accent, isDark ? 0.12 : 0.10);

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        flex: '1 1 0',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 420,
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: accentBg,
        border: '1px solid',
        borderColor: isOver
          ? accent
          : isDark
            ? 'rgba(255,255,255,0.06)'
            : 'rgba(15,23,42,0.06)',
        boxShadow: isDark
          ? '0 4px 12px rgba(0,0,0,0.3)'
          : '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
        transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
        ...(isOver && {
          boxShadow: `0 0 0 2px ${accent}40, 0 4px 16px rgba(15,23,42,0.08)`,
          bgcolor: hexToRgba(accent, isDark ? 0.18 : 0.16),
        }),
      }}
    >
      <Box
        sx={{
          height: 4,
          bgcolor: accent,
          flexShrink: 0,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
        }}
      />
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
          bgcolor: isDark ? 'rgba(15,23,42,0.3)' : '#f8fafc',
          flexShrink: 0,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accent, flexShrink: 0 }} />
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color: isDark ? '#f1f5f9' : '#0f172a',
            }}
          >
            {STATUS_LABELS[status]}
          </Typography>
        </Stack>
        <Chip
          label={tasks.length}
          size="small"
          sx={{
            height: 22,
            minWidth: 22,
            fontSize: '0.7rem',
            fontWeight: 700,
            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
            color: isDark ? '#cbd5e1' : '#475569',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`,
          }}
        />
      </Box>

      <SortableContext
        id={status}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack
          spacing={1.25}
          sx={{
            p: 1.5,
            flex: 1,
            minHeight: 200,
            bgcolor: isOver
              ? isDark
                ? 'rgba(79,70,229,0.06)'
                : 'rgba(79,70,229,0.04)'
              : 'transparent',
            transition: 'background 0.2s',
            overflowY: 'auto',
          }}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              assigneeEmail={task.assigneeId ? (assigneeEmailMap?.get(task.assigneeId) ?? null) : null}
              onTransition={onTransition}
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
            />
          ))}
          {tasks.length === 0 && (
            <Box
              sx={{
                border: '1.5px dashed',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                borderRadius: 2,
                p: 3,
                textAlign: 'center',
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
              }}
            >
              <Typography variant="body2" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.8rem' }}>
                No tasks
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? '#475569' : '#cbd5e1', fontSize: '0.7rem' }}>
                Drag tasks here
              </Typography>
            </Box>
          )}
        </Stack>
      </SortableContext>
    </Paper>
  );
}
