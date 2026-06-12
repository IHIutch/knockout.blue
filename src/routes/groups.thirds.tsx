import { createFileRoute, Link } from '@tanstack/react-router'

import { Flag } from '../components/Flag'
import { GroupStageNav } from '../components/GroupStageNav'
import { useBracketDraft } from '../hooks/useBracketDraft'
import { GROUP_IDS, TEAMS } from '../lib/tournament/data'

export const Route = createFileRoute('/groups/thirds')({
  component: ThirdsPage,
})

// eslint-disable-next-line react-refresh/only-export-components
function ThirdsPage() {
  const draft = useBracketDraft()
  const selectedCount = draft.thirds.filter(g => draft.groupPicks[g]?.[2] !== undefined).length
  const full = selectedCount === 8

  return (
    <main className="mx-auto max-w-xl px-4 pb-16">
      <div className="py-5">
        <GroupStageNav groupPicks={draft.groupPicks} thirds={draft.thirds} current="thirds" />
      </div>

      <section className="mb-5">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">Best third-place teams</h1>
          <span
            className={`text-xs tabular-nums ${full ? 'font-semibold text-sky-300' : 'text-zinc-500'}`}
          >
            {selectedCount}
            /8 advancing
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-400">
          Eight of the twelve third-place teams reach the Round of 32. Pick yours — we slot them
          into the bracket the way FIFA&apos;s schedule allows.
        </p>
      </section>

      <div className="grid gap-2 sm:grid-cols-2">
        {GROUP_IDS.map((group) => {
          const code = draft.groupPicks[group]?.[2]
          if (!code) {
            return (
              <Link
                key={group}
                to="/groups/$groupId"
                params={{ groupId: group }}
                className="flex h-14 items-center gap-3 rounded-xl border border-dashed border-zinc-800 px-3 text-sm text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
              >
                <span className="grid h-7 w-9 shrink-0 place-items-center rounded-md border border-dashed border-zinc-700 text-xs font-bold">
                  {group}
                </span>
                Order Group
                {' '}
                {group}
                {' '}
                first →
              </Link>
            )
          }

          const team = TEAMS[code]
          const selected = draft.thirds.includes(group)
          return (
            <button
              key={group}
              type="button"
              onClick={() => draft.toggleThird(group)}
              aria-pressed={selected}
              className={`flex h-14 cursor-pointer items-center gap-3 rounded-xl border px-3 text-left transition-colors ${
                selected
                  ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
                  : 'border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-600'
              }`}
            >
              <span
                className={`grid h-7 w-9 shrink-0 place-items-center rounded-md text-xs font-bold ${
                  selected ? 'bg-sky-500/25 text-sky-200' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                3
                {group}
              </span>
              <Flag code={team.code} className="h-5 w-7 shrink-0 rounded ring-1 ring-black/10" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{team.name}</span>
                <span className="block text-xs text-zinc-500">
                  Group
                  {' '}
                  {group}
                  {' '}
                  · rank
                  {' '}
                  {team.rank}
                </span>
              </span>
              <span
                aria-hidden
                className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                  selected ? 'border-sky-400' : 'border-zinc-600'
                }`}
              >
                {selected && <span className="size-2.5 rounded-full bg-sky-400" />}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          to="/groups/$groupId"
          params={{ groupId: 'L' }}
          className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          ← Group L
        </Link>
        <Link
          to="/bracket"
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            full
              ? 'bg-sky-600 text-white hover:bg-sky-500'
              : 'border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100'
          }`}
        >
          {full ? 'Fill in your bracket →' : 'Skip to the bracket →'}
        </Link>
      </div>
    </main>
  )
}
