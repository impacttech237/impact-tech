/* Service worker : noyau hors ligne précaché (versionné), le reste est mis en cache à l'usage. */
const VERSION = '__VERSION__';
const FICHIERS = __FICHIERS__;
const CACHE = 'mf-' + VERSION;
const RUN = 'mf-run';
const IMMUABLE = /^\/(js|css)\/m\.[0-9a-f]{10}\.(js|css)$|^\/fonts\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mf-') && k !== CACHE && k !== RUN).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/pdf/') || u.pathname.startsWith('/admin')) return;
  const chemin = u.pathname;
  // Fichiers à nom hashé et polices : cache d'abord. Données et pages : réseau d'abord rapide, cache en secours.
  e.respondWith((async () => {
    const hit = await caches.match(r, { ignoreSearch: true });
    if (hit && (IMMUABLE.test(chemin) || FICHIERS.includes(chemin) && !chemin.startsWith('/data/') && chemin !== '/')) return hit;
    try {
      const rep = await fetch(r);
      if (rep.ok && (chemin.startsWith('/data/') || chemin.startsWith('/img/'))) { const c = await caches.open(RUN); c.put(r, rep.clone()); }
      return rep;
    } catch { return hit || (await caches.match('/')) || Response.error(); }
  })());
});
