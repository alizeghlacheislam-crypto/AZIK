/* ============================================
   AZIK Studio — Service Worker
   - network-first للـ HTML (الزائر يشوف دائماً آخر نسخة)
   - cache-first للأصول الثابتة (logo, fonts, poster, icons)
   - cache versioning + حذف الـ caches القديمة عند activate
   - يتجاهل Supabase / Telegram / cross-origin غير google fonts
   - فشل الـ SW = الموقع يخدم عادي بدون أي تأثير
   ============================================ */

const VERSION = 'v1';
const STATIC_CACHE  = `azik-static-${VERSION}`;
const RUNTIME_CACHE = `azik-runtime-${VERSION}`;

// أصول جوهرية نسبق نخزّنهم وقت install
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/logo.webp',
  '/hero-poster.jpg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .catch(() => { /* precache فشل = ما يوقفش التثبيت */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// تجاهل: غير GET، POST/PUT/DELETE، Supabase, Telegram, خدمات API
function shouldHandle(request) {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);

  // تجاهل cross-origin إلا google fonts
  const sameOrigin = url.origin === self.location.origin;
  const isGoogleFonts =
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !isGoogleFonts) return false;

  // تجاهل Supabase + Telegram + analytics
  if (url.hostname.endsWith('.supabase.co')) return false;
  if (url.hostname.endsWith('telegram.org')) return false;

  // تجاهل chrome-extension://
  if (url.protocol === 'chrome-extension:') return false;

  return true;
}

function isHTMLRequest(request) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!shouldHandle(request)) return; // pass-through

  // 1) HTML → network-first
  if (isHTMLRequest(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // نخزّن نسخة محدّثة للـ offline fallback
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, copy).catch(() => {});
          });
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || caches.match('/index.html') || caches.match('/')
          )
        )
    );
    return;
  }

  // 2) باقي الأصول الثابتة → cache-first (مع تحديث في الخلفية)
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.ok && response.type !== 'opaque') {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, copy).catch(() => {});
            });
          }
          return response;
        })
        .catch(() => cached); // لو فشل الـ network و كاين cache = استعملو
      return cached || fetchPromise;
    })
  );
});
