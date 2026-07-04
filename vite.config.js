// vite.config.js
// Vite build configuration. Proxies /api requests to the backend during development
// so the frontend can call relative paths like /api/auth/login without CORS issues.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy Socket.io's websocket/polling handshake to the backend as well
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
