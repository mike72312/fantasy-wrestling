import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true, // ✅ Enables readable stack traces in production
    emptyOutDir: true
  },
  preview: {
    allowedHosts: ['wrestling-frontend.onrender.com'] // ✅ Adjust for your Render domain
  }
});