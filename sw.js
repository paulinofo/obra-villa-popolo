/* Copia local de la app. Sin esto, cada arranque exige bajar el HTML: si la
   red falla ese rato la app no abre, aunque los datos ya estén en el teléfono.
   Con esto abre siempre de la copia y la versión nueva se baja por detrás.

   El nombre de la caché lleva el sello del armado: al cambiar, el teléfono
   tira la copia vieja. Sin eso, un teléfono que ya tenía la app de obra
   seguiría abriendo ésa desde su caché, para siempre. */
const CACHE = 'villa-popolo-20260918-1431'
const PORTADA = './'

self.addEventListener('install', (e) => e.waitUntil((async () => {
  const c = await caches.open(CACHE)
  try { await c.add(new Request(PORTADA, { cache: 'reload' })) } catch (x) {}
  await self.skipWaiting()
})()))

self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
  await self.clients.claim()
})()))

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return          // el servidor de datos va derecho
  e.respondWith((async () => {
    const c = await caches.open(CACHE)
    const guardado = await c.match(e.request, { ignoreSearch: true })
    const red = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r }).catch(() => null)
    return guardado || (await red) || new Response('sin red', { status: 503 })
  })())
})
