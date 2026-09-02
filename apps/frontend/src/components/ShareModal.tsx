import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Autocomplete,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Box,
  Divider,
} from '@mui/material';
import { Close as CloseIcon, PersonRemove as RemoveIcon } from '@mui/icons-material';
import { useShares, useShareTask, useUnshareTask } from '../hooks/useShareTask';
import { useUsers } from '../hooks/useUsers';
import type { Task, User } from '../types/task';

interface ShareModalProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  isOwner?: boolean;
  currentUserId?: string;
}

function getUserLabel(user: User): string {
  return user.name ? `${user.name} (${user.email})` : user.email;
}

export function ShareModal({ open, task, onClose, isOwner, currentUserId }: ShareModalProps) {
  const taskId = task?.id ?? '';

  // Only fetch shares when dialog is open and task exists
  const {
    data: shares,
    isLoading: isSharesLoading,
    isFetching: isSharesFetching,
  } = useShares(open && taskId ? taskId : '');

  const { data: users, isLoading: isUsersLoading } = useUsers();
  const shareMutation = useShareTask();
  const unshareMutation = useUnshareTask();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Effective owner check: explicit prop wins, else infer from currentUserId vs task.ownerId
  const effectiveIsOwner = useMemo(() => {
    if (typeof isOwner === 'boolean') return isOwner;
    if (currentUserId && task) return task.ownerId === currentUserId;
    // If no info, allow removal to avoid blocking UI; backend will still enforce 403
    return true;
  }, [isOwner, currentUserId, task]);

  // Users not yet shared and not the owner (owner already has access)
  const availableUsers = useMemo(() => {
    if (!users) return [];
    if (!shares) return users;
    const sharedIds = new Set(shares.map((s) => s.userId));
    return users.filter((u) => {
      if (sharedIds.has(u.id)) return false;
      if (task && u.id === task.ownerId) return false;
      return true;
    });
  }, [users, shares, task]);

  const sharesWithEmail = useMemo(() => {
    if (!shares) return [];
    return shares.map((s) => {
      const user = users?.find((u) => u.id === s.userId);
      return {
        share: s,
        label: user ? getUserLabel(user) : s.userId,
        email: user?.email ?? s.userId,
      };
    });
  }, [shares, users]);

  const handleAdd = () => {
    if (!taskId || !selectedUser) return;
    shareMutation.mutate(
      { taskId, userId: selectedUser.id },
      {
        onSuccess: () => setSelectedUser(null),
      },
    );
  };

  const handleRemove = (userId: string) => {
    if (!taskId) return;
    unshareMutation.mutate({ taskId, userId });
  };

  const handleClose = () => {
    setSelectedUser(null);
    onClose();
  };

  const isAdding = shareMutation.isPending;
  const isRemovingId = unshareMutation.isPending ? unshareMutation.variables?.userId : null;

  const showSharesLoading = (isSharesLoading || isSharesFetching) && open && Boolean(taskId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Share Task{task ? ` — ${task.title}` : ''}</span>
        <IconButton size="small" onClick={handleClose} aria-label="Close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Add share section */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Add collaborator
            </Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
              <Autocomplete
                options={availableUsers}
                getOptionLabel={(option) => getUserLabel(option)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedUser}
                onChange={(_event, newValue) => setSelectedUser(newValue)}
                loading={isUsersLoading}
                noOptionsText={isUsersLoading ? 'Loading users...' : 'No users available'}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select user"
                    placeholder="Search by email or name"
                    size="small"
                  />
                )}
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={handleAdd}
                disabled={!selectedUser || isAdding || !effectiveIsOwner}
                sx={{ minWidth: 80, height: 40 }}
              >
                {isAdding ? <CircularProgress size={18} color="inherit" /> : 'Add'}
              </Button>
            </Stack>
            {!effectiveIsOwner && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Only the owner can add collaborators.
              </Typography>
            )}
            {shareMutation.isError && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                Failed to share. Please try again.
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Shares list */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Shared with ({sharesWithEmail.length})
            </Typography>

            {showSharesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : sharesWithEmail.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                Not shared with anyone yet.
              </Typography>
            ) : (
              <List dense disablePadding>
                {sharesWithEmail.map(({ share, label, email }) => {
                  const isRemoving = isRemovingId === share.userId;
                  return (
                    <ListItem
                      key={share.id}
                      secondaryAction={
                        effectiveIsOwner ? (
                          <IconButton
                            edge="end"
                            size="small"
                            color="error"
                            onClick={() => handleRemove(share.userId)}
                            disabled={isRemoving}
                            aria-label={`Remove ${email}`}
                          >
                            {isRemoving ? <CircularProgress size={16} /> : <RemoveIcon fontSize="small" />}
                          </IconButton>
                        ) : undefined
                      }
                      sx={{ px: 0 }}
                    >
                      <ListItemText
                        primary={label}
                        secondary={email !== label ? email : undefined}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
            {unshareMutation.isError && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                Failed to remove access. Please try again.
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
