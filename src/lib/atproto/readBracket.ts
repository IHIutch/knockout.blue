import type {} from '@atcute/atproto'

import { Client, simpleFetchHandler } from '@atcute/client'
import { createServerFn } from '@tanstack/react-start'

import type { BracketRecord } from '../bracket/schema'

import { BRACKET_NSID } from '../bracket/nsid'
import { bracketRecordSchema } from '../bracket/schema'
import { resolveActor } from './identity'

export type BracketLookup
  = | { status: 'ok', handle: string, did: string, record: BracketRecord }
    | { status: 'not-found', identifier: string }
    | { status: 'no-bracket', handle: string, did: string }
    | { status: 'invalid-record', handle: string, did: string }

/**
 * Fetch someone's published bracket straight from their PDS — no app
 * database. Runs server-side (SSR share pages, OG image route) but is
 * isomorphic plain-fetch code.
 */
export async function lookupBracket(identifier: string): Promise<BracketLookup> {
  const actor = await resolveActor(identifier)
  if (!actor)
    return { status: 'not-found', identifier }

  const rpc = new Client({ handler: simpleFetchHandler({ service: actor.pds }) })
  const response = await rpc.get('com.atproto.repo.getRecord', {
    params: { repo: actor.did, collection: BRACKET_NSID, rkey: 'self' },
  })

  if (!response.ok) {
    return { status: 'no-bracket', handle: actor.handle, did: actor.did }
  }

  // Untrusted data: anyone can write anything into this collection.
  const parsed = bracketRecordSchema.safeParse(response.data.value)
  if (!parsed.success) {
    return { status: 'invalid-record', handle: actor.handle, did: actor.did }
  }

  return { status: 'ok', handle: actor.handle, did: actor.did, record: parsed.data }
}

export const getBracketForActor = createServerFn({ method: 'GET' })
  .validator((identifier: string) => identifier)
  .handler(({ data }) => lookupBracket(data))
