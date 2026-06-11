import { useEffect, useState } from 'react'
import { getBracketStats, type BracketStats as Stats } from '../server/stats'

/**
 * "N brackets published" — network-wide count from the public UFOs
 * collection tracker (no indexer of our own). Renders nothing until
 * there's a real number worth bragging about.
 */
export function BracketStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    getBracketStats()
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  if (!stats || stats.brackets < 1) return null

  return (
    <p className="text-sm text-zinc-400">
      <span className="font-semibold text-sky-300 tabular-nums">
        {stats.brackets.toLocaleString('en-US')}
      </span>{' '}
      {stats.brackets === 1 ? 'bracket' : 'brackets'} published across the atmosphere
      {stats.accounts > 1 && (
        <span className="text-zinc-500"> · ~{stats.accounts.toLocaleString('en-US')} accounts</span>
      )}
    </p>
  )
}
