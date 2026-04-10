// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor':  ['react', 'react-dom', 'react-router-dom'],
          'three-vendor':  ['three', '@react-three/fiber', '@react-three/drei'],
          'motion-vendor': ['framer-motion', 'gsap'],
          'd3-vendor':     ['d3'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
})
