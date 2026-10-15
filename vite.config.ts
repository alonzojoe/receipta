import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Pin the zone the test workers run in. Receipt numbers and dates are local-time, so a
// test that passes on a UTC CI box and fails on a laptop in Manila proves nothing.
// `??=` lets an explicit `TZ=America/Los_Angeles npm test` still win. Evaluated here, in
// the main process, so the workers inherit it.
process.env.TZ ??= 'Asia/Manila'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
