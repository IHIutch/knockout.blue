/**
 * The lexicon NSID for bracket records, under the bracket.blue domain
 * (authority `blue.bracket`). Year-scoped: a 2030 edition is a new
 * collection, not a migration. This constant is the only place the NSID
 * appears in source.
 */
export const BRACKET_NSID = 'blue.bracket.wc2026' as const

export type BracketNsid = typeof BRACKET_NSID
