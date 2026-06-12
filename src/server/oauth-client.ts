import type { PublicClientMetadata, Store } from '@atcute/oauth-node-client'

import { OAuthClient } from '@atcute/oauth-node-client'

import type { KvBinding } from './env'

import { actorResolver } from '../lib/atproto/identity'
import { env } from './env'

/**
 * Server-side AT proto OAuth (public client — no keyset/JWKs needed).
 * Tokens live in Cloudflare KV; the browser only ever holds a signed
 * cookie with the user's DID+handle (see session-cookie.ts).
 *
 * Dev uses the spec's loopback client (no client_id → synthesized from
 * redirect_uris + scope); production is the discoverable client whose
 * metadata is the static asset at /oauth/client-metadata.json.
 */

export const OAUTH_SCOPE = import.meta.env.VITE_OAUTH_SCOPE

/** Adapt a KV namespace to atcute's Store interface. */
function kvStore<V>(kv: KvBinding, prefix: string, ttlSeconds?: number): Store<string, V> {
  return {
    async get(key) {
      const raw = await kv.get(`${prefix}:${key}`)
      return raw === null ? undefined : (JSON.parse(raw) as V)
    },
    async set(key, value) {
      await kv.put(`${prefix}:${key}`, JSON.stringify(value), {
        // KV minimum TTL is 60s; sessions get no TTL (refresh extends them).
        expirationTtl: ttlSeconds,
      })
    },
    async delete(key) {
      await kv.delete(`${prefix}:${key}`)
    },
    async clear() {
      // Not needed (and KV has no cheap clear); stores are key-scoped.
    },
  }
}

let client: OAuthClient | undefined

export function getOAuthClient(): OAuthClient {
  if (client)
    return client

  const redirect_uris = [import.meta.env.VITE_OAUTH_REDIRECT_URI]
  // Omitting client_id in dev makes atcute build the loopback client.
  const metadata: PublicClientMetadata = import.meta.env.DEV
    ? { redirect_uris, scope: OAUTH_SCOPE }
    : {
        client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
        client_name: 'knockout.blue — World Cup 2026 Brackets',
        client_uri: 'https://knockout.blue',
        redirect_uris,
        scope: OAUTH_SCOPE,
      }

  client = new OAuthClient({
    metadata,
    actorResolver,
    responseMode: 'query',
    stores: {
      sessions: kvStore(env.OAUTH_SESSION, 'session'),
      states: kvStore(env.OAUTH_STATE, 'state', 600),
    },
  })

  return client
}
