import { env as workerEnv } from 'cloudflare:workers'

/**
 * Minimal typed view of our Worker bindings. We deliberately avoid pulling
 * in the full workerd runtime types (they clash with lib.dom in one
 * tsconfig), so the KV surface we use is declared here.
 */
export interface KvBinding {
  get: (key: string) => Promise<string | null>
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>
  delete: (key: string) => Promise<void>
}

interface WorkerEnv {
  OAUTH_SESSION: KvBinding
  OAUTH_STATE: KvBinding
  /** Secret for signing the session cookie (`wrangler secret put SESSION_SECRET`; .dev.vars in dev). */
  SESSION_SECRET?: string
}

export const env = workerEnv as unknown as WorkerEnv
