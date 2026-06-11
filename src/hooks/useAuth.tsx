import type { OAuthUserAgent } from '@atcute/oauth-browser-client'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { resolveActor } from '../lib/atproto/identity'

export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'signed-in'; did: string; handle: string; agent: OAuthUserAgent }

interface AuthApi {
  state: AuthState
  /** Resolves the identifier and redirects to the account's auth server. */
  signIn: (identifier: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthApi | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    // oauth.ts is client-only; the dynamic import keeps it out of SSR.
    import('../lib/atproto/oauth')
      .then(async ({ restoreSession }) => {
        const agent = await restoreSession()
        if (cancelled) return
        if (!agent) {
          setState({ status: 'anonymous' })
          return
        }
        const actor = await resolveActor(agent.sub)
        if (cancelled) return
        setState({
          status: 'signed-in',
          did: agent.sub,
          handle: actor?.handle ?? agent.sub,
          agent,
        })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'anonymous' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (identifier: string) => {
    const { startLogin } = await import('../lib/atproto/oauth')
    await startLogin(identifier)
  }, [])

  const signOut = useCallback(async () => {
    const { logout } = await import('../lib/atproto/oauth')
    await logout(state.status === 'signed-in' ? state.agent : null)
    setState({ status: 'anonymous' })
  }, [state])

  return <AuthContext.Provider value={{ state, signIn, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthApi {
  const api = useContext(AuthContext)
  if (!api) throw new Error('useAuth must be used inside <AuthProvider>')
  return api
}
