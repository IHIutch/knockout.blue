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

import { BRACKET_HALVES, TEAMS } from '../tournament/data'
import { flagDataUri } from '../tournament/flags'

const colors = {
  bg: '#09090b',
  card: '#18181b',
  border: '#27272a',
  text: '#e4e4e7',
  dim: '#cad5e2',
  accent: '#38bdf8',
  accentBg: 'rgba(14, 165, 233, 0.18)',
}

function TeamLine({ team, picked, isChampion }: { team: TeamCode | null, picked: boolean, isChampion: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: picked ? colors.accentBg : 'transparent',
        outline: isChampion ? `2px solid ${colors.accent}` : 'none',
      }}
    >
      {team
        ? (
            <img src={flagDataUri(team)} width={24} height={18} style={{ borderRadius: 2 }} />
          )
        : (
            <div style={{ display: 'flex', width: 16, height: 12, backgroundColor: colors.border, borderRadius: 2 }} />
          )}
      <span
        style={{
          fontSize: 18,
          fontWeight: picked ? 800 : 500,
          color: team ? (picked ? '#f0f9ff' : colors.text) : colors.dim,
        }}
      >
        {team ?? '···'}
      </span>
    </div>
  )
}

function MatchBox({ m, champion }: { m: ResolvedMatch, champion: TeamCode | null }) {
  // const hasChampion = champion === m.home || champion === m.away
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
      <TeamLine team={m.home} picked={m.picked !== null && m.picked === m.home} isChampion={champion === m.home} />
      <TeamLine team={m.away} picked={m.picked !== null && m.picked === m.away} isChampion={champion === m.away} />
    </div>
  )
}

function Column({ matches, derived, isEndcap }: { matches: readonly number[], isEndcap?: boolean, derived: ResolvedBracket }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isEndcap ? 'space-between' : 'space-around',
        flexGrow: 1,
        width: 92,
        gap: 4,
      }}
    >
      {matches.map(n => (
        <MatchBox key={n} m={derived.matches[n]} champion={derived.champion} />
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
        // width: 180,
        // gap: 14,
        position: 'relative',
        backgroundColor: 'blue',
        margin: '0 -12px',
      }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          position: 'absolute',
          top: '-19rem',
        }}
        >
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: colors.dim }}>
            CHAMPION
          </span>
          {champion
            ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 4 }}>
                  <img
                    src={flagDataUri(champion.code)}
                    // width={160}
                    // height={120}
                    style={{ borderRadius: 8, outline: `2px solid ${colors.accent}`, outlineOffset: '2px', aspectRatio: '4 / 3', width: 200 }}
                  />
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#f0f9ff', textAlign: 'center', marginTop: 2 }}>
                    {champion.name}
                  </div>
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
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            padding: 6,
            width: 130,
            top: '4rem',
            position: 'absolute',
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: colors.dim, padding: '0 6px 2px', textAlign: 'center' }}>
            FINAL · JUL 19
          </span>
          <TeamLine team={final.home} picked={final.picked !== null && final.picked === final.home} isChampion={champion?.code === final.home} />
          <TeamLine team={final.away} picked={final.picked !== null && final.picked === final.away} isChampion={champion?.code === final.away} />
        </div>
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
        padding: '12px 12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'start' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fafafa' }}>knockout</span>
          <span style={{ fontSize: 24, fontWeight: 800, color: colors.accent }}>.blue</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: colors.dim }}>
          World Cup 2026
        </span>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, gap: 24 }}>
        <Column matches={BRACKET_HALVES.left.r32} derived={derived} isEndcap />
        <Column matches={BRACKET_HALVES.left.r16} derived={derived} />
        <Column matches={BRACKET_HALVES.left.qf} derived={derived} />
        <Column matches={BRACKET_HALVES.left.sf} derived={derived} />
        <Center derived={derived} />
        <Column matches={BRACKET_HALVES.right.sf} derived={derived} />
        <Column matches={BRACKET_HALVES.right.qf} derived={derived} />
        <Column matches={BRACKET_HALVES.right.r16} derived={derived} />
        <Column matches={BRACKET_HALVES.right.r32} derived={derived} isEndcap />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, position: 'absolute', left: 0, right: 0, bottom: 18 }}>
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
