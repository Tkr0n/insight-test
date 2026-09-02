import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { Stack } from '@mui/material';
import { KanbanColumn } from './KanbanColumn';
import type { Task, TaskStatus } from '../types/task';
import { VALID_TRANSITIONS } from '../types/task';

const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];

const STATUS_SET = new Set<string>(STATUSES);

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const grouped: Record<TaskStatus, Task[]> = {
    PENDING: [],
    IN_PROGRESS: [],
    DONE: [],
    ARCHIVED: [],
  };
  for (const task of tasks) {
    const s = task.status;
    if (s in grouped) grouped[s].push(task);
  }
  return grouped;
}

interface KanbanBoardProps {
  tasks: Task[];
  currentUserId?: string;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
  onTransition: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onShare?: (task: Task) => void;
}

export function KanbanBoard({
  tasks,
  currentUserId,
  onMove,
  onTransition,
  onEdit,
  onDelete,
  onShare,
}: KanbanBoardProps) {
  const byStatus = groupByStatus(tasks);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    const currentStatus = activeTask.status;

    // Resolve destination status: over.id may be a column id (TaskStatus) or a task id
    let newStatus: TaskStatus | null = null;

    if (STATUS_SET.has(overId)) {
      newStatus = overId as TaskStatus;
    } else {
      // over is a task -> find its status, or read from sortable containerId
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      } else {
        const containerId = (
          over.data.current as { sortable?: { containerId?: string } } | undefined
        )?.sortable?.containerId;
        if (containerId && STATUS_SET.has(containerId)) {
          newStatus = containerId as TaskStatus;
        }
      }
    }

    if (!newStatus) return;
    if (newStatus === currentStatus) return;

    const allowed = VALID_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) return;

    onMove(activeId, newStatus);
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          overflowX: 'auto',
          pb: 2,
          alignItems: 'flex-start',
          minHeight: 420,
        }}
      >
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={byStatus[status] ?? []}
            currentUserId={currentUserId}
            onTransition={onTransition}
            onEdit={onEdit}
            onDelete={onDelete}
            onShare={onShare}
          />
        ))}
      </Stack>
    </DndContext>
  );
}
