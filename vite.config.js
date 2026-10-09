import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Production builds are served from GitHub Pages at /Last-War-Armory/; the dev server stays at /.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Last-War-Armory/' : '/',
  plugins: [react()],
}))
