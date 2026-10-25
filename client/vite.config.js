import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

function copyAdminHtmlPlugin() {
  return {
    name: 'copy-admin-html',
    closeBundle() {
      const src = resolve(import.meta.dirname, 'dist/admin/index.html');
      const dest = resolve(import.meta.dirname, 'dist/admin.html');
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log('✓ Successfully generated physical dist/admin.html for direct URL access');
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyAdminHtmlPlugin()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html')
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
