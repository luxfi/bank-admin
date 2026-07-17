import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// Standalone admin console. Mirrors the proven bank-dash build: Tailwind v4
// via the vite plugin, and a hard dedupe of react/react-dom because @hanzo/iam
// ships its own React (otherwise "Invalid hook call — more than one copy").
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['@hanzo/iam/browser', '@hanzo/iam/react'],
  },
  server: {
    port: 3000,
    proxy: {
      '/v1': {
        target: process.env.VITE_BANK_API_URL || 'https://api.lux.financial',
        changeOrigin: true,
      },
    },
  },
})
