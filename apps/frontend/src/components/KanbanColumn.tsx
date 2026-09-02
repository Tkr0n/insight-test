import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Paper, Typography, Stack, Box } from '@mui/material';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../types/task';
import { STATUS_LABELS } from '../types/task';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  currentUserId?: string;
  onTransition: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onShare?: (task: Task) => void;
}

interface SortableTaskCardProps {
  task: Task;
  currentUserId?: string;
  onTransition: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onShare?: (task: Task) => void;
}

function SortableTaskCard({
  task,
  currentUserId,
  onTransition,
  onEdit,
  onDelete,
  onShare,
}: SortableTaskCardProps) {
  const isDraggable = Boolean(currentUserId && task.assigneeId === currentUserId);

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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
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
  onTransition,
  onEdit,
  onDelete,
  onShare,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <Paper
      ref={setNodeRef}
      sx={{
        minWidth: 300,
        maxWidth: 340,
        flex: '1 0 300px',
        p: 1.5,
        bgcolor: isOver ? 'grey.100' : 'grey.50',
        border: isOver ? '1px dashed' : '1px solid transparent',
        borderColor: isOver ? 'primary.main' : 'transparent',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 400,
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        {STATUS_LABELS[status]} ({tasks.length})
      </Typography>
      <SortableContext
        id={status}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack spacing={1} sx={{ minHeight: 200, flex: 1 }}>
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              currentUserId={currentUserId}
              onTransition={onTransition}
              onEdit={onEdit}
              onDelete={onDelete}
              onShare={onShare}
            />
          ))}
          {tasks.length === 0 && (
            <Box
              sx={{
                border: '1px dashed',
                borderColor: 'grey.300',
                borderRadius: 1,
                p: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No tasks
              </Typography>
            </Box>
          )}
        </Stack>
      </SortableContext>
    </Paper>
  );
}
