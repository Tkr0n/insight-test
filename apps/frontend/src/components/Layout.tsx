import { ReactNode } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  TaskAlt as LogoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useColorMode } from '../theme/ColorModeContext';
import { apiClient } from '../api/axios-client';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { mode, toggleMode } = useColorMode();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // proceed to logout locally even if backend fails
    }
    localStorage.removeItem('id_token');
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
          borderBottom: '1px solid',
          borderColor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
          color: mode === 'dark' ? '#f1f5f9' : '#0f172a',
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <LogoIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.1rem' }}>
            Insightt
          </Typography>
          <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
            <IconButton
              onClick={toggleMode}
              size="small"
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                color: mode === 'dark' ? '#f1f5f9' : '#475569',
                '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0' },
              }}
            >
              {mode === 'dark' ? <LightIcon fontSize="small" /> : <DarkIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Button
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              color: mode === 'dark' ? '#94a3b8' : '#64748b',
              '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f1f5f9' },
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
