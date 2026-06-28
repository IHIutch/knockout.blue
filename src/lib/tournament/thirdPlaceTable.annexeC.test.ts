import fs from 'node:fs'
import { describe, expect, it } from 'vitest'

import { THIRD_PLACE_TABLE, WINNER_COLUMN_ORDER } from './thirdPlaceTable'

/**
 * Exhaustive cross-check of THIRD_PLACE_TABLE against an *independent* copy of
 * FIFA's Annexe C allocation: the published Wikipedia template wikitext
 * (`__fixtures__/annexeC.wikitext`, "Combinations of matches in the round of
 * 32"). thirdPlaceTable.ts was reproduced from FIFA's PDF via a third-party
 * repo; this fixture comes from a different transcription of the same source,
 * so agreement on all 495 rows means a transcription error would have to occur
 * identically in both — vanishingly unlikely.
 *
 * Each wikitext row carries the combination twice over: once as the bold group
 * letters ('''X''') in the 12 group columns, and once as the eight 3X
 * assignment cells. The eight assignment cells are in FIFA's winner-column
 * order 1A 1B 1D 1E 1G 1I 1K 1L — exactly WINNER_COLUMN_ORDER — so an assignment
 * string maps directly onto a THIRD_PLACE_TABLE value. Requiring the bold set
 * to equal the assignment set makes the fixture self-validating against its own
 * transcription slips.
 */

interface CanonRow {
  rowNo: number
  combo: string // sorted 8-letter combination (from the bold group columns)
  assignment: string // third-place groups in WINNER_COLUMN_ORDER (the 3X cells)
  assignSet: string // sorted assignment letters, for the internal-consistency check
}

function parseAnnexeC(): CanonRow[] {
  const url = new URL('./__fixtures__/annexeC.wikitext', import.meta.url)
  const text = fs.readFileSync(url, 'utf8')
  // Each data row starts with `! scope="row" | N`.
  return text
    .split(/!\s*scope="row"\s*\|/)
    .slice(1)
    .map((block) => {
      const rowNo = Number(block.match(/^\s*(\d+)/)![1])
      const bold = [...block.matchAll(/'''([A-L])'''/g)].map(m => m[1])
      const assign = [...block.matchAll(/3([A-L])\b/g)].map(m => m[1])
      return {
        rowNo,
        combo: [...bold].sort().join(''),
        assignment: assign.join(''),
        assignSet: [...assign].sort().join(''),
      }
    })
}

describe('thirdPlaceTable matches FIFA Annexe C (canonical wikitext)', () => {
  const rows = parseAnnexeC()

  it('parses all 495 rows, numbered 1..495 without gaps or dupes', () => {
    expect(rows.length).toBe(495)
    expect(rows.map(r => r.rowNo)).toEqual(Array.from({ length: 495 }, (_, i) => i + 1))
  })

  it('every fixture row is internally consistent (bold set === assignment set)', () => {
    for (const r of rows) {
      expect(r.assignment.length, `row ${r.rowNo}`).toBe(WINNER_COLUMN_ORDER.length)
      expect(r.combo, `row ${r.rowNo} bold vs assignment`).toBe(r.assignSet)
    }
  })

  it('agrees with THIRD_PLACE_TABLE on all 495 combinations', () => {
    const mismatches: string[] = []
    for (const r of rows) {
      const ours = THIRD_PLACE_TABLE[r.combo]
      if (ours !== r.assignment)
        mismatches.push(`row ${r.rowNo} ${r.combo}: annexeC=${r.assignment} table=${ours}`)
    }
    expect(mismatches).toEqual([])
    // and no extra rows in our table beyond the canonical 495
    expect(new Set(rows.map(r => r.combo))).toEqual(new Set(Object.keys(THIRD_PLACE_TABLE)))
  })
})
