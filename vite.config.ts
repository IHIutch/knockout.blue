import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// atproto OAuth forbids "localhost" as an origin; dev must run on 127.0.0.1.
// The loopback client_id below is the spec-defined exception for local dev.
const DEV_ORIGIN = 'http://127.0.0.1:3000'
const PROD_ORIGIN = 'https://knockout.blue'
// Granular scope: consent screen grants write access ONLY to our record
// collection (with explicit create/update/delete actions — the no-action form
// is not treated as "all actions" by the PDS), not the whole account. Built by
// @atcute/oauth-types scope.repo({ collection, action }).
const OAUTH_SCOPE
  = 'atproto repo?collection=blue.knockout.wc2026&action=create&action=update&action=delete'

const config = defineConfig(({ command }) => {
  const dev = command === 'serve'
  const redirectUri = `${dev ? DEV_ORIGIN : PROD_ORIGIN}/oauth/callback`
  const clientId = dev
    ? `http://localhost?redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(OAUTH_SCOPE)}`
    : `${PROD_ORIGIN}/oauth/client-metadata.json`

  return {
    resolve: { tsconfigPaths: true },
    server: {
      host: '127.0.0.1',
      // Local KV (miniflare) persists under .wrangler/ — a watched write
      // there would reload the page mid-OAuth-redirect.
      watch: { ignored: ['**/.wrangler/**'] },
    },
    define: {
      'import.meta.env.VITE_OAUTH_CLIENT_ID': JSON.stringify(clientId),
      'import.meta.env.VITE_OAUTH_REDIRECT_URI': JSON.stringify(redirectUri),
      'import.meta.env.VITE_OAUTH_SCOPE': JSON.stringify(OAUTH_SCOPE),
    },
    plugins: [
      devtools(),
      cloudflare({ viteEnvironment: { name: 'ssr' } }),
      tailwindcss(),
      tanstackStart(),
      viteReact(),
    ],
  }
})

export default config
