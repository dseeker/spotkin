// SpotKin Service Worker
// Provides offline functionality and caching for PWA

const CACHE_NAME = 'spotkin-v1.0.0';
const STATIC_CACHE = 'spotkin-static-v1';
const DYNAMIC_CACHE = 'spotkin-dynamic-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
    './',
    './index.html',
    './app.js',
    './styles.css',
    './manifest.json',
    './images/favicon.png',
    './images/favicon.svg',
    // Add core assets needed for basic functionality
    'https://cdn.tailwindcss.com/3.3.0',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Files that should always be fetched from network (when online)
const NETWORK_FIRST_URLS = [
    '/api/',  // Any API calls
    'https://api.puter.com/', // Puter AI API
    'https://puter.com/'      // Puter platform
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ Static files cached successfully');
                return self.skipWaiting(); // Activate immediately
            })
            .catch((error) => {
                console.error('❌ Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old caches
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim(); // Take control immediately
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Network-first strategy for API calls and critical services
    if (NETWORK_FIRST_URLS.some(pattern => request.url.includes(pattern))) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }
    
    // Cache-first strategy for static assets
    if (STATIC_FILES.some(file => request.url.includes(file))) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }
    
    // Stale-while-revalidate for dynamic content
    event.respondWith(staleWhileRevalidateStrategy(request));
});

// Cache-first strategy: try cache first, then network
async function cacheFirstStrategy(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Cache-first strategy failed:', error);
        
        // Return offline fallback for HTML requests
        if (request.destination === 'document') {
            return caches.match('./index.html');
        }
        
        throw error;
    }
}

// Network-first strategy: try network first, fallback to cache
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache for:', request.url);
        
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline message for failed API calls
        if (request.url.includes('api')) {
            return new Response(
                JSON.stringify({
                    error: 'offline',
                    message: 'This feature requires an internet connection'
                }),
                {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503
                }
            );
        }
        
        throw error;
    }
}

// Stale-while-revalidate: return cache immediately, update in background
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Start network request in background
    const networkResponsePromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(() => null); // Ignore network errors
    
    // Return cached response immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Otherwise wait for network response
    return networkResponsePromise || caches.match('./index.html');
}

// Background sync for queuing failed requests
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'background-snapshot') {
        event.waitUntil(handleBackgroundSnapshot());
    } else if (event.tag === 'background-timeline') {
        event.waitUntil(handleBackgroundTimeline());
    } else if (event.tag === 'background-preferences') {
        event.waitUntil(handleBackgroundPreferences());
    } else if (event.tag === 'background-alerts') {
        event.waitUntil(handleBackgroundAlerts());
    }
});

// IndexedDB Database Management for Background Sync
class BackgroundSyncDB {
    constructor() {
        this.dbName = 'spotkin-background-sync';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores for different sync types
                if (!db.objectStoreNames.contains('snapshots')) {
                    const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id', autoIncrement: true });
                    snapshotStore.createIndex('timestamp', 'timestamp', { unique: false });
                    snapshotStore.createIndex('retryCount', 'retryCount', { unique: false });
                }

                if (!db.objectStoreNames.contains('timeline')) {
                    const timelineStore = db.createObjectStore('timeline', { keyPath: 'id', autoIncrement: true });
                    timelineStore.createIndex('timestamp', 'timestamp', { unique: false });
                }

                if (!db.objectStoreNames.contains('preferences')) {
                    db.createObjectStore('preferences', { keyPath: 'id', autoIncrement: true });
                }

                if (!db.objectStoreNames.contains('alerts')) {
                    const alertStore = db.createObjectStore('alerts', { keyPath: 'id', autoIncrement: true });
                    alertStore.createIndex('priority', 'priority', { unique: false });
                    alertStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }

    async addItem(storeName, data) {
        const db = await this.init();
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const item = {
            ...data,
            timestamp: Date.now(),
            retryCount: 0,
            lastRetry: null
        };
        
        return store.add(item);
    }

    async getAllItems(storeName) {
        const db = await this.init();
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteItem(storeName, id) {
        const db = await this.init();
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        return store.delete(id);
    }

    async updateRetryCount(storeName, id, retryCount) {
        const db = await this.init();
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const item = getRequest.result;
                if (item) {
                    item.retryCount = retryCount;
                    item.lastRetry = Date.now();
                    const updateRequest = store.put(item);
                    updateRequest.onsuccess = () => resolve(item);
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    reject(new Error('Item not found'));
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }
}

const syncDB = new BackgroundSyncDB();

async function handleBackgroundSnapshot() {
    console.log('📸 Processing background snapshots');
    
    try {
        const snapshots = await syncDB.getAllItems('snapshots');
        console.log(`📋 Found ${snapshots.length} queued snapshots`);

        for (const snapshot of snapshots) {
            try {
                await processQueuedSnapshot(snapshot);
                await syncDB.deleteItem('snapshots', snapshot.id);
                console.log(`✅ Processed snapshot ${snapshot.id}`);
            } catch (error) {
                console.error(`❌ Failed to process snapshot ${snapshot.id}:`, error);
                
                // Implement exponential backoff
                const maxRetries = 3;
                const newRetryCount = (snapshot.retryCount || 0) + 1;
                
                if (newRetryCount <= maxRetries) {
                    await syncDB.updateRetryCount('snapshots', snapshot.id, newRetryCount);
                    console.log(`🔄 Queued retry ${newRetryCount}/${maxRetries} for snapshot ${snapshot.id}`);
                } else {
                    await syncDB.deleteItem('snapshots', snapshot.id);
                    console.log(`❌ Max retries exceeded for snapshot ${snapshot.id}, removing from queue`);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error processing background snapshots:', error);
    }
}

async function handleBackgroundTimeline() {
    console.log('📊 Processing background timeline sync');
    
    try {
        const timelineEvents = await syncDB.getAllItems('timeline');
        console.log(`📋 Found ${timelineEvents.length} queued timeline events`);

        for (const event of timelineEvents) {
            try {
                await processQueuedTimelineEvent(event);
                await syncDB.deleteItem('timeline', event.id);
                console.log(`✅ Processed timeline event ${event.id}`);
            } catch (error) {
                console.error(`❌ Failed to process timeline event ${event.id}:`, error);
                
                const maxRetries = 2;
                const newRetryCount = (event.retryCount || 0) + 1;
                
                if (newRetryCount <= maxRetries) {
                    await syncDB.updateRetryCount('timeline', event.id, newRetryCount);
                } else {
                    await syncDB.deleteItem('timeline', event.id);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error processing background timeline sync:', error);
    }
}

async function handleBackgroundPreferences() {
    console.log('⚙️ Processing background preferences sync');
    
    try {
        const preferences = await syncDB.getAllItems('preferences');
        console.log(`📋 Found ${preferences.length} queued preference changes`);

        for (const pref of preferences) {
            try {
                await processQueuedPreferences(pref);
                await syncDB.deleteItem('preferences', pref.id);
                console.log(`✅ Processed preference change ${pref.id}`);
            } catch (error) {
                console.error(`❌ Failed to process preference change ${pref.id}:`, error);
                // Preferences are less critical, only retry once
                const maxRetries = 1;
                const newRetryCount = (pref.retryCount || 0) + 1;
                
                if (newRetryCount <= maxRetries) {
                    await syncDB.updateRetryCount('preferences', pref.id, newRetryCount);
                } else {
                    await syncDB.deleteItem('preferences', pref.id);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error processing background preferences sync:', error);
    }
}

async function handleBackgroundAlerts() {
    console.log('🚨 Processing background alerts sync');
    
    try {
        const alerts = await syncDB.getAllItems('alerts');
        console.log(`📋 Found ${alerts.length} queued alerts`);

        // Sort by priority (critical alerts first)
        alerts.sort((a, b) => {
            const priorities = { 'danger': 3, 'warning': 2, 'safe': 1 };
            return (priorities[b.priority] || 0) - (priorities[a.priority] || 0);
        });

        for (const alert of alerts) {
            try {
                await processQueuedAlert(alert);
                await syncDB.deleteItem('alerts', alert.id);
                console.log(`✅ Processed alert ${alert.id}`);
            } catch (error) {
                console.error(`❌ Failed to process alert ${alert.id}:`, error);
                
                // Critical alerts get more retries
                const maxRetries = alert.priority === 'danger' ? 5 : 3;
                const newRetryCount = (alert.retryCount || 0) + 1;
                
                if (newRetryCount <= maxRetries) {
                    await syncDB.updateRetryCount('alerts', alert.id, newRetryCount);
                } else {
                    await syncDB.deleteItem('alerts', alert.id);
                }
            }
        }
    } catch (error) {
        console.error('❌ Error processing background alerts sync:', error);
    }
}

// Processing functions for different sync types
async function processQueuedSnapshot(snapshot) {
    // Process camera snapshot that failed when offline
    const response = await fetch('/api/process-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            imageData: snapshot.imageData,
            timestamp: snapshot.timestamp,
            settings: snapshot.settings
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

async function processQueuedTimelineEvent(event) {
    // Sync timeline event to server or external storage
    const response = await fetch('/api/timeline-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event.data)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

async function processQueuedPreferences(pref) {
    // Sync preference changes to server or cloud storage
    const response = await fetch('/api/preferences-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pref.data)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

async function processQueuedAlert(alert) {
    // Process critical alerts that need to be delivered
    const response = await fetch('/api/alert-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert.data)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('🔔 Push notification received');
    
    const options = {
        body: 'SpotKin detected activity requiring your attention',
        icon: './images/icon-192.png',
        badge: './images/badge.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'View Details',
                icon: './images/icon-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: './images/icon-dismiss.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('SpotKin Alert', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'view') {
        // Open the app and navigate to relevant section
        event.waitUntil(
            clients.openWindow('./?notification=view')
        );
    } else if (event.action === 'dismiss') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('./')
        );
    }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    console.log('📨 Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_SNAPSHOT') {
        // Cache a snapshot for offline viewing
        caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put('/snapshot-' + Date.now(), 
                new Response(event.data.imageData, {
                    headers: { 'Content-Type': 'image/jpeg' }
                })
            );
        });
    }
    
    // Handle background sync queue requests from main thread
    if (event.data && event.data.type === 'QUEUE_FOR_SYNC') {
        const { storeName, data } = event.data;
        console.log(`📥 Queuing ${storeName} for background sync:`, data);
        
        syncDB.addItem(storeName, data)
            .then(() => {
                console.log(`✅ Successfully queued ${storeName} item`);
                // Notify client of successful queueing
                event.ports[0]?.postMessage({ success: true, queued: true });
            })
            .catch((error) => {
                console.error(`❌ Failed to queue ${storeName} item:`, error);
                event.ports[0]?.postMessage({ success: false, error: error.message });
            });
    }
    
    // Handle sync status requests
    if (event.data && event.data.type === 'GET_SYNC_STATUS') {
        console.log('📊 Getting sync status');
        
        Promise.all([
            syncDB.getAllItems('snapshots'),
            syncDB.getAllItems('timeline'),
            syncDB.getAllItems('preferences'),
            syncDB.getAllItems('alerts')
        ]).then(([snapshots, timeline, preferences, alerts]) => {
            const status = {
                snapshots: { count: snapshots.length, items: snapshots },
                timeline: { count: timeline.length, items: timeline },
                preferences: { count: preferences.length, items: preferences },
                alerts: { count: alerts.length, items: alerts },
                lastSyncAttempt: null // This would track last sync attempt in a real implementation
            };
            
            event.ports[0]?.postMessage({ success: true, status });
        }).catch((error) => {
            console.error('❌ Failed to get sync status:', error);
            event.ports[0]?.postMessage({ success: false, error: error.message });
        });
    }
    
    // Handle manual sync trigger
    if (event.data && event.data.type === 'TRIGGER_MANUAL_SYNC') {
        console.log('🔄 Manual sync triggered from client');
        
        // Trigger all sync events
        const syncPromises = [
            handleBackgroundSnapshot(),
            handleBackgroundTimeline(),
            handleBackgroundPreferences(),
            handleBackgroundAlerts()
        ];
        
        Promise.allSettled(syncPromises)
            .then((results) => {
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;
                
                console.log(`📊 Manual sync complete: ${successful} successful, ${failed} failed`);
                event.ports[0]?.postMessage({ 
                    success: true, 
                    results: { successful, failed },
                    message: `Sync completed: ${successful} successful, ${failed} failed`
                });
            })
            .catch((error) => {
                console.error('❌ Manual sync failed:', error);
                event.ports[0]?.postMessage({ success: false, error: error.message });
            });
    }
    
    // Handle notification requests from main thread
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, options } = event.data.data;
        console.log('🔔 Showing notification via service worker:', title);
        
        self.registration.showNotification(title, options)
            .then(() => {
                console.log('✅ Notification shown successfully');
            })
            .catch((error) => {
                console.error('❌ Failed to show notification:', error);
            });
    }
});

console.log('🎉 SpotKin Service Worker loaded successfully');