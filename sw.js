// Service Worker for Coffee Market Dashboard
// Version 1.0.0

const CACHE_NAME = 'coffee-market-v1';
const CACHE_URLS = [
    '/',
    '/index-optimized.html',
    '/styles.css',
    '/app.js',
    '/reports.json',
    '/coffee-beans-pattern-optimized.webp',
    '/coffee-abstract-dark-optimized.webp',
    '/coffeefutures.xlsx',
    '/usdbrl.xlsx',
    '/nvdi.xls'
];

// Install event - cache resources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching files');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Clearing old cache');
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip external requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache if not successful
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Add to cache
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('/index-optimized.html');
                        }
                    });
            })
    );
});

// Background sync for data updates
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Update cache with fresh data
            updateCache()
        );
    }
});

// Function to update cache with fresh data
async function updateCache() {
    const cache = await caches.open(CACHE_NAME);
    
    // Update reports data
    try {
        const response = await fetch('/reports.json');
        if (response.ok) {
            await cache.put('/reports.json', response);
        }
    } catch (error) {
        console.log('Failed to update reports cache:', error);
    }
    
    // Update Excel files
    const excelFiles = [
        '/coffeefutures.xlsx',
        '/usdbrl.xlsx',
        '/nvdi.xls'
    ];
    
    for (const file of excelFiles) {
        try {
            const response = await fetch(file);
            if (response.ok) {
                await cache.put(file, response);
            }
        } catch (error) {
            console.log(`Failed to update ${file} cache:`, error);
        }
    }
}

// Notification handling
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/coffee-beans-pattern-optimized.webp',
            badge: '/coffee-beans-pattern-optimized.webp',
            data: data.url
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data)
    );
});