import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Served from https://r1-yaniv.github.io/pulse-waitlist/ on GitHub Pages, so
  // assets must resolve under the repo subpath. Use '/' for a custom domain.
  base: '/pulse-waitlist/',
  plugins: [react(), tailwindcss()],
})
