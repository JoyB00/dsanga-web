import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts'],
    // One file at a time: they share the dev database, and Payload checks the schema when it starts.
    fileParallelism: false,
    hookTimeout: 60_000,
    testTimeout: 20_000,
  },
})
