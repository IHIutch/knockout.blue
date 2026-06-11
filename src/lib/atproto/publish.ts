import type {} from '@atcute/atproto'
import { Client, ok } from '@atcute/client'
import type { OAuthUserAgent } from '@atcute/oauth-browser-client'
import { BRACKET_NSID } from '../bracket/nsid'
import { pruneInvalidPicks } from '../bracket/derive'
import { bracketRecordSchema, buildRecord, type WinnersMap } from '../bracket/schema'
import type { R32Field } from '../tournament/data'

/**
 * Publish the draft to the signed-in user's own PDS at rkey "self"
 * (idempotent create-or-replace). Invalid picks are pruned so the public
 * record is always internally consistent; createdAt survives republishing.
 */
export async function publishBracket(
  agent: OAuthUserAgent,
  winners: WinnersMap,
  field: R32Field,
): Promise<void> {
  const rpc = new Client({ handler: agent })
  const now = new Date().toISOString()

  let createdAt = now
  const existing = await rpc.get('com.atproto.repo.getRecord', {
    params: { repo: agent.sub, collection: BRACKET_NSID, rkey: 'self' },
  })
  if (existing.ok) {
    const parsed = bracketRecordSchema.safeParse(existing.data.value)
    if (parsed.success) createdAt = parsed.data.createdAt
  }

  const record = buildRecord(pruneInvalidPicks(winners, field), { createdAt, updatedAt: now })

  await ok(
    rpc.post('com.atproto.repo.putRecord', {
      input: {
        repo: agent.sub,
        collection: BRACKET_NSID,
        rkey: 'self',
        record,
      },
    }),
  )
}
