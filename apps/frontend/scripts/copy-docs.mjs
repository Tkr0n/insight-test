import { cp, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const docsSrc = path.join(projectRoot, 'docs');
const dest = path.join(__dirname, '..', 'public', 'docs');

await mkdir(path.join(dest, 'diagrams'), { recursive: true });
await cp(docsSrc, dest, { recursive: true, filter: (src) => !src.includes('superpowers') && !src.endsWith('.pdf') });
console.log(`[copy-docs] Copied ${docsSrc} -> ${dest}`);
