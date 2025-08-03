import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const config: UserConfig = {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
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
