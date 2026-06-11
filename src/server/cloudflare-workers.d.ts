/**
 * The cloudflare:workers virtual module is provided by @cloudflare/vite-plugin
 * at runtime; we exclude wrangler's generated runtime types (DOM lib clash),
 * so declare the one export we consume. src/server/env.ts narrows it.
 */
declare module 'cloudflare:workers' {
  export const env: unknown
}
