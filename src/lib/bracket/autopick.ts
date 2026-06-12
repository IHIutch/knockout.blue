import type { GroupId, R32Field } from '../tournament/data'
import type { GroupPicksMap } from '../tournament/groupStage'
import type { MatchKey, WinnersMap } from './schema'

import { GROUP_IDS, MATCH_NUMBERS, TEAMS, teamsInGroup } from '../tournament/data'
import { sanitizeGroupPicks } from '../tournament/groupStage'
import { deriveBracket } from './derive'

export type AutopickMode = 'chalk' | 'chaos'

/**
 * Fill out group-stage predictions: complete each group's top three
 * (existing picks keep their positions) and top the advancing thirds up to
 * eight. 'chalk' goes by FIFA rank; 'chaos' flips the provided coin.
 */
export function autopickGroups(
  groupPicks: GroupPicksMap,
  thirds: GroupId[],
  mode: AutopickMode,
  random: () => number = Math.random,
): { groupPicks: GroupPicksMap, thirds: GroupId[] } {
  const filled: GroupPicksMap = { ...sanitizeGroupPicks(groupPicks) }

  for (const group of GROUP_IDS) {
    const existing = filled[group] ?? []
    if (existing.length === 3)
      continue
    const rest = teamsInGroup(group)
      .filter(team => !existing.includes(team.code))
      .sort((a, b) => (mode === 'chalk' ? a.rank - b.rank : random() - 0.5))
      .map(team => team.code)
    filled[group] = [...existing, ...rest].slice(0, 3)
  }

  const kept = [...new Set(thirds)].slice(0, 8)
  const remaining = GROUP_IDS.filter(g => !kept.includes(g)).sort((a, b) =>
    mode === 'chalk'
      ? TEAMS[filled[a]![2]].rank - TEAMS[filled[b]![2]].rank
      : random() - 0.5,
  )

  return { groupPicks: filled, thirds: [...kept, ...remaining].slice(0, 8) }
}

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
    if (m.picked || !m.home || !m.away)
      continue
    const pick
      = mode === 'chalk'
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
