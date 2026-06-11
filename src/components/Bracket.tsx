import { useRef, useState } from 'react'
import type { ResolvedBracket } from '../lib/bracket/derive'
import { MATCHES, ROUNDS, type RoundId, type TeamCode } from '../lib/tournament/data'
import { MatchCard } from './MatchCard'

export function Bracket({
  derived,
  interactive = false,
  onPick,
}: {
  derived: ResolvedBracket
  interactive?: boolean
  onPick?: (match: number, team: TeamCode) => void
}) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef(new Map<RoundId, HTMLDivElement>())
  const [activeRound, setActiveRound] = useState<RoundId>('r32')

  const scrollToRound = (id: RoundId) => {
    const scroller = scrollerRef.current
    const column = columnRefs.current.get(id)
    if (!scroller || !column) return
    scroller.scrollTo({ left: column.offsetLeft - scroller.offsetLeft, behavior: 'smooth' })
    setActiveRound(id)
  }

  const onScroll = () => {
    const scroller = scrollerRef.current
    if (!scroller) return
    let nearest: RoundId = 'r32'
    let best = Infinity
    for (const [id, el] of columnRefs.current) {
      const distance = Math.abs(el.offsetLeft - scroller.offsetLeft - scroller.scrollLeft)
      if (distance < best) {
        best = distance
        nearest = id
      }
    }
    setActiveRound(nearest)
  }

  return (
    <div>
      <nav className="sticky top-0 z-10 -mx-4 mb-3 flex gap-1 overflow-x-auto bg-zinc-950/90 px-4 py-2 backdrop-blur">
        {ROUNDS.map((round) => (
          <button
            key={round.id}
            type="button"
            onClick={() => scrollToRound(round.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeRound === round.id
                ? 'bg-sky-500/20 text-sky-300'
                : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
            }`}
          >
            {round.label}
            <span className="ml-1.5 hidden text-[10px] text-zinc-500 sm:inline">{round.dates}</span>
          </button>
        ))}
      </nav>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4"
      >
        {ROUNDS.map((round) => (
          <div
            key={round.id}
            ref={(el) => {
              if (el) columnRefs.current.set(round.id, el)
              else columnRefs.current.delete(round.id)
            }}
            className="flex w-[min(85vw,17rem)] shrink-0 snap-start flex-col"
          >
            <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {round.label}
              <span className="ml-2 font-normal normal-case tracking-normal text-zinc-600">{round.dates}</span>
            </div>
            <div className="flex flex-1 flex-col justify-around gap-2">
              {round.matches.map((n) => (
                <MatchCard
                  key={n}
                  info={MATCHES[n]}
                  resolved={derived.matches[n]}
                  interactive={interactive}
                  onPick={onPick ? (team) => onPick(n, team) : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
