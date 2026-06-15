import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import type { BracketStats as Stats } from '../server/stats'

import { getBracketStats } from '../server/stats'

/**
 * "N brackets published" — network-wide count from the public UFOs
 * collection tracker (no indexer of our own). Renders nothing until
 * there's a real number worth bragging about. Links to the champion
 * tally so the count is a way in, not a dead end.
 */
export function BracketStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    getBracketStats()
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  if (!stats || stats.brackets < 1)
    return null

  return (
    <Link
      to="/champions"
      className="group text-sm text-zinc-400 transition-colors hover:text-zinc-200"
    >
      <span className="font-semibold text-sky-300 tabular-nums">
        {stats.brackets}
      </span>
      {' '}
      <span className="underline underline-offset-2">
        {stats.brackets === 1 ? 'bracket' : 'brackets'}
        {' '}
        published across the atmosphere
      </span>
      <span aria-hidden className="icon-[lucide--arrow-right] size-3 ml-1" />
    </Link>
  )
}
