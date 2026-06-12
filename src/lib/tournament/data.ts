/**
 * Static tournament truth for the 2026 FIFA World Cup knockout stage.
 *
 * Matches are identified by their official FIFA match numbers (73–104).
 * The 16 Round-of-32 participant pairs are unknown until the group stage
 * ends on June 27, 2026 — until then R32 slots carry `team: null` plus a
 * human-readable source label (e.g. "1A", "3rd C/E/F/H/I"). Filling in the
 * real teams on June 27–28 is a one-commit change to R32_TEAMS below.
 */

export type GroupId
  = | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
    | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export type TeamCode
  // Group A
  = | 'MEX' | 'KOR' | 'RSA' | 'CZE'
  // Group B
    | 'CAN' | 'SUI' | 'QAT' | 'BIH'
  // Group C
    | 'BRA' | 'MAR' | 'SCO' | 'HAI'
  // Group D
    | 'USA' | 'TUR' | 'PAR' | 'AUS'
  // Group E
    | 'GER' | 'ECU' | 'CIV' | 'CUW'
  // Group F
    | 'NED' | 'JPN' | 'SWE' | 'TUN'
  // Group G
    | 'BEL' | 'IRN' | 'EGY' | 'NZL'
  // Group H
    | 'ESP' | 'URU' | 'KSA' | 'CPV'
  // Group I
    | 'FRA' | 'SEN' | 'NOR' | 'IRQ'
  // Group J
    | 'ARG' | 'AUT' | 'ALG' | 'JOR'
  // Group K
    | 'POR' | 'COL' | 'UZB' | 'COD'
  // Group L
    | 'ENG' | 'CRO' | 'PAN' | 'GHA'

export interface Team {
  code: TeamCode
  name: string
  /** ISO 3166-1 code for the Flagpack flag set (gb-eng/gb-sct for the home nations). */
  iso: string
  group: GroupId
  /** Approximate FIFA world ranking (Dec 2025). Used only for "chalk" autopick ordering. */
  rank: number
}

export const TEAMS: Record<TeamCode, Team> = {
  MEX: { code: 'MEX', name: 'Mexico', iso: 'mx', group: 'A', rank: 15 },
  KOR: { code: 'KOR', name: 'South Korea', iso: 'kr', group: 'A', rank: 22 },
  RSA: { code: 'RSA', name: 'South Africa', iso: 'za', group: 'A', rank: 63 },
  CZE: { code: 'CZE', name: 'Czechia', iso: 'cz', group: 'A', rank: 46 },

  CAN: { code: 'CAN', name: 'Canada', iso: 'ca', group: 'B', rank: 27 },
  SUI: { code: 'SUI', name: 'Switzerland', iso: 'ch', group: 'B', rank: 17 },
  QAT: { code: 'QAT', name: 'Qatar', iso: 'qa', group: 'B', rank: 58 },
  BIH: { code: 'BIH', name: 'Bosnia and Herzegovina', iso: 'ba', group: 'B', rank: 78 },

  BRA: { code: 'BRA', name: 'Brazil', iso: 'br', group: 'C', rank: 5 },
  MAR: { code: 'MAR', name: 'Morocco', iso: 'ma', group: 'C', rank: 11 },
  SCO: { code: 'SCO', name: 'Scotland', iso: 'gb-sct', group: 'C', rank: 37 },
  HAI: { code: 'HAI', name: 'Haiti', iso: 'ht', group: 'C', rank: 86 },

  USA: { code: 'USA', name: 'United States', iso: 'us', group: 'D', rank: 14 },
  TUR: { code: 'TUR', name: 'Türkiye', iso: 'tr', group: 'D', rank: 25 },
  PAR: { code: 'PAR', name: 'Paraguay', iso: 'py', group: 'D', rank: 40 },
  AUS: { code: 'AUS', name: 'Australia', iso: 'au', group: 'D', rank: 26 },

  GER: { code: 'GER', name: 'Germany', iso: 'de', group: 'E', rank: 9 },
  ECU: { code: 'ECU', name: 'Ecuador', iso: 'ec', group: 'E', rank: 23 },
  CIV: { code: 'CIV', name: 'Ivory Coast', iso: 'ci', group: 'E', rank: 44 },
  CUW: { code: 'CUW', name: 'Curaçao', iso: 'cw', group: 'E', rank: 82 },

  NED: { code: 'NED', name: 'Netherlands', iso: 'nl', group: 'F', rank: 7 },
  JPN: { code: 'JPN', name: 'Japan', iso: 'jp', group: 'F', rank: 19 },
  SWE: { code: 'SWE', name: 'Sweden', iso: 'se', group: 'F', rank: 45 },
  TUN: { code: 'TUN', name: 'Tunisia', iso: 'tn', group: 'F', rank: 41 },

  BEL: { code: 'BEL', name: 'Belgium', iso: 'be', group: 'G', rank: 8 },
  IRN: { code: 'IRN', name: 'Iran', iso: 'ir', group: 'G', rank: 21 },
  EGY: { code: 'EGY', name: 'Egypt', iso: 'eg', group: 'G', rank: 34 },
  NZL: { code: 'NZL', name: 'New Zealand', iso: 'nz', group: 'G', rank: 72 },

  ESP: { code: 'ESP', name: 'Spain', iso: 'es', group: 'H', rank: 1 },
  URU: { code: 'URU', name: 'Uruguay', iso: 'uy', group: 'H', rank: 16 },
  KSA: { code: 'KSA', name: 'Saudi Arabia', iso: 'sa', group: 'H', rank: 60 },
  CPV: { code: 'CPV', name: 'Cape Verde', iso: 'cv', group: 'H', rank: 70 },

  FRA: { code: 'FRA', name: 'France', iso: 'fr', group: 'I', rank: 3 },
  SEN: { code: 'SEN', name: 'Senegal', iso: 'sn', group: 'I', rank: 18 },
  NOR: { code: 'NOR', name: 'Norway', iso: 'no', group: 'I', rank: 29 },
  IRQ: { code: 'IRQ', name: 'Iraq', iso: 'iq', group: 'I', rank: 68 },

  ARG: { code: 'ARG', name: 'Argentina', iso: 'ar', group: 'J', rank: 2 },
  AUT: { code: 'AUT', name: 'Austria', iso: 'at', group: 'J', rank: 24 },
  ALG: { code: 'ALG', name: 'Algeria', iso: 'dz', group: 'J', rank: 36 },
  JOR: { code: 'JOR', name: 'Jordan', iso: 'jo', group: 'J', rank: 66 },

  POR: { code: 'POR', name: 'Portugal', iso: 'pt', group: 'K', rank: 6 },
  COL: { code: 'COL', name: 'Colombia', iso: 'co', group: 'K', rank: 13 },
  UZB: { code: 'UZB', name: 'Uzbekistan', iso: 'uz', group: 'K', rank: 55 },
  COD: { code: 'COD', name: 'DR Congo', iso: 'cd', group: 'K', rank: 64 },

  ENG: { code: 'ENG', name: 'England', iso: 'gb-eng', group: 'L', rank: 4 },
  CRO: { code: 'CRO', name: 'Croatia', iso: 'hr', group: 'L', rank: 10 },
  PAN: { code: 'PAN', name: 'Panama', iso: 'pa', group: 'L', rank: 30 },
  GHA: { code: 'GHA', name: 'Ghana', iso: 'gh', group: 'L', rank: 75 },
}

export const TEAM_CODES = Object.keys(TEAMS) as TeamCode[]

/** Official FIFA knockout match numbers. */
export const MATCH_NUMBERS = Array.from({ length: 32 }, (_, i) => 73 + i)

export const R32_MATCH_NUMBERS = MATCH_NUMBERS.filter(n => n <= 88)

export type RoundId = 'r32' | 'r16' | 'qf' | 'sf' | 'thirdPlace' | 'final'

export interface Round {
  id: RoundId
  label: string
  shortLabel: string
  dates: string
  matches: number[]
}

export const ROUNDS: Round[] = [
  { id: 'r32', label: 'Round of 32', shortLabel: 'R32', dates: 'Jun 28 – Jul 3', matches: range(73, 88) },
  { id: 'r16', label: 'Round of 16', shortLabel: 'R16', dates: 'Jul 4 – 7', matches: range(89, 96) },
  { id: 'qf', label: 'Quarterfinals', shortLabel: 'QF', dates: 'Jul 9 – 11', matches: range(97, 100) },
  { id: 'sf', label: 'Semifinals', shortLabel: 'SF', dates: 'Jul 14 – 15', matches: [101, 102] },
  { id: 'thirdPlace', label: 'Third Place', shortLabel: '3rd', dates: 'Jul 18', matches: [103] },
  { id: 'final', label: 'Final', shortLabel: 'Final', dates: 'Jul 19', matches: [104] },
]

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i)
}

/** Where a knockout slot's team comes from. */
export type SlotSource
  /** R32: a group-stage outcome. `label` is FIFA's slot notation (e.g. "1A", "2C", "3rd C/E/F/H/I"). */
  = | { kind: 'groupSlot', label: string }
    | { kind: 'matchWinner', match: number }
    | { kind: 'matchLoser', match: number }

export interface MatchInfo {
  match: number
  round: RoundId
  /** ISO date (local stadium date). */
  date: string
  venue: string
  home: SlotSource
  away: SlotSource
}

function m(match: number, round: RoundId, date: string, venue: string, home: SlotSource, away: SlotSource): MatchInfo {
  return { match, round, date, venue, home, away }
}

const group = (label: string): SlotSource => ({ kind: 'groupSlot', label })
const winner = (match: number): SlotSource => ({ kind: 'matchWinner', match })
const loser = (match: number): SlotSource => ({ kind: 'matchLoser', match })

/** All 32 knockout matches, keyed by FIFA match number. Sources only ever point backward. */
export const MATCHES: Record<number, MatchInfo> = Object.fromEntries(
  [
    // Round of 32
    m(73, 'r32', '2026-06-28', 'SoFi Stadium, Inglewood', group('2A'), group('2B')),
    m(74, 'r32', '2026-06-29', 'Gillette Stadium, Foxborough', group('1E'), group('3rd A/B/C/D/F')),
    m(75, 'r32', '2026-06-29', 'Estadio BBVA, Monterrey', group('1F'), group('2C')),
    m(76, 'r32', '2026-06-29', 'NRG Stadium, Houston', group('1C'), group('2F')),
    m(77, 'r32', '2026-06-30', 'MetLife Stadium, East Rutherford', group('1I'), group('3rd C/D/F/G/H')),
    m(78, 'r32', '2026-06-30', 'AT&T Stadium, Arlington', group('2E'), group('2I')),
    m(79, 'r32', '2026-06-30', 'Estadio Azteca, Mexico City', group('1A'), group('3rd C/E/F/H/I')),
    m(80, 'r32', '2026-07-01', 'Mercedes-Benz Stadium, Atlanta', group('1L'), group('3rd E/H/I/J/K')),
    m(81, 'r32', '2026-07-01', 'Levi\'s Stadium, Santa Clara', group('1D'), group('3rd B/E/F/I/J')),
    m(82, 'r32', '2026-07-01', 'Lumen Field, Seattle', group('1G'), group('3rd A/E/H/I/J')),
    m(83, 'r32', '2026-07-02', 'BMO Field, Toronto', group('2K'), group('2L')),
    m(84, 'r32', '2026-07-02', 'SoFi Stadium, Inglewood', group('1H'), group('2J')),
    m(85, 'r32', '2026-07-02', 'BC Place, Vancouver', group('1B'), group('3rd E/F/G/I/J')),
    m(86, 'r32', '2026-07-03', 'Hard Rock Stadium, Miami Gardens', group('1J'), group('2H')),
    m(87, 'r32', '2026-07-03', 'Arrowhead Stadium, Kansas City', group('1K'), group('3rd D/E/I/J/L')),
    m(88, 'r32', '2026-07-03', 'AT&T Stadium, Arlington', group('2D'), group('2G')),
    // Round of 16
    m(89, 'r16', '2026-07-04', 'Lincoln Financial Field, Philadelphia', winner(74), winner(77)),
    m(90, 'r16', '2026-07-04', 'NRG Stadium, Houston', winner(73), winner(75)),
    m(91, 'r16', '2026-07-05', 'MetLife Stadium, East Rutherford', winner(76), winner(78)),
    m(92, 'r16', '2026-07-05', 'Estadio Azteca, Mexico City', winner(79), winner(80)),
    m(93, 'r16', '2026-07-06', 'AT&T Stadium, Arlington', winner(83), winner(84)),
    m(94, 'r16', '2026-07-06', 'Lumen Field, Seattle', winner(81), winner(82)),
    m(95, 'r16', '2026-07-07', 'Mercedes-Benz Stadium, Atlanta', winner(86), winner(88)),
    m(96, 'r16', '2026-07-07', 'BC Place, Vancouver', winner(85), winner(87)),
    // Quarterfinals
    m(97, 'qf', '2026-07-09', 'Gillette Stadium, Foxborough', winner(89), winner(90)),
    m(98, 'qf', '2026-07-10', 'SoFi Stadium, Inglewood', winner(93), winner(94)),
    m(99, 'qf', '2026-07-11', 'Hard Rock Stadium, Miami Gardens', winner(91), winner(92)),
    m(100, 'qf', '2026-07-11', 'Arrowhead Stadium, Kansas City', winner(95), winner(96)),
    // Semifinals
    m(101, 'sf', '2026-07-14', 'AT&T Stadium, Arlington', winner(97), winner(98)),
    m(102, 'sf', '2026-07-15', 'Mercedes-Benz Stadium, Atlanta', winner(99), winner(100)),
    // Third place + Final
    m(103, 'thirdPlace', '2026-07-18', 'Hard Rock Stadium, Miami Gardens', loser(101), loser(102)),
    m(104, 'final', '2026-07-19', 'MetLife Stadium, East Rutherford', winner(101), winner(102)),
  ].map(info => [info.match, info]),
)

/** The two teams contesting an R32 match (73–88). */
export type R32Field = Record<number, { home: TeamCode | null, away: TeamCode | null }>

/**
 * The real Round-of-32 field. All null until the group stage ends on
 * June 27, 2026 — updating this object with the 16 actual matchups is the
 * launch trigger (one reviewed commit, nothing else changes).
 */
export const LIVE_R32_FIELD: R32Field = Object.fromEntries(
  R32_MATCH_NUMBERS.map(n => [n, { home: null, away: null }]),
)

/** True once the live R32 field has been filled in (post group stage). */
export const R32_FIELD_IS_SET = Object.values(LIVE_R32_FIELD).every(
  slot => slot.home !== null && slot.away !== null,
)
