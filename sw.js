// Simplified Service Worker - removed complex caching
// Version 1.0.0

const CACHE_NAME = 'coffee-market-v1';

// Minimal install event
self.addEventListener('install', event => {
    self.skipWaiting();
});

// Minimal activate event
self.addEventListener('activate', event => {
    self.clients.claim();
});

// Simplified fetch - just pass through to network
self.addEventListener('fetch', event => {
    // Always fetch from network, no caching
    event.respondWith(fetch(event.request));
});

// Removed push notifications - not needed