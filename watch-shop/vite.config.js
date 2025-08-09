import { defineConfig, loadEnv, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Only include specific env variables we need
  const envWithProcessPrefix = Object.entries(env).reduce(
    (prev, [key, val]) => {
      if (key.startsWith('VITE_') || key.startsWith('VERCEL_')) {
        prev[`process.env.${key}`] = `"${val}"`;
      }
      return prev;
    },
    {}
  );
  
  const isProduction = mode === 'production';
  
  return {
    // Use absolute paths for Vercel
    base: '/',
    // Ensure Vite handles the public directory correctly
    publicDir: 'public',
    define: envWithProcessPrefix,
    plugins: [
      react(),
      splitVendorChunkPlugin(),
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
      })
    ].filter(Boolean),
    css: {
      postcss: './postcss.config.js',
      devSourcemap: mode === 'development',
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
    },
    build: {
      chunkSizeWarningLimit: 1000, // Increase chunk size warning limit to 1MB
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          },
        },
      },
    },
  };
});
