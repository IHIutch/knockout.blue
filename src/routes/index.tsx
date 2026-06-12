import { createFileRoute, Link } from '@tanstack/react-router'

import { BracketStats } from '../components/BracketStats'
import { useBracketDraft } from '../hooks/useBracketDraft'

export const Route = createFileRoute('/')({
  component: Landing,
})

// eslint-disable-next-line react-refresh/only-export-components
function Landing() {
  const draft = useBracketDraft()
  const started
    = draft.hydrated
      && (Object.keys(draft.groupPicks).length > 0 || Object.keys(draft.winners).length > 0)

  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">
        World Cup 2026
      </p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
        Call the whole tournament.
      </h1>
      <p className="mt-4 max-w-md text-pretty text-zinc-400">
        Order your groups, pick every knockout winner, and publish your bracket
        straight to your own Bluesky account.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/groups/$groupId"
          params={{ groupId: 'A' }}
          className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
        >
          {started ? 'Keep picking' : 'Start your bracket'}
        </Link>
        <Link
          to="/bracket"
          className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
        >
          View the bracket
        </Link>
      </div>

      <ol className="mt-12 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:gap-6">
        {['Order all 12 groups', 'Call every knockout match', 'Publish & share'].map((step, i) => (
          <li key={step} className="flex items-center justify-center gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-300">
              {i + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <BracketStats />
      </div>
    </main>
  )
}
