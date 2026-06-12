import { Link } from '@tanstack/react-router'

import type { GroupId } from '../lib/tournament/data'
import type { GroupPicksMap } from '../lib/tournament/groupStage'

import { GROUP_IDS } from '../lib/tournament/data'

function pillClass(active: boolean, done: boolean, wide = false): string {
  const base = `grid h-8 ${wide ? 'px-3' : 'w-8'} shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors`
  if (active)
    return `${base} bg-sky-600 text-white`
  if (done)
    return `${base} bg-sky-500/15 text-sky-300 hover:bg-sky-500/25`
  return `${base} bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300`
}

/**
 * Step navigation for the group-stage flow: one pill per group plus the
 * best-thirds step. The current step lives in the URL — every pill is a
 * plain link.
 */
export function GroupStageNav({
  groupPicks,
  thirds,
  current,
}: {
  groupPicks: GroupPicksMap
  thirds: GroupId[]
  current: GroupId | 'thirds'
}) {
  return (
    <nav aria-label="Group stage steps" className="flex flex-wrap items-center gap-1.5">
      {GROUP_IDS.map(group => (
        <Link
          key={group}
          to="/groups/$groupId"
          params={{ groupId: group }}
          className={pillClass(current === group, (groupPicks[group]?.length ?? 0) === 3)}
        >
          {group}
        </Link>
      ))}
      <Link
        to="/groups/thirds"
        className={pillClass(
          current === 'thirds',
          thirds.filter(g => groupPicks[g]?.[2] !== undefined).length === 8,
          true,
        )}
      >
        Best 3rds
      </Link>
    </nav>
  )
}
