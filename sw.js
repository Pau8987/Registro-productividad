const STATIC_CACHE_NAME = 'productividad-static-v2'; // Incrementa versión
const DYNAMIC_CACHE_NAME = 'productividad-dynamic-v2'; // Incrementa versión

// Archivos esenciales de la app
const STATIC_FILES = [
  'index7.html', // Asegúrate que el nombre es correcto
  '/', // Cachear la raíz es importante
  'manifest.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png'
];

// Función auxiliar para limitar el tamaño de la caché dinámica (opcional)
/*
const trimCache = (cacheName, maxItems) => {
  caches.open(cacheName).then(cache => {
    return cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
};
*/

// 1. Instalación: Cachea los archivos estáticos (App Shell)
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v2...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando App Shell estático');
        // Usamos addAll para que falle si algún archivo no se puede cachear
        return cache.addAll(STATIC_FILES);
      })
      .catch(error => {
        console.error('[SW] Error al cachear App Shell:', error);
        // Si falla aquí, la instalación no se completa, lo cual es bueno.
      })
  );
});

// 2. Activación: Limpia caches antiguas
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker v2...');
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        // Borra todas las caches que no sean las actuales
        if (key !== STATIC_CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
          console.log('[SW] Eliminando cache antigua:', key);
          return caches.delete(key);
        }
      }));
    })
  );
  // Fuerza al SW a tomar control inmediatamente
  return self.clients.claim();
});

// 3. Fetch: Decide cómo manejar las peticiones (Estrategia Network falling back to Cache)
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET (como el POST a Google Script)
  if (event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }

  // Ignorar peticiones a Google Script para evitar problemas
  if (event.request.url.includes('script.google.com')) {
    return event.respondWith(fetch(event.request));
  }
  
  // Para todo lo demás (App Shell, fuentes, etc.)
  event.respondWith(
    // Intenta primero ir a la red
    fetch(event.request)
      .then(networkResponse => {
        // Si la red responde bien, guarda una copia en la caché dinámica y devuelve la respuesta
        return caches.open(DYNAMIC_CACHE_NAME).then(cache => {
          // Opcional: Limitar tamaño de caché dinámica
          // trimCache(DYNAMIC_CACHE_NAME, 50); // Guarda los últimos 50 recursos
          cache.put(event.request.url, networkResponse.clone());
          return networkResponse;
        });
      })
      .catch(() => {
        // Si la red falla (estás offline), busca en TODAS las caches
        return caches.match(event.request).then(cachedResponse => {
          // Si encuentra algo en CUALQUIER cache (estática o dinámica), lo devuelve
          if (cachedResponse) {
            return cachedResponse;
          }
          // Si no está en ninguna caché y no hay red, no podemos hacer nada
          // (Podríamos devolver una página offline genérica aquí si quisiéramos)
          console.warn('[SW] Recurso no encontrado en caché ni en red:', event.request.url);
          // Devolver una respuesta de error o undefined
          return new Response(null, { status: 404, statusText: 'Not Found in Cache or Network' });
        });
      })
  );
});