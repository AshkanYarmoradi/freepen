// This is the service worker for the freepen application
// Based on the Next.js PWA documentation: https://nextjs.org/docs/app/guides/progressive-web-apps

/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Disable TypeScript checking for this file
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */

// Define the necessary interfaces for TypeScript
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<any>): void;
}

interface FetchEvent extends ExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
  clientId: string;
  resultingClientId: string;
  mode: string;
  destination: string;
}

interface PushEvent extends ExtendableEvent {
  data: {
    json(): any;
  };
}

interface NotificationEvent extends ExtendableEvent {
  notification: Notification;
}

interface Notification {
  close(): void;
  data: any;
}

interface Client {
  url: string;
  focus(): Promise<Client>;
}

interface Clients {
  claim(): void;
  matchAll(options?: { type: string }): Promise<Client[]>;
  openWindow(url: string): Promise<Client>;
}

interface WindowOrWorkerGlobalScope {
  caches: CacheStorage;
  fetch(request: RequestInfo): Promise<Response>;
  location: Location;
}

interface ServiceWorkerGlobalScope extends WindowOrWorkerGlobalScope {
  __WB_MANIFEST: Array<{
    url: string;
    revision: string | null;
  }>;
  skipWaiting(): void;
  clients: Clients;
  registration: ServiceWorkerRegistration;
  addEventListener(type: 'install', listener: (event: ExtendableEvent) => void): void;
  addEventListener(type: 'activate', listener: (event: ExtendableEvent) => void): void;
  addEventListener(type: 'fetch', listener: (event: FetchEvent) => void): void;
  addEventListener(type: 'push', listener: (event: PushEvent) => void): void;
  addEventListener(type: 'notificationclick', listener: (event: NotificationEvent) => void): void;
}

declare const self: ServiceWorkerGlobalScope;

// Cache name
const CACHE_NAME = 'freepen-cache-v1';

// Assets to cache
const ASSETS_TO_CACHE = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/create-room-192x192.png',
  '/icons/join-room-192x192.png',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Activate the new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip browser-extension requests
  if (event.request.url.includes('/extension/')) {
    return;
  }

  // Skip API requests (we don't want to cache these)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    (caches.match(event.request) as Promise<Response>).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Ensure we always return a Response, not undefined

      // Otherwise, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();

          // Cache the response for future use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If fetch fails (offline), serve the offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline');
          }

          // For image requests, you could return a fallback image
          if (event.request.destination === 'image') {
            return caches.match('/icons/icon-192x192.png');
          }

          // For other requests, just return the error
          return new Response('Network error', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
    })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'freepen Notification';
  const options = {
    body: data.body || 'New message received',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event - handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }

      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data.url);
      }
    })
  );
});

export {};
