import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Skeleton,
  Snackbar,
  Alert,
  Box,
  Paper,
  Typography,
  Button,
  Fab,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTasks } from '../hooks/useTasks';
import { useCreateTask } from '../hooks/useCreateTask';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useMarkAsDone } from '../hooks/useMarkAsDone';
import { useUsers } from '../hooks/useUsers';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { KanbanBoard } from '../components/KanbanBoard';
import { FilterPanel } from '../components/FilterPanel';
import { ShareModal } from '../components/ShareModal';
import { TaskForm, type TaskFormValues } from '../components/TaskForm';
import { ErrorAlert } from '../components/ErrorAlert';
import type { Task, TaskStatus, TaskFilters } from '../types/task';
import { isDoneTransition } from '../utils/statusTransition';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

function getLocalUserId(): string | undefined {
  try {
    const token = localStorage.getItem('id_token');
    if (!token) return undefined;
    const parts = token.split('.');
    if (parts.length !== 3) return undefined;
    const payload = JSON.parse(atob(parts[1] ?? ''));
    return payload.sub ?? payload.userId ?? payload.id ?? undefined;
  } catch {
    return undefined;
  }
}

function parseFilters(params: URLSearchParams): TaskFilters {
  const f: TaskFilters = {};
  const title = params.get('title');
  if (title) f.title = title;
  const tags = params.get('tags');
  if (tags) f.tags = tags.split(',').filter(Boolean);
  const assigneeId = params.get('assigneeId');
  if (assigneeId) f.assigneeId = assigneeId;
  const urgency = params.get('urgency');
  if (urgency) {
    const n = Number(urgency);
    if (!Number.isNaN(n)) f.urgency = n;
  }
  const importance = params.get('importance');
  if (importance) {
    const n = Number(importance);
    if (!Number.isNaN(n)) f.importance = n;
  }
  const startDateFrom = params.get('startDateFrom');
  if (startDateFrom) f.startDateFrom = startDateFrom;
  const startDateTo = params.get('startDateTo');
  if (startDateTo) f.startDateTo = startDateTo;
  const dueDateFrom = params.get('dueDateFrom');
  if (dueDateFrom) f.dueDateFrom = dueDateFrom;
  const dueDateTo = params.get('dueDateTo');
  if (dueDateTo) f.dueDateTo = dueDateTo;
  const overdue = params.get('overdue');
  if (overdue === 'true') f.overdue = true;
  const status = params.get('status');
  if (status) f.status = status.split(',').filter(Boolean) as TaskStatus[];
  return f;
}

function buildSearchParams(filters: TaskFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (filters.title) p.set('title', filters.title);
  if (filters.tags?.length) p.set('tags', filters.tags.join(','));
  if (filters.assigneeId) p.set('assigneeId', filters.assigneeId);
  if (filters.urgency !== undefined) p.set('urgency', String(filters.urgency));
  if (filters.importance !== undefined) p.set('importance', String(filters.importance));
  if (filters.startDateFrom) p.set('startDateFrom', filters.startDateFrom);
  if (filters.startDateTo) p.set('startDateTo', filters.startDateTo);
  if (filters.dueDateFrom) p.set('dueDateFrom', filters.dueDateFrom);
  if (filters.dueDateTo) p.set('dueDateTo', filters.dueDateTo);
  if (filters.overdue) p.set('overdue', 'true');
  if (filters.status?.length) p.set('status', filters.status.join(','));
  return p;
}

export function DashboardPage() {
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState<TaskFilters>(() => parseFilters(searchParams));
  const { data: tasks, isLoading, error } = useTasks(filters);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const markAsDone = useMarkAsDone();
  const { data: users } = useUsers();
  const { data: me } = useCurrentUser();

  const currentUserId = useMemo(() => me?.id ?? getLocalUserId(), [me]);

  const assigneeEmailMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of users ?? []) map.set(u.id, u.email);
    if (me) map.set(me.id, me.email);
    return map;
  }, [users, me]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  useEffect(() => {
    const next = buildSearchParams(filters);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  const availableTags = useMemo(
    () => [...new Set((tasks ?? []).flatMap((t) => t.tags ?? []))],
    [tasks],
  );

  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
      const status = axiosErr.response?.status;
      if (status === 422) return 'Invalid status transition. Please refresh and try again.';
      if (status === 409) return 'This action was already processed. Please refresh.';
      if (status === 401) return 'Your session has expired. Please log in again.';
      if (status === 403) return 'You do not have permission to perform this action.';
      return axiosErr.response?.data?.error || 'An error occurred';
    }
    return 'An unexpected error occurred';
  };

  const handleCreate = (values: TaskFormValues) => {
    createTask.mutate(values, {
      onSuccess: () => {
        setFormOpen(false);
        setSnackbar({ open: true, message: 'Task created', severity: 'success' });
      },
      onError: (err) => {
        setSnackbar({ open: true, message: getErrorMessage(err), severity: 'error' });
      },
    });
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormOpen(true);
  };

  const handleUpdate = (values: TaskFormValues) => {
    if (!editingTask) return;

    if (
      editingTask.ownerId !== currentUserId &&
      values.assigneeId !== (editingTask.assigneeId ?? null)
    ) {
      setSnackbar({ open: true, message: 'Only owner can reassign task', severity: 'error' });
      return;
    }

    updateTask.mutate(
      { id: editingTask.id, ...values },
      {
        onSuccess: () => {
          setFormOpen(false);
          setEditingTask(null);
          setSnackbar({ open: true, message: 'Task updated', severity: 'success' });
        },
        onError: (err) => {
          setSnackbar({ open: true, message: getErrorMessage(err), severity: 'error' });
        },
      },
    );
  };

  const runStatusChange = (taskId: string, status: TaskStatus) => {
    setTransitioningId(taskId);
    const onSuccess = () => {
      setTransitioningId(null);
      setSnackbar({ open: true, message: 'Task status updated', severity: 'success' });
    };
    const onError = (err: unknown) => {
      setTransitioningId(null);
      setSnackbar({ open: true, message: getErrorMessage(err), severity: 'error' });
    };
    if (isDoneTransition(status)) {
      markAsDone.mutate(taskId, { onSuccess, onError });
    } else {
      updateTask.mutate({ id: taskId, status }, { onSuccess, onError });
    }
  };

  const handleMove = (taskId: string, newStatus: TaskStatus) => {
    const task = tasks?.find((t) => t.id === taskId);
    if (!task) return;
    if (currentUserId) {
      const canMove = task.ownerId === currentUserId || task.assigneeId === currentUserId || !task.assigneeId;
      if (!canMove) {
        setSnackbar({ open: true, message: 'Only owner or assignee can move', severity: 'error' });
        return;
      }
    }
    runStatusChange(taskId, newStatus);
  };

  const handleShare = (task: Task) => {
    setSharingTask(task);
    setShareOpen(true);
  };

  const handleTransition = (taskId: string, targetStatus: TaskStatus) => {
    runStatusChange(taskId, targetStatus);
  };

  const handleDelete = (taskId: string) => {
    setDeletingId(taskId);
    deleteTask.mutate(taskId, {
      onSuccess: () => {
        setDeletingId(null);
        setSnackbar({ open: true, message: 'Task deleted', severity: 'success' });
      },
      onError: (err) => {
        setDeletingId(null);
        setSnackbar({ open: true, message: getErrorMessage(err), severity: 'error' });
      },
    });
  };

  const initialFormValues: TaskFormValues = editingTask
    ? {
        title: editingTask.title,
        description: editingTask.description ?? '',
        assigneeId: editingTask.assigneeId ?? null,
        startDate: editingTask.startDate ?? null,
        dueDate: editingTask.dueDate ?? null,
        urgency: editingTask.urgency ?? 2,
        importance: editingTask.importance ?? 2,
        tags: editingTask.tags ?? [],
      }
    : {
        title: '',
        description: '',
        assigneeId: currentUserId ?? null,
        startDate: null,
        dueDate: null,
        urgency: 2,
        importance: 2,
        tags: [],
      };

  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ pb: 10 }}>
      <FilterPanel
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters({})}
        availableTags={availableTags}
      />

      {error && <ErrorAlert message={getErrorMessage(error)} />}

      {isLoading && (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={100} sx={{ borderRadius: 3 }} />
          ))}
        </Stack>
      )}

      {!isLoading && tasks && tasks.length === 0 && (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 4,
            textAlign: 'center',
            borderRadius: 3,
            border: '1px dashed',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
            bgcolor: isDark ? 'rgba(30,41,59,0.5)' : '#f8fafc',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No tasks yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Create your first task to get started and organize your work.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTask(null);
              setFormOpen(true);
            }}
            sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 600, bgcolor: '#4f46e5' }}
          >
            Create task
          </Button>
        </Paper>
      )}

      {!isLoading && tasks && tasks.length > 0 && (
        <KanbanBoard
          tasks={tasks}
          currentUserId={currentUserId}
          assigneeEmailMap={assigneeEmailMap}
          onMove={handleMove}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onShare={handleShare}
          onTransition={handleTransition}
        />
      )}

      {/* Floating circular New Task button */}
      <Tooltip title="New Task">
        <Fab
          color="primary"
          onClick={() => {
            setEditingTask(null);
            setFormOpen(true);
          }}
          sx={{
            position: 'fixed',
            bottom: 28,
            right: 28,
            width: 56,
            height: 56,
            bgcolor: '#4f46e5',
            '&:hover': { bgcolor: '#4338ca' },
            boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
            zIndex: 1200,
          }}
          aria-label="New Task"
        >
          <AddIcon />
        </Fab>
      </Tooltip>

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        isLoading={createTask.isPending || updateTask.isPending}
        initialValues={initialFormValues}
        title={editingTask ? 'Edit Task' : 'Create Task'}
      />

      <ShareModal
        open={shareOpen}
        task={sharingTask}
        onClose={() => setShareOpen(false)}
        currentUserId={currentUserId}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'none' }} data-testid="transitioning-state" data-value={transitioningId ?? ''} />
      <Box sx={{ display: 'none' }} data-testid="deleting-state" data-value={deletingId ?? ''} />
    </Box>
  );
}
