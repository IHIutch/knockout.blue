import { useEffect, useMemo, useReducer } from 'react'

import type { AutopickMode } from '../lib/bracket/autopick'
import type { MatchKey } from '../lib/bracket/schema'
import type { DraftData } from '../lib/draft'
import type { GroupId, TeamCode } from '../lib/tournament/data'

import { autopick, autopickGroups } from '../lib/bracket/autopick'
import { deriveBracket } from '../lib/bracket/derive'
import { EMPTY_DRAFT, loadDraft, saveDraft } from '../lib/draft'
import { deriveFieldFromGroupPicks } from '../lib/tournament/groupStage'

interface DraftState extends DraftData {
  /** False until the localStorage draft has been loaded on the client. */
  hydrated: boolean
}

type DraftAction
  = | { type: 'hydrate', draft: DraftData }
    | { type: 'pick', match: number, team: TeamCode }
    | { type: 'pickGroupTeam', group: GroupId, team: TeamCode }
    | { type: 'toggleThird', group: GroupId }
    | { type: 'autopick', mode: AutopickMode }
    | { type: 'clear' }

function reducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'hydrate':
      return { ...action.draft, hydrated: true }
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
    case 'pickGroupTeam': {
      const current = state.groupPicks[action.group] ?? []
      // Tapping a picked team removes it (later picks shift up a place);
      // tapping an unpicked team appends it as the next finishing position.
      const next = current.includes(action.team)
        ? current.filter(code => code !== action.team)
        : current.length < 3
          ? [...current, action.team]
          : current
      return { ...state, groupPicks: { ...state.groupPicks, [action.group]: next } }
    }
    case 'toggleThird': {
      const next = state.thirds.includes(action.group)
        ? state.thirds.filter(g => g !== action.group)
        : state.thirds.length < 8
          ? [...state.thirds, action.group]
          : state.thirds
      return { ...state, thirds: next }
    }
    case 'autopick': {
      const groups = autopickGroups(state.groupPicks, state.thirds, action.mode)
      const field = deriveFieldFromGroupPicks(groups.groupPicks, groups.thirds)
      return {
        ...state,
        ...groups,
        winners: autopick(state.winners, field, action.mode),
      }
    }
    case 'clear':
      return { ...state, winners: {} }
  }
}

export function useBracketDraft() {
  const [state, dispatch] = useReducer(reducer, { ...EMPTY_DRAFT, hydrated: false })

  // Routes are SSR'd; loading the draft post-mount avoids a server/client
  // hydration mismatch.
  useEffect(() => {
    dispatch({ type: 'hydrate', draft: loadDraft() })
  }, [])

  useEffect(() => {
    if (!state.hydrated)
      return
    const { winners, groupPicks, thirds } = state
    const t = setTimeout(saveDraft, 300, { winners, groupPicks, thirds })
    return () => clearTimeout(t)
  }, [state])

  const field = useMemo(
    () => deriveFieldFromGroupPicks(state.groupPicks, state.thirds),
    [state.groupPicks, state.thirds],
  )
  const derived = useMemo(() => deriveBracket(state.winners, field), [state.winners, field])

  return {
    winners: state.winners,
    groupPicks: state.groupPicks,
    thirds: state.thirds,
    hydrated: state.hydrated,
    field,
    derived,
    pick: (match: number, team: TeamCode) => dispatch({ type: 'pick', match, team }),
    pickGroupTeam: (group: GroupId, team: TeamCode) =>
      dispatch({ type: 'pickGroupTeam', group, team }),
    toggleThird: (group: GroupId) => dispatch({ type: 'toggleThird', group }),
    runAutopick: (mode: AutopickMode) => dispatch({ type: 'autopick', mode }),
    clear: () => dispatch({ type: 'clear' }),
    hydrateFrom: (draft: DraftData) => dispatch({ type: 'hydrate', draft }),
  }
}

export type BracketDraftApi = ReturnType<typeof useBracketDraft>
