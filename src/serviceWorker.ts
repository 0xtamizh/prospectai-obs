const CACHE_NAME = 'redis-logs-cache-v1';
const API_URL = 'https://services.tryprospectai.com/api/redis-logs/fetch-all';
const API_KEY = '0fa971b59edcf5d6505b6460e2f918cd4ba31303f4b4ae4add6237e7be17a48a';
const FETCH_TIMEOUT = 30000; // 30 seconds timeout

declare const self: ServiceWorkerGlobalScope;

let isFetching = false;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(() => {
      console.log('Service Worker installed');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
      self.clients.claim()
    ])
  );
});

async function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchAndCacheData(force: boolean = false) {
  if (isFetching) {
    throw new Error('Already fetching data');
  }
  
  isFetching = true;
  let cachedData = null;

  try {
    // Check cache first if not forcing refresh
    if (!force) {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(API_URL);
      
      if (cachedResponse) {
        cachedData = await cachedResponse.clone().json();
        // Return cached data if less than 15 minutes old
        if (Date.now() - cachedData.timestamp < 15 * 60 * 1000) {
          notifyClients(cachedData);
          return cachedData;
        }
      }
    }

    // Fetch fresh data with timeout
    const response = await fetchWithTimeout(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ folder: 'error' })
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    const cacheData = {
      logs: data.data || {},
      timestamp: Date.now()
    };

    // Store in cache
    const cache = await caches.open(CACHE_NAME);
    await cache.put(
      new Request(API_URL),
      new Response(JSON.stringify(cacheData), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=900' // 15 minutes
        }
      })
    );

    notifyClients(cacheData);
    return cacheData;
  } catch (error) {
    console.error('Error fetching data:', error);
    
    // If fetch fails but we have cached data, return it as fallback
    if (cachedData) {
      console.log('Using cached data as fallback');
      notifyClients(cachedData);
      return cachedData;
    }
    
    throw error;
  } finally {
    isFetching = false;
  }
}

function notifyClients(data: any) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'LOGS_UPDATED',
        data
      });
    });
  });
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data.type === 'FETCH_LOGS') {
    event.waitUntil(
      fetchAndCacheData(event.data.force)
        .catch(error => {
          // Notify clients about the error
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'FETCH_ERROR',
                error: error.message
              });
            });
          });
          throw error;
        })
    );
  } else if (event.data.type === 'GET_CACHED_LOGS') {
    event.waitUntil(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(API_URL);
          if (cachedResponse) {
            const data = await cachedResponse.json();
            notifyClients(data);
          } else {
            // If no cache exists, fetch fresh data
            await fetchAndCacheData(false);
          }
        } catch (error) {
          console.error('Error getting cached logs:', error);
          throw error;
        }
      })()
    );
  }
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'redis-logs-sync') {
    event.waitUntil(fetchAndCacheData(false));
  }
});

// Periodic background sync
self.addEventListener('periodicsync', (event: any) => {
  if (event.tag === 'redis-logs-sync') {
    event.waitUntil(fetchAndCacheData(false));
  }
});