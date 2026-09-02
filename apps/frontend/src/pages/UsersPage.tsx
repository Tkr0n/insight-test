import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Skeleton,
  Alert,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useAllUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useAllUsers';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface UserForm {
  email: string;
  name: string;
}

export function UsersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: users, isLoading, error } = useAllUsers();
  const { data: me } = useCurrentUser();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const params = new URLSearchParams(window.location.search);
  const autoCreate = params.get('action') === 'create';

  const [open, setOpen] = useState(autoCreate);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>({ email: '', name: '' });
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  const closeCreateModal = () => {
    setOpen(false);
    setCreated(null);
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ email: '', name: '' });
    setFormError('');
    setCreated(null);
    setOpen(true);
  };

  const handleOpenEdit = (u: { id: string; email: string; name?: string | null }) => {
    setEditingId(u.id);
    setForm({ email: u.email, name: u.name ?? '' });
    setFormError('');
    setCreated(null);
    setOpen(true);
  };

  const handleSubmit = () => {
    setFormError('');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError('Invalid email');
      return;
    }
    const payload = { email: form.email.trim(), name: form.name.trim() || null };
    if (editingId) {
      updateUser.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => setOpen(false),
          onError: (e: unknown) => {
            const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to update';
            setFormError(msg);
          },
        }
      );
    } else {
      createUser.mutate(payload, {
        onSuccess: (data) => {
          setFormError('');
          setCreated({ email: data.user.email, password: data.temporaryPassword });
        },
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create';
          setFormError(msg);
        },
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteUser.mutate(id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  };

  const isAdmin = me?.isAdmin === true;

  if (!me) {
    return (
      <Box sx={{ p: 4 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 2, mb: 1.5 }} />
        ))}
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Access restricted to administrators.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Users
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage system users — create, edit and delete
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: 2.5, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700 }}
        >
          New
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load users
        </Alert>
      )}

      {isLoading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={64} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      ) : (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
            bgcolor: isDark ? '#1e293b' : '#fff',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(15,23,42,0.5)' : '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ID</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(users ?? []).map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: u.id === me?.id ? '#4f46e5' : isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 16, color: u.id === me?.id ? '#fff' : '#64748b' }} />
                      </Box>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {u.name ?? '—'}{' '}
                          {u.id === me?.id && <Chip label="You" size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem', bgcolor: '#4f46e5', color: '#fff' }} />}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{u.email}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace' }}>{u.id.slice(0, 8)}…</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleOpenEdit(u)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={u.id === me?.id ? 'Cannot delete yourself' : 'Delete'}>
                      <span>
                        <IconButton size="small" color="error" disabled={u.id === me?.id} onClick={() => setDeleteConfirm(u.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {(users ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog
        open={open}
        onClose={closeCreateModal}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'Edit user' : created ? 'User created' : 'New user'}</DialogTitle>
        {created ? (
          <>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Alert severity="success">
                  {created.email} was created. Share this temporary password with them — they'll be required to change it on first login.
                </Alert>
                <TextField
                  label="Temporary password"
                  value={created.password}
                  fullWidth
                  size="small"
                  slotProps={{
                    htmlInput: { readOnly: true },
                    input: { sx: { fontFamily: 'monospace' } },
                  }}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button variant="contained" onClick={closeCreateModal} sx={{ borderRadius: 2, bgcolor: '#4f46e5' }}>
                Done
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {formError && <Alert severity="error">{formError}</Alert>}
                <TextField
                  label="Email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  fullWidth
                  size="small"
                  type="email"
                  autoFocus
                />
                <TextField
                  label="Name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  fullWidth
                  size="small"
                  placeholder="Optional"
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={closeCreateModal} sx={{ borderRadius: 2 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={createUser.isPending || updateUser.isPending}
                sx={{ borderRadius: 2, bgcolor: '#4f46e5' }}
              >
                {editingId ? 'Save' : 'Create'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle>Delete user</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure? This cannot be undone. If the user owns tasks, reassign them first.
          </Typography>
          {deleteUser.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(deleteUser.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to delete'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} sx={{ borderRadius: 2 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
