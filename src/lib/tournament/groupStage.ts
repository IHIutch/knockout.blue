import type { GroupId, R32Field, TeamCode } from './data'

import { GROUP_IDS, MATCHES, R32_MATCH_NUMBERS, TEAMS } from './data'

/**
 * Group-stage predictions → Round-of-32 field.
 *
 * Users order the top three of every group (index 0 = winner, 1 = runner-up,
 * 2 = third place) and pick which eight of the twelve third-place teams
 * advance. Winners and runners-up map straight onto "1A"/"2B" slots; the
 * eight advancing thirds are assigned to the eight constrained third-place
 * slots ("3rd C/E/F/H/I" etc.) by a backtracking matcher.
 */

/** Ordered top-three picks per group: [winner, runner-up, third]. Partial by design. */
export type GroupPicksMap = Partial<Record<GroupId, TeamCode[]>>

type ParsedSlot
  = | { kind: 'placed', group: GroupId, rank: 1 | 2 }
    | { kind: 'third', candidates: GroupId[] }

function parseSlotLabel(label: string): ParsedSlot {
  const third = label.match(/^3rd ([A-L](?:\/[A-L])+)$/)
  if (third)
    return { kind: 'third', candidates: third[1].split('/') as GroupId[] }
  const placed = label.match(/^([12])([A-L])$/)
  if (placed)
    return { kind: 'placed', group: placed[2] as GroupId, rank: Number(placed[1]) as 1 | 2 }
  throw new Error(`Unparseable R32 slot label: "${label}"`)
}

/** Each R32 match's two slots, parsed from the FIFA slot notation in MATCHES. */
export const R32_SLOTS: Record<number, { home: ParsedSlot, away: ParsedSlot }>
  = Object.fromEntries(
    R32_MATCH_NUMBERS.map((n) => {
      const info = MATCHES[n]
      if (info.home.kind !== 'groupSlot' || info.away.kind !== 'groupSlot')
        throw new Error(`R32 match ${n} has a non-group slot`)
      return [n, { home: parseSlotLabel(info.home.label), away: parseSlotLabel(info.away.label) }]
    }),
  )

/** The eight third-place R32 slots and the groups each one accepts. */
export const THIRD_PLACE_SLOTS: { match: number, side: 'home' | 'away', candidates: GroupId[] }[]
  = R32_MATCH_NUMBERS.flatMap(n =>
    (['home', 'away'] as const).flatMap((side) => {
      const slot = R32_SLOTS[n][side]
      return slot.kind === 'third' ? [{ match: n, side, candidates: slot.candidates }] : []
    }),
  )

/**
 * Assign eight advancing third-place groups to the eight constrained slots.
 * Deterministic backtracking: always fill the most-constrained slot first,
 * trying groups in alphabetical order. FIFA's slot sets admit a matching for
 * every 8-of-12 combination (exhaustively verified in tests).
 *
 * Returns null when `advancing` isn't exactly eight distinct groups.
 */
export function assignThirdPlaceSlots(advancing: GroupId[]): Map<number, GroupId> | null {
  const groups = [...new Set(advancing)].sort()
  if (groups.length !== 8)
    return null

  const assignment = new Map<number, GroupId>()
  const used = new Set<GroupId>()

  const solve = (): boolean => {
    if (assignment.size === THIRD_PLACE_SLOTS.length)
      return true

    let target: { match: number, options: GroupId[] } | null = null
    for (const slot of THIRD_PLACE_SLOTS) {
      if (assignment.has(slot.match))
        continue
      const options = slot.candidates.filter(g => groups.includes(g) && !used.has(g))
      if (!target || options.length < target.options.length)
        target = { match: slot.match, options }
    }
    if (!target)
      return false

    for (const group of target.options) {
      assignment.set(target.match, group)
      used.add(group)
      if (solve())
        return true
      assignment.delete(target.match)
      used.delete(group)
    }
    return false
  }

  return solve() ? assignment : null
}

/**
 * Drop picks that don't belong to the group, duplicates, and overflow beyond
 * three — group picks read from untrusted records (or stale drafts) must not
 * corrupt the field.
 */
export function sanitizeGroupPicks(groupPicks: GroupPicksMap): GroupPicksMap {
  const clean: GroupPicksMap = {}
  for (const group of GROUP_IDS) {
    const picks = groupPicks[group]
    if (!picks)
      continue
    const valid = [...new Set(picks)]
      .filter(code => TEAMS[code]?.group === group)
      .slice(0, 3)
    if (valid.length > 0)
      clean[group] = valid
  }
  return clean
}

/**
 * Pure derivation from group-stage predictions to an R32 field. Unfilled
 * positions stay null (the bracket renders FIFA's slot labels for them).
 * Third-place slots fill only once exactly eight groups with a third-place
 * pick are marked as advancing.
 */
export function deriveFieldFromGroupPicks(
  groupPicks: GroupPicksMap,
  advancingThirds: GroupId[],
): R32Field {
  const picks = sanitizeGroupPicks(groupPicks)
  const advancing = [...new Set(advancingThirds)].filter(g => picks[g]?.[2] !== undefined)
  const thirdAssignment = advancing.length === 8 ? assignThirdPlaceSlots(advancing) : null

  const resolve = (match: number, slot: ParsedSlot): TeamCode | null => {
    if (slot.kind === 'placed')
      return picks[slot.group]?.[slot.rank - 1] ?? null
    const group = thirdAssignment?.get(match)
    return group ? picks[group]![2] : null
  }

  return Object.fromEntries(
    R32_MATCH_NUMBERS.map(n => [
      n,
      { home: resolve(n, R32_SLOTS[n].home), away: resolve(n, R32_SLOTS[n].away) },
    ]),
  )
}
