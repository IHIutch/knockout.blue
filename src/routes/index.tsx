import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Bracket } from '../components/Bracket'
import { BracketStats } from '../components/BracketStats'
import { EditorToolbar } from '../components/EditorToolbar'
import { PublishAction } from '../components/PublishAction'
import { PublishBar } from '../components/PublishBar'
import { useBracketDraft } from '../hooks/useBracketDraft'
import { PICKS_ARE_OPEN } from '../lib/tournament/field'

export const Route = createFileRoute('/')({
  validateSearch: z.object({ authError: z.string().optional() }),
  component: Editor,
})

function Editor() {
  const { authError } = Route.useSearch()
  const draft = useBracketDraft()
  const hasPicks = Object.keys(draft.winners).length > 0

  return (
    <main className="mx-auto max-w-7xl px-4 pb-28">
      <section className="flex flex-wrap items-end justify-between gap-3 py-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Call the knockout rounds</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-400">
            Pick every winner from the Round of 32 to the Final. Your bracket lives in your own AT
            Protocol account — sign in with Bluesky to publish and share it.
          </p>
          <div className="mt-2">
            <BracketStats />
          </div>
        </div>
        {PICKS_ARE_OPEN && (
          <EditorToolbar onAutopick={draft.runAutopick} onClear={draft.clear} hasPicks={hasPicks} />
        )}
      </section>

      {authError && (
        <div className="mb-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          Sign-in didn&apos;t go through: {authError}
        </div>
      )}

      {!PICKS_ARE_OPEN && (
        <div className="mb-4 rounded-xl border border-sky-900/60 bg-sky-950/40 px-4 py-3 text-sm text-sky-200">
          The group stage wraps up June 27 — picks open when the Round of 32 field is set on{' '}
          <span className="font-semibold">June 28</span>. Here&apos;s the bracket so far.
        </div>
      )}

      <Bracket derived={draft.derived} interactive={PICKS_ARE_OPEN} onPick={draft.pick} />

      <PublishBar
        derived={draft.derived}
        action={
          draft.hydrated ? (
            <PublishAction winners={draft.winners} picksMade={draft.derived.completeness.picked} />
          ) : null
        }
      />
    </main>
  )
}
