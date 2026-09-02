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
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { TagInput } from './TagInput';
import { useUsers } from '../hooks/useUsers';
import { PRIORITY_LABELS } from '../utils/priority';

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

const PRIORITY_OPTIONS = [1, 2, 3, 4] as const;

export function TaskForm({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  initialValues = DEFAULT_VALUES,
  title = 'Create Task',
}: TaskFormProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [values, setValues] = useState<TaskFormValues>(initialValues);

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
    if (!values.assigneeId) return;
    onSubmit(values);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            bgcolor: isDark ? '#1e293b' : '#ffffff',
            border: isDark ? '1px solid rgba(255,255,255,0.06)' : 'none',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0, fontSize: '1.15rem' }}>{title}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              label="Title"
              value={values.title}
              onChange={handleChange('title')}
              required
              fullWidth
              autoFocus
              slotProps={{ htmlInput: { maxLength: 255 } }}
              size="small"
            />
            <TextField
              label="Description"
              value={values.description}
              onChange={handleChange('description')}
              multiline
              rows={3}
              fullWidth
              size="small"
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="urgency-label">Urgency</InputLabel>
                <Select
                  labelId="urgency-label"
                  id="urgency-select"
                  label="Urgency"
                  value={values.urgency}
                  onChange={handleSelectChange('urgency')}
                >
                  {PRIORITY_OPTIONS.map((v) => (
                    <MenuItem key={v} value={v}>
                      {PRIORITY_LABELS[v]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="importance-label">Importance</InputLabel>
                <Select
                  labelId="importance-label"
                  id="importance-select"
                  label="Importance"
                  value={values.importance}
                  onChange={handleSelectChange('importance')}
                >
                  {PRIORITY_OPTIONS.map((v) => (
                    <MenuItem key={v} value={v}>
                      {PRIORITY_LABELS[v]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {/* Pill preview */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={PRIORITY_LABELS[values.urgency]}
                size="small"
                sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                color={values.urgency >= 4 ? 'error' : values.urgency === 3 ? 'warning' : 'default'}
                variant={values.urgency >= 3 ? 'filled' : 'outlined'}
              />
              <Chip
                label={PRIORITY_LABELS[values.importance]}
                size="small"
                sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                color={values.importance >= 4 ? 'error' : values.importance === 3 ? 'warning' : 'default'}
                variant={values.importance >= 3 ? 'filled' : 'outlined'}
              />
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 0.5 }}>
                Preview
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Start Date"
                type="date"
                value={values.startDate ?? ''}
                onChange={handleDateChange('startDate')}
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="Due Date"
                type="date"
                value={values.dueDate ?? ''}
                onChange={handleDateChange('dueDate')}
                fullWidth
                size="small"
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
                <FormControl fullWidth size="small">
                  <InputLabel id="assignee-label">Assignee</InputLabel>
                  <Select
                    labelId="assignee-label"
                    id="assignee-select"
                    label="Assignee"
                    value={values.assigneeId ?? ''}
                    onChange={handleSelectChange('assigneeId')}
                  >
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
                  size="small"
                  helperText="User list unavailable — enter ID manually"
                />
              )
            ) : (
              <TextField
                label="Assignee ID"
                value={values.assigneeId ?? ''}
                onChange={handleChange('assigneeId')}
                fullWidth
                size="small"
                disabled
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={isLoading} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !values.title.trim() || Boolean(dateError) || !values.assigneeId}
            sx={{ borderRadius: 2, px: 3, fontWeight: 600 }}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
