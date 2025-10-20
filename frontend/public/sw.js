const CACHE = "al-buruj-v6"; // bump to invalidate old caches
const ASSETS = ["/","/index.html","/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Support forced activation when the app posts a SKIP_WAITING message
self.addEventListener("message", (event) => {
  if (event && event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Network-first for navigations/HTML to avoid stale UI after server restarts
// Cache-first for other GET static requests
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.url.includes("/api/")) return; // never cache API

  const isHTML = request.mode === "navigate" || (request.headers.get("accept") || "").includes("text/html");
  const dest = request.destination; // '', 'document', 'script', 'style', 'image', 'font', etc.

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Ensure fresh JS and CSS on normal reloads
  if (dest === "script" || dest === "style") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return resp;
          })
          .catch(() => cached)
    )
  );
});
