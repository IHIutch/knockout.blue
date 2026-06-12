import type { TeamCode } from './data'

import { TEAMS } from './data'
import { FLAG_SVG } from './flags.generated'

/**
 * Flagpack flag SVGs as base64 <img> data URIs, shared by the editor UI and
 * the takumi OG image. Data URIs (vs inline SVG) keep each flag an isolated
 * document, so the clip-path ids inside Flagpack SVGs can't collide across
 * the dozens of flags on a page. Built once per team and cached.
 */

const cache = new Map<TeamCode, string | undefined>()

function base64(input: string): string {
  // Flagpack SVGs are ASCII, but encode via bytes so any stray unicode is safe.
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

/** Data URI for an <img src>, or undefined if the flag is unknown. */
export function flagDataUri(code: TeamCode): string | undefined {
  if (cache.has(code))
    return cache.get(code)
  const svg = FLAG_SVG[TEAMS[code].iso]
  const uri = svg ? `data:image/svg+xml;base64,${base64(svg)}` : undefined
  cache.set(code, uri)
  return uri
}
