const CACHE = "KarBu-v6";
const FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// Installation — mise en cache des fichiers essentiels
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

// Activation — suppression des anciens caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Cache first, puis réseau
self.addEventListener("fetch", e => {
  // Ignorer les requêtes non GET
  if(e.request.method !== "GET") return;
  
  // Ignorer les requêtes externes (API etc.)
  if(!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Retourner le cache si disponible
      if(cached) return cached;
      
      // Sinon aller chercher en réseau et mettre en cache
      return fetch(e.request).then(response => {
        if(!response || response.status !== 200) return response;
        var clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      }).catch(() => {
        // Hors ligne — retourner index.html pour les navigations
        if(e.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});

// Message — forcer la mise à jour
self.addEventListener("message", e => {
  if(e.data === "skipWaiting") self.skipWaiting();
});
