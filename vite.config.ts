import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Served at the root on Railway (single container serves dist/ + the API).
  base: '/',
  plugins: [react(), tailwindcss()],
  server: {
    // Bind to all interfaces so a phone on the same Wi-Fi can reach the dev
    // server at http://<mac-LAN-IP>:5173. The /api proxy still runs here on the
    // Mac, so the Express API doesn't need to be exposed to the LAN.
    host: true,
    // Dev: forward API calls to the local Express server (see `npm run dev:api`).
    proxy: { '/api': 'http://localhost:8080' },
  },
})
