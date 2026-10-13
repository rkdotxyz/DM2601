import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative asset paths, so the same build works at any address: on
// GitHub Pages (/DM2601/) and, later, served from the doll itself.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { host: true },
  // three.js makes one large bundle; it's ~380 KB gzipped, which is fine.
  build: { chunkSizeWarningLimit: 1600 },
});
