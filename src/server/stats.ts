import { createServerFn } from '@tanstack/react-start'

import { BRACKET_NSID } from '../lib/bracket/nsid'

/**
 * Network-wide bracket count via UFOs (ufos-api.microcosm.blue), a public
 * Jetstream-backed collection tracker — no indexer of our own. It's a free
 * community service: cache per isolate for 10 minutes and treat any failure
 * as "no stat" (the UI hides it).
 */

export interface BracketStats {
  brackets: number
  accounts: number
}

let cached: { value: BracketStats | null, at: number } | undefined
const TTL_MS = 10 * 60 * 1000

async function fetchStats(): Promise<BracketStats | null> {
  try {
    const url = `https://ufos-api.microcosm.blue/collections/stats?collection=${BRACKET_NSID}&since=2026-01-01T00:00:00Z`
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) })
    if (!res.ok)
      return null
    const data = (await res.json()) as Record<
      string,
      { creates: number, deletes: number, dids_estimate: number }
    >
    const s = data[BRACKET_NSID]
    if (!s)
      return null
    return { brackets: Math.max(0, s.creates - s.deletes), accounts: s.dids_estimate }
  }
  catch {
    return null
  }
}

export const getBracketStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BracketStats | null> => {
    if (cached && Date.now() - cached.at < TTL_MS)
      return cached.value
    const value = await fetchStats()
    cached = { value, at: Date.now() }
    return value
  },
)
