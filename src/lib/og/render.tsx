/**
 * Bolão-style social image: the full knockout bracket converging from the
 * outer edges to the predicted champion in the center, 1200×630. Rendered
 * with takumi (WASM on workerd). Server-only — import dynamically.
 *
 * Takumi notes: default display is inline (every box sets flex explicitly);
 * flags are Flagpack SVGs embedded as base64 data URIs (shared with the UI,
 * no network); the WASM build's embedded Manrope (Latin) covers our text.
 */
import { render } from 'takumi-js'

import type { ResolvedBracket, ResolvedMatch } from '../bracket/derive'
import type { TeamCode } from '../tournament/data'

import { TEAMS } from '../tournament/data'
import { flagDataUri } from '../tournament/flags'

/** Bracket halves: matches feeding SF 101 read left→center, SF 102 center←right. */
const LEFT = { r32: [74, 77, 73, 75, 83, 84, 81, 82], r16: [89, 90, 93, 94], qf: [97, 98], sf: 101 }
const RIGHT = { r32: [76, 78, 79, 80, 86, 88, 85, 87], r16: [91, 92, 95, 96], qf: [99, 100], sf: 102 }

const colors = {
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  text: '#e4e4e7',
  dim: '#cad5e2',
  accent: '#38bdf8',
  accentBg: 'rgba(14, 165, 233, 0.18)',
}

function TeamLine({ team, picked }: { team: TeamCode | null, picked: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: picked ? colors.accentBg : 'transparent',
      }}
    >
      {team
        ? (
            <img src={flagDataUri(team)} width={16} height={12} style={{ borderRadius: 2 }} />
          )
        : (
            <div style={{ display: 'flex', width: 16, height: 12, backgroundColor: colors.border, borderRadius: 2 }} />
          )}
      <span
        style={{
          fontSize: 13,
          fontWeight: picked ? 800 : 500,
          color: team ? (picked ? '#f0f9ff' : colors.text) : colors.dim,
        }}
      >
        {team ?? '···'}
      </span>
    </div>
  )
}

function MatchBox({ m }: { m: ResolvedMatch }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
        padding: 2,
      }}
    >
      <TeamLine team={m.home} picked={m.picked !== null && m.picked === m.home} />
      <TeamLine team={m.away} picked={m.picked !== null && m.picked === m.away} />
    </div>
  )
}

function Column({ matches, derived }: { matches: number[], derived: ResolvedBracket }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        flexGrow: 1,
        width: 92,
        gap: 4,
      }}
    >
      {matches.map(n => (
        <MatchBox key={n} m={derived.matches[n]} />
      ))}
    </div>
  )
}

function Center({ derived }: { derived: ResolvedBracket }) {
  const champion = derived.champion ? TEAMS[derived.champion] : null
  const final = derived.matches[104]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 210,
        gap: 14,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: colors.dim }}>
        CHAMPION
      </span>
      {champion
        ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <img
                src={flagDataUri(champion.code)}
                width={80}
                height={60}
                style={{ borderRadius: 8, border: `2px solid ${colors.accent}` }}
              />
              <span style={{ fontSize: 26, fontWeight: 800, color: '#f0f9ff', textAlign: 'center' }}>
                {champion.name}
              </span>
            </div>
          )
        : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  width: 80,
                  height: 60,
                  borderRadius: 8,
                  border: `2px dashed ${colors.border}`,
                }}
              />
              <span style={{ fontSize: 20, fontWeight: 700, color: colors.dim }}>TBD</span>
            </div>
          )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: 8,
          padding: 6,
          width: 130,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: colors.dim, padding: '0 6px 2px' }}>
          FINAL · JUL 19
        </span>
        <TeamLine team={final.home} picked={final.picked !== null && final.picked === final.home} />
        <TeamLine team={final.away} picked={final.picked !== null && final.picked === final.away} />
      </div>
    </div>
  )
}

export function BracketImage({ handle, derived }: { handle: string, derived: ResolvedBracket }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 1200,
        height: 630,
        backgroundColor: colors.bg,
        padding: '18px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'start' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fafafa' }}>knockout</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: colors.accent }}>.blue</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: colors.dim }}>
          World Cup 2026
        </span>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, gap: 8 }}>
        <Column matches={LEFT.r32} derived={derived} />
        <Column matches={LEFT.r16} derived={derived} />
        <Column matches={LEFT.qf} derived={derived} />
        <Column matches={[LEFT.sf]} derived={derived} />
        <Center derived={derived} />
        <Column matches={[RIGHT.sf]} derived={derived} />
        <Column matches={RIGHT.qf} derived={derived} />
        <Column matches={RIGHT.r16} derived={derived} />
        <Column matches={RIGHT.r32} derived={derived} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>
          @
          {handle}
        </span>
      </div>
    </div>
  )
}

const imageCache = new Map<string, ArrayBuffer>()

// PNG at the canonical 1200×630 (1x): universal social-scraper support
// (incl. Facebook/LinkedIn) and crisp text. Platforms display OG cards at
// this size, so a higher DPR adds bytes without visible benefit.
const IMAGE_FORMAT = 'png' as const

/** Content-Type matching IMAGE_FORMAT, for the og image route to serve. */
export const IMAGE_CONTENT_TYPE = `image/${IMAGE_FORMAT}`

// eslint-disable-next-line react-refresh/only-export-components
export async function renderBracketImage(
  handle: string,
  derived: ResolvedBracket,
): Promise<Uint8Array> {
  return render(<BracketImage handle={handle} derived={derived} />, {
    width: 1200,
    height: 630,
    format: IMAGE_FORMAT,
    resourcesOptions: { cache: imageCache },
  })
}
