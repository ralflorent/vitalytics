import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

const gitSha = execSync('git rev-parse --short HEAD').toString().trim();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(gitSha),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    nodePolyfills({ protocolImports: true }),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Never cache AI API calls
            urlPattern: /^https:\/\/(api\.openai\.com|api\.anthropic\.com|generativelanguage\.googleapis\.com)\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            // Cache Google Fonts with stale-while-revalidate
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: false, // Use the manually created manifest.webmanifest
    }),
  ],
  worker: { format: 'es' },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) {
            return 'vendor-antd';
          }
          if (id.includes('node_modules/openai')) {
            return 'vendor-ai-openai';
          }
          if (id.includes('node_modules/@anthropic-ai')) {
            return 'vendor-ai-anthropic';
          }
          if (id.includes('node_modules/@google/genai')) {
            return 'vendor-ai-gemini';
          }
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark') || id.includes('node_modules/rehype') || id.includes('node_modules/micromark') || id.includes('node_modules/mdast') || id.includes('node_modules/unist')) {
            return 'vendor-markdown';
          }
        },
      },
    },
  },
  optimizeDeps: { exclude: ['pdfjs-dist'] },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
