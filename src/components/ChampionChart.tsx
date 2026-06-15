import { useEffect, useState } from 'react'

import type { ChampionPicks } from '../server/champions'

import { TEAMS } from '../lib/tournament/data'
import { getChampionPicks } from '../server/champions'
import { Flag } from './Flag'

/**
 * Horizontal bar chart of predicted champions across all published brackets.
 * Bar width is each team's share of the brackets that named a champion, so a
 * team picked by half the field fills half the track.
 */
export function ChampionChart() {
  const [data, setData] = useState<ChampionPicks | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    getChampionPicks()
      .then((d) => {
        setData(d)
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  if (status === 'loading')
    return <p className="text-sm text-zinc-500">Tallying published brackets…</p>

  if (status === 'error' || !data || data.total === 0)
    return <p className="text-sm text-zinc-500">No published brackets to tally yet.</p>

  return (
    <div>
      <ol className="space-y-3">
        {data.picks.map((pick) => {
          const team = TEAMS[pick.code]
          const ratio = pick.count / data.total
          const pct = Math.round(ratio * 100)
          return (
            <li key={pick.code}>
              <span className="sr-only">
                {`${team.name}: ${pick.count} ${pick.count === 1 ? 'pick' : 'picks'}, ${pct}%`}
              </span>
              <div aria-hidden className="flex items-center gap-3">
                <div className="flex w-32 shrink-0 items-center gap-2">
                  <Flag
                    code={pick.code}
                    className="h-3.5 w-5 shrink-0 rounded-[3px] ring-1 ring-black/10"
                  />
                  <span className="truncate text-sm text-zinc-300">{team.name}</span>
                </div>
                <div

                  className="relative h-8 flex-1 overflow-hidden rounded-md bg-zinc-900"
                >
                  <div
                    className="h-full rounded-md bg-sky-500/80 transition-[width]"
                    style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-sm tabular-nums text-zinc-400">
                  {pick.count}
                  <span className="text-zinc-600">
                    {' · '}
                    {pct}
                    %
                  </span>
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="mt-3 border-t border-t-zinc-800 pt-3">
        <p className="text-xs text-zinc-500 tabular-nums">
          Across all
          {' '}
          {data.total}
          {' '}
          published
          {' '}
          {data.total === 1 ? 'bracket' : 'brackets'}
          .
        </p>
      </div>
    </div>
  )
}
