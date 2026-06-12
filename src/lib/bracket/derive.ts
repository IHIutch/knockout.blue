import type { R32Field, SlotSource, TeamCode } from '../tournament/data'
import type { WinnersMap } from './schema'

import {
  MATCH_NUMBERS,
  MATCHES,

} from '../tournament/data'

export interface ResolvedMatch {
  match: number
  /** Participants as currently derivable; null = unknown (upstream not picked / R32 field not set). */
  home: TeamCode | null
  away: TeamCode | null
  /** The stored pick, but only if it is one of the two current participants. */
  picked: TeamCode | null
  /** The raw stored pick, valid or not (for "stale pick" UI hints). */
  storedPick: TeamCode | null
}

export interface ResolvedBracket {
  matches: Record<number, ResolvedMatch>
  champion: TeamCode | null
  runnerUp: TeamCode | null
  /** Winner of the third-place match (103). */
  third: TeamCode | null
  completeness: {
    /** Matches with a currently-valid pick. */
    picked: number
    /** Matches whose both participants are currently known (i.e. could be picked right now). */
    pickable: number
    total: number
  }
}

/**
 * Pure derivation from stored picks to a fully resolved bracket.
 *
 * Picks are kept-if-valid: a stored pick is honored iff that team is one of
 * the match's two derived participants. Nothing is ever cleared here —
 * flipping an upstream pick back instantly revalidates downstream picks.
 * A single ascending pass over 73→104 suffices because slot sources only
 * ever reference earlier matches.
 */
export function deriveBracket(winners: WinnersMap, field: R32Field): ResolvedBracket {
  const matches: Record<number, ResolvedMatch> = {}

  const resolveSlot = (matchNumber: number, source: SlotSource, side: 'home' | 'away'): TeamCode | null => {
    switch (source.kind) {
      case 'groupSlot':
        return field[matchNumber]?.[side] ?? null
      case 'matchWinner':
        return matches[source.match].picked
      case 'matchLoser': {
        const upstream = matches[source.match]
        if (!upstream.home || !upstream.away || !upstream.picked)
          return null
        return upstream.picked === upstream.home ? upstream.away : upstream.home
      }
    }
  }

  for (const n of MATCH_NUMBERS) {
    const info = MATCHES[n]
    const home = resolveSlot(n, info.home, 'home')
    const away = resolveSlot(n, info.away, 'away')
    const storedPick = winners[String(n) as keyof WinnersMap] ?? null
    const picked = storedPick !== null && (storedPick === home || storedPick === away) ? storedPick : null
    matches[n] = { match: n, home, away, picked, storedPick }
  }

  const final = matches[104]
  const resolved = Object.values(matches)

  return {
    matches,
    champion: final.picked,
    runnerUp: final.picked && final.home && final.away
      ? (final.picked === final.home ? final.away : final.home)
      : null,
    third: matches[103].picked,
    completeness: {
      picked: resolved.filter(m => m.picked !== null).length,
      pickable: resolved.filter(m => m.home !== null && m.away !== null).length,
      total: MATCH_NUMBERS.length,
    },
  }
}

/**
 * Drop stored picks that are not currently valid, so published records are
 * clean. The editor's local draft keeps the unpruned map (kept-if-valid UX).
 */
export function pruneInvalidPicks(winners: WinnersMap, field: R32Field): WinnersMap {
  const { matches } = deriveBracket(winners, field)
  return Object.fromEntries(
    Object.entries(matches)
      .filter(([, m]) => m.picked !== null)
      .map(([n, m]) => [n, m.picked as TeamCode]),
  )
}
