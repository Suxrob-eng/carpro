import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { config as loadEnv } from 'dotenv'

// Load .env for vite config time (dev)
loadEnv()

const API_PROXY = process.env.VITE_API_URL || 'http://localhost:8000'
const BASE = process.env.VITE_BASE_URL || '/'

export default defineConfig({
  base: BASE,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: API_PROXY,
        changeOrigin: true
      },
      '/media': {
        target: API_PROXY,
        changeOrigin: true
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  }
})