/**
 * The ONLY module that imports @atcute/oauth-browser-client, which touches
 * localStorage/IndexedDB at module scope and must never run during SSR.
 * Consumers load this file exclusively via dynamic `import()` inside
 * effects/event handlers, keeping it out of the server module graph.
 */
if (import.meta.env.SSR) {
  throw new Error('lib/atproto/oauth.ts is client-only; import it dynamically')
}

import {
  OAuthUserAgent,
  configureOAuth,
  createAuthorizationUrl,
  deleteStoredSession,
  finalizeAuthorization,
  getSession,
} from '@atcute/oauth-browser-client'
import { isActorIdentifier, type Did } from '@atcute/lexicons/syntax'
import { actorResolver } from './identity'

const DID_KEY = 'bracketblue:did'

configureOAuth({
  metadata: {
    client_id: import.meta.env.VITE_OAUTH_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_OAUTH_REDIRECT_URI,
  },
  identityResolver: actorResolver,
})

/** Resolves the identifier and redirects to the account's auth server. */
export async function startLogin(identifier: string): Promise<void> {
  const trimmed = identifier.trim().replace(/^@/, '')
  if (!isActorIdentifier(trimmed)) {
    throw new Error('Enter a handle like "you.bsky.social" or a DID')
  }
  const url = await createAuthorizationUrl({
    target: { type: 'account', identifier: trimmed },
    scope: import.meta.env.VITE_OAUTH_SCOPE,
  })
  window.location.assign(url)
  // Give the browser a beat to navigate so callers don't flash error UI.
  await new Promise((resolve) => setTimeout(resolve, 200))
}

/** Callback page: exchange the authorization response for a session. */
export async function finishLogin(params: URLSearchParams): Promise<OAuthUserAgent> {
  const { session } = await finalizeAuthorization(params)
  const agent = new OAuthUserAgent(session)
  window.localStorage.setItem(DID_KEY, agent.sub)
  return agent
}

/** Resume a persisted session; null means signed out (or expired/revoked). */
export async function restoreSession(): Promise<OAuthUserAgent | null> {
  const did = window.localStorage.getItem(DID_KEY) as Did | null
  if (!did) return null
  try {
    const session = await getSession(did, { allowStale: false })
    return new OAuthUserAgent(session)
  } catch {
    window.localStorage.removeItem(DID_KEY)
    return null
  }
}

export async function logout(agent: OAuthUserAgent | null): Promise<void> {
  const did = window.localStorage.getItem(DID_KEY) as Did | null
  window.localStorage.removeItem(DID_KEY)
  try {
    if (agent) await agent.signOut()
    else if (did) deleteStoredSession(did)
  } catch {
    // Token revocation is best-effort; the local session is already gone.
  }
}
