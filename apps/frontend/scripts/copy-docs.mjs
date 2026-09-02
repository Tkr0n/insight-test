import { cp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const candidates = [
  path.join(projectRoot, 'docs'),
  path.resolve(__dirname, '..', 'docs'),
  '/docs',
];
let docsSrc = null;
for (const c of candidates) {
  try {
    await access(c);
    docsSrc = c;
    break;
  } catch {}
}
const dest = path.join(__dirname, '..', 'public', 'docs');

await mkdir(path.join(dest, 'diagrams'), { recursive: true });

if (!docsSrc) {
  console.warn(`[copy-docs] No docs source found (tried ${candidates.join(', ')}) — skipping copy, frontend will fallback to /api/docs`);
  process.exit(0);
}

await cp(docsSrc, dest, { recursive: true, filter: (src) => !src.includes('superpowers') && !src.endsWith('.pdf') });
console.log(`[copy-docs] Copied ${docsSrc} -> ${dest}`);
