import { createServerFn } from '@tanstack/react-start'

import type { MatchKey } from '../lib/bracket/schema'
import type { TeamCode } from '../lib/tournament/data'

import { BRACKET_NSID } from '../lib/bracket/nsid'
import { bracketRecordSchema } from '../lib/bracket/schema'
import { TEAMS } from '../lib/tournament/data'

/**
 * Champion picks across every published bracket, tallied from the public
 * UFOs records endpoint (ufos-api.microcosm.blue) — the same community
 * Jetstream-backed tracker `stats.ts` uses for the headline count, so no
 * indexer of our own. Cached per isolate for 10 minutes; any failure is
 * treated as "no data" (the UI shows an empty state).
 */

/** FIFA match number of the Final — its winner is the predicted champion. */
const FINAL_MATCH_KEY: MatchKey = '104'
// UFOs returns newest-first; 100 covers the field comfortably for now.
const MAX_RECORDS = 100

export interface ChampionPick {
  code: TeamCode
  count: number
}

export interface ChampionPicks {
  /** Brackets that named a champion — the percentage denominator. */
  total: number
  /** Teams with at least one champion vote, most-picked first. */
  picks: ChampionPick[]
}

interface UfosRecord {
  did: string
  record: unknown
}

let cached: { value: ChampionPicks | null, at: number } | undefined
const TTL_MS = 10 * 60 * 1000

async function fetchChampionPicks(): Promise<ChampionPicks | null> {
  try {
    const url = `https://ufos-api.microcosm.blue/records?collection=${BRACKET_NSID}&limit=${MAX_RECORDS}`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok)
      return null
    const rows = (await res.json()) as UfosRecord[]
    if (!Array.isArray(rows))
      return null

    const counts = new Map<TeamCode, number>()
    let total = 0
    for (const row of rows) {
      // Untrusted: anyone can write anything into this collection.
      const parsed = bracketRecordSchema.safeParse(row.record)
      if (!parsed.success)
        continue
      const champion = parsed.data.winners[FINAL_MATCH_KEY]
      if (!champion)
        continue
      counts.set(champion, (counts.get(champion) ?? 0) + 1)
      total++
    }

    // Most picks first; ties broken by FIFA rank so the favourite leads.
    const picks = [...counts.entries()]
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count || TEAMS[a.code].rank - TEAMS[b.code].rank)

    return { total, picks }
  }
  catch {
    return null
  }
}

export const getChampionPicks = createServerFn({ method: 'GET' }).handler(
  async (): Promise<ChampionPicks | null> => {
    if (cached && Date.now() - cached.at < TTL_MS)
      return cached.value
    const value = await fetchChampionPicks()
    cached = { value, at: Date.now() }
    return value
  },
)
