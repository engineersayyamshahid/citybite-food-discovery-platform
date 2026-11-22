import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Simple Vite setup. The API address comes from .env (VITE_API_URL).
// "host: true" lets a phone or another laptop open the site with http://<laptop-IP>:5173
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true, open: true },
});
