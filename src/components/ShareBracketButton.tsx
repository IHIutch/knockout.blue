/** Canonical public origin — share the live URL, never a localhost/preview one. */
const ORIGIN = 'https://knockout.blue'

/**
 * "Share on Bluesky" — a Bluesky compose Action Intent link
 * (https://docs.bsky.app/docs/advanced-guides/intent-links). Opens the
 * composer pre-filled with the bracket link; shown when you're viewing your
 * own published bracket.
 */
export function ShareBracketButton({ handle, championName }: { handle: string, championName?: string }) {
  const url = `${ORIGIN}/b/${handle}`
  const text = championName
    ? `My World Cup 2026 bracket. I've got ${championName} winning it all! \n\n ${url}`
    : `My World Cup 2026 bracket \n\n ${url}`
  const intent = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`

  return (
    <a
      href={intent}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
    >
      Share on Bluesky
      <span className="size-3.5 icon-[simple-icons--bluesky]" aria-hidden />
    </a>
  )
}
