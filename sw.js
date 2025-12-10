
const CACHE_NAME = 'effimey-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Filter out non-http schemes (extensions, data uris, etc)
  if (!event.request.url.startsWith('http')) return;

  // Ignore Firestore/Firebase requests to let SDK handle them directly
  const url = new URL(event.request.url);
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseio.com')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // 1. Attempt to match in cache
        // Wrap in try-catch to handle IO errors (FILE_ERROR_NO_SPACE) from IndexedDB
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
      } catch (err) {
        console.warn('Cache storage failed, falling back to network:', err);
      }

      try {
        // 2. Network Fetch
        return await fetch(event.request);
      } catch (error) {
        // 3. Network Failed (Offline): Return Custom Fallback
        console.warn('Network fetch failed:', error);

        // Specifically handle navigation requests (HTML pages)
        if (event.request.mode === 'navigate') {
          const offlineHTML = `
            <!DOCTYPE html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Offline - Effimey</title>
                <style>
                  body {
                    font-family: 'DM Sans', sans-serif;
                    background-color: #F8FAFC;
                    color: #0F172A;
                    height: 100vh;
                    margin: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                  }
                  .container {
                    padding: 24px;
                    max-width: 400px;
                  }
                  .icon {
                    width: 64px;
                    height: 64px;
                    background-color: #FEF2F2;
                    color: #EF4444;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                  }
                  h1 { margin: 0 0 12px; font-size: 24px; font-weight: 700; }
                  p { margin: 0 0 24px; color: #64748B; line-height: 1.5; }
                  button {
                    background-color: #EF4444;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    font-size: 16px;
                  }
                  button:hover { opacity: 0.9; }
                  @media (prefers-color-scheme: dark) {
                    body { background-color: #09090b; color: #F8FAFC; }
                    .icon { background-color: #27272a; }
                    p { color: #94A3B8; }
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                  </div>
                  <h1>You're Offline</h1>
                  <p>It seems you've lost your internet connection. Please check your network settings and try again.</p>
                  <button onclick="window.location.reload()">Retry Connection</button>
                </div>
              </body>
            </html>
          `;
          
          return new Response(offlineHTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          });
        }

        // For non-navigation requests (assets/data), return a safe fallback
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })()
  );
});
