import type {} from '@atcute/atproto'
import type { Did } from '@atcute/lexicons/syntax'

import { Client, ok } from '@atcute/client'
import { isActorIdentifier } from '@atcute/lexicons/syntax'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import type { SessionUser } from './session-cookie'

import { pruneInvalidPicks } from '../lib/bracket/derive'
import { BRACKET_NSID } from '../lib/bracket/nsid'
import {
  advancingThirdsSchema,
  bracketRecordSchema,
  buildRecord,
  groupPicksSchema,
  winnersSchema,
} from '../lib/bracket/schema'
import { deriveFieldFromGroupPicks } from '../lib/tournament/groupStage'
import { RETURN_TO_COOKIE, RETURN_TO_MAX_AGE, sanitizeReturnTo } from './return-to'

const publishInputSchema = z.object({
  winners: winnersSchema,
  groupPicks: groupPicksSchema,
  thirds: advancingThirdsSchema,
})

const BSKY_PDS = 'https://bsky.social'

// This module is imported by client components (to call the server fns),
// so server-only modules (KV bindings, cloudflare:workers) are loaded via
// dynamic import inside handler bodies — never at the top level.

/**
 * Begin the OAuth flow. With no identifier (one-click "Sign in with
 * Bluesky") we authorize against bsky.social and let the PDS's own login
 * page identify the user. An identifier may be a handle, DID, or a PDS URL
 * (for self-hosters). Returns the authorization URL to redirect to.
 *
 * `returnTo` is the in-app path that initiated sign-in; it rides the OAuth
 * round-trip in a short-lived cookie so the callback can land the user
 * right back where they were.
 */
export const startLogin = createServerFn({ method: 'POST' })
  .validator((input: { identifier: string | null, returnTo?: string }) => input)
  .handler(async ({ data }) => {
    const { getOAuthClient, OAUTH_SCOPE } = await import('./oauth-client')
    const { setCookie } = await import('@tanstack/react-start/server')

    const returnTo = sanitizeReturnTo(data.returnTo)
    if (returnTo) {
      setCookie(RETURN_TO_COOKIE, returnTo, {
        httpOnly: true,
        sameSite: 'lax',
        secure: !import.meta.env.DEV,
        path: '/',
        maxAge: RETURN_TO_MAX_AGE,
      })
    }

    const trimmed = data.identifier?.trim().replace(/^@/, '') ?? ''

    let target
    if (trimmed === '') {
      target = { type: 'pds', serviceUrl: BSKY_PDS } as const
    }
    else if (/^https?:\/\//.test(trimmed)) {
      target = { type: 'pds', serviceUrl: trimmed } as const
    }
    else if (isActorIdentifier(trimmed)) {
      target = { type: 'account', identifier: trimmed } as const
    }
    else {
      throw new Error('Enter a handle like "you.bsky.social", a DID, or a PDS URL')
    }

    const { url } = await getOAuthClient().authorize({ target, scope: OAUTH_SCOPE })
    return url.toString()
  })

/** The signed-cookie user, if any. Cheap — no KV/PDS round-trips. */
export const getSessionUser = createServerFn({ method: 'GET' }).handler(
  async (): Promise<SessionUser | null> => {
    const { readSessionCookie } = await import('./session-cookie')
    return readSessionCookie()
  },
)

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  const { readSessionCookie, clearSessionCookie } = await import('./session-cookie')
  const user = await readSessionCookie()
  clearSessionCookie()
  if (user) {
    try {
      const { getOAuthClient } = await import('./oauth-client')
      await getOAuthClient().revoke(user.did as Did)
    }
    catch {
      // Best-effort: KV session is gone either way next time restore fails.
    }
  }
  return null
})

/**
 * Publish the caller's bracket to their PDS. Validated at the server
 * boundary; winners that aren't reachable from the caller's own predicted
 * field are pruned; createdAt survives republishing.
 */
export const publishBracket = createServerFn({ method: 'POST' })
  .validator(publishInputSchema)
  .handler(async ({ data }) => {
    const { readSessionCookie } = await import('./session-cookie')
    const { getOAuthClient } = await import('./oauth-client')

    const user = await readSessionCookie()
    if (!user)
      throw new Error('Not signed in')

    const session = await getOAuthClient().restore(user.did as Did)
    const rpc = new Client({ handler: session })
    const now = new Date().toISOString()

    let createdAt = now
    const existing = await rpc.get('com.atproto.repo.getRecord', {
      params: { repo: session.did, collection: BRACKET_NSID, rkey: 'self' },
    })
    if (existing.ok) {
      const parsed = bracketRecordSchema.safeParse(existing.data.value)
      if (parsed.success)
        createdAt = parsed.data.createdAt
    }

    const field = deriveFieldFromGroupPicks(data.groupPicks, data.thirds)
    const record = buildRecord(
      { ...data, winners: pruneInvalidPicks(data.winners, field) },
      { createdAt, updatedAt: now },
    )

    await ok(
      rpc.post('com.atproto.repo.putRecord', {
        input: { repo: session.did, collection: BRACKET_NSID, rkey: 'self', record },
      }),
    )

    return { handle: user.handle }
  })
