import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import { GATEWAY_HEADERS } from './src/contracts/gateway-headers.v1.js';

const env = loadEnv('development', process.cwd(), '');
const apiTarget = env.VITE_API_PROXY_TARGET ?? 'http://localhost:3001';
const appBase = '/notes/';
const injectDevIdentity = env.TRUST_GATEWAY_HEADERS === 'false' || env.VITE_INJECT_DEV_IDENTITY === 'true';

export default defineConfig({
  base: appBase,
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
      [`${appBase}api`]: {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/notes/, ''),
        configure: (proxy) => {
          if (!injectDevIdentity) return;
          proxy.on('proxyReq', (proxyReq) => {
            const userId = env.DEV_USER_ID ?? 'alice';
            const email = env.DEV_USER_EMAIL ?? `${userId}@dev.local`;
            proxyReq.setHeader(GATEWAY_HEADERS.userId, userId);
            proxyReq.setHeader(GATEWAY_HEADERS.email, email);
            proxyReq.setHeader(GATEWAY_HEADERS.scopes, 'app:notes');
            if (env.DEV_USER_DISPLAY_NAME) {
              proxyReq.setHeader(GATEWAY_HEADERS.displayName, env.DEV_USER_DISPLAY_NAME);
            }
          });
        },
      },
      [`${appBase}health`]: {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/notes/, ''),
      },
      [`${appBase}version`]: {
        target: apiTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/notes/, ''),
      },
    },
  },
});
