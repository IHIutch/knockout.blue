import type { GroupId, R32Field, TeamCode } from './data'

import { GROUP_IDS, MATCHES, R32_MATCH_NUMBERS, TEAMS } from './data'
import { THIRD_PLACE_TABLE, WINNER_COLUMN_ORDER, WINNER_MATCH_NUMBER } from './thirdPlaceTable'

/**
 * Group-stage predictions → Round-of-32 field.
 *
 * Users order the top three of every group (index 0 = winner, 1 = runner-up,
 * 2 = third place) and pick which eight of the twelve third-place teams
 * advance. Winners and runners-up map straight onto "1A"/"2B" slots; the
 * eight advancing thirds are assigned to the eight constrained third-place
 * slots ("3rd C/E/F/H/I" etc.) by FIFA's published allocation table
 * (Annexe C), looked up by the sorted combination of advancing groups.
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

/** Match number for each WINNER_COLUMN_ORDER index — the table's column order. */
const TABLE_MATCH_BY_COLUMN = WINNER_COLUMN_ORDER.map(w => WINNER_MATCH_NUMBER[w])

/**
 * Assign eight advancing third-place groups to their eight Round-of-32 slots
 * using FIFA's official allocation table (Annexe C, see `./thirdPlaceTable`).
 *
 * The candidate sets ("3rd C/E/F/H/I" etc.) don't uniquely determine the
 * pairing — every 8-of-12 combination admits many candidate-respecting
 * matchings — so FIFA pre-published one fixed choice per combination. This is
 * a direct lookup of that table, keyed by the sorted combination, returning a
 * Map from FIFA match number to the third-place group that fills it.
 *
 * Returns null when `advancing` isn't exactly eight distinct groups. Every
 * valid 8-of-12 combination is present in the table, so a non-null input of
 * eight distinct groups always resolves.
 */
export function assignThirdPlaceSlots(advancing: GroupId[]): Map<number, GroupId> | null {
  const groups = [...new Set(advancing)].sort()
  if (groups.length !== 8)
    return null

  const row = THIRD_PLACE_TABLE[groups.join('')]
  if (!row)
    return null

  const assignment = new Map<number, GroupId>()
  for (let i = 0; i < TABLE_MATCH_BY_COLUMN.length; i++)
    assignment.set(TABLE_MATCH_BY_COLUMN[i], row[i] as GroupId)

  return assignment
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
