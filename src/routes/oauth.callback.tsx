import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/oauth/callback')({ component: OAuthCallback })

/**
 * OAuth redirect target. Success parameters arrive in the URL fragment
 * (never sent to the server), error responses may arrive as query params —
 * so all the work happens in a client effect; SSR renders the shell.
 */
function OAuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const params = hashParams.size > 0 ? hashParams : new URLSearchParams(window.location.search)

    // Scrub tokens from the URL/history before doing anything else.
    window.history.replaceState(null, '', window.location.pathname)

    import('../lib/atproto/oauth')
      .then(({ finishLogin }) => finishLogin(params))
      .then(() => navigate({ to: '/', replace: true }))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Sign-in failed.')
      })
  }, [navigate])

  return (
    <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      {error ? (
        <>
          <h1 className="text-xl font-bold">Sign-in didn&apos;t go through</h1>
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            type="button"
            onClick={() => navigate({ to: '/', replace: true })}
            className="mt-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
          >
            Back to your bracket
          </button>
        </>
      ) : (
        <>
          <p className="size-8 animate-spin rounded-full border-2 border-zinc-700 border-t-sky-400" aria-hidden />
          <h1 className="text-lg font-semibold">Signing you in…</h1>
        </>
      )}
    </main>
  )
}
