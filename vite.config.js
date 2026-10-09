import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Served from the root of https://wpnz-armory.duckdns.org (GitHub Pages custom domain).
export default defineConfig({
  base: '/',
  plugins: [react()],
})
