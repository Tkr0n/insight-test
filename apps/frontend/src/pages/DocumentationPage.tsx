import { useState } from 'react';
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
} from '@mui/material';
import {
  Architecture as ArchIcon,
  Schema as SchemaIcon,
  Storage as InfraIcon,
  BugReport as TestIcon,
  Gavel as RulesIcon,
  Hub as FlowIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

interface DocItem {
  title: string;
  desc: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  tag: string;
}

const DOCS: DocItem[] = [
  { title: 'Arquitectura y Flujos', desc: 'Capas, JWT+CSRF, Kanban drag & drop, filtros y share flow. Mermaid + narrativa.', href: '/docs/architecture-and-flows.md', icon: <ArchIcon />, color: '#4f46e5', tag: 'MD' },
  { title: 'Reglas de Negocio', desc: 'State machine reversible, permisos owner/assignee/share y colores de deadline.', href: '/docs/business-rules.md', icon: <RulesIcon />, color: '#0891b2', tag: 'MD' },
  { title: 'Esquema de BD', desc: 'Tablas users/tasks/task_shares, FKs y volumen persistente.', href: '/docs/database-schema.md', icon: <SchemaIcon />, color: '#7c3aed', tag: 'MD' },
  { title: 'Infraestructura', desc: 'Docker Compose, PgBouncer, Redis y variables de entorno.', href: '/docs/infrastructure.md', icon: <InfraIcon />, color: '#ea580c', tag: 'MD' },
  { title: 'Estrategia de Testing', desc: 'Jest + Supertest, Vitest y Cypress. Cobertura y matriz de permisos.', href: '/docs/testing-strategy.md', icon: <TestIcon />, color: '#059669', tag: 'MD' },
  { title: 'Calidad de Código', desc: 'Early returns, complejidad ≤15, tipos estrictos y observabilidad.', href: '/docs/code-quality.md', icon: <FlowIcon />, color: '#db2777', tag: 'MD' },
];

interface DiagramItem {
  title: string;
  desc: string;
  href: string;
  color: string;
}

const DIAGRAMS: DiagramItem[] = [
  { title: 'System Architecture', desc: 'Componentes, boundaries y conexiones (Frontend, API, DB, Cloud)', href: '/docs/diagrams/system.architecture.html', color: '#4f46e5' },
  { title: 'Auth Flow (Sequence)', desc: 'Login httpOnly + CSRF double-submit — Browser → API → Cognito', href: '/docs/diagrams/auth-flow.sequence.html', color: '#0891b2' },
  { title: 'Request Flow (Sequence)', desc: 'markAsDone: Idempotency SETNX + Lambda FOR UPDATE', href: '/docs/diagrams/request-flow.sequence.html', color: '#e11d48' },
  { title: 'Infrastructure', desc: 'Docker, Postgres, PgBouncer, Redis — networking y volúmenes', href: '/docs/diagrams/infrastructure.architecture.html', color: '#ea580c' },
  { title: 'Task Lifecycle (Nuevo)', desc: 'State machine reversible PENDING ↔ IN_PROGRESS ↔ DONE ↔ ARCHIVED', href: '/docs/diagrams/task-lifecycle.lifecycle.html', color: '#7c3aed' },
  { title: 'Kanban Flow (Nuevo)', desc: 'Drag & drop desktop + accordion mobile + filtros accordión', href: '/docs/diagrams/kanban-flow.workflow.html', color: '#059669' },
];

export function DocumentationPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <Box sx={{ pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
          Documentación
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Diagramas interactivos y documentos Markdown con el diseño y decisiones del sistema.
        </Typography>
      </Box>

      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 1.5 }}>
        Documentos Markdown
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {DOCS.map((d) => (
          <Grid key={d.title} size={{ xs: 12, md: 6, lg: 4 }}>
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
                  <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${d.color}18`, color: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <Chip label={d.tag} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: `${d.color}15`, color: d.color }} />
                <Button
                  size="small"
                  endIcon={<OpenIcon sx={{ fontSize: 14 }} />}
                  onClick={() => window.open(d.href, '_blank')}
                  sx={{ textTransform: 'none', fontWeight: 700, color: d.color }}
                >
                  Abrir
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary' }}>
          Diagramas HTML (archify)
        </Typography>
        {preview && (
          <Button size="small" onClick={() => setPreview(null)} sx={{ borderRadius: 2 }}>
            Cerrar preview
          </Button>
        )}
      </Stack>

      <Grid container spacing={2}>
        {DIAGRAMS.map((d) => (
          <Grid key={d.title} size={{ xs: 12, md: 6 }}>
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
                  onClick={() => window.open(d.href, '_blank')}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, bgcolor: d.color, '&:hover': { filter: 'brightness(0.9)' } }}
                >
                  Abrir
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setPreview(preview === d.href ? null : d.href)}
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  {preview === d.href ? 'Ocultar' : 'Preview'}
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {preview && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Preview: {preview}
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
            <Box component="iframe" src={preview} sx={{ width: '100%', height: '100%', border: 0 }} title="Diagram preview" />
          </Paper>
        </Box>
      )}
    </Box>
  );
}
