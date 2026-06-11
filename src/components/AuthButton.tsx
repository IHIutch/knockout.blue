import { LogOut } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

/** Sign-in affordance: inline handle form (atproto OAuth needs the user's handle to find their auth server). */
export function AuthButton({
  label = 'Sign in',
  panelDirection = 'down',
}: {
  label?: string
  /** 'up' for triggers in the bottom-fixed publish bar. */
  panelDirection?: 'down' | 'up'
}) {
  const { state, signIn, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (state.status === 'loading') {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-zinc-800/60" aria-hidden />
  }

  if (state.status === 'signed-in') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="max-w-40 truncate text-zinc-300">@{state.handle}</span>
        <button
          type="button"
          onClick={() => void signOut()}
          title="Sign out"
          className="rounded-lg border border-zinc-800 p-1.5 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          <LogOut className="size-3.5" aria-hidden />
          <span className="sr-only">Sign out</span>
        </button>
      </div>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await signIn(identifier)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start sign-in.')
      setBusy(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-sky-600 px-3.5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
      >
        {label}
      </button>
      {open && (
        <form
          onSubmit={submit}
          className={`absolute right-0 z-30 w-72 rounded-xl border border-zinc-800 bg-zinc-900 p-3 shadow-xl ${
            panelDirection === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <label htmlFor="auth-handle" className="mb-1.5 block text-xs font-medium text-zinc-400">
            Your Bluesky handle
          </label>
          <input
            id="auth-handle"
            autoFocus
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you.bsky.social"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-sky-500 focus:outline-none"
          />
          {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || identifier.trim().length === 0}
            className="mt-2 w-full rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500 disabled:opacity-50"
          >
            {busy ? 'Redirecting…' : 'Continue'}
          </button>
        </form>
      )}
    </div>
  )
}
