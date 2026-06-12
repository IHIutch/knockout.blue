import { describe, expect, it } from 'vitest'

import type { WinnersMap } from './schema'

import {
  MATCH_NUMBERS,
  MATCHES,
  R32_MATCH_NUMBERS,
  TEAM_CODES,
  TEAMS,
} from '../tournament/data'
import { DEV_R32_FIELD } from '../tournament/fixture.dev'
import { deriveFieldFromGroupPicks } from '../tournament/groupStage'
import { autopick } from './autopick'
import { deriveBracket, pruneInvalidPicks } from './derive'
import { BRACKET_NSID } from './nsid'
import { bracketRecordSchema } from './schema'

describe('tournament data', () => {
  it('has 48 teams in 12 groups of 4', () => {
    expect(TEAM_CODES).toHaveLength(48)
    const byGroup = new Map<string, number>()
    for (const team of Object.values(TEAMS)) {
      byGroup.set(team.group, (byGroup.get(team.group) ?? 0) + 1)
    }
    expect(byGroup.size).toBe(12)
    expect([...byGroup.values()].every(n => n === 4)).toBe(true)
  })

  it('covers matches 73–104 with backward-only references', () => {
    expect(MATCH_NUMBERS).toEqual(Array.from({ length: 32 }, (_, i) => 73 + i))
    for (const n of MATCH_NUMBERS) {
      const info = MATCHES[n]
      expect(info.match).toBe(n)
      for (const slot of [info.home, info.away]) {
        if (slot.kind !== 'groupSlot') {
          expect(slot.match).toBeLessThan(n)
        }
        else {
          expect(n).toBeLessThanOrEqual(88)
        }
      }
    }
  })

  it('dev fixture fills every R32 match with distinct teams', () => {
    const seen = new Set<string>()
    for (const n of R32_MATCH_NUMBERS) {
      const { home, away } = DEV_R32_FIELD[n]
      expect(home).toBeTruthy()
      expect(away).toBeTruthy()
      seen.add(home!)
      seen.add(away!)
    }
    expect(seen.size).toBe(32)
  })
})

describe('bracketRecordSchema', () => {
  const valid = {
    $type: BRACKET_NSID,
    schemaVersion: 1,
    winners: { 73: 'KOR', 104: 'BRA' },
    createdAt: '2026-06-11T00:00:00.000Z',
    updatedAt: '2026-06-11T00:00:00.000Z',
  }

  it('accepts a valid (partial) record', () => {
    expect(bracketRecordSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts an empty winners map', () => {
    expect(bracketRecordSchema.safeParse({ ...valid, winners: {} }).success).toBe(true)
  })

  it.each([
    ['wrong $type', { ...valid, $type: 'app.bsky.feed.post' }],
    ['unknown team code', { ...valid, winners: { 73: 'XYZ' } }],
    ['match number out of range', { ...valid, winners: { 72: 'BRA' } }],
    ['non-ISO timestamp', { ...valid, createdAt: 'yesterday' }],
    ['missing winners', { $type: BRACKET_NSID, schemaVersion: 1, createdAt: valid.createdAt, updatedAt: valid.updatedAt }],
  ])('rejects %s', (_label, record) => {
    expect(bracketRecordSchema.safeParse(record).success).toBe(false)
  })
})

describe('deriveBracket', () => {
  it('with no picks, only R32 is pickable', () => {
    const result = deriveBracket({}, DEV_R32_FIELD)
    expect(result.completeness).toEqual({ picked: 0, pickable: 16, total: 32 })
    expect(result.matches[89].home).toBeNull()
    expect(result.champion).toBeNull()
  })

  it('with no group predictions, nothing is pickable', () => {
    const result = deriveBracket({}, deriveFieldFromGroupPicks({}, []))
    expect(result.completeness.pickable).toBe(0)
  })

  it('propagates winners and derives third-place participants from semifinal losers', () => {
    const winners = autopick({}, DEV_R32_FIELD, 'chalk')
    const result = deriveBracket(winners, DEV_R32_FIELD)

    expect(result.completeness).toEqual({ picked: 32, pickable: 32, total: 32 })
    // Chalk (by rank) over the dev fixture: ESP beats ARG in the final,
    // SF losers FRA and ENG meet in match 103, FRA (rank 3) wins it.
    expect(result.champion).toBe('ESP')
    expect(result.runnerUp).toBe('ARG')
    expect(result.matches[103].home).toBe('FRA')
    expect(result.matches[103].away).toBe('ENG')
    expect(result.third).toBe('FRA')
  })

  it('keeps downstream picks stored but invalid when an upstream pick flips, and revalidates on flip-back', () => {
    // BRA's path through the dev fixture: M76 → M91 → M99 → M102 → M104.
    const winners: WinnersMap = { 76: 'BRA', 91: 'BRA', 99: 'BRA', 102: 'BRA', 104: 'BRA' }
    const before = deriveBracket(winners, DEV_R32_FIELD)
    expect(before.champion).toBe('BRA')

    const flipped = deriveBracket({ ...winners, 76: 'JPN' }, DEV_R32_FIELD)
    expect(flipped.matches[91].picked).toBeNull()
    expect(flipped.matches[91].storedPick).toBe('BRA')
    expect(flipped.champion).toBeNull()

    const restored = deriveBracket({ ...winners, 76: 'BRA' }, DEV_R32_FIELD)
    expect(restored.champion).toBe('BRA')
  })

  it('ignores picks for teams that are not participants', () => {
    const result = deriveBracket({ 73: 'BRA' }, DEV_R32_FIELD)
    expect(result.matches[73].picked).toBeNull()
    expect(result.matches[73].storedPick).toBe('BRA')
    expect(result.completeness.picked).toBe(0)
  })
})

describe('pruneInvalidPicks', () => {
  it('drops invalidated downstream picks and keeps valid ones', () => {
    const winners: WinnersMap = { 76: 'JPN', 91: 'BRA', 99: 'BRA' }
    expect(pruneInvalidPicks(winners, DEV_R32_FIELD)).toEqual({ 76: 'JPN' })
  })
})

describe('autopick', () => {
  it('chalk is deterministic and fills all 32 picks', () => {
    const a = autopick({}, DEV_R32_FIELD, 'chalk')
    const b = autopick({}, DEV_R32_FIELD, 'chalk')
    expect(a).toEqual(b)
    expect(Object.keys(a)).toHaveLength(32)
  })

  it('preserves existing valid picks', () => {
    const winners = autopick({ 73: 'CAN' }, DEV_R32_FIELD, 'chalk')
    expect(winners['73']).toBe('CAN')
  })

  it('chaos fills all picks with an injected rng', () => {
    let seed = 42
    const rng = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed / 2147483648
    }
    const winners = autopick({}, DEV_R32_FIELD, 'chaos', rng)
    const result = deriveBracket(winners, DEV_R32_FIELD)
    expect(result.completeness.picked).toBe(32)
    expect(result.champion).not.toBeNull()
  })

  it('does nothing when the field is empty', () => {
    expect(autopick({}, deriveFieldFromGroupPicks({}, []), 'chalk')).toEqual({})
  })
})
