import type { R32Field } from './data'

/**
 * A plausible Round-of-32 field for development before the real one is
 * known (June 27, 2026). Group winners/runners-up are seeded by ranking;
 * the eight third-place teams are assigned to slots respecting each slot's
 * five-group candidate constraint (74→3D, 77→3G, 79→3C, 80→3H, 81→3F,
 * 82→3E, 85→3I, 87→3J). Never ship this as live data.
 */
export const DEV_R32_FIELD: R32Field = {
  73: { home: 'KOR', away: 'CAN' }, // 2A v 2B
  74: { home: 'GER', away: 'PAR' }, // 1E v 3rd D
  75: { home: 'NED', away: 'MAR' }, // 1F v 2C
  76: { home: 'BRA', away: 'JPN' }, // 1C v 2F
  77: { home: 'FRA', away: 'EGY' }, // 1I v 3rd G
  78: { home: 'ECU', away: 'SEN' }, // 2E v 2I
  79: { home: 'MEX', away: 'SCO' }, // 1A v 3rd C
  80: { home: 'ENG', away: 'KSA' }, // 1L v 3rd H
  81: { home: 'USA', away: 'SWE' }, // 1D v 3rd F
  82: { home: 'BEL', away: 'CIV' }, // 1G v 3rd E
  83: { home: 'COL', away: 'CRO' }, // 2K v 2L
  84: { home: 'ESP', away: 'AUT' }, // 1H v 2J
  85: { home: 'SUI', away: 'NOR' }, // 1B v 3rd I
  86: { home: 'ARG', away: 'URU' }, // 1J v 2H
  87: { home: 'POR', away: 'ALG' }, // 1K v 3rd J
  88: { home: 'TUR', away: 'IRN' }, // 2D v 2G
}
