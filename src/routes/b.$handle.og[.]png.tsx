import { createFileRoute } from '@tanstack/react-router'

import { lookupBracket } from '../lib/atproto/readBracket'
import { autopick } from '../lib/bracket/autopick'
import { deriveBracket } from '../lib/bracket/derive'
import { ACTIVE_FIELD } from '../lib/tournament/field'
import { DEV_R32_FIELD } from '../lib/tournament/fixture.dev'

export const Route = createFileRoute('/b/$handle/og.png')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        // Escape hatch to preview the image without a published record:
        // /b/anything/og.png?demo renders chalk picks for any handle. Never
        // referenced by the share page's meta tags unless ?demo is set there
        // too, so real link cards can't pick it up.
        const demo = new URL(request.url).searchParams.has('demo')

        // Demo uses the dev fixture field: the live field is empty until the
        // group stage ends, so chalk picks over it would render an empty
        // bracket — the opposite of what a filled-out preview is for.
        const field = demo ? DEV_R32_FIELD : ACTIVE_FIELD

        let handle = params.handle
        let winners = autopick({}, field, 'chalk')
        if (!demo) {
          const lookup = await lookupBracket(params.handle)
          if (lookup.status !== 'ok') {
            return new Response('No bracket here', { status: 404 })
          }
          handle = lookup.handle
          winners = lookup.record.winners
        }

        // Takumi (4 MB WASM) loads lazily so it never burdens SSR startup.
        const { renderBracketImage, IMAGE_CONTENT_TYPE } = await import('../lib/og/render')
        const image = await renderBracketImage(handle, deriveBracket(winners, field))

        return new Response(image.slice().buffer as ArrayBuffer, {
          headers: {
            'Content-Type': IMAGE_CONTENT_TYPE,
            'Cache-Control': 'public, max-age=300',
          },
        })
      },
    },
  },
})
