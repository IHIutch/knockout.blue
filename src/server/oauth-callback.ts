import type { SessionUser } from './session-cookie'

import { resolveActor } from '../lib/atproto/identity'
import { getOAuthClient } from './oauth-client'
import { sessionSetCookieHeader } from './session-cookie'

/**
 * Handle the OAuth redirect (response_mode=query): exchange the code, set
 * the signed session cookie, bounce home. Errors land on / with a query
 * param the editor shows as a banner. Server-only module — the callback
 * route loads it via dynamic import inside its GET handler.
 */
export async function handleOAuthCallback(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  try {
    const { session } = await getOAuthClient().callback(params)
    const actor = await resolveActor(session.did)
    const user: SessionUser = { did: session.did, handle: actor?.handle ?? session.did }
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/',
        'Set-Cookie': await sessionSetCookieHeader(user),
      },
    })
  }
  catch (err) {
    const message
      = params.get('error_description') ?? (err instanceof Error ? err.message : 'Sign-in failed')
    const to = new URL('/', request.url)
    to.searchParams.set('authError', message)
    return new Response(null, { status: 302, headers: { Location: to.toString() } })
  }
}
