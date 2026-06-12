import { createFileRoute, Link, redirect } from '@tanstack/react-router'

import type { GroupId, Team } from '../lib/tournament/data'

import { Flag } from '../components/Flag'
import { GroupStageNav } from '../components/GroupStageNav'
import { useBracketDraft } from '../hooks/useBracketDraft'
import { GROUP_IDS, teamsInGroup } from '../lib/tournament/data'

export const Route = createFileRoute('/groups/$groupId')({
  params: {
    parse: ({ groupId }) => ({ groupId: groupId.toUpperCase() as GroupId }),
    stringify: ({ groupId }) => ({ groupId }),
  },
  beforeLoad: ({ params }) => {
    if (!GROUP_IDS.includes(params.groupId))
      throw redirect({ to: '/groups/$groupId', params: { groupId: 'A' } })
  },
  component: GroupPage,
})

const ORDINALS = ['1st', '2nd', '3rd'] as const

// eslint-disable-next-line react-refresh/only-export-components
function TeamPickRow({
  team,
  position,
  pickedOut,
  onPick,
}: {
  team: Team
  /** Index in the group's ordered picks, or -1 if unpicked. */
  position: number
  /** True when three teams are picked and this isn't one of them. */
  pickedOut: boolean
  onPick: () => void
}) {
  const picked = position >= 0
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={picked}
      className={`flex h-14 w-full cursor-pointer items-center gap-3 rounded-xl border px-3 text-left transition-colors ${
        picked
          ? position < 2
            ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
            : 'border-amber-500/60 bg-amber-500/10 text-amber-100'
          : `border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-600 ${pickedOut ? 'opacity-50' : ''}`
      }`}
    >
      <span
        className={`grid h-7 w-9 shrink-0 place-items-center rounded-md text-xs font-bold ${
          picked
            ? position < 2
              ? 'bg-sky-500/25 text-sky-200'
              : 'bg-amber-500/20 text-amber-200'
            : 'border border-dashed border-zinc-700 text-zinc-600'
        }`}
      >
        {picked ? ORDINALS[position] : pickedOut ? 'Out' : '—'}
      </span>
      <Flag code={team.code} className="h-5 w-7 shrink-0 rounded ring-1 ring-black/10" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{team.name}</span>
        <span className="block text-xs text-zinc-500">
          FIFA rank
          {' '}
          {team.rank}
        </span>
      </span>
    </button>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
function GroupPage() {
  const { groupId } = Route.useParams()
  const draft = useBracketDraft()
  const picks = draft.groupPicks[groupId] ?? []
  const teams = teamsInGroup(groupId)

  const index = GROUP_IDS.indexOf(groupId)
  const prevGroup = index > 0 ? GROUP_IDS[index - 1] : null
  const nextGroup = index < GROUP_IDS.length - 1 ? GROUP_IDS[index + 1] : null
  const groupsDone = GROUP_IDS.filter(g => (draft.groupPicks[g]?.length ?? 0) === 3).length

  return (
    <main className="mx-auto max-w-xl px-4 pb-16">
      <div className="py-5">
        <GroupStageNav groupPicks={draft.groupPicks} thirds={draft.thirds} current={groupId} />
      </div>

      <section className="mb-5">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            Group
            {' '}
            {groupId}
          </h1>
          <span className="text-xs text-zinc-500 tabular-nums">
            {groupsDone}
            /12 groups ordered
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Tap teams in finishing order. The top two advance — your 3rd-place team joins the race
          for the eight wildcard spots.
        </p>
      </section>

      <div className="space-y-2">
        {teams.map(team => (
          <TeamPickRow
            key={team.code}
            team={team}
            position={picks.indexOf(team.code)}
            pickedOut={picks.length === 3 && !picks.includes(team.code)}
            onPick={() => draft.pickGroupTeam(groupId, team.code)}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        {prevGroup
          ? (
              <Link
                to="/groups/$groupId"
                params={{ groupId: prevGroup }}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
              >
                ← Group
                {' '}
                {prevGroup}
              </Link>
            )
          : <span />}
        {nextGroup
          ? (
              <Link
                to="/groups/$groupId"
                params={{ groupId: nextGroup }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  picks.length === 3
                    ? 'bg-sky-600 text-white hover:bg-sky-500'
                    : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100'
                }`}
              >
                Group
                {' '}
                {nextGroup}
                {' '}
                →
              </Link>
            )
          : (
              <Link
                to="/groups/thirds"
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
              >
                Pick your best thirds →
              </Link>
            )}
      </div>
    </main>
  )
}
