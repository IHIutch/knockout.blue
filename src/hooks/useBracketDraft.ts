import { useEffect, useMemo, useReducer } from 'react'

import type { AutopickMode } from '../lib/bracket/autopick'
import type { MatchKey, WinnersMap } from '../lib/bracket/schema'
import type { TeamCode } from '../lib/tournament/data'

import { autopick } from '../lib/bracket/autopick'
import { deriveBracket } from '../lib/bracket/derive'
import { loadDraft, saveDraft } from '../lib/draft'
import { ACTIVE_FIELD } from '../lib/tournament/field'

interface DraftState {
  winners: WinnersMap
  /** False until the localStorage draft has been loaded on the client. */
  hydrated: boolean
}

type DraftAction
  = | { type: 'hydrate', winners: WinnersMap }
    | { type: 'pick', match: number, team: TeamCode }
    | { type: 'autopick', mode: AutopickMode }
    | { type: 'clear' }

function reducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'hydrate':
      return { winners: action.winners, hydrated: true }
    case 'pick': {
      const key = String(action.match) as MatchKey
      const winners = { ...state.winners }
      // Tapping the already-picked team unpicks it.
      if (winners[key] === action.team) {
        delete winners[key]
      }
      else {
        winners[key] = action.team
      }
      return { ...state, winners }
    }
    case 'autopick':
      return { ...state, winners: autopick(state.winners, ACTIVE_FIELD, action.mode) }
    case 'clear':
      return { ...state, winners: {} }
  }
}

export function useBracketDraft() {
  const [state, dispatch] = useReducer(reducer, { winners: {}, hydrated: false })

  // The index route is SSR'd; loading the draft post-mount avoids a
  // server/client hydration mismatch.
  useEffect(() => {
    dispatch({ type: 'hydrate', winners: loadDraft() })
  }, [])

  useEffect(() => {
    if (!state.hydrated)
      return
    const t = setTimeout(saveDraft, 300, state.winners)
    return () => clearTimeout(t)
  }, [state])

  const derived = useMemo(() => deriveBracket(state.winners, ACTIVE_FIELD), [state.winners])

  return {
    winners: state.winners,
    hydrated: state.hydrated,
    derived,
    pick: (match: number, team: TeamCode) => dispatch({ type: 'pick', match, team }),
    runAutopick: (mode: AutopickMode) => dispatch({ type: 'autopick', mode }),
    clear: () => dispatch({ type: 'clear' }),
    hydrateFrom: (winners: WinnersMap) => dispatch({ type: 'hydrate', winners }),
  }
}

export type BracketDraftApi = ReturnType<typeof useBracketDraft>
