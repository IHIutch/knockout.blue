import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'

// atproto OAuth forbids "localhost" as an origin; dev must run on 127.0.0.1.
// The loopback client_id below is the spec-defined exception for local dev.
const DEV_ORIGIN = 'http://127.0.0.1:3000'
const PROD_ORIGIN = 'https://bracket.blue'
const OAUTH_SCOPE = 'atproto transition:generic'

const config = defineConfig(({ command }) => {
  const dev = command === 'serve'
  const redirectUri = `${dev ? DEV_ORIGIN : PROD_ORIGIN}/oauth/callback`
  const clientId = dev
    ? `http://localhost?redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(OAUTH_SCOPE)}`
    : `${PROD_ORIGIN}/oauth/client-metadata.json`

  return {
    resolve: { tsconfigPaths: true },
    server: { host: '127.0.0.1' },
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
