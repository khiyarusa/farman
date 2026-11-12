import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

// FARMAN web build.
// base: './' is required so the packaged Capacitor app can load assets from the
// local file/https origin without absolute paths pointing at a web server root.
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5188,
    strictPort: true,
    host: '127.0.0.1',
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          babylon: ['@babylonjs/core'],
          physics: ['@dimforge/rapier3d-compat'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.ts'],
    globals: false,
  },
});
