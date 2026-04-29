import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (id.includes('maplibre-gl') || id.includes('supercluster')) {
            return 'mapbox'
          }

          if (id.includes('framer-motion')) {
            return 'framer'
          }

          if (id.includes('recharts')) {
            return 'charts'
          }

          if (id.includes('socket.io-client') || id.includes('engine.io-client')) {
            return 'socket'
          }

          if (
            id.includes('three') ||
            id.includes('@react-three/fiber') ||
            id.includes('@react-three/postprocessing')
          ) {
            return 'three'
          }

          return undefined
        },
      },
    },
  },
})
