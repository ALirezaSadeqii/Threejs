import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: 'public',
  server: {
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  },
  base: '/Threejs/', // This should match your repository name
}); 