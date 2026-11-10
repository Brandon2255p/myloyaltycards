// Service worker source. `scripts/build-sw.mjs` fills in the placeholders after
// `next build` and writes the result to public/sw.js.
//
// Goal: the app opens with no connection, but always shows the latest deploy
// when there is one.
//   - Pages are network-first: online you get the current HTML (which points at
//     the current scripts); offline, or after PAGE_TIMEOUT_MS on a bad
//     connection, you get the stored copy.
//   - Build assets under /_next/static/ have content-hashed names, so a stored
//     copy can never be stale: cache-first, kept across deploys.
//   - Files from public/ are not hashed, so they are re-downloaded whenever a
//     new version of this worker installs.

const VERSION = '__VERSION__';
const PAGES = __PAGES__;
const BUILD_ASSETS = __BUILD_ASSETS__;
const PUBLIC_FILES = __PUBLIC_FILES__;

const PAGE_CACHE = 'mlc-pages';
const ASSET_CACHE = 'mlc-assets';
const PAGE_TIMEOUT_MS = 3000;

const pathOf = (requestOrUrl) => new URL(requestOrUrl.url ?? requestOrUrl, self.location.origin).pathname;

async function download(cache, path, cacheMode) {
  const response = await fetch(path, { cache: cacheMode });
  if (!response.ok) throw new Error(`sw ${VERSION}: ${path} responded ${response.status}`);
  await cache.put(path, response);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const assets = await caches.open(ASSET_CACHE);
      const stored = new Set((await assets.keys()).map(pathOf));
      const pages = await caches.open(PAGE_CACHE);
      await Promise.all([
        ...BUILD_ASSETS.filter((path) => !stored.has(path)).map((path) => download(assets, path, 'default')),
        ...PUBLIC_FILES.map((path) => download(assets, path, 'reload')),
        ...PAGES.map((path) => download(pages, path, 'reload')),
      ]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from other service workers (including the old workbox one).
      for (const name of await caches.keys()) {
        if (name !== PAGE_CACHE && name !== ASSET_CACHE) await caches.delete(name);
      }
      // Drop assets that belong to previous deploys.
      const keep = new Set([...BUILD_ASSETS, ...PUBLIC_FILES]);
      const assets = await caches.open(ASSET_CACHE);
      for (const request of await assets.keys()) {
        if (!keep.has(pathOf(request))) await assets.delete(request);
      }
      await self.clients.claim();
    })(),
  );
});

async function servePage(request, path) {
  const cache = await caches.open(PAGE_CACHE);
  // Stored by path only: the query string carries the user's cards and the HTML is the same for all of them.
  const cached = await cache.match(path);
  const network = fetch(request).then(async (response) => {
    if (response.ok) await cache.put(path, response.clone());
    return response;
  });
  if (!cached) return network;

  network.catch(() => {});
  const timeout = new Promise((resolve) => setTimeout(resolve, PAGE_TIMEOUT_MS));
  try {
    const response = await Promise.race([network, timeout]);
    if (response && response.ok) return response;
  } catch {
    // Offline: fall through to the stored copy.
  }
  return cached;
}

async function serveAsset(request, path) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(path);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(path, response.clone());
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    if (PAGES.includes(url.pathname)) event.respondWith(servePage(request, url.pathname));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || PUBLIC_FILES.includes(url.pathname)) {
    event.respondWith(serveAsset(request, url.pathname));
  }
});
