import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Lets the e2e suite (see /e2e) point the built/previewed client at an
// isolated server instance instead of the default dev server on :5001 —
// `preview.proxy` defaults to `server.proxy`, so this one setting covers
// both `vite dev` and `vite preview`.
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:5001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': { target: apiProxyTarget, changeOrigin: true },
      '/storage': { target: apiProxyTarget, changeOrigin: true },
    },
  },
})
