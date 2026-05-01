/** @type {import('next').NextConfig} */
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'worker',
  runtimeCaching: [
    // ── Static assets (fonts, images, scripts, styles) ──────────────────────
    // Cache-first: these files are content-hashed, safe to cache indefinitely.
    {
      urlPattern: /\.(?:js|css|woff2?|ttf|otf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gaffer-static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // ── Images (local + external CDN) ────────────────────────────────────────
    // Stale-while-revalidate: show cached copy, refresh in background.
    {
      urlPattern: /\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'gaffer-images',
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
    // ── Next.js page navigation (HTML) ───────────────────────────────────────
    // Network-first with short timeout: always try network, fall back to cache.
    {
      urlPattern: /^https:\/\/[^/]+\/(app|admin|auth|onboarding)(\/.*)?$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'gaffer-pages',
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
    // ── Wikipedia / external image CDNs ─────────────────────────────────────
    {
      urlPattern: /^https:\/\/upload\.wikimedia\.org\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'gaffer-external-images',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        },
      },
    },
    // ── Avatar services ──────────────────────────────────────────────────────
    {
      urlPattern: /^https:\/\/(i\.pravatar\.cc|api\.dicebear\.com)\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'gaffer-avatars',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 3 * 24 * 60 * 60,
        },
      },
    },
    // ── Video files — bypass SW entirely ────────────────────────────────────
    // Browsers stream video using HTTP Range requests. Service workers that
    // don't explicitly handle Range headers will break video playback by
    // returning a 200 response instead of the required 206 Partial Content.
    // NetworkOnly tells workbox to pass these requests straight through to
    // the network, never touching the cache.
    {
      urlPattern: /\.(?:mp4|webm|ogg|mov)$/i,
      handler: 'NetworkOnly',
    },
    // NOTE: API / auth endpoints are intentionally NOT cached here.
    // React Query handles API response caching with explicit staleTime / gcTime.
    // Auth state is managed by Firebase SDK / cookies, never by the SW cache.
  ],
})

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // swcMinify is the default in Next.js 13+ and no longer needs to be declared.
  images: {
    // Removed Firebase-specific domain; allow any https host for avatars/logos
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost', port: '4000' },
    ],
  },
}

module.exports = withPWA(nextConfig)
