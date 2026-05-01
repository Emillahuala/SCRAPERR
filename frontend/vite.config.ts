import path from 'path'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react')) return 'vendorReact'
          if (id.includes('react-router-dom')) return 'vendorReact'
          if (id.includes('@tanstack/react-query') || id.includes('zustand')) return 'vendorQuery'
          if (id.includes('recharts')) return 'vendorRecharts'
          if (id.includes('@supabase/supabase-js')) return 'vendorSupabase'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
