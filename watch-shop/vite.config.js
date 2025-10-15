// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Determine if production mode
  const isProd = mode === 'production';

  return {
    base: '/',
    publicDir: 'public',

    css: {
      // ✅ Use .js (CommonJS) — NOT .mjs
      postcss: './postcss.config.cjs',
      devSourcemap: !isProd,
      modules: {
        generateScopedName: isProd
          ? '[hash:base64:8]'
          : '[name]__[local]__[hash:base64:5]',
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },

    plugins: [
      react({
        jsxImportSource: '@emotion/react',
        babel: {
          plugins: ['@emotion/babel-plugin'],
        },
      }),
      createHtmlPlugin({
        minify: isProd,
        inject: {
          data: {
            title: 'Silistain',
            description: 'Your site description for better SEO',
            keywords: 'ecommerce, watches, luxury watches',
            url: 'https://silistain.com',
            image: '/social-preview.jpg',
          },
        },
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        strategies: 'generateSW',
        workbox: {
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
          globPatterns: [
            '**/*.{js,css,html,ico,png,svg,webp,woff,woff2}',
            'assets/*.{js,css,ico,png,svg,webp,woff,woff2}'
          ],
          globDirectory: 'dist',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
          ],
        },
        manifest: {
          name: 'Silistain',
          short_name: 'Silistain',
          description: 'Your site description',
          theme_color: '#ffffff',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            },
          ],
        },
      }),
    ],

    resolve: {
      alias: {
        '@': '/src',
      },
    },

    server: {
      port: 3000,
      open: true,
      cors: true,
      headers: {
        'Permissions-Policy': [
          'geolocation=()',
          'camera=()',
          'microphone=()',
          'payment=()',
          'fullscreen=()',
          'display-capture=()'
        ].join(', ')
      },
      proxy: {
        '/supabase': {
          // ✅ Removed trailing spaces
          target: 'https://zzggvfexheroporjlzgd.supabase.co',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/supabase/, ''),
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('Proxying request:', req.method, req.url);
              proxyReq.setHeader('apikey', env.SUPABASE_ANON_KEY);
              proxyReq.setHeader('Authorization', `Bearer ${env.SUPABASE_ANON_KEY}`);
              if (req.url.includes('/auth/')) {
                proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
              }
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
              console.log('Received response:', proxyRes.statusCode, req.url);
            });
          },
        },
        '/auth/v1/callback': {
          target: 'https://zzggvfexheroporjlzgd.supabase.co',
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('apikey', env.SUPABASE_ANON_KEY);
            });
          },
        },
        '/api/tn-municipalities': {
          // ✅ Removed trailing spaces
          target: 'https://tn-municipality-api.vercel.app',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/tn-municipalities/, '/api'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              console.log('Proxying request to Tunisian Municipality API:', proxyReq.path);
              proxyReq.setHeader('Accept', 'application/json');
            });
            proxy.on('proxyRes', (proxyRes) => {
              console.log('Received response from Tunisian Municipality API:', proxyRes.statusCode);
              proxyRes.headers['Access-Control-Allow-Origin'] = '*';
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
              proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
            });
          },
        },
      },
    },

    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: !isProd,
      minify: isProd ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: true,
        },
        format: {
          comments: false,
        },
      },
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
      reportCompressedSize: false,

      rollupOptions: {
        input: {
          main: './index.html',
        },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@headlessui/react',
              '@radix-ui/react-avatar',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              'framer-motion',
              '@heroicons/react',
              'react-hot-toast',
            ],
            'supabase': ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
            'utils': ['date-fns', 'clsx', 'class-variance-authority'],
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },

    // ✅ REMOVED: define: { 'process.env': {} }
    // Vite handles this via import.meta.env
  };
});