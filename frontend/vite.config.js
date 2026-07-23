import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_PROXY = env.VITE_API_URL || 'http://localhost:8000'
  const BASE = env.VITE_BASE_URL || '/'

  return defineConfig({
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
}