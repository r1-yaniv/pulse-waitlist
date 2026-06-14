import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Served at the root on Railway (single container serves dist/ + the API).
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    // Dev: forward API calls to the local Express server (see `npm run dev:api`).
    proxy: { '/api': 'http://localhost:8080' },
  },
})
