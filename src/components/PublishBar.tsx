import type { ReactNode } from 'react'
import type { ResolvedBracket } from '../lib/bracket/derive'
import { TEAMS } from '../lib/tournament/data'

export function PublishBar({
  derived,
  action,
}: {
  derived: ResolvedBracket
  /** The publish button / sign-in prompt (wired separately from layout). */
  action?: ReactNode
}) {
  const { picked, total } = derived.completeness
  const champion = derived.champion ? TEAMS[derived.champion] : null

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
            <span className="font-medium text-zinc-300 tabular-nums">
              {picked}/{total} picks made
            </span>
            {champion && (
              <span className="truncate text-zinc-400">
                Your champion: {champion.flag} <span className="font-semibold text-zinc-200">{champion.name}</span>
              </span>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-sky-500 transition-[width] duration-300"
              style={{ width: `${(picked / total) * 100}%` }}
            />
          </div>
        </div>
        {action}
      </div>
    </div>
  )
}
