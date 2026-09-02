import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  Link,
} from '@mui/material';
import { login, register, changePassword } from '../api/auth.api';

type Mode = 'login' | 'register';

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [session, setSession] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const switchingPassword = session !== null;

  const resetFields = () => {
    setSession(null);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setInfo('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.challenge === 'NEW_PASSWORD_REQUIRED' && result.session) {
        setSession(result.session);
        return;
      }
      localStorage.removeItem('id_token');
      navigate('/tasks', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setError(axiosErr.response?.data?.error ?? axiosErr.message ?? 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }
    try {
      await changePassword(email, session as string, newPassword);
      localStorage.removeItem('id_token');
      navigate('/tasks', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setError(axiosErr.response?.data?.error ?? axiosErr.message ?? 'Failed to change password');
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setIsLoading(true);
    try {
      await register(email, password, name || null);
      setMode('login');
      setIsLoading(false);
      setInfo('Account created. You can now sign in.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string };
      setError(axiosErr.response?.data?.error ?? axiosErr.message ?? 'Registration failed');
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'grey.100',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Insightt Task Manager
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            {switchingPassword
              ? 'You must set a new password before continuing'
              : mode === 'login'
                ? 'Sign in to manage your tasks'
                : 'Create your account'}
          </Typography>

          {switchingPassword ? (
            <form onSubmit={handleChangePassword}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField label="Email" type="email" value={email} disabled fullWidth autoFocus />
                <TextField
                  label="New password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  fullWidth
                  helperText="Minimum 8 characters with uppercase, lowercase and a number"
                />
                <TextField
                  label="Confirm new password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Set password and sign in'}
                </Button>
              </Stack>
            </form>
          ) : mode === 'login' ? (
            <form onSubmit={handleLogin}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                {info && <Alert severity="success">{info}</Alert>}
                <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth autoFocus />
                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    resetFields();
                    setMode('register');
                  }}
                  sx={{ alignSelf: 'center' }}
                >
                  Don't have an account? Register
                </Link>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <Stack spacing={2}>
                {error && <Alert severity="error">{error}</Alert>}
                <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth autoFocus />
                <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
                <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth helperText="Minimum 8 characters with uppercase, lowercase and a number" />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create account'}
                </Button>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    resetFields();
                    setMode('login');
                  }}
                  sx={{ alignSelf: 'center' }}
                >
                  Already have an account? Sign in
                </Link>
              </Stack>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
