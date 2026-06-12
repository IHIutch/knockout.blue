import type { ResolvedActor } from '@atcute/identity-resolver'

import {
  CompositeDidDocumentResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,

  WebDidDocumentResolver,
  XrpcHandleResolver,
} from '@atcute/identity-resolver'
import { isActorIdentifier } from '@atcute/lexicons/syntax'

/**
 * Isomorphic actor resolution (handle or DID → { did, handle, pds }) using
 * plain fetch: works in the browser, Vite SSR, and Cloudflare workerd.
 * Handles resolve via the Bluesky AppView's XRPC endpoint (the practical
 * choice for browsers, where DNS-over-HTTPS/well-known are CORS-hostile).
 */
export const actorResolver = new LocalActorResolver({
  handleResolver: new XrpcHandleResolver({ serviceUrl: 'https://public.api.bsky.app' }),
  didDocumentResolver: new CompositeDidDocumentResolver({
    methods: {
      plc: new PlcDidDocumentResolver(),
      web: new WebDidDocumentResolver(),
    },
  }),
})

/** Resolve a handle or DID; null for malformed identifiers or failed resolution. */
export async function resolveActor(identifier: string): Promise<ResolvedActor | null> {
  const trimmed = identifier.trim().replace(/^@/, '')
  if (!isActorIdentifier(trimmed))
    return null
  try {
    return await actorResolver.resolve(trimmed)
  }
  catch {
    return null
  }
}
