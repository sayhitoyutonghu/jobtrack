import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy disabled - using Railway backend directly
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //   },
    //   '/auth': {
    //     target: 'http://localhost:3000',
    //     changeOrigin: true,
    //   }
    // }
  },
  css: {
    postcss: './postcss.config.js',
  },
})
