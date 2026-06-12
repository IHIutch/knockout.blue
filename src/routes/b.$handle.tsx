import { createFileRoute, Link } from '@tanstack/react-router'

import { Bracket } from '../components/Bracket'
import { Flag } from '../components/Flag'
import { getBracketForActor } from '../lib/atproto/readBracket'
import { deriveBracket } from '../lib/bracket/derive'
import { TEAMS } from '../lib/tournament/data'
import { ACTIVE_FIELD } from '../lib/tournament/field'

export const Route = createFileRoute('/b/$handle')({
  loader: ({ params }) => getBracketForActor({ data: params.handle }),
  head: ({ loaderData }) => {
    if (!loaderData || loaderData.status !== 'ok') {
      return { meta: [{ title: 'Bracket not found — knockout.blue' }] }
    }
    const derived = deriveBracket(loaderData.record.winners, ACTIVE_FIELD)
    const champion = derived.champion ? TEAMS[derived.champion] : null
    const title = `@${loaderData.handle}'s World Cup 2026 bracket`
    const description = champion
      ? `Champion pick: ${champion.name} · ${derived.completeness.picked}/${derived.completeness.total} picks`
      : `${derived.completeness.picked}/${derived.completeness.total} picks made`
    // Absolute URL required by OG crawlers; production origin is what matters to them.
    const ogImage = `https://knockout.blue/b/${loaderData.handle}/og.png`
    return {
      meta: [
        { title: `${title} — knockout.blue` },
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: ogImage },
        { property: 'og:image:type', content: 'image/png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: ogImage },
      ],
    }
  },
  component: SharePage,
})

// eslint-disable-next-line react-refresh/only-export-components
function SharePage() {
  const lookup = Route.useLoaderData()

  if (lookup.status !== 'ok') {
    const message = {
      'not-found': `Couldn't find an account for "${'identifier' in lookup ? lookup.identifier : ''}".`,
      'no-bracket': `@${'handle' in lookup ? lookup.handle : ''} hasn't published a bracket yet.`,
      'invalid-record': `@${'handle' in lookup ? lookup.handle : ''} has a bracket record we couldn't read.`,
    }[lookup.status]

    return (
      <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
        <p className="text-4xl">🥅</p>
        <h1 className="text-xl font-bold">Nothing in the net</h1>
        <p className="text-sm text-zinc-400">{message}</p>
        <Link
          to="/"
          className="mt-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
        >
          Make your own bracket
        </Link>
      </main>
    )
  }

  const derived = deriveBracket(lookup.record.winners, ACTIVE_FIELD)
  const champion = derived.champion ? TEAMS[derived.champion] : null

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16">
      <section className="flex flex-wrap items-center justify-between gap-4 py-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            @
            {lookup.handle}
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            World Cup 2026 picks ·
            {' '}
            {derived.completeness.picked}
            /
            {derived.completeness.total}
            {' '}
            made
          </p>
        </div>
        {champion && (
          <div className="flex items-center gap-3 rounded-xl border border-sky-900/60 bg-sky-950/40 px-4 py-2.5">
            <Flag code={champion.code} className="h-8 w-11 shrink-0 rounded ring-1 ring-black/10" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-sky-300/80">Champion pick</div>
              <div className="font-semibold text-sky-100">{champion.name}</div>
            </div>
          </div>
        )}
      </section>

      <Bracket derived={derived} interactive={false} />

      <div className="mt-8 flex justify-center">
        <Link
          to="/"
          className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
        >
          Make your own bracket
        </Link>
      </div>
    </main>
  )
}
