import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Architecture as ArchIcon,
  Schema as SchemaIcon,
  Storage as InfraIcon,
  BugReport as TestIcon,
  Gavel as RulesIcon,
  Hub as FlowIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { apiClient } from '../api/axios-client';

interface DocItem {
  id: string;
  title: string;
  desc: string;
  file: string;
  icon: React.ReactNode;
  color: string;
}

const DOCS: DocItem[] = [
  { id: 'architecture-and-flows', title: 'Architecture & Flows', desc: 'Layers, JWT+CSRF, Kanban reversible, filters and share flow.', file: 'architecture-and-flows.md', icon: <ArchIcon />, color: '#4f46e5' },
  { id: 'business-rules', title: 'Business Rules', desc: 'Reversible state machine, permissions and deadline colors.', file: 'business-rules.md', icon: <RulesIcon />, color: '#0891b2' },
  { id: 'database-schema', title: 'Database Schema', desc: 'Tables users/tasks/task_shares and FKs.', file: 'database-schema.md', icon: <SchemaIcon />, color: '#7c3aed' },
  { id: 'infrastructure', title: 'Infrastructure', desc: 'Docker Compose, PgBouncer, Redis and env vars.', file: 'infrastructure.md', icon: <InfraIcon />, color: '#ea580c' },
  { id: 'testing-strategy', title: 'Testing Strategy', desc: 'Jest, Supertest, Vitest and Cypress coverage.', file: 'testing-strategy.md', icon: <TestIcon />, color: '#059669' },
  { id: 'code-quality', title: 'Code Quality', desc: 'Early returns, complexity and strict types.', file: 'code-quality.md', icon: <FlowIcon />, color: '#db2777' },
];

interface DiagramItem {
  id: string;
  title: string;
  desc: string;
  file: string;
  color: string;
}

export const DIAGRAMS: DiagramItem[] = [
  { id: 'system.architecture', title: 'System Architecture', desc: 'Components, boundaries and connections', file: 'system.architecture.html', color: '#4f46e5' },
  { id: 'users-access', title: 'Access & Roles', desc: 'Admin by email, user lifecycle and task permissions', file: 'users-access.architecture.html', color: '#0891b2' },
  { id: 'auth-flow', title: 'Auth Flow (Sequence)', desc: 'httpOnly + CSRF double-submit', file: 'auth-flow.sequence.html', color: '#0891b2' },
  { id: 'request-flow', title: 'Request Flow (Sequence)', desc: 'markAsDone: SETNX + Lambda FOR UPDATE', file: 'request-flow.sequence.html', color: '#e11d48' },
  { id: 'infrastructure', title: 'Infrastructure', desc: 'Docker, Postgres, PgBouncer, Redis', file: 'infrastructure.architecture.html', color: '#ea580c' },
  { id: 'task-lifecycle', title: 'Task Lifecycle', desc: 'Reversible PENDING ↔ IN_PROGRESS ↔ DONE ↔ ARCHIVED', file: 'task-lifecycle.lifecycle.html', color: '#7c3aed' },
  { id: 'kanban-flow', title: 'Kanban Flow', desc: 'Desktop drag & drop + mobile accordion', file: 'kanban-flow.workflow.html', color: '#059669' },
];

export function DocumentationPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [searchParams, setSearchParams] = useSearchParams();
  const [previewDiagram, setPreviewDiagram] = useState<string | null>(() => searchParams.get('diagram'));
  const [mdOpen, setMdOpen] = useState<string | null>(null);
  const [mdContent, setMdContent] = useState<string>('');
  const [mdLoading, setMdLoading] = useState(false);

  const docParam = searchParams.get('doc');
  const diagramParam = searchParams.get('diagram');

  useEffect(() => {
    if (docParam) {
      const item = DOCS.find((d) => d.id === docParam);
      if (item) openMarkdown(item.file);
    }
  }, [docParam]);

  useEffect(() => {
    if (diagramParam) setPreviewDiagram(diagramParam);
  }, [diagramParam]);

  const openMarkdown = async (file: string) => {
    setMdOpen(file);
    setMdLoading(true);
    try {
      const res = await fetch(`/docs/${file}`);
      if (!res.ok) throw new Error('not found');
      const text = await res.text();
      setMdContent(text);
    } catch {
      // fallback to API (for prod where static not copied)
      try {
        const res = await apiClient.get(`/docs/${encodeURIComponent(file)}`, { responseType: 'text' as never });
        setMdContent(res.data as unknown as string);
      } catch {
        setMdContent('Failed to load document. Expected at /docs/' + file + ' — ensure docs are copied to public/docs.');
      }
    } finally {
      setMdLoading(false);
    }
  };

  const handleDocOpen = (doc: DocItem) => {
    setSearchParams({ doc: doc.id }, { replace: false });
    openMarkdown(doc.file);
  };

  const handleDiagramPreview = (diagramId: string) => {
    const newVal = previewDiagram === diagramId ? null : diagramId;
    setPreviewDiagram(newVal);
    const params = new URLSearchParams(searchParams);
    if (newVal) params.set('diagram', newVal);
    else params.delete('diagram');
    setSearchParams(params, { replace: true });
  };

  const getDiagram = (id: string) => DIAGRAMS.find((d) => d.id === id);

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Documentation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Interactive diagrams and Markdown documents with system design and decisions.
        </Typography>
      </Box>

      <Typography
        variant="subtitle2"
        sx={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 1.5 }}
      >
        Markdown Documents
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {DOCS.map((d) => (
          <Grid key={d.id} size={{ xs: 12, md: 6, lg: 4 }}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                borderRadius: 3,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                bgcolor: isDark ? '#1e293b' : '#fff',
                borderLeft: `4px solid ${d.color}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(15,23,42,0.08)' },
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', mb: 1 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      bgcolor: `${d.color}18`,
                      color: d.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {d.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {d.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {d.desc}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, justifyContent: 'space-between' }}>
                <Chip label="MD" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${d.color}15`, color: d.color }} />
                <Button
                  size="small"
                  onClick={() => handleDocOpen(d)}
                  sx={{ textTransform: 'none', fontWeight: 700, color: d.color }}
                >
                  Open
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary' }}
        >
          HTML Diagrams (archify)
        </Typography>
        {previewDiagram && (
          <Button size="small" onClick={() => handleDiagramPreview(previewDiagram)} sx={{ borderRadius: 2 }}>
            Close preview
          </Button>
        )}
      </Stack>

      <Grid container spacing={2}>
        {DIAGRAMS.map((d) => (
          <Grid key={d.id} size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                bgcolor: isDark ? '#1e293b' : '#fff',
                borderLeft: `4px solid ${d.color}`,
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
                  {d.title}
                </Typography>
                <Chip label="HTML" size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: `${d.color}15`, color: d.color }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 1.5 }}>
                {d.desc}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => window.open(`/docs/diagrams/${encodeURIComponent(d.file)}`, '_blank')}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: d.color, '&:hover': { filter: 'brightness(0.9)' } }}
                >
                  Open
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDiagramPreview(d.id)}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  {previewDiagram === d.id ? 'Hide' : 'Preview'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {previewDiagram && getDiagram(previewDiagram) && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Preview: {getDiagram(previewDiagram)!.title}
          </Typography>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
              height: 720,
            }}
          >
            <Box
              component="iframe"
              src={`/docs/diagrams/${encodeURIComponent(getDiagram(previewDiagram)!.file)}`}
              sx={{ width: '100%', height: '100%', border: 0 }}
              title="Diagram preview"
            />
          </Paper>
        </Box>
      )}

      <Dialog
        open={!!mdOpen}
        onClose={() => {
          setMdOpen(null);
          const p = new URLSearchParams(searchParams);
          p.delete('doc');
          setSearchParams(p, { replace: true });
        }}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: '80vh' } } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          {mdOpen}
          <IconButton
            onClick={() => {
              setMdOpen(null);
              const p = new URLSearchParams(searchParams);
              p.delete('doc');
              setSearchParams(p, { replace: true });
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {mdLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          ) : (
            <Box
              component="pre"
              sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                m: 0,
                color: isDark ? '#cbd5e1' : '#334155',
              }}
            >
              {mdContent}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
