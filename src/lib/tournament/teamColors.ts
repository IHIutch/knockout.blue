import type { TeamCode } from './data'

/**
 * Confetti colors per team — its flag colors, hand-picked. Near-black is left
 * out (it vanishes on the dark page), so black-and-X flags keep just the X.
 * Order doesn't matter; each becomes a confetti piece with a darker back face.
 */
const TEAM_COLORS: Record<TeamCode, string[]> = {
  // Group A
  MEX: ['#006847', '#ce1126', '#ffffff'],
  KOR: ['#cd2e3a', '#0047a0', '#ffffff'],
  RSA: ['#007a4d', '#ffb915', '#de3831', '#002395'],
  CZE: ['#11457e', '#d7141a', '#ffffff'],
  // Group B
  CAN: ['#d52b1e', '#ffffff'],
  SUI: ['#d52b1e', '#ffffff'],
  QAT: ['#8d1b3d', '#ffffff'],
  BIH: ['#002395', '#ffec00', '#ffffff'],
  // Group C
  BRA: ['#009c3b', '#ffdf00', '#002776'],
  MAR: ['#c1272d', '#006233'],
  SCO: ['#005eb8', '#ffffff'],
  HAI: ['#00209f', '#d21034'],
  // Group D
  USA: ['#0a3161', '#b31942', '#ffffff'],
  TUR: ['#e30a17', '#ffffff'],
  PAR: ['#d52b1e', '#0038a8', '#ffffff'],
  AUS: ['#012169', '#e4002b', '#ffffff'],
  // Group E
  GER: ['#dd0000', '#ffce00'],
  ECU: ['#ffd100', '#0072c6', '#ed1c24'],
  CIV: ['#f77f00', '#009e60', '#ffffff'],
  CUW: ['#002b7f', '#f9e814', '#ffffff'],
  // Group F
  NED: ['#ae1c28', '#21468b', '#ff7f00'],
  JPN: ['#bc002d', '#ffffff'],
  SWE: ['#006aa7', '#fecc00'],
  TUN: ['#e70013', '#ffffff'],
  // Group G
  BEL: ['#fae042', '#ed2939'],
  IRN: ['#239f40', '#da0000', '#ffffff'],
  EGY: ['#ce1126', '#c09300', '#ffffff'],
  NZL: ['#00247d', '#cc142b', '#ffffff'],
  // Group H
  ESP: ['#c60b1e', '#ffc400', '#0039a6', '#ffffff'],
  URU: ['#0038a8', '#fcd116', '#ffffff'],
  KSA: ['#006c35', '#ffffff'],
  CPV: ['#003893', '#cf2027', '#f7d116'],
  // Group I
  FRA: ['#0055a4', '#ef4135', '#ffffff'],
  SEN: ['#00853f', '#fdef42', '#e31b23'],
  NOR: ['#ba0c2f', '#00205b', '#ffffff'],
  IRQ: ['#ce1126', '#007a3d', '#ffffff'],
  // Group J
  ARG: ['#75aadb', '#f6b40e', '#ffffff'],
  AUT: ['#ed2939', '#ffffff'],
  ALG: ['#006233', '#d21034', '#ffffff'],
  JOR: ['#ce1126', '#007a3d', '#ffffff'],
  // Group K
  POR: ['#006600', '#d52b1e', '#ffd700'],
  COL: ['#fcd116', '#003893', '#ce1126'],
  UZB: ['#0099b5', '#1eb53a', '#ce1126'],
  COD: ['#007fff', '#f7d618', '#ce1021'],
  // Group L
  ENG: ['#ce1124', '#ffffff'],
  CRO: ['#ff0000', '#171796', '#ffffff'],
  PAN: ['#d21034', '#005293', '#ffffff'],
  GHA: ['#ce1126', '#fcd116', '#006b3f'],
}

/** A darker variant of a #rrggbb color, for the back face of confetti paper. */
function shade(hex: string, factor: number): string {
  const channel = (i: number) =>
    Math.max(0, Math.min(255, Math.round(Number.parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) * factor)))
      .toString(16)
      .padStart(2, '0')
  return `#${channel(0)}${channel(1)}${channel(2)}`
}

/** A team's flag colors as [front, back] confetti pairs. */
export function teamConfettiColors(code: TeamCode): [string, string][] {
  return TEAM_COLORS[code].map(c => [c, shade(c, 0.6)])
}
