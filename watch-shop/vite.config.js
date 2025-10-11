import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: process.env.NODE_ENV === 'production' ? '/' : '/',
    publicDir: 'public',
    css: {
      postcss: './postcss.config.mjs',
      devSourcemap: process.env.NODE_ENV !== 'production',
      modules: {
        generateScopedName: process.env.NODE_ENV === 'production'
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
        minify: true,
        inject: {
          data: {
            title: 'Silistain',
            description: 'Your site description for better SEO',
            keywords: 'ecommerce, watches, luxury watches',
            url: 'https://silistain.vercel.app',
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
        // Proxy API requests to Supabase
        '/supabase': {
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
              // Ensure we're always sending the correct headers
              proxyReq.setHeader('apikey', env.SUPABASE_ANON_KEY);
              proxyReq.setHeader('Authorization', `Bearer ${env.SUPABASE_ANON_KEY}`);
              
              // For auth requests, we need to include credentials
              if (req.url.includes('/auth/')) {
                proxyReq.setHeader('Access-Control-Allow-Credentials', 'true');
              }
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              // Ensure CORS headers are set correctly in the response
              proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
              proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
              
              console.log('Received response:', proxyRes.statusCode, req.url);
            });
          },
        },
        // Handle OAuth callbacks
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
        // Tunisian Municipality API proxy
        '/api/tn-municipalities': {
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
              // Ensure CORS headers are set
              proxyRes.headers['Access-Control-Allow-Origin'] = '*'; // Or your specific origin
              proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
              proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
            });
          },
        },
      },
    },
    // Build optimization settings
    build: {
      rollupOptions: {
        input: {
          main: './index.html'
        },
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@headlessui/react', 
              '@radix-ui/*', 
              'framer-motion',
              '@heroicons/react',
              'react-hot-toast'
            ],
            'supabase': ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
            'utils': ['date-fns', 'clsx', 'class-variance-authority', 'html2canvas']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: process.env.NODE_ENV !== 'production',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true
        },
        format: {
          comments: false
        }
      },
      assetsInlineLimit: 4096,
      reportCompressedSize: false,
      // Add build hook to generate sitemap
      buildStart() {
        if (process.env.NODE_ENV === 'production') {
          require('./scripts/generate-sitemap');
        }
      },
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true
    },
    define: {
      'process.env': {}
    }
  };
});
