import path from 'path'
import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const config: UserConfig = {
    plugins: [react()],
    // Base path for GitHub Pages (set VITE_BASE=/repo-name/ in CI)
    base: process.env.VITE_BASE || '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      port: 5173,
      watch: {
        usePolling: true,
      },
      // HMR configuration for Docker
      // When running in Docker, the container port 5173 is mapped to host port 8080
      // The HMR client needs to connect via the mapped port (8080)
      hmr: {
        clientPort: process.env.VITE_HMR_PORT ? parseInt(process.env.VITE_HMR_PORT) : undefined,
      },
      // Add proxy for API calls to auth service
      proxy: {
        '/api': {
          target: 'http://localhost:8001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      }
    }
  }
  
  // Check if build is running with skipTypeCheck flag
  if (command === 'build' && process.argv.includes('--skipTypeCheck')) {
    // This doesn't directly affect Vite, but we can use environment variables
    // that our build script can check
    process.env.SKIP_TS_CHECK = 'true'
  }
  
  return config
})
