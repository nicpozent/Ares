import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The API base is injected at build time (VITE_API_BASE, default /api).
// In dev, proxy /api to the local backend so the SPA and API share an origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})
