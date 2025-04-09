import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import history from 'connect-history-api-fallback';

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4080', // Your OMERO-Web API
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''), // Remove '/api' prefix
      },
    },
    fs: { strict: true },
    middlewareMode: false,
    setupMiddlewares(middlewares) {
      middlewares.use(
        history({
          disableDotRule: true,
          htmlAcceptHeaders: ["text/html", "application/xhtml+xml"],
        })
      );
      return middlewares;
    },
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'static/[name]-[hash][extname]',
        chunkFileNames: 'static/[name]-[hash].js',
        entryFileNames: 'static/[name]-[hash].js',
      },
    },
  },
});
