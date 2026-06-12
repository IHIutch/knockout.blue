import type { ReactNode } from 'react'

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
} from 'react'

import { getSessionUser, logout, startLogin } from '../server/auth'

export type AuthState
  = | { status: 'loading' }
    | { status: 'anonymous' }
    | { status: 'signed-in', did: string, handle: string }

interface AuthApi {
  state: AuthState
  /**
   * Start the OAuth flow and navigate away. Null identifier = one-click
   * "Sign in with Bluesky" (authorize against bsky.social, no handle
   * needed); otherwise a handle, DID, or PDS URL.
   */
  signIn: (identifier: string | null) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    getSessionUser()
      .then((user) => {
        if (cancelled)
          return
        setState(user ? { status: 'signed-in', ...user } : { status: 'anonymous' })
      })
      .catch(() => {
        if (!cancelled)
          setState({ status: 'anonymous' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (identifier: string | null) => {
    // Capture where sign-in started so the OAuth callback can return here.
    const returnTo = window.location.pathname + window.location.search
    const url = await startLogin({ data: { identifier, returnTo } })
    window.location.assign(url)
    // Give the browser a beat to navigate so callers don't flash error UI.
    await new Promise(resolve => setTimeout(resolve, 200))
  }, [])

  const signOut = useCallback(async () => {
    await logout()
    setState({ status: 'anonymous' })
  }, [])

  return <AuthContext value={{ state, signIn, signOut }}>{children}</AuthContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthApi {
  const api = use(AuthContext)
  if (!api)
    throw new Error('useAuth must be used inside <AuthProvider>')
  return api
}
