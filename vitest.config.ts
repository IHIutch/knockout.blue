import { defineConfig } from 'vitest/config'

// Standalone vitest config: the app's vite.config.ts loads the Cloudflare
// Workers plugin, which is incompatible with vitest's environment defaults.
// Tests target pure modules in src/lib, so no app plugins are needed.
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
