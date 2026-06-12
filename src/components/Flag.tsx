import { flagDataUri } from '../lib/tournament/flags'
import { TEAMS, type TeamCode } from '../lib/tournament/data'

/**
 * A team's Flagpack flag, rendered as an isolated <img> data URI. Size it via
 * className. Decorative: the team code/name is always rendered alongside.
 */
export function Flag({ code, className }: { code: TeamCode; className?: string }) {
  const src = flagDataUri(code)
  if (!src) {
    return <span className={className} aria-hidden />
  }
  return <img src={src} alt={`${TEAMS[code].name} flag`} className={className} />
}
