import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material';
import { TagInput } from './TagInput';
import { useUsers } from '../hooks/useUsers';

export interface TaskFormValues {
  title: string;
  description: string;
  assigneeId: string | null;
  startDate: string | null;
  dueDate: string | null;
  urgency: number;
  importance: number;
  tags: string[];
}

const DEFAULT_VALUES: TaskFormValues = {
  title: '',
  description: '',
  assigneeId: null,
  startDate: null,
  dueDate: null,
  urgency: 2,
  importance: 2,
  tags: [],
};

interface TaskFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
  isLoading?: boolean;
  initialValues?: TaskFormValues;
  title?: string;
}

export function TaskForm({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  initialValues = DEFAULT_VALUES,
  title = 'Create Task',
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>(initialValues);

  // Try to load users for assignee dropdown; fallback gracefully if hook fails
  let usersData: { id: string; email: string; name?: string }[] | undefined;
  let usersLoading = false;
  try {
    const usersQuery = useUsers();
    usersData = usersQuery.data;
    usersLoading = usersQuery.isLoading;
  } catch {
    usersData = undefined;
  }

  useEffect(() => {
    if (open) {
      setValues(initialValues);
    }
  }, [open, initialValues]);

  const handleChange =
    (field: keyof TaskFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const raw = e.target.value;
      // Normalize empty assigneeId to null for API consistency
      const next = field === 'assigneeId' && raw === '' ? null : raw;
      setValues((prev) => ({ ...prev, [field]: next }));
    };

  const handleSelectChange =
    (field: 'urgency' | 'importance' | 'assigneeId') =>
    (e: { target: { value: unknown } }) => {
      const raw = e.target.value as string | number;
      if (field === 'assigneeId') {
        const val = raw === '' ? null : (raw as string);
        setValues((prev) => ({ ...prev, assigneeId: val }));
        return;
      }
      setValues((prev) => ({ ...prev, [field]: Number(raw) }));
    };

  const handleDateChange =
    (field: 'startDate' | 'dueDate') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setValues((prev) => ({ ...prev, [field]: raw === '' ? null : raw }));
    };

  const handleTagsChange = (tags: string[]) => {
    setValues((prev) => ({ ...prev, tags }));
  };

  const dateError =
    values.startDate && values.dueDate && values.dueDate < values.startDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) return;
    if (dateError) return;
    onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={values.title}
              onChange={handleChange('title')}
              required
              fullWidth
              autoFocus
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <TextField
              label="Description"
              value={values.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              fullWidth
            />

            <Stack direction="row" spacing={2}>
              <FormControl fullWidth>
                <InputLabel id="urgency-label">Urgency</InputLabel>
                <Select
                  labelId="urgency-label"
                  id="urgency-select"
                  label="Urgency"
                  value={values.urgency}
                  onChange={handleSelectChange('urgency')}
                >
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={4}>4</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel id="importance-label">Importance</InputLabel>
                <Select
                  labelId="importance-label"
                  id="importance-select"
                  label="Importance"
                  value={values.importance}
                  onChange={handleSelectChange('importance')}
                >
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={4}>4</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                value={values.startDate ?? ''}
                onChange={handleDateChange('startDate')}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Due Date"
                type="date"
                value={values.dueDate ?? ''}
                onChange={handleDateChange('dueDate')}
                fullWidth
                error={Boolean(dateError)}
                helperText={dateError ? 'Due date cannot be before start date' : undefined}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            {dateError ? (
              <FormHelperText error sx={{ mt: -1 }}>
                Due date cannot be before start date
              </FormHelperText>
            ) : null}

            <TagInput value={values.tags} onChange={handleTagsChange} />

            {usersData !== undefined || !usersLoading ? (
              usersData ? (
                <FormControl fullWidth>
                  <InputLabel id="assignee-label">Assignee</InputLabel>
                  <Select
                    labelId="assignee-label"
                    id="assignee-select"
                    label="Assignee"
                    value={values.assigneeId ?? ''}
                    onChange={handleSelectChange('assigneeId')}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {usersData.map((u) => (
                      <MenuItem key={u.id} value={u.id}>
                        {u.name ? `${u.name} (${u.email})` : u.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  label="Assignee ID"
                  value={values.assigneeId ?? ''}
                  onChange={handleChange('assigneeId')}
                  fullWidth
                  placeholder="Enter assignee user ID"
                  helperText="User list unavailable — enter ID manually"
                />
              )
            ) : (
              <TextField
                label="Assignee ID"
                value={values.assigneeId ?? ''}
                onChange={handleChange('assigneeId')}
                fullWidth
                placeholder="Loading users..."
                disabled
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !values.title.trim() || Boolean(dateError)}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
