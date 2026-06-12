/**
 * The lexicon NSID for bracket records, under the knockout.blue domain
 * (authority `blue.knockout`). Year-scoped: a 2030 edition is a new
 * collection, not a migration. This constant is the only place the NSID
 * appears in source.
 */
export const BRACKET_NSID = 'blue.knockout.wc2026' as const

export type BracketNsid = typeof BRACKET_NSID
