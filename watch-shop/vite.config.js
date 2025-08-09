import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      'process.env': env
    },
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
    },
  };
});
