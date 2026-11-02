// ==============================================================================
// VITE CONFIGURATION
// This file configures Vite to build our React application.
// We proxy /api requests to our FastAPI backend running on port 8000!
// ==============================================================================

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Automatically forward any /api calls to our FastAPI backend on 127.0.0.1:8001
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      }
    }
  }
})
