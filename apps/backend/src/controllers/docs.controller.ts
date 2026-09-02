import { Router, Request, Response } from 'express';
import { readFile } from 'fs/promises';
import path from 'path';
import { AppError } from '../middlewares/error-handler.js';
import { asyncHandler } from '../middlewares/async-handler.js';

const router = Router();

// Resolve docs folder: try multiple candidates (dev vs built)
const DOCS_CANDIDATES = [
  path.resolve(process.cwd(), 'docs'),
  path.resolve(process.cwd(), 'insight/docs'),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof __dirname !== 'undefined' ? path.resolve((__dirname as string), '../../../docs') : '',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof __dirname !== 'undefined' ? path.resolve((__dirname as string), '../../docs') : '',
].filter(Boolean);

function resolveDocsPath(relative: string): string | null {
  for (const root of DOCS_CANDIDATES) {
    if (!root) continue;
    const full = path.resolve(root, relative);
    if (full.startsWith(path.resolve(root))) return full;
  }
  return null;
}

const ALLOWED_MD = new Set([
  'architecture-and-flows.md',
  'business-rules.md',
  'database-schema.md',
  'infrastructure.md',
  'testing-strategy.md',
  'code-quality.md',
]);

const ALLOWED_HTML = new Set([
  'system.architecture.html',
  'system.architecture.json',
  'auth-flow.sequence.html',
  'request-flow.sequence.html',
  'infrastructure.architecture.html',
  'task-lifecycle.lifecycle.html',
  'task-lifecycle.lifecycle.json',
  'kanban-flow.workflow.html',
  'kanban-flow.workflow.json',
]);

router.get('/:name', asyncHandler(async (req: Request, res: Response) => {
  const name = req.params.name as string;

  // allow both plain .md and diagrams subfolder via ? param name containing slash
  // For diagrams, frontend will request via ?diagram=system.architecture -> maps to system.architecture.html
  let relative: string | null = null;
  if (ALLOWED_MD.has(name)) {
    relative = name;
  } else if (ALLOWED_HTML.has(name)) {
    relative = path.join('diagrams', name);
  } else if (name.includes('.md') && ALLOWED_MD.has(path.basename(name))) {
    relative = path.basename(name);
  }

  if (!relative) throw new AppError(404, 'Document not found');

  const full = resolveDocsPath(relative);
  if (!full) throw new AppError(404, 'Document not found');

  let content: string;
  try {
    content = await readFile(full, 'utf-8');
  } catch {
    throw new AppError(404, 'Document not found');
  }
  const isHtml = relative.endsWith('.html');
  const isJson = relative.endsWith('.json');
  if (isHtml) {
    res.type('text/html');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *");
  } else if (isJson) res.type('application/json');
  else res.type('text/markdown');
  res.send(content);
}));

export { router as docsRoutes };
