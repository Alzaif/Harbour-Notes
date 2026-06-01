import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:3001';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  envPrefix: 'VITE_',
  build: {
    outDir: 'dist/ui',
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': { target: apiTarget, changeOrigin: true },
      '/health': { target: apiTarget, changeOrigin: true },
      '/version': { target: apiTarget, changeOrigin: true },
    },
  },
});
