import { z } from 'zod'

import type { GroupId } from './tournament/data'
import type { GroupPicksMap } from './tournament/groupStage'

import { advancingThirdsSchema, groupPicksSchema, winnersSchema } from './bracket/schema'

const KEY = 'knockoutblue:draft:v2'
const LEGACY_KEY = 'knockoutblue:draft:v1'

const draftSchema = z.object({
  winners: winnersSchema,
  groupPicks: groupPicksSchema,
  thirds: advancingThirdsSchema,
})

export interface DraftData {
  winners: z.infer<typeof winnersSchema>
  groupPicks: GroupPicksMap
  thirds: GroupId[]
}

export const EMPTY_DRAFT: DraftData = { winners: {}, groupPicks: {}, thirds: [] }

/** Client-only. Returns an empty draft on the server, missing key, or bad data. */
export function loadDraft(): DraftData {
  if (typeof window === 'undefined')
    return EMPTY_DRAFT
  try {
    const raw = window.localStorage.getItem(KEY)
    if (raw) {
      const parsed = draftSchema.safeParse(JSON.parse(raw))
      if (parsed.success)
        return parsed.data
    }
    // v1 drafts held only the winners map.
    const legacy = window.localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const winners = winnersSchema.safeParse(JSON.parse(legacy))
      if (winners.success)
        return { ...EMPTY_DRAFT, winners: winners.data }
    }
    return EMPTY_DRAFT
  }
  catch {
    return EMPTY_DRAFT
  }
}

export function saveDraft(draft: DraftData): void {
  if (typeof window === 'undefined')
    return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(draft))
    window.localStorage.removeItem(LEGACY_KEY)
  }
  catch {
    // Storage full or blocked — the draft just won't persist.
  }
}
