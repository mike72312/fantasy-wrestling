import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'fantasy-wrestling-frontend-vite',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  preview: {
    allowedHosts: ['wrestling-frontend.onrender.com'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'fantasy-wrestling-frontend-vite/src'),
    },
  },
});