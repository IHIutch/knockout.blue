import { createFileRoute } from '@tanstack/react-router'

import { lookupBracket } from '../lib/atproto/readBracket'
import { deriveBracket } from '../lib/bracket/derive'
import { deriveFieldFromGroupPicks } from '../lib/tournament/groupStage'

export const Route = createFileRoute('/b/$handle/og.png')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const lookup = await lookupBracket(params.handle)
        if (lookup.status !== 'ok') {
          return new Response('No bracket here', { status: 404 })
        }

        // The record brings its own field via the publisher's group predictions.
        const field = deriveFieldFromGroupPicks(
          lookup.record.groupPicks ?? {},
          lookup.record.thirds ?? [],
        )

        // Takumi (4 MB WASM) loads lazily so it never burdens SSR startup.
        const { renderBracketImage, IMAGE_CONTENT_TYPE } = await import('../lib/og/render')
        const image = await renderBracketImage(
          lookup.handle,
          deriveBracket(lookup.record.winners, field),
        )

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
