// Copies the zxing-wasm reader binary into public/ so the app serves it
// itself instead of fetching it from a CDN (keeps scanning offline-capable).
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules/zxing-wasm/dist/reader/zxing_reader.wasm');
const dest = join(root, 'public/zxing_reader.wasm');

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(src, dest);
console.log('Copied zxing_reader.wasm to public/');
