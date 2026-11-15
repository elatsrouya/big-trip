// Offline support: the app shell is cached (network first, so updates arrive),
// free images from Wikimedia/Wikipedia are cached after first view. Google content is never cached.
const V = 'bt-v7';
const IMG = 'bt-img2'; // the old image cache could hold failed responses, so it is dropped
const SHELL = ['./', 'index.html', 'css/app.css', 'manifest.webmanifest', 'js/app.js', 'js/config.js', 'js/data.js', 'js/store.js', 'js/quota.js', 'js/maps.js', 'js/media.js', 'js/ui.js', 'js/router.js',
  'js/views/home.js', 'js/views/route.js', 'js/views/place.js', 'js/views/discover.js', 'js/views/budget.js', 'js/views/calendar.js', 'js/views/countries.js', 'js/views/prep.js', 'js/views/more.js', 'js/widget.js', 'icons/icon-192.png', 'vendor/lucide.min.js', 'vendor/maplibre-gl.js', 'vendor/maplibre-gl.css'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== IMG).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || /google/.test(u.hostname)) return;
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }).then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
  } else if (/wikimedia\.org|wikipedia\.org|unpkg\.com|fonts\.(googleapis|gstatic)\.com/.test(u.hostname) && e.request.destination !== '') {
    e.respondWith(caches.open(IMG).then(async c => { const hit = await c.match(e.request); if (hit) return hit; const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => caches.match(e.request)));
  }
});
