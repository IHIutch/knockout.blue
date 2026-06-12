import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'

import { Bracket } from '../components/Bracket'
import { EditorToolbar } from '../components/EditorToolbar'
import { PublishAction } from '../components/PublishAction'
import { PublishBar } from '../components/PublishBar'
import { useBracketDraft } from '../hooks/useBracketDraft'
import { GROUP_IDS } from '../lib/tournament/data'

export const Route = createFileRoute('/bracket')({
  validateSearch: z.object({ authError: z.string().optional() }),
  component: Editor,
})

// eslint-disable-next-line react-refresh/only-export-components
function Editor() {
  const { authError } = Route.useSearch()
  const draft = useBracketDraft()
  const hasPicks = Object.keys(draft.winners).length > 0

  const groupsDone = GROUP_IDS.filter(g => (draft.groupPicks[g]?.length ?? 0) === 3).length
  const thirdsDone = draft.thirds.filter(g => draft.groupPicks[g]?.[2] !== undefined).length
  const fieldComplete = groupsDone === 12 && thirdsDone === 8
  const nextGroup = GROUP_IDS.find(g => (draft.groupPicks[g]?.length ?? 0) < 3)

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28">
      <section className="flex flex-wrap items-end justify-between gap-3 py-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Call the knockout rounds</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Pick every winner from the Round of 32 to the Final. Your bracket lives in your own AT
            Protocol account — sign in with Bluesky to publish and share it.
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            The Round of 32 field is built from
            {' '}
            <Link
              to="/groups/$groupId"
              params={{ groupId: 'A' }}
              className="text-sky-400 underline-offset-2 hover:underline"
            >
              your group predictions
            </Link>
            {' '}
            — it&apos;s your call from the first whistle to the Final.
          </p>
        </div>
        <EditorToolbar onAutopick={draft.runAutopick} onClear={draft.clear} hasPicks={hasPicks} />
      </section>

      {authError && (
        <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          Sign-in didn&apos;t go through:
          {' '}
          {authError}
        </div>
      )}

      {draft.hydrated && !fieldComplete && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-900/60 bg-sky-950/40 px-4 py-3 text-sm text-sky-200">
          <span>
            Your bracket starts with group predictions —
            {' '}
            <span className="font-semibold tabular-nums">
              {groupsDone}
              /12
            </span>
            {' '}
            groups ordered,
            {' '}
            <span className="font-semibold tabular-nums">
              {thirdsDone}
              /8
            </span>
            {' '}
            best thirds picked.
          </span>
          {nextGroup
            ? (
                <Link
                  to="/groups/$groupId"
                  params={{ groupId: nextGroup }}
                  className="rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-sky-500"
                >
                  Finish your groups
                </Link>
              )
            : (
                <Link
                  to="/groups/thirds"
                  className="rounded-lg bg-sky-600 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-sky-500"
                >
                  Pick your best thirds
                </Link>
              )}
        </div>
      )}

      <Bracket derived={draft.derived} interactive onPick={draft.pick} />

      <PublishBar
        derived={draft.derived}
        action={
          draft.hydrated
            ? (
                <PublishAction
                  data={{
                    winners: draft.winners,
                    groupPicks: draft.groupPicks,
                    thirds: draft.thirds,
                  }}
                  picksMade={draft.derived.completeness.picked}
                />
              )
            : null
        }
      />
    </main>
  )
}
