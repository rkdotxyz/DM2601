import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Relative asset paths, so the same build works at any address: on
// GitHub Pages (/DM2601/app/) and served from the doll itself.
//
// --mode doll builds the app as ONE html file (scripts, styles, font and
// photo all inside it), which scripts/make-web-page.mjs compresses into
// firmware/heart_doll/web_page.h for the doll to serve.
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: [react(), ...(mode === "doll" ? [viteSingleFile()] : [])],
  server: { host: true },
  build: {
    outDir: mode === "doll" ? "dist-doll" : "dist",
    // three.js makes one large bundle; it's ~390 KB gzipped, which is fine.
    chunkSizeWarningLimit: 1600,
    assetsInlineLimit: mode === "doll" ? Infinity : 4096,
  },
}));
