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

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm({ email: '', name: '' });
    setFormError('');
    setOpen(true);
  };

  const handleOpenEdit = (u: { id: string; email: string; name?: string | null }) => {
    setEditingId(u.id);
    setForm({ email: u.email, name: u.name ?? '' });
    setFormError('');
    setOpen(true);
  };

  const handleSubmit = () => {
    setFormError('');
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError('Email inválido');
      return;
    }
    const payload = { email: form.email.trim(), name: form.name.trim() || null };
    if (editingId) {
      updateUser.mutate(
        { id: editingId, ...payload },
        {
          onSuccess: () => setOpen(false),
          onError: (e: unknown) => {
            const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al actualizar';
            setFormError(msg);
          },
        }
      );
    } else {
      createUser.mutate(payload, {
        onSuccess: () => setOpen(false),
        onError: (e: unknown) => {
          const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear';
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

  return (
    <Box sx={{ pb: 4 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Gestiona los usuarios del sistema — crear, editar y eliminar
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ borderRadius: 2.5, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, fontWeight: 700 }}
        >
          Nuevo
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error al cargar usuarios
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
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ID</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Acciones</TableCell>
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
                          {u.id === me?.id && <Chip label="Tú" size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem', bgcolor: '#4f46e5', color: '#fff' }} />}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.85rem' }}>{u.email}</TableCell>
                  <TableCell sx={{ fontSize: '0.7rem', color: 'text.secondary', fontFamily: 'monospace' }}>{u.id.slice(0, 8)}…</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenEdit(u)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={u.id === me?.id ? 'No puedes eliminarte' : 'Eliminar'}>
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
                    No hay usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{editingId ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
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
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              fullWidth
              size="small"
              placeholder="Opcional"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={createUser.isPending || updateUser.isPending}
            sx={{ borderRadius: 2, bgcolor: '#4f46e5' }}
          >
            {editingId ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle>Eliminar usuario</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            ¿Estás seguro? Esta acción no se puede deshacer. Si el usuario es dueño de tareas, deberás reasignarlas primero.
          </Typography>
          {deleteUser.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(deleteUser.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'No se pudo eliminar'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)} sx={{ borderRadius: 2 }}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} sx={{ borderRadius: 2 }}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
