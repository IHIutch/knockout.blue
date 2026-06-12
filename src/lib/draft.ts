import type { WinnersMap } from './bracket/schema'

import { winnersSchema } from './bracket/schema'

const KEY = 'bracketblue:draft:v1'

/** Client-only. Returns an empty draft on the server, missing key, or bad data. */
export function loadDraft(): WinnersMap {
  if (typeof window === 'undefined')
    return {}
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw)
      return {}
    const parsed = winnersSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : {}
  }
  catch {
    return {}
  }
}

export function saveDraft(winners: WinnersMap): void {
  if (typeof window === 'undefined')
    return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(winners))
  }
  catch {
    // Storage full or blocked — the draft just won't persist.
  }
}
