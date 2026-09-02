import {
  TextField,
  Autocomplete,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Chip,
  Stack,
  Box,
  Button,
  Typography,
  OutlinedInput,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useUsers } from '../hooks/useUsers';
import type { TaskFilters, TaskStatus } from '../types/task';
import { PRIORITY_LABELS } from '../utils/priority';

const STATUS_OPTIONS: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED'];

interface FilterPanelProps {
  filters: TaskFilters;
  onChange: (f: TaskFilters) => void;
  onClear: () => void;
  availableTags?: string[];
}

function FilterContent({
  filters,
  onChange,
  onClear,
  availableTags,
}: FilterPanelProps) {
  const { data: users, isLoading: usersLoading } = useUsers();
  const userOptions = users ?? [];
  const selectedUser =
    filters.assigneeId != null
      ? (userOptions.find((u) => u.id === filters.assigneeId) ?? null)
      : null;

  const activeChips: { label: string; onDelete: () => void }[] = [];

  if (filters.title) {
    activeChips.push({
      label: `title: ${filters.title}`,
      onDelete: () => onChange({ ...filters, title: undefined }),
    });
  }
  if (filters.assigneeId) {
    const userLabel =
      userOptions.find((u) => u.id === filters.assigneeId)?.email ?? filters.assigneeId;
    activeChips.push({
      label: `assignee: ${userLabel}`,
      onDelete: () => onChange({ ...filters, assigneeId: undefined }),
    });
  }
  if (filters.tags?.length) {
    for (const t of filters.tags) {
      activeChips.push({
        label: `tag: ${t}`,
        onDelete: () => {
          const next = filters.tags?.filter((x) => x !== t);
          onChange({ ...filters, tags: next?.length ? next : undefined });
        },
      });
    }
  }
  if (filters.urgency !== undefined) {
    activeChips.push({
      label: `urgency: ${PRIORITY_LABELS[filters.urgency]}`,
      onDelete: () => onChange({ ...filters, urgency: undefined }),
    });
  }
  if (filters.importance !== undefined) {
    activeChips.push({
      label: `importance: ${PRIORITY_LABELS[filters.importance]}`,
      onDelete: () => onChange({ ...filters, importance: undefined }),
    });
  }
  if (filters.startDateFrom) {
    activeChips.push({
      label: `start from: ${filters.startDateFrom}`,
      onDelete: () => onChange({ ...filters, startDateFrom: undefined }),
    });
  }
  if (filters.startDateTo) {
    activeChips.push({
      label: `start to: ${filters.startDateTo}`,
      onDelete: () => onChange({ ...filters, startDateTo: undefined }),
    });
  }
  if (filters.dueDateFrom) {
    activeChips.push({
      label: `due from: ${filters.dueDateFrom}`,
      onDelete: () => onChange({ ...filters, dueDateFrom: undefined }),
    });
  }
  if (filters.dueDateTo) {
    activeChips.push({
      label: `due to: ${filters.dueDateTo}`,
      onDelete: () => onChange({ ...filters, dueDateTo: undefined }),
    });
  }
  if (filters.overdue) {
    activeChips.push({
      label: 'overdue',
      onDelete: () => onChange({ ...filters, overdue: undefined }),
    });
  }
  if (filters.status?.length) {
    for (const s of filters.status) {
      activeChips.push({
        label: `status: ${s}`,
        onDelete: () => {
          const next = filters.status?.filter((x) => x !== s);
          onChange({ ...filters, status: next?.length ? next : undefined });
        },
      });
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          placeholder="Search title"
          label="Search title"
          value={filters.title ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ ...filters, title: v.trim() ? v : undefined });
          }}
          size="small"
          fullWidth
        />

        <Autocomplete
          options={userOptions}
          getOptionLabel={(option) =>
            typeof option === 'string'
              ? option
              : option.name
                ? `${option.name} (${option.email})`
                : option.email
          }
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selectedUser}
          onChange={(_event, newValue) => {
            if (newValue && typeof newValue !== 'string') {
              onChange({ ...filters, assigneeId: newValue.id });
            } else {
              onChange({ ...filters, assigneeId: undefined });
            }
          }}
          loading={usersLoading}
          loadingText="Loading users..."
          noOptionsText={usersLoading ? 'Loading users...' : 'No users available'}
          renderInput={(params) => (
            <TextField {...params} label="Assignee" placeholder="Search by name or email" size="small" />
          )}
          sx={{ minWidth: 220, flex: 1 }}
        />

        <Autocomplete
          multiple
          freeSolo
          options={availableTags ?? []}
          value={filters.tags ?? []}
          onChange={(_event, newValue) => {
            const cleaned = (newValue as string[]).map((v) => v.trim()).filter(Boolean);
            onChange({ ...filters, tags: cleaned.length ? cleaned : undefined });
          }}
          renderInput={(params) => (
            <TextField {...params} label="Tags" placeholder="Add tags" size="small" />
          )}
          sx={{ minWidth: 220, flex: 1 }}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
          <InputLabel id="filter-urgency-label">Urgency</InputLabel>
          <Select
            labelId="filter-urgency-label"
            label="Urgency"
            value={filters.urgency ?? ''}
            onChange={(e) => {
              const v = e.target.value as string | number;
              onChange({ ...filters, urgency: v === '' ? undefined : Number(v) });
            }}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {[1, 2, 3, 4].map((v) => (
              <MenuItem key={v} value={v}>
                {PRIORITY_LABELS[v]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160, flex: 1 }}>
          <InputLabel id="filter-importance-label">Importance</InputLabel>
          <Select
            labelId="filter-importance-label"
            label="Importance"
            value={filters.importance ?? ''}
            onChange={(e) => {
              const v = e.target.value as string | number;
              onChange({ ...filters, importance: v === '' ? undefined : Number(v) });
            }}
          >
            <MenuItem value="">
              <em>All</em>
            </MenuItem>
            {[1, 2, 3, 4].map((v) => (
              <MenuItem key={v} value={v}>
                {PRIORITY_LABELS[v]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel id="filter-status-label">Status</InputLabel>
          <Select
            labelId="filter-status-label"
            label="Status"
            multiple
            value={filters.status ?? []}
            onChange={(e) => {
              const v = e.target.value as TaskStatus[];
              onChange({ ...filters, status: v.length ? v : undefined });
            }}
            input={<OutlinedInput label="Status" />}
            renderValue={(selected) => (selected as string[]).join(', ')}
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                <Checkbox checked={(filters.status ?? []).includes(s)} size="small" />
                <Typography variant="body2">{s}</Typography>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControlLabel
          control={
            <Checkbox
              checked={!!filters.overdue}
              onChange={(e) => onChange({ ...filters, overdue: e.target.checked ? true : undefined })}
              size="small"
            />
          }
          label="Overdue"
          sx={{ minWidth: 110 }}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Start from"
          type="date"
          value={filters.startDateFrom ?? ''}
          onChange={(e) => onChange({ ...filters, startDateFrom: e.target.value || undefined })}
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Start to"
          type="date"
          value={filters.startDateTo ?? ''}
          onChange={(e) => onChange({ ...filters, startDateTo: e.target.value || undefined })}
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Due from"
          type="date"
          value={filters.dueDateFrom ?? ''}
          onChange={(e) => onChange({ ...filters, dueDateFrom: e.target.value || undefined })}
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Due to"
          type="date"
          value={filters.dueDateTo ?? ''}
          onChange={(e) => onChange({ ...filters, dueDateTo: e.target.value || undefined })}
          size="small"
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>

      {activeChips.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          {activeChips.map((chip) => (
            <Chip key={chip.label} label={chip.label} onDelete={chip.onDelete} size="small" />
          ))}
          <Button variant="outlined" size="small" onClick={onClear} sx={{ ml: 1, borderRadius: 2 }}>
            Clear
          </Button>
        </Stack>
      )}
      {activeChips.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" size="small" onClick={onClear} sx={{ borderRadius: 2 }}>
            Clear
          </Button>
        </Box>
      )}
    </Stack>
  );
}

export function FilterPanel(props: FilterPanelProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    const activeCount =
      (props.filters.title ? 1 : 0) +
      (props.filters.assigneeId ? 1 : 0) +
      (props.filters.tags?.length ?? 0) +
      (props.filters.urgency !== undefined ? 1 : 0) +
      (props.filters.importance !== undefined ? 1 : 0) +
      (props.filters.status?.length ?? 0) +
      (props.filters.overdue ? 1 : 0) +
      (props.filters.startDateFrom ? 1 : 0) +
      (props.filters.startDateTo ? 1 : 0) +
      (props.filters.dueDateFrom ? 1 : 0) +
      (props.filters.dueDateTo ? 1 : 0);

    return (
      <Accordion
        disableGutters
        elevation={0}
        defaultExpanded={false}
        sx={{
          mb: 2.5,
          borderRadius: '12px !important',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
          bgcolor: isDark ? '#1e293b' : '#ffffff',
          overflow: 'hidden',
          '&:before': { display: 'none' },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: isDark ? 'rgba(15,23,42,0.3)' : '#f8fafc',
            '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1.5 },
          }}
        >
          <FilterListIcon sx={{ fontSize: 20, color: isDark ? '#94a3b8' : '#64748b' }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', flex: 1 }}>Filters</Typography>
          {activeCount > 0 && (
            <Chip
              label={activeCount}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: '#4f46e5',
                color: '#fff',
              }}
            />
          )}
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2, pt: 1 }}>
          <FilterContent {...props} />
        </AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Box
      sx={{
        p: 2.5,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
        borderRadius: 3,
        mb: 2.5,
        bgcolor: isDark ? '#1e293b' : '#ffffff',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(15,23,42,0.06)',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: isDark ? '#94a3b8' : '#64748b', mb: 2 }}
      >
        Filters
      </Typography>
      <FilterContent {...props} />
    </Box>
  );
}
