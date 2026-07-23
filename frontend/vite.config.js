import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl = env.VITE_API_URL?.trim()
  const API_PROXY_URL = apiUrl || 'http://localhost:8000'
  const API_PROXY = API_PROXY_URL.replace(/\/api\/?$/, '') || 'http://localhost:8000'
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