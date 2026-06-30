// FOOax · Service Worker para apps de control de cobranza
// Cachea la app para que funcione sin internet en campo.
// Sincroniza solo: lo que se captura se guarda en localStorage (no en la nube);
// este SW solo asegura que la app ABRA aunque no haya señal.

const CACHE_NAME = "foox-cobranza-v1"; // sube el número cada vez que publiques cambios importantes
const ASSETS_TO_CACHE = [
  "./",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Estrategia: network-first para el HTML (para que jale la versión más nueva si hay señal),
// cache-first para todo lo demás (íconos, manifest).
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match("./")))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
