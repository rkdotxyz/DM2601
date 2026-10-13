import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative paths, so the built site works from any folder or GitHub Pages.
  base: './',
  // three.js alone is most of the bundle; that's expected.
  build: { chunkSizeWarningLimit: 1600 },
})
