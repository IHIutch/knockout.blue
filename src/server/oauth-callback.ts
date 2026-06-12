import type { SessionUser } from './session-cookie'

import { resolveActor } from '../lib/atproto/identity'
import { getOAuthClient } from './oauth-client'
import { CLEAR_RETURN_TO_HEADER, readReturnTo } from './return-to'
import { sessionSetCookieHeader } from './session-cookie'

/**
 * Handle the OAuth redirect (response_mode=query): exchange the code, set
 * the signed session cookie, and bounce back to the page that started
 * sign-in (the kb_return_to cookie; /bracket when absent). Errors land on
 * /bracket with a query param the editor shows as a banner. Server-only
 * module — the callback route loads it via dynamic import inside its GET
 * handler.
 */
export async function handleOAuthCallback(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  try {
    const { session } = await getOAuthClient().callback(params)
    const actor = await resolveActor(session.did)
    const user: SessionUser = { did: session.did, handle: actor?.handle ?? session.did }
    const headers = new Headers({ Location: readReturnTo(request) ?? '/bracket' })
    headers.append('Set-Cookie', await sessionSetCookieHeader(user))
    headers.append('Set-Cookie', CLEAR_RETURN_TO_HEADER)
    return new Response(null, { status: 302, headers })
  }
  catch (err) {
    const message
      = params.get('error_description') ?? (err instanceof Error ? err.message : 'Sign-in failed')
    const to = new URL('/bracket', request.url)
    to.searchParams.set('authError', message)
    const headers = new Headers({ Location: to.toString() })
    headers.append('Set-Cookie', CLEAR_RETURN_TO_HEADER)
    return new Response(null, { status: 302, headers })
  }
}
