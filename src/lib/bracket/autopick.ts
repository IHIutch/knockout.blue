import { MATCH_NUMBERS, TEAMS, type R32Field } from '../tournament/data'
import { deriveBracket } from './derive'
import type { MatchKey, WinnersMap } from './schema'

export type AutopickMode = 'chalk' | 'chaos'

/**
 * Fill every currently-unpicked match. Existing valid picks are preserved.
 * 'chalk' takes the better-ranked team; 'chaos' flips a (provided) coin.
 * Iterates match-by-match so each round's picks feed the next.
 */
export function autopick(
  winners: WinnersMap,
  field: R32Field,
  mode: AutopickMode,
  random: () => number = Math.random,
): WinnersMap {
  const result: WinnersMap = { ...winners }

  for (const n of MATCH_NUMBERS) {
    const { matches } = deriveBracket(result, field)
    const m = matches[n]
    if (m.picked || !m.home || !m.away) continue
    const pick =
      mode === 'chalk'
        ? TEAMS[m.home].rank <= TEAMS[m.away].rank
          ? m.home
          : m.away
        : random() < 0.5
          ? m.home
          : m.away
    result[String(n) as MatchKey] = pick
  }

  return result
}
