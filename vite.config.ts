import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// Custom plugin to force correct Content-Type for manifest.json to satisfy PWA installation checks
const forceManifestContentType = () => ({
  name: 'force-manifest-content-type',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url && req.url.includes('manifest.json')) {
        const originalWriteHead = res.writeHead;
        res.writeHead = function (statusCode: any, ...args: any[]) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          return originalWriteHead.apply(this, [statusCode, ...args] as any);
        };
      }
      next();
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    forceManifestContentType(),
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', { target: '19' }],
        ],
      },
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon-192x192.png', 'icons/icon-512x512.png', 'screenshots/desktop.png', 'screenshots/mobile.png'],
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'Minutas',
        short_name: 'Minutas',
        description: 'Sistema de gestión de reportes y novedades operativas',
        theme_color: '#0f172a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'screenshots/desktop.png',
            sizes: '1264x625',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Escritorio',
          },
          {
            src: 'screenshots/mobile.png',
            sizes: '500x749',
            type: 'image/png',
            label: 'Móvil',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/dcsmijbstwndaorigqyb\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return '@vendor-react';
            }
            if (id.includes('lucide-react')) {
              return '@icons';
            }
            if (id.includes('@radix-ui')) {
              return '@ui';
            }
          }
        },
      },
    },
  },
  optimizeDeps: {
    // Force re-bundle on next start to clear stale Sentry cache
    force: true,
  },
});

