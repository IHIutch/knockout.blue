import { describe, expect, it } from 'vitest'

import type { GroupId } from './data'

import { assignThirdPlaceSlots } from './groupStage'

/**
 * FIFA's OFFICIAL third-place allocation is a predetermined lookup table, not
 * "any valid matching". For the 48-team format there are C(12,8) = 495
 * combinations of which eight groups produce an advancing third-place team,
 * and FIFA published the slot assignment for every one of them in advance.
 *
 * The current `assignThirdPlaceSlots` only finds *a* matching that respects
 * each slot's candidate set. Every one of the 495 combinations admits multiple
 * valid matchings (6–29 each), so a matcher that stops at the first legal one
 * will disagree with FIFA's table on most combinations. This test pins the
 * output to the official table.
 *
 * The eight third-place R32 slots are keyed by FIFA match number:
 *   74 = 1E,  77 = 1I,  79 = 1A,  80 = 1L,
 *   81 = 1D,  82 = 1G,  85 = 1B,  87 = 1K
 *
 * Each table row maps a combination (the 8 advancing groups, sorted) to the
 * group whose third-place team fills each of those eight match slots.
 */

type ThirdPlaceRow = Record<number, GroupId>

/** match-number -> winner label, for readable failure messages. */
const SLOT_LABEL: Record<number, string> = {
  74: '1E',
  77: '1I',
  79: '1A',
  80: '1L',
  81: '1D',
  82: '1G',
  85: '1B',
  87: '1K',
}

const SLOT_MATCHES = Object.keys(SLOT_LABEL).map(Number)

/** Combination key: the 8 advancing groups as a sorted string, e.g. "ACDFGHJK". */
function comboKey(groups: GroupId[]): string {
  return [...groups].sort().join('')
}

function comboGroups(key: string): GroupId[] {
  return key.split('') as GroupId[]
}

/**
 * Independent external anchor rows for FIFA's allocation. Key = sorted
 * combination of advancing groups. Value = { matchNumber: groupId } for the
 * eight third-place slots.
 *
 * The full 495-row Annexe C table now backs `assignThirdPlaceSlots` directly
 * (see `./thirdPlaceTable`), and its structural integrity — all 495 present,
 * every row a candidate-respecting bijection — is asserted exhaustively in
 * `groupStage.test.ts`. Re-listing all 495 expected rows here would just be
 * the table checked against a copy of itself.
 *
 * So this file keeps only rows verified against a source *independent* of that
 * table, to catch a table that is internally consistent but wrong. The row
 * below is verified against live reporting of the real tournament:
 * combination {A,C,D,F,G,H,J,K} gives
 *   1A vs 3rd H, 1E vs 3rd C, 1I vs 3rd F, 1D vs 3rd J,
 *   1G vs 3rd A, 1K vs 3rd D, 1L vs 3rd K, 1B vs 3rd G.
 */
const FIFA_THIRD_PLACE_TABLE: Record<string, ThirdPlaceRow> = {
  ACDFGHJK: { 74: 'C', 77: 'F', 79: 'H', 80: 'K', 81: 'J', 82: 'A', 85: 'G', 87: 'D' },
}

describe('third-place slot assignment matches FIFA\'s official table', () => {
  const rows = Object.entries(FIFA_THIRD_PLACE_TABLE)

  it('has at least one row to check', () => {
    expect(rows.length).toBeGreaterThan(0)
  })

  it.each(rows)('combination %s is assigned exactly as FIFA published', (key, expected) => {
    const assignment = assignThirdPlaceSlots(comboGroups(key))
    expect(assignment, `no assignment produced for ${key}`).not.toBeNull()

    const actual = Object.fromEntries(
      SLOT_MATCHES.map(m => [m, assignment!.get(m)]),
    ) as ThirdPlaceRow

    // Per-slot assertions so a failure names the exact mismatching match.
    for (const m of SLOT_MATCHES) {
      expect(
        actual[m],
        `combo ${key}: match ${m} (${SLOT_LABEL[m]}) expected 3rd ${expected[m]}, got 3rd ${actual[m]}`,
      ).toBe(expected[m])
    }
  })

  // Anchor rows must be canonical (sorted, 8 groups) so the lookup key matches.
  // Exhaustive 495-combination coverage is asserted in groupStage.test.ts
  // against the table that actually backs assignThirdPlaceSlots.
  it.each(rows)('anchor combination %s is canonical', (key) => {
    expect(key.length, `combo "${key}" must list exactly 8 groups`).toBe(8)
    expect(comboKey(comboGroups(key)), `combo "${key}" must be sorted/canonical`).toBe(key)
  })
})
