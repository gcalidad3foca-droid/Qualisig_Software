/* COPASST Software — service worker
   · Páginas: se pide la versión nueva; si la red tarda, se muestra al instante la copia guardada y se actualiza por detrás.
   · Librerías y fuentes (URLs con versión fija): se sirven desde el equipo, sin volver a descargarlas. */
const C = 'copasst-v5', LIB = 'copasst-lib-v2', LIBN = 'copasst-libn-v2';
const SHELL = ['./', './index.html', './Lista_Inspeccion_Condiciones_Seguras.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const LIBS = /^https:\/\/(www\.gstatic\.com\/firebasejs\/|cdnjs\.cloudflare\.com\/ajax\/libs\/|cdn\.jsdelivr\.net\/npm\/|fonts\.googleapis\.com\/|fonts\.gstatic\.com\/)/;
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C && x !== LIB && x !== LIBN).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (LIBS.test(r.url)) {
    /* caché separada según el modo de la petición: una respuesta opaca nunca se entrega a una petición CORS */
    e.respondWith(caches.open(r.mode === 'no-cors' ? LIBN : LIB).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok || (r.mode === 'no-cors' && res.type === 'opaque')) c.put(r, res.clone()); return res; }))));
    return;
  }
  if (u.origin !== location.origin) return;
  const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; });
  if (r.mode === 'navigate') {
    e.respondWith(caches.match(r, { ignoreSearch: true }).then(m => {
      if (!m) return net.catch(() => caches.match('./index.html'));
      return Promise.race([net.catch(() => m), new Promise(ok => setTimeout(() => ok(m), 1200))]);
    }));
    e.waitUntil(net.catch(() => {}));
    return;
  }
  e.respondWith(net.catch(() => caches.match(r)));
});
