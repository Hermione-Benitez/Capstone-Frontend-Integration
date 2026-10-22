import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
    proxy: {
      '/api/dms': {
        target: 'https://dts-api-gab-byafd0h2aha6a9c9.japaneast-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/dms/, ''),
      },
      '/api/stars': {
        target: 'https://stars-h8bgfbhghzbdc9fd.southeastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/stars/, ''),
      },
      '/api/foms': {
        target: 'https://fomsintegration-amfve2fdccbdgbgy.eastasia-01.azurewebsites.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/foms/, ''),
      },
    },
  },
});
