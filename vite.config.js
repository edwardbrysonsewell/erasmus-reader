import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/erasmus-reader/',
  build: {
    chunkSizeWarningLimit: 30000,
    rollupOptions: {
      output: {
        manualChunks: {
          dict: ['./src/data/DICTLINE.json'],
          text: ['./src/data/colloquia.json'],
          ls: ['./src/data/lewis-short.json'],
        }
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Erasmus Colloquia Reader',
        short_name: 'Colloquia',
        description: 'Offline reader for Erasmus\' Colloquia Familiaria with word lookup',
        theme_color: '#2c1810',
        background_color: '#f5f0e8',
        display: 'standalone',
        orientation: 'any',
        start_url: '/erasmus-reader/',
        scope: '/erasmus-reader/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        navigateFallback: '/erasmus-reader/index.html',
        navigateFallbackAllowlist: [/^\/erasmus-reader\//],
      }
    })
  ]
})
