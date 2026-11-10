// Runs after `next build`. Lists everything the app needs to open offline and
// writes public/sw.js from scripts/sw.template.js with that list baked in.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const staticDir = join(root, '.next/static');
const publicDir = join(root, 'public');

// Routes to store for offline use. Add new pages here.
const PAGES = ['/', '/import'];

// Files in public/ the app never requests, plus the worker itself.
const PUBLIC_SKIP = new Set(['sw.js', 'file.svg', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg']);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]))
    .sort();
}

const toUrl = (base, dir, file) => base + encodeURI(relative(dir, file).split(sep).join('/'));

if (!existsSync(staticDir)) {
  throw new Error('build-sw: .next/static not found. Run this after `next build`.');
}

const buildAssets = walk(staticDir)
  .filter((file) => !file.endsWith('.map'))
  .map((file) => toUrl('/_next/static/', staticDir, file));

const publicPaths = walk(publicDir).filter((file) => !PUBLIC_SKIP.has(relative(publicDir, file)));
const publicFiles = publicPaths.map((file) => toUrl('/', publicDir, file));

// The version changes whenever the build output or any public file changes,
// which is what makes browsers install the new worker.
const hash = createHash('sha256');
hash.update(readFileSync(join(root, '.next/BUILD_ID')));
buildAssets.forEach((url) => hash.update(url));
publicPaths.forEach((file) => hash.update(file).update(readFileSync(file)));
const version = hash.digest('hex').slice(0, 12);

const sw = readFileSync(join(root, 'scripts/sw.template.js'), 'utf8')
  .replace("'__VERSION__'", JSON.stringify(version))
  .replace('__PAGES__', JSON.stringify(PAGES))
  .replace('__BUILD_ASSETS__', JSON.stringify(buildAssets))
  .replace('__PUBLIC_FILES__', JSON.stringify(publicFiles));

writeFileSync(join(publicDir, 'sw.js'), sw);
console.log(
  `Wrote public/sw.js (version ${version}: ${PAGES.length} pages, ${buildAssets.length} build assets, ${publicFiles.length} public files)`,
);
