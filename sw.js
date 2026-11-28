/* Qualisig · service worker: permite instalar la app y abrirla rápido.
   Las páginas se buscan primero en internet (siempre ves la última versión) y,
   si no hay conexión, se usa la copia guardada. Firebase y la IA nunca se guardan. */
const VERSION = 'qualisig-2026-11-28o';
const SHELL = ['./', './index.html', './Lista_Habilitacion_3100.html', './Lista_Verificacion_FOCA.html', './Lista_Verificacion_VIU.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const STATIC = /(^|\.)(cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|unpkg\.com)$/;
const SKIP = /(firebaseio\.com|firebasedatabase\.app|identitytoolkit|securetoken|googleapis\.com\/(identitytoolkit|token)|workers\.dev|google-analytics|gstatic\.com\/firebasejs)/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' }))))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const keep = (req, res) => { if (res && res.ok && res.type !== 'opaque') caches.open(VERSION).then(c => c.put(req, res)).catch(() => {}); };
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (SKIP.test(u.href)) return;
  const page = r.mode === 'navigate' || (u.origin === location.origin && /(\.html?|\/)$/.test(u.pathname));
  if (page) {
    e.respondWith(fetch(r).then(res => { keep(r, res.clone()); return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('./index.html'))));
    return;
  }
  if (u.origin === location.origin || STATIC.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => { const net = fetch(r).then(res => { keep(r, res.clone()); return res; }).catch(() => m); return m || net; }));
  }
});
