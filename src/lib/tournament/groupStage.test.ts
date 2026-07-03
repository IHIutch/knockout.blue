import { describe, expect, it } from 'vitest'

import type { GroupId, TeamCode } from './data'
import type { GroupPicksMap } from './groupStage'

import { autopickGroups } from '../bracket/autopick'
import { GROUP_IDS, R32_MATCH_NUMBERS, teamsInGroup } from './data'
import {
  assignThirdPlaceSlots,
  deriveFieldFromGroupPicks,
  R32_SLOTS,
  sanitizeGroupPicks,
  THIRD_PLACE_SLOTS,
} from './groupStage'
import {
  THIRD_PLACE_TABLE,
  WINNER_COLUMN_ORDER,
  WINNER_MATCH_NUMBER,
} from './thirdPlaceTable'

/** Top three of every group by FIFA rank — a complete, valid prediction. */
function chalkGroupPicks(): GroupPicksMap {
  return Object.fromEntries(
    GROUP_IDS.map(g => [
      g,
      [...teamsInGroup(g)]
        .sort((a, b) => a.rank - b.rank)
        .slice(0, 3)
        .map(t => t.code),
    ]),
  )
}

function* combinations<T>(items: T[], size: number, start = 0): Generator<T[]> {
  if (size === 0) {
    yield []
    return
  }
  for (let i = start; i <= items.length - size; i++) {
    for (const rest of combinations(items, size - 1, i + 1)) {
      yield [items[i], ...rest]
    }
  }
}

describe('r32 slot parsing', () => {
  it('covers every group at ranks 1 and 2 plus eight third-place slots', () => {
    const placed = new Set<string>()
    let thirds = 0
    for (const n of R32_MATCH_NUMBERS) {
      for (const side of ['home', 'away'] as const) {
        const slot = R32_SLOTS[n][side]
        if (slot.kind === 'placed')
          placed.add(`${slot.rank}${slot.group}`)
        else thirds++
      }
    }
    expect(thirds).toBe(8)
    expect(placed.size).toBe(24)
    for (const g of GROUP_IDS) {
      expect(placed.has(`1${g}`)).toBe(true)
      expect(placed.has(`2${g}`)).toBe(true)
    }
  })
})

describe('assignThirdPlaceSlots', () => {
  it('finds a valid assignment for every 8-of-12 combination', () => {
    let count = 0
    for (const combo of combinations(GROUP_IDS, 8)) {
      count++
      const assignment = assignThirdPlaceSlots(combo)
      expect(assignment, `no assignment for ${combo.join('/')}`).not.toBeNull()
      const groups = [...assignment!.values()]
      expect(new Set(groups).size).toBe(8)
      expect([...groups].sort()).toEqual([...combo].sort())
      for (const slot of THIRD_PLACE_SLOTS) {
        expect(slot.candidates).toContain(assignment!.get(slot.match))
      }
    }
    expect(count).toBe(495)
  })

  it('is deterministic', () => {
    const combo: GroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    expect(assignThirdPlaceSlots(combo)).toEqual(assignThirdPlaceSlots([...combo].reverse()))
  })

  it('rejects anything but eight distinct groups', () => {
    expect(assignThirdPlaceSlots(['A', 'B', 'C'])).toBeNull()
    expect(assignThirdPlaceSlots(['A', 'A', 'B', 'C', 'D', 'E', 'F', 'G'])).toBeNull()
    expect(assignThirdPlaceSlots(GROUP_IDS)).toBeNull()
  })
})

describe('thirdPlaceTable integrity (Annexe C)', () => {
  const candidatesByMatch = new Map(
    THIRD_PLACE_SLOTS.map(s => [s.match, new Set(s.candidates)]),
  )
  const entries = Object.entries(THIRD_PLACE_TABLE)

  it('contains exactly the 495 distinct combinations', () => {
    expect(entries.length).toBe(495)
    const expected = [...combinations(GROUP_IDS, 8)].map(c => c.join(''))
    expect(new Set(Object.keys(THIRD_PLACE_TABLE))).toEqual(new Set(expected))
  })

  it('keys are sorted, 8 distinct groups', () => {
    for (const [combo] of entries) {
      expect(combo.length).toBe(8)
      expect(new Set(combo).size).toBe(8)
      expect([...combo].sort().join('')).toBe(combo)
    }
  })

  it('every row is a bijection onto the combination, within candidate sets', () => {
    for (const [combo, value] of entries) {
      expect(value.length, `row ${combo}`).toBe(WINNER_COLUMN_ORDER.length)
      // bijection: the assigned groups are exactly the combination's groups
      expect([...value].sort().join(''), `row ${combo} is not a permutation`).toBe(combo)
      // each assignment respects its slot's published candidate set
      WINNER_COLUMN_ORDER.forEach((winner, i) => {
        const match = WINNER_MATCH_NUMBER[winner]
        expect(
          candidatesByMatch.get(match)!.has(value[i] as GroupId),
          `row ${combo}: ${winner} (match ${match}) = 3${value[i]} not in candidates`,
        ).toBe(true)
      })
    }
  })
})

describe('sanitizeGroupPicks', () => {
  it('drops teams from the wrong group, duplicates, and overflow', () => {
    expect(
      sanitizeGroupPicks({
        A: ['MEX', 'BRA', 'MEX', 'KOR', 'RSA', 'CZE'] as TeamCode[],
      }),
    ).toEqual({ A: ['MEX', 'KOR', 'RSA'] })
  })
})

describe('deriveFieldFromGroupPicks', () => {
  it('fills all 32 slots with distinct teams from a complete prediction', () => {
    const picks = chalkGroupPicks()
    const field = deriveFieldFromGroupPicks(picks, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    const seen = new Set<string>()
    for (const n of R32_MATCH_NUMBERS) {
      expect(field[n].home).not.toBeNull()
      expect(field[n].away).not.toBeNull()
      seen.add(field[n].home!)
      seen.add(field[n].away!)
    }
    expect(seen.size).toBe(32)
  })

  it('leaves slots null for unordered groups and keeps the rest', () => {
    const picks = chalkGroupPicks()
    delete picks.A
    const field = deriveFieldFromGroupPicks(picks, ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'])
    // Match 79 is 1A v 3rd; match 73 is 2A v 2B.
    expect(field[79].home).toBeNull()
    expect(field[73].home).toBeNull()
    expect(field[73].away).not.toBeNull()
  })

  it('fills no third-place slot until exactly eight advancing thirds exist', () => {
    const picks = chalkGroupPicks()
    const partial = deriveFieldFromGroupPicks(picks, ['A', 'B', 'C'])
    for (const slot of THIRD_PLACE_SLOTS) {
      expect(partial[slot.match][slot.side]).toBeNull()
    }
  })

  it('ignores advancing thirds whose group has no third-place pick', () => {
    const picks = chalkGroupPicks()
    picks.A = picks.A!.slice(0, 2)
    const field = deriveFieldFromGroupPicks(picks, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
    for (const slot of THIRD_PLACE_SLOTS) {
      expect(field[slot.match][slot.side]).toBeNull()
    }
  })
})

describe('autopickGroups', () => {
  it('chalk completes every group and exactly eight thirds, deterministically', () => {
    const a = autopickGroups({}, [], 'chalk')
    const b = autopickGroups({}, [], 'chalk')
    expect(a).toEqual(b)
    for (const g of GROUP_IDS) {
      expect(a.groupPicks[g]).toHaveLength(3)
    }
    expect(a.thirds).toHaveLength(8)
  })

  it('preserves existing picks and third selections', () => {
    const { groupPicks, thirds } = autopickGroups({ A: ['RSA'] }, ['A'], 'chalk')
    expect(groupPicks.A![0]).toBe('RSA')
    expect(thirds).toContain('A')
  })

  it('produces a fully derivable field', () => {
    const { groupPicks, thirds } = autopickGroups({}, [], 'chalk')
    const field = deriveFieldFromGroupPicks(groupPicks, thirds)
    expect(Object.values(field).every(s => s.home && s.away)).toBe(true)
  })
})
