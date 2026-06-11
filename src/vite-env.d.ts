/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Injected by vite.config.ts `define` — loopback client in dev, hosted metadata URL in prod. */
  readonly VITE_OAUTH_CLIENT_ID: string
  readonly VITE_OAUTH_REDIRECT_URI: string
  readonly VITE_OAUTH_SCOPE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
