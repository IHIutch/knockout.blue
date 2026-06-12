import type { ResolvedMatch } from '../lib/bracket/derive'
import type { MatchInfo, SlotSource, TeamCode } from '../lib/tournament/data'

import { TEAMS } from '../lib/tournament/data'
import { Flag } from './Flag'

function sourceLabel(source: SlotSource): string {
  switch (source.kind) {
    case 'groupSlot':
      return source.label
    case 'matchWinner':
      return `Winner M${source.match}`
    case 'matchLoser':
      return `Loser M${source.match}`
  }
}

function formatMatchDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

function TeamRow({
  team,
  fallbackLabel,
  picked,
  interactive,
  onPick,
}: {
  team: TeamCode | null
  fallbackLabel: string
  picked: boolean
  interactive: boolean
  onPick?: () => void
}) {
  if (!team) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-lg border border-dashed border-zinc-800 px-2.5 text-sm text-zinc-500">
        <span className="truncate">{fallbackLabel}</span>
      </div>
    )
  }

  const info = TEAMS[team]
  const clickable = interactive && onPick

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onPick}
      aria-pressed={picked}
      className={`flex h-10 w-full items-center gap-2 rounded-lg border px-2.5 text-left text-sm transition-colors ${
        picked
          ? 'border-sky-500/70 bg-sky-500/15 text-sky-100'
          : 'border-zinc-800 bg-zinc-900 text-zinc-200'
      } ${clickable ? 'cursor-pointer hover:border-zinc-600' : ''}`}
    >
      <Flag code={info.code} className="h-3.5 w-5 shrink-0 rounded-[3px] ring-1 ring-black/10" />
      <span className="font-semibold tabular-nums">{info.code}</span>
      <span className="min-w-0 flex-1 truncate text-zinc-400">{info.name}</span>
      <span
        aria-hidden
        className={`grid size-4 shrink-0 place-items-center rounded-full border ${
          picked ? 'border-sky-400' : 'border-zinc-600'
        }`}
      >
        {picked && <span className="size-2 rounded-full bg-sky-400" />}
      </span>
    </button>
  )
}

export function MatchCard({
  info,
  resolved,
  interactive = false,
  onPick,
}: {
  info: MatchInfo
  resolved: ResolvedMatch
  interactive?: boolean
  onPick?: (team: TeamCode) => void
}) {
  const stale = resolved.storedPick !== null && resolved.picked === null
  const venueShort = info.venue.split(',')[0]

  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2">
      <div className="mb-1.5 flex items-baseline justify-between gap-2 px-1 text-[11px] text-zinc-500">
        <span className="font-medium">
          M
          {info.match}
          {stale && (
            <span title="A pick here was undone by an earlier change" className="ml-1.5 align-middle text-amber-400">
              ●
            </span>
          )}
        </span>
        <span className="truncate">
          {formatMatchDate(info.date)}
          {' '}
          ·
          {venueShort}
        </span>
      </div>
      <div className="space-y-1">
        <TeamRow
          team={resolved.home}
          fallbackLabel={sourceLabel(info.home)}
          picked={resolved.picked !== null && resolved.picked === resolved.home}
          interactive={interactive}
          onPick={resolved.home ? () => onPick?.(resolved.home as TeamCode) : undefined}
        />
        <TeamRow
          team={resolved.away}
          fallbackLabel={sourceLabel(info.away)}
          picked={resolved.picked !== null && resolved.picked === resolved.away}
          interactive={interactive}
          onPick={resolved.away ? () => onPick?.(resolved.away as TeamCode) : undefined}
        />
      </div>
    </div>
  )
}
