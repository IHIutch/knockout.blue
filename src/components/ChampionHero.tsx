import type { Team } from '../lib/tournament/data'

import { teamConfettiColors } from '../lib/tournament/teamColors'
import { Confetti } from './Confetti'
import { Flag } from './Flag'

/**
 * The predicted champion as the page centerpiece, celebrated with confetti in
 *  the team's own flag colors.
 */
export function ChampionHero({ champion }: { champion: Team }) {
  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-sky-900/60 bg-linear-to-b from-sky-950/70 to-zinc-950 px-6 py-10 text-center">
      <Confetti durationMs={0} colors={teamConfettiColors(champion.code)} />
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300/80">
        Predicted Champion
      </p>
      <div className="mt-4 flex flex-col items-center gap-3">
        <Flag
          code={champion.code}
          className="h-16 w-24 rounded-lg shadow-lg ring-1 ring-black/20"
        />
        <h2 className="text-3xl font-bold tracking-tight text-sky-50 sm:text-4xl">
          {champion.name}
        </h2>
      </div>
    </section>
  )
}
