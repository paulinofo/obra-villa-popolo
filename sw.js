/* ============================================================
   Trabajador de servicio de la app de la obra.

   Sin esto, cada vez que alguien abre la app el teléfono tiene que
   bajar el HTML del servidor: si la red falla ese rato, la app no
   abre aunque los datos ya estén guardados en el teléfono. Con esto,
   la app abre siempre desde la copia local y la versión nueva se
   descarga por detrás para el siguiente arranque.
   ============================================================ */
const CACHE = 'obra-vp17-v1';
const PORTADA = './';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.add(new Request(PORTADA, { cache: 'reload' })))
      .catch(() => {})            // sin red en la instalación: se guarda al primer uso
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  // Solo el documento de la app y de este mismo origen. Las llamadas al
  // servidor de datos (otro origen) pasan derecho, nunca se guardan.
  if (req.method !== 'GET') return;
  const esDocumento = req.mode === 'navigate' || req.destination === 'document';
  if (!esDocumento || new URL(req.url).origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const guardada = await cache.match(PORTADA);
    // baja la versión nueva por detrás para el próximo arranque
    const dellaRed = fetch(req)
      .then(r => { if (r && r.ok) cache.put(PORTADA, r.clone()); return r; })
      .catch(() => null);
    if (guardada) return guardada;
    const fresca = await dellaRed;
    return fresca || new Response(
      '<!doctype html><meta charset="utf-8"><body style="font:16px -apple-system;padding:40px;text-align:center;color:#2B2117;background:#F6F1EA">' +
      '<h2>Sin conexión</h2><p>Abre la app otra vez cuando haya señal.</p></body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  })());
});
