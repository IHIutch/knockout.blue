import { createFileRoute } from '@tanstack/react-router'

/**
 * OAuth redirect target — handled entirely by the server. The dynamic
 * import keeps the server-only module (KV, cloudflare:workers) out of the
 * client module graph; route files are crawled by the client build.
 */
export const Route = createFileRoute('/oauth/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { handleOAuthCallback } = await import('../server/oauth-callback')
        return handleOAuthCallback(request)
      },
    },
  },
})
