// ─── Kasir Sesi Potret — Service Worker ───────────────────────────────────────
// Versi cache: update string ini setiap kali ada perubahan besar untuk memaksa
// browser memperbarui cache secara otomatis.
const CACHE_VERSION = 'sesi-potret-v1';

// Aset statis yang di-cache saat install
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/logo.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
];

// Pattern URL yang TIDAK boleh di-cache (selalu fetch dari network)
const NETWORK_ONLY_PATTERNS = [
    /\/login/,
    /\/logout/,
    /\/register/,
    /\/pos\/checkout/,
    /\/pos\/pending/,
    /\/report\/export/,
    /\/api\//,
];

// ─── Install: cache aset statis ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            // addAll dengan toleransi error (satu file gagal tidak batalkan semuanya)
            return Promise.allSettled(
                STATIC_ASSETS.map((url) => cache.add(url).catch(() => null))
            );
        })
    );
    // Langsung aktifkan service worker baru tanpa menunggu tab lama ditutup
    self.skipWaiting();
});

// ─── Activate: hapus cache lama ───────────────────────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_VERSION)
                    .map((key) => caches.delete(key))
            )
        )
    );
    // Ambil kontrol semua tab yang terbuka segera
    self.clients.claim();
});

// ─── Fetch: Strategi Cache ────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Abaikan request non-HTTP (chrome-extension, dll)
    if (!url.protocol.startsWith('http')) return;

    // Abaikan request ke domain berbeda (CDN fonts, dll)
    if (url.origin !== self.location.origin) return;

    // Network-only: jangan cache API/form submission penting
    const isNetworkOnly = NETWORK_ONLY_PATTERNS.some((pattern) =>
        pattern.test(url.pathname)
    );
    if (isNetworkOnly || request.method !== 'GET') return;

    // Strategi: Network First → fallback ke Cache
    // Cocok untuk aplikasi kasir yang butuh data real-time tapi tetap bisa
    // berjalan saat offline (menampilkan halaman yang pernah dikunjungi)
    event.respondWith(
        fetch(request)
            .then((networkResponse) => {
                // Simpan response segar ke cache
                if (networkResponse && networkResponse.status === 200) {
                    const cloned = networkResponse.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(request, cloned);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // Offline: coba ambil dari cache
                return caches.match(request).then((cached) => {
                    if (cached) return cached;

                    // Fallback untuk halaman navigasi (bukan aset)
                    if (request.headers.get('Accept')?.includes('text/html')) {
                        return caches.match('/');
                    }

                    // Tidak ada fallback
                    return new Response('Offline — konten tidak tersedia', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                    });
                });
            })
    );
});

// ─── Push Notifications (opsional — siap digunakan jika dibutuhkan) ──────────
self.addEventListener('push', (event) => {
    if (!event.data) return;
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title || 'Kasir Sesi Potret', {
            body:    data.body || '',
            icon:    '/icons/icon-192x192.png',
            badge:   '/icons/icon-72x72.png',
            vibrate: [100, 50, 100],
        })
    );
});
