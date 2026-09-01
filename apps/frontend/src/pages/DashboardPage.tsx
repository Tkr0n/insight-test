import { useState } from 'react';
import {
  Typography,
  Button,
  Stack,
  Skeleton,
  Snackbar,
  Alert,
  Box,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTasks } from '../hooks/useTasks';
import { useCreateTask } from '../hooks/useCreateTask';
import { useUpdateTask } from '../hooks/useUpdateTask';
import { useDeleteTask } from '../hooks/useDeleteTask';
import { useMarkAsDone } from '../hooks/useMarkAsDone';
import { TaskCard } from '../components/TaskCard';
import { TaskForm } from '../components/TaskForm';
import { ErrorAlert } from '../components/ErrorAlert';
import type { Task, TaskStatus } from '../types/task';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

export function DashboardPage() {
  const { data: tasks, isLoading, error } = useTasks();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const markAsDone = useMarkAsDone();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);

  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
      const status = axiosErr.response?.status;
      if (status === 422) return 'Invalid status transition. Please refresh and try again.';
      if (status === 409) return 'This action was already processed. Please refresh.';
      if (status === 401) return 'Your session has expired. Please log in again.';
      return axiosErr.response?.data?.error || 'An error occurred';
    }
    return 'An unexpected error occurred';
  };

  const handleCreate = (values: { title: string; description: string }) => {
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

  const handleUpdate = (values: { title: string; description: string }) => {
    if (!editingTask) return;
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
      }
    );
  };

  const handleTransition = (taskId: string, targetStatus: TaskStatus) => {
    setTransitioningId(taskId);

    if (targetStatus === 'ARCHIVED') {
      updateTask.mutate(
        { id: taskId, status: targetStatus },
        {
          onSuccess: () => {
            setTransitioningId(null);
            setSnackbar({ open: true, message: 'Task status updated', severity: 'success' });
          },
          onError: (err) => {
            setTransitioningId(null);
            setSnackbar({ open: true, message: getErrorMessage(err), severity: 'error' });
          },
        }
      );
    } else {
      markAsDone.mutate(taskId, {
        onSuccess: () => {
          setTransitioningId(null);
          setSnackbar({ open: true, message: 'Task status updated', severity: 'success' });
        },
        onError: (err) => {
          setTransitioningId(null);
          setSnackbar({ open: true, message: getErrorMessage(err), severity: 'error' });
        },
      });
    }
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

  return (
    <Box>
      <Stack direction="row" sx={{ mb: 3, justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">My Tasks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingTask(null);
            setFormOpen(true);
          }}
        >
          New Task
        </Button>
      </Stack>

      {error && <ErrorAlert message={getErrorMessage(error)} />}

      {isLoading && (
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={100} />
          ))}
        </Stack>
      )}

      {!isLoading && tasks && tasks.length === 0 && (
        <Typography align="center" color="text.secondary" sx={{ py: 8 }}>
          No tasks yet. Create your first task to get started.
        </Typography>
      )}

      {!isLoading && tasks && tasks.length > 0 && (
        <Stack spacing={0}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onTransition={handleTransition}
              onDelete={handleDelete}
              onEdit={handleEdit}
              isTransitioning={transitioningId === task.id}
              isDeleting={deletingId === task.id}
            />
          ))}
        </Stack>
      )}

      <TaskForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdate : handleCreate}
        isLoading={createTask.isPending || updateTask.isPending}
        initialValues={
          editingTask
            ? { title: editingTask.title, description: editingTask.description ?? '' }
            : undefined
        }
        title={editingTask ? 'Edit Task' : 'Create Task'}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
