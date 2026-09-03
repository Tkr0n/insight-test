import { ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import {
  Logout as LogoutIcon,
  LightMode as LightIcon,
  DarkMode as DarkIcon,
  TaskAlt as LogoIcon,
  People as UsersIcon,
  Description as DocsIcon,
  ExpandMore as ExpandIcon,
  Menu as MenuIcon,
  Architecture as ArchIcon,
  Schema as SchemaIcon,
  Storage as InfraIcon,
  BugReport as TestIcon,
  Gavel as RulesIcon,
  Hub as FlowIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useColorMode } from '../theme/ColorModeContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { apiClient } from '../api/axios-client';
import { DIAGRAMS } from '../pages/DocumentationPage';

function NavButton({
  label,
  active,
  menuOpen,
  onClick,
  icon,
  hasMenu,
}: {
  label: string;
  active?: boolean;
  menuOpen?: boolean;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  icon: React.ReactNode;
  hasMenu?: boolean;
}) {
  const { mode } = useColorMode();
  const isOpen = Boolean(hasMenu && menuOpen && !active);
  const borderColor = isOpen ? (mode === 'dark' ? '#6366f1' : '#4f46e5') : 'transparent';
  return (
    <Button
      onClick={onClick}
      startIcon={icon}
      endIcon={hasMenu ? <ExpandIcon sx={{ fontSize: 16 }} /> : undefined}
      sx={{
        borderRadius: 2,
        textTransform: 'none',
        fontWeight: active ? 700 : 600,
        color: active ? '#4f46e5' : mode === 'dark' ? '#cbd5e1' : '#475569',
        bgcolor: active ? (mode === 'dark' ? 'rgba(79,70,229,0.15)' : '#eef2ff') : 'transparent',
        border: `1px solid ${borderColor}`,
        px: 1.75,
        py: 0.7,
        '&:hover': { bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#f1f5f9' },
      }}
    >
      {label}
    </Button>
  );
}

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobileNav = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleMode } = useColorMode();
  const { data: me } = useCurrentUser();
  const isAdmin = me?.isAdmin === true;

  const [docsAnchor, setDocsAnchor] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDocsOpen, setDrawerDocsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // proceed to logout locally even if backend fails
    }
    localStorage.removeItem('id_token');
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const openDocsDiagram = (diagramId: string) => {
    setDocsAnchor(null);
    const file = DIAGRAMS.find((d) => d.id === diagramId)?.file;
    if (file) window.open(`/docs/diagrams/${encodeURIComponent(file)}`, '_blank');
  };

  const openDrawerDiagram = (diagramId: string) => {
    setDrawerOpen(false);
    const file = DIAGRAMS.find((d) => d.id === diagramId)?.file;
    if (file) window.open(`/docs/diagrams/${encodeURIComponent(file)}`, '_blank');
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
        <Toolbar sx={{ gap: 1 }}>
          <Box
            onClick={() => navigate('/tasks')}
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              cursor: 'pointer',
            }}
          >
            <LogoIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          <Typography
            onClick={() => navigate('/tasks')}
            variant="h6"
            sx={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.1rem', cursor: 'pointer', mr: 1 }}
          >
            Insightt
          </Typography>

          {!isMobileNav && (
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 1, alignItems: 'center' }}>
              <Button
                onClick={() => navigate('/tasks')}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: isActive('/tasks') ? 700 : 600,
                  color: isActive('/tasks') ? '#4f46e5' : mode === 'dark' ? '#cbd5e1' : '#475569',
                  bgcolor: isActive('/tasks') ? (mode === 'dark' ? 'rgba(79,70,229,0.15)' : '#eef2ff') : 'transparent',
                }}
              >
                Tasks
              </Button>

              {isAdmin && (
                <NavButton
                  label="Users"
                  icon={<UsersIcon sx={{ fontSize: 18 }} />}
                  active={isActive('/users')}
                  onClick={() => navigate('/users')}
                />
              )}
              <NavButton
                label="Documentation"
                icon={<DocsIcon sx={{ fontSize: 18 }} />}
                active={isActive('/docs')}
                menuOpen={Boolean(docsAnchor)}
                hasMenu
                onClick={(e) => setDocsAnchor(e.currentTarget)}
              />
            </Box>
          )}

          {isMobileNav && <Box sx={{ flex: 1 }} />}

          {!isMobileNav && (
            <>
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
            </>
          )}

          {isMobileNav && (
            <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: mode === 'dark' ? '#f1f5f9' : '#0f172a' }}>
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={docsAnchor}
        open={Boolean(docsAnchor)}
        onClose={() => setDocsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 280, mt: 1 } } }}
      >
        <MenuItem onClick={() => { setDocsAnchor(null); navigate('/docs'); }}>
          <ListItemIcon>
            <DocsIcon fontSize="small" />
          </ListItemIcon>
          View all documentation
        </MenuItem>
        <Divider />
        <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', fontWeight: 700, letterSpacing: '0.06em' }}>
          MARKDOWN
        </Typography>
        <MenuItem onClick={() => { setDocsAnchor(null); navigate('/docs?doc=architecture-and-flows'); }}>
          <ListItemIcon>
            <ArchIcon fontSize="small" />
          </ListItemIcon>
          Architecture & Flows
        </MenuItem>
        <MenuItem onClick={() => { setDocsAnchor(null); navigate('/docs?doc=business-rules'); }}>
          <ListItemIcon>
            <RulesIcon fontSize="small" />
          </ListItemIcon>
          Business Rules
        </MenuItem>
        <MenuItem onClick={() => { setDocsAnchor(null); navigate('/docs?doc=database-schema'); }}>
          <ListItemIcon>
            <SchemaIcon fontSize="small" />
          </ListItemIcon>
          Database Schema
        </MenuItem>
        <MenuItem onClick={() => { setDocsAnchor(null); navigate('/docs?doc=infrastructure'); }}>
          <ListItemIcon>
            <InfraIcon fontSize="small" />
          </ListItemIcon>
          Infrastructure
        </MenuItem>
        <MenuItem onClick={() => { setDocsAnchor(null); navigate('/docs?doc=testing-strategy'); }}>
          <ListItemIcon>
            <TestIcon fontSize="small" />
          </ListItemIcon>
          Testing Strategy
        </MenuItem>
        <Divider />
        <Typography variant="caption" sx={{ px: 2, py: 0.5, color: 'text.secondary', fontWeight: 700, letterSpacing: '0.06em' }}>
          HTML DIAGRAMS
        </Typography>
        <MenuItem onClick={() => openDocsDiagram('system.architecture')}>
          <ListItemIcon>
            <ArchIcon fontSize="small" />
          </ListItemIcon>
          System Architecture
        </MenuItem>
        <MenuItem onClick={() => openDocsDiagram('users-access')}>
          <ListItemIcon>
            <ArchIcon fontSize="small" />
          </ListItemIcon>
          Access & Roles
        </MenuItem>
        <MenuItem onClick={() => openDocsDiagram('auth-flow')}>
          <ListItemIcon>
            <FlowIcon fontSize="small" />
          </ListItemIcon>
          Auth Flow
        </MenuItem>
        <MenuItem onClick={() => openDocsDiagram('request-flow')}>
          <ListItemIcon>
            <FlowIcon fontSize="small" />
          </ListItemIcon>
          Request Flow
        </MenuItem>
        <MenuItem onClick={() => openDocsDiagram('infrastructure')}>
          <ListItemIcon>
            <InfraIcon fontSize="small" />
          </ListItemIcon>
          Infrastructure
        </MenuItem>
      </Menu>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} slotProps={{ paper: { sx: { width: 300 } } }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Navigation
          </Typography>
          <IconButton size="small" onClick={toggleMode}>
            {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
          </IconButton>
        </Box>
        <Divider />
        <List>
          <ListItemButton onClick={() => { setDrawerOpen(false); navigate('/tasks'); }} selected={isActive('/tasks')}>
            <ListItemIcon>
              <LogoIcon />
            </ListItemIcon>
            <ListItemText primary="Tasks" />
          </ListItemButton>

          {isAdmin && (
            <ListItemButton onClick={() => { setDrawerOpen(false); navigate('/users'); }} selected={isActive('/users')}>
              <ListItemIcon>
                <UsersIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItemButton>
          )}

          <ListItemButton onClick={() => setDrawerDocsOpen((v) => !v)}>
            <ListItemIcon>
              <DocsIcon />
            </ListItemIcon>
            <ListItemText primary="Documentation" />
            <ExpandIcon sx={{ transform: drawerDocsOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
          </ListItemButton>
          <Collapse in={drawerDocsOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ pl: 4 }} onClick={() => { setDrawerOpen(false); navigate('/docs'); }}>
                <ListItemText primary="View all" />
              </ListItemButton>
              {[
                ['Architecture', 'architecture-and-flows'],
                ['Business Rules', 'business-rules'],
                ['DB Schema', 'database-schema'],
                ['Infrastructure', 'infrastructure'],
                ['Testing', 'testing-strategy'],
              ].map(([label, doc]) => (
                <ListItemButton key={label} sx={{ pl: 4 }} onClick={() => { setDrawerOpen(false); navigate(`/docs?doc=${doc}`); }}>
                  <ListItemText primary={label} />
                </ListItemButton>
              ))}
              <Divider sx={{ my: 1 }} />
              {([
                ['System Architecture', 'system.architecture'],
                ['Access & Roles', 'users-access'],
                ['Auth Flow', 'auth-flow'],
                ['Request Flow', 'request-flow'],
              ] as const).map(([label, diagram]) => (
                <ListItemButton key={label} sx={{ pl: 4 }} onClick={() => openDrawerDiagram(diagram)}>
                  <ListItemText primary={label} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>

          <Divider sx={{ my: 1 }} />
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </List>
      </Drawer>

      <Container maxWidth="xl" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}
