import { createFileRoute } from '@tanstack/react-router'
import { autopick } from '../lib/bracket/autopick'
import { deriveBracket } from '../lib/bracket/derive'
import { lookupBracket } from '../lib/atproto/readBracket'
import { ACTIVE_FIELD } from '../lib/tournament/field'

export const Route = createFileRoute('/b/$handle/og.png')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        // Dev-only escape hatch to preview the image without a published
        // record: /b/anything/og.png?demo
        const demo = import.meta.env.DEV && new URL(request.url).searchParams.has('demo')

        let handle = params.handle
        let winners = autopick({}, ACTIVE_FIELD, 'chalk')
        if (!demo) {
          const lookup = await lookupBracket(params.handle)
          if (lookup.status !== 'ok') {
            return new Response('No bracket here', { status: 404 })
          }
          handle = lookup.handle
          winners = lookup.record.winners
        }

        // Takumi (4 MB WASM) loads lazily so it never burdens SSR startup.
        const { renderBracketImage } = await import('../lib/og/render')
        const png = await renderBracketImage(handle, deriveBracket(winners, ACTIVE_FIELD))

        return new Response(png.slice().buffer as ArrayBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=300',
          },
        })
      },
    },
  },
})
