import { useState } from 'react'

import { useAuth } from '../hooks/useAuth'

/**
 * One-click "Sign in with Bluesky": the button starts the OAuth flow
 * directly — bsky.social's own login page identifies the user, so no handle
 * is needed here. Used in the header and the publish bar.
 */
export function AuthButton({
  label = 'Sign in with Bluesky',
  errorDirection = 'down',
}: {
  label?: string
  /** 'up' renders the error above the button (for the bottom-fixed publish bar). */
  errorDirection?: 'down' | 'up'
}) {
  const { state, signIn, signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (state.status === 'loading') {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-zinc-800/60" aria-hidden />
  }

  if (state.status === 'signed-in') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="max-w-40 truncate text-zinc-300">
          @
          {state.handle}
        </span>
        <button
          type="button"
          onClick={() => void signOut()}
          title="Sign out"
          className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          <span className="icon-[lucide--log-out] size-3.5" aria-hidden />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    )
  }

  const signInWithBluesky = async () => {
    setBusy(true)
    setError(null)
    try {
      await signIn(null)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start sign-in.')
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        disabled={busy}
        onClick={() => void signInWithBluesky()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
      >
        {busy
          ? (
              'Redirecting…'
            )
          : (
              <>
                <span className="icon-[simple-icons--bluesky] size-4" aria-hidden />
                {label}
              </>
            )}
      </button>
      {error && (
        <p
          className={`absolute right-0 w-56 text-xs text-red-400 ${
            errorDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {error}
        </p>
      )}
    </div>
  )
}
