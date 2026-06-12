import { z } from 'zod'

import type { GroupId, TeamCode } from '../tournament/data'

import { GROUP_IDS, MATCH_NUMBERS, TEAM_CODES } from '../tournament/data'
import { BRACKET_NSID } from './nsid'

/** FIFA match numbers as record keys ("73"–"104"). */
export const MATCH_KEYS = MATCH_NUMBERS.map(String) as [string, ...string[]]

const teamCodeSchema = z.enum(TEAM_CODES as [TeamCode, ...TeamCode[]])
const matchKeySchema = z.enum(MATCH_KEYS)
const groupIdSchema = z.enum(GROUP_IDS as [GroupId, ...GroupId[]])

export type MatchKey = z.infer<typeof matchKeySchema>

/** Picked winner per FIFA match number. Partial by design — save anytime. */
export const winnersSchema = z.partialRecord(matchKeySchema, teamCodeSchema)

export type WinnersMap = z.infer<typeof winnersSchema>

/**
 * Predicted group order, index 0 = winner. Partial by design; deeper
 * consistency (team actually in that group, no duplicates) is handled by
 * sanitization in the field derivation, mirroring how impossible winners
 * picks are ignored rather than rejected.
 */
export const groupPicksSchema = z.partialRecord(groupIdSchema, z.array(teamCodeSchema).max(3))

/** Groups whose predicted third-place team advances (eight when complete). */
export const advancingThirdsSchema = z.array(groupIdSchema).max(12)

/**
 * The `blue.knockout.wc2026` record as stored in a user's PDS (rkey "self").
 *
 * Records read from the network are untrusted — anyone can write arbitrary
 * JSON into this collection — so every read goes through `safeParse`.
 * Deeper consistency (a picked team that can't actually reach that match)
 * is not validated here; the derivation layer ignores impossible picks.
 *
 * schemaVersion 1 records predate group-stage predictions and carry only
 * winners; they still parse, and derive against an empty predicted field.
 */
export const bracketRecordSchema = z.object({
  $type: z.literal(BRACKET_NSID),
  schemaVersion: z.union([z.literal(1), z.literal(2)]),
  winners: winnersSchema,
  groupPicks: groupPicksSchema.optional(),
  thirds: advancingThirdsSchema.optional(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export type BracketRecord = z.infer<typeof bracketRecordSchema>

export interface BracketData {
  winners: WinnersMap
  groupPicks: z.infer<typeof groupPicksSchema>
  thirds: GroupId[]
}

export function buildRecord(
  data: BracketData,
  timestamps: { createdAt: string, updatedAt: string },
): BracketRecord {
  return bracketRecordSchema.parse({
    $type: BRACKET_NSID,
    schemaVersion: 2,
    winners: data.winners,
    groupPicks: data.groupPicks,
    thirds: data.thirds,
    ...timestamps,
  })
}
