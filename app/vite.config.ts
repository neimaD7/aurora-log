import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extra-files',
      closeBundle() {
        // Copy files that live outside the Vite build but need to be served
        const parent = resolve(__dirname, '..');
        const dist = resolve(__dirname, '../dist');
        const extras = ['dashboard.html', 'dashboard-manifest.json', 'manifest.json'];
        for (const file of extras) {
          try { copyFileSync(resolve(parent, file), resolve(dist, file)); } catch { /* file not found — skip */ }
        }
      }
    }
  ],
  base: './', // Relative base path for GitHub Pages compatibility
  build: {
    outDir: '../dist', // Build to parent directory
    sourcemap: false, // No source maps in production
  },
  css: {
    devSourcemap: true, // Source maps in dev for CSS
  },
})
