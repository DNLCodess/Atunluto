// Service Worker for Atunluto Group PWA
const CACHE_NAME = "atunluto-v3";
const OFFLINE_URL = "/offline";

// Files to cache on install (REMOVED /admin routes)
const STATIC_CACHE_URLS = [
  "/",
  "/offline",
  "/about",
  "/mission-vision",
  "/manifestos",
  "/achievements",
  "/gallery",
  "/join-us",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install");

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log("[Service Worker] Caching static assets");

      try {
        await cache.addAll(STATIC_CACHE_URLS);
      } catch (error) {
        console.error("[Service Worker] Failed to cache:", error);
      }
    })()
  );

  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate");

  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })()
  );

  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // ✅ CRITICAL: Skip caching for these routes
  const url = new URL(event.request.url);
  const shouldSkipCache =
    url.pathname.startsWith("/admin") || // All admin pages
    url.pathname.startsWith("/login") || // Login page
    url.pathname.includes("/api/") || // API routes
    url.pathname.includes("supabase") || // Supabase requests
    event.request.method !== "GET"; // Non-GET requests

  if (shouldSkipCache) {
    // Always fetch fresh from network for these routes
    event.respondWith(fetch(event.request));
    return;
  }

  // For public pages, use cache-first strategy
  event.respondWith(
    (async () => {
      try {
        // Try cache first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          console.log(
            "[Service Worker] Serving from cache:",
            event.request.url
          );
          return cachedResponse;
        }

        // If not in cache, fetch from network
        console.log(
          "[Service Worker] Fetching from network:",
          event.request.url
        );
        const networkResponse = await fetch(event.request);

        // Cache the new response ONLY for static public pages
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          event.request.method === "GET"
        ) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
        }

        return networkResponse;
      } catch (error) {
        console.error("[Service Worker] Fetch failed:", error);

        // If both cache and network fail, show offline page
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(OFFLINE_URL);
        return cachedResponse || new Response("Offline", { status: 503 });
      }
    })()
  );
});

// Handle messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log("[Service Worker] Cache cleared");
      })
    );
  }
});

// Background sync for form submissions when back online
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-registrations") {
    event.waitUntil(syncRegistrations());
  }
});

async function syncRegistrations() {
  console.log("[Service Worker] Syncing registrations");
  // This will be implemented when we handle offline form submissions
}

// Push notification handling (for future use)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New update from Atunluto Group",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View",
        icon: "/icons/checkmark.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/icons/close.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification("Atunluto Group", options)
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click:", event);
  event.notification.close();

  event.waitUntil(clients.openWindow("/"));
});
