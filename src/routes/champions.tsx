import { createFileRoute } from '@tanstack/react-router'

import { ChampionChart } from '../components/ChampionChart'

export const Route = createFileRoute('/champions')({
  component: ChampionsPage,
})

// eslint-disable-next-line react-refresh/only-export-components
function ChampionsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <section className="py-6">
        <h1 className="text-xl font-bold tracking-tight">Who wins it all?</h1>
        <p className="mt-1 max-w-prose text-sm text-zinc-400">
          Every published bracket&apos;s predicted champion — the winner of the Final —
          tallied across the atmosphere.
        </p>
      </section>

      <ChampionChart />
    </main>
  )
}
