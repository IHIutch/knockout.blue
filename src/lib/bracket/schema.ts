import { z } from 'zod'

import type { TeamCode } from '../tournament/data'

import { MATCH_NUMBERS, TEAM_CODES } from '../tournament/data'
import { BRACKET_NSID } from './nsid'

/** FIFA match numbers as record keys ("73"–"104"). */
export const MATCH_KEYS = MATCH_NUMBERS.map(String) as [string, ...string[]]

const teamCodeSchema = z.enum(TEAM_CODES as [TeamCode, ...TeamCode[]])
const matchKeySchema = z.enum(MATCH_KEYS)

export type MatchKey = z.infer<typeof matchKeySchema>

/** Picked winner per FIFA match number. Partial by design — save anytime. */
export const winnersSchema = z.partialRecord(matchKeySchema, teamCodeSchema)

export type WinnersMap = z.infer<typeof winnersSchema>

/**
 * The `blue.knockout.wc2026` record as stored in a user's PDS (rkey "self").
 *
 * Records read from the network are untrusted — anyone can write arbitrary
 * JSON into this collection — so every read goes through `safeParse`.
 * Deeper consistency (a picked team that can't actually reach that match)
 * is not validated here; the derivation layer ignores impossible picks.
 */
export const bracketRecordSchema = z.object({
  $type: z.literal(BRACKET_NSID),
  schemaVersion: z.literal(1),
  winners: winnersSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type BracketRecord = z.infer<typeof bracketRecordSchema>

export function buildRecord(
  winners: WinnersMap,
  timestamps: { createdAt: string, updatedAt: string },
): BracketRecord {
  return bracketRecordSchema.parse({
    $type: BRACKET_NSID,
    schemaVersion: 1,
    winners,
    ...timestamps,
  })
}
