import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    base: process.env.NODE_ENV === 'production' ? '/' : '/',
    publicDir: 'public',
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      port: 3000,
      open: true,
      cors: true,
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
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1000,
      sourcemap: true,
      minify: 'terser',
      assetsDir: 'assets',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: './index.html'
        },
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js', '@supabase/auth-helpers-react'],
            'vendor-ui': ['@headlessui/react', '@heroicons/react', 'react-hot-toast', 'framer-motion'],
            'html2canvas': ['html2canvas']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      },
      base: '/',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    define: {
      'process.env': {}
    }
  };
});
