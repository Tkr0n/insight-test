import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  DragOverlay,
  DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography, Chip, Stack } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../types/task';
import { VALID_TRANSITIONS, STATUS_LABELS } from '../types/task';
import { hexToRgba } from '../utils/priority';

const STATUSES: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];
const STATUS_SET = new Set<string>(STATUSES);

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  PENDING: '#f59e0b',
  IN_PROGRESS: '#3b82f6',
  DONE: '#10b981',
  ARCHIVED: '#64748b',
};

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
  assigneeEmailMap?: Map<string, string>;
  onMove: (taskId: string, newStatus: TaskStatus) => void;
  onTransition: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onShare?: (task: Task) => void;
}

export function KanbanBoard({
  tasks,
  currentUserId,
  assigneeEmailMap,
  onMove,
  onTransition,
  onEdit,
  onDelete,
  onShare,
}: KanbanBoardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';
  const byStatus = groupByStatus(tasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const activeEmail = useMemo(() => {
    if (!activeTask?.assigneeId) return null;
    return assigneeEmailMap?.get(activeTask.assigneeId) ?? null;
  }, [activeTask, assigneeEmailMap]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === String(event.active.id));
    if (task) setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeTaskData = tasks.find((t) => t.id === activeId);
    if (!activeTaskData) return;

    const currentStatus = activeTaskData.status;
    let newStatus: TaskStatus | null = null;

    if (STATUS_SET.has(overId)) {
      newStatus = overId as TaskStatus;
    } else {
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

  const handleDragCancel = () => setActiveTask(null);

  if (isMobile) {
    return (
      <Stack spacing={1.25}>
        {STATUSES.map((status) => {
          const colTasks = byStatus[status] ?? [];
          const accent = COLUMN_ACCENT[status];
          return (
            <Accordion
              key={status}
              defaultExpanded={false}
              disableGutters
              elevation={0}
              sx={{
                borderRadius: '12px !important',
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                bgcolor: hexToRgba(accent, isDark ? 0.1 : 0.08),
                overflow: 'hidden',
                '&:before': { display: 'none' },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ color: isDark ? '#94a3b8' : '#64748b' }} />}
                sx={{
                  minHeight: 56,
                  borderLeft: `4px solid ${accent}`,
                  bgcolor: isDark ? 'rgba(15,23,42,0.3)' : '#f8fafc',
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 },
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: accent, flexShrink: 0 }} />
                <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.02em', flex: 1 }}>
                  {STATUS_LABELS[status]}
                </Typography>
                <Chip
                  label={colTasks.length}
                  size="small"
                  sx={{
                    height: 22,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                    color: isDark ? '#cbd5e1' : '#475569',
                  }}
                />
              </AccordionSummary>
              <AccordionDetails sx={{ p: 1.5, pt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                {colTasks.length === 0 ? (
                  <Box
                    sx={{
                      border: '1.5px dashed',
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.8rem' }}>
                      No tasks
                    </Typography>
                  </Box>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      assigneeEmail={task.assigneeId ? (assigneeEmailMap?.get(task.assigneeId) ?? null) : null}
                      onTransition={onTransition}
                      onMove={onMove}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onShare={onShare}
                      isDraggable={false}
                      isMobile
                      currentUserId={currentUserId}
                    />
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2,
          alignItems: 'start',
          minHeight: 420,
        }}
      >
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={byStatus[status] ?? []}
            currentUserId={currentUserId}
            assigneeEmailMap={assigneeEmailMap}
            onTransition={onTransition}
            onEdit={onEdit}
            onDelete={onDelete}
            onShare={onShare}
          />
        ))}
      </Box>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
        {activeTask ? (
          <Box sx={{ width: 340, transform: 'rotate(2deg)', boxShadow: '0 12px 32px rgba(15,23,42,0.2)' }}>
            <TaskCard
              task={activeTask}
              assigneeEmail={activeEmail}
              onTransition={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              isDraggable={false}
            />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
