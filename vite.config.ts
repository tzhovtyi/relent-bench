import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: 'core',
  resolve: {
    alias: {
      '@core': fileURLToPath(new URL('./core/src', import.meta.url)),
    },
  },
  server: { port: 4173 },
  preview: { port: 4173 },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    sourcemap: true,
  },
});
