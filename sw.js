// Service worker de SCAVi: permite instalar la app.
// Páginas: siempre de la red (para tener la versión más nueva); copia guardada solo si no hay internet.
// Íconos y manifiesto: de la copia guardada.
// No toca Firebase, Stripe ni ningún otro dominio.
const CACHE = 'scavi-v2';
const ESTATICOS = ['iconos/icon-192.png', 'iconos/icon-512.png', 'iconos/apple-touch-icon.png', 'iconos/favicon-32.png', 'manifest.webmanifest'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Firebase, Stripe, CDNs: sin intervenir

  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req, { cache: 'no-store' })
        .then(res => {
          if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
          return res;
        })
        .catch(() => caches.match(req).then(r => r || new Response(
          '<meta charset="utf-8"><body style="font-family:sans-serif;background:#0d0f14;color:#e8eaf0;text-align:center;padding:60px 20px">' +
          '<h2>Sin conexión</h2><p>SCAVi necesita internet para cargar tus datos. Revisa tu conexión e inténtalo de nuevo.</p>' +
          '<button onclick="location.reload()" style="padding:10px 22px;font-size:15px">Reintentar</button></body>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } })))
    );
    return;
  }

  if (url.pathname.includes('/iconos/') || url.pathname.endsWith('manifest.webmanifest')) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});
