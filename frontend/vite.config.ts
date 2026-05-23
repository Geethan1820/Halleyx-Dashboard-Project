import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      // File watching inside Docker on Windows/macOS
      watch: {
        usePolling: true,
        interval: 1000,
      },
      // Optional: proxy API through Vite (alternative to VITE_API_URL)
      proxy: env.VITE_PROXY_API === 'true'
        ? {
            '/api': {
              target: env.VITE_PROXY_TARGET || 'http://backend:3000',
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
    },
    preview: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
    },
  }
})
