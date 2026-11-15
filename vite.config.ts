/// <reference types="vitest/config" />

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'explicit-local-service-mode',
      config(config, { mode }) {
        if (mode !== 'dev' && mode !== 'demo') return
        const environment = loadEnv(mode, config.envDir ?? config.root ?? process.cwd())
        const isDemo = mode === 'demo'
        return {
          // Explicit defines take precedence over shell and .env VITE_* values.
          define: {
            'import.meta.env.VITE_SERVICE_MODE': JSON.stringify(isDemo ? 'mock' : 'http'),
            'import.meta.env.VITE_API_BASE_URL': JSON.stringify(environment.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'),
          },
          server: { host: 'localhost', port: isDemo ? 5174 : 5173, strictPort: true },
        }
      },
    },
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    clearMocks: true,
    restoreMocks: true,
  },
})
