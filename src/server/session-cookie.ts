import { getCookies, setCookie } from '@tanstack/react-start/server'

import { env } from './env'

/**
 * HTTP-only session cookie holding only { did, handle } — OAuth tokens never
 * leave the server (they're in KV). HMAC-SHA256 signed: an unforgeable
 * cookie is what authorizes restoring the KV-stored OAuth session, so
 * integrity here is load-bearing.
 */

const COOKIE_NAME = 'kb_session'
const MAX_AGE = 60 * 60 * 24 * 60 // 60 days; PDS refresh-token lifetime is the real ceiling

export interface SessionUser {
  did: string
  handle: string
}

function getSecret(): string {
  const secret = env.SESSION_SECRET
  if (secret && secret.length >= 32)
    return secret
  if (import.meta.env.DEV)
    return 'dev-only-insecure-session-secret-0000'
  throw new Error('SESSION_SECRET (≥32 chars) is required in production')
}

const encoder = new TextEncoder()

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

function encodePayload(user: SessionUser): string {
  return btoa(JSON.stringify(user)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

function decodePayload(payload: string): SessionUser | null {
  try {
    const parsed = JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/'))) as unknown
    if (
      parsed !== null
      && typeof parsed === 'object'
      && typeof (parsed as SessionUser).did === 'string'
      && typeof (parsed as SessionUser).handle === 'string'
    ) {
      return parsed as SessionUser
    }
    return null
  }
  catch {
    return null
  }
}

async function cookieValue(user: SessionUser): Promise<string> {
  const payload = encodePayload(user)
  return `${payload}.${await hmac(payload)}`
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  setCookie(COOKIE_NAME, await cookieValue(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.env.DEV,
    path: '/',
    maxAge: MAX_AGE,
  })
}

/** Set-Cookie header value, for handlers that build their own Response. */
export async function sessionSetCookieHeader(user: SessionUser): Promise<string> {
  const secure = import.meta.env.DEV ? '' : ' Secure;'
  return `${COOKIE_NAME}=${await cookieValue(user)}; HttpOnly;${secure} SameSite=Lax; Path=/; Max-Age=${MAX_AGE}`
}

export function clearSessionCookie(): void {
  setCookie(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
}

/** Returns the cookie's user iff the signature verifies; null otherwise. */
export async function readSessionCookie(): Promise<SessionUser | null> {
  const raw = getCookies()[COOKIE_NAME]
  if (!raw)
    return null
  const [payload, signature] = raw.split('.')
  if (!payload || !signature)
    return null
  if ((await hmac(payload)) !== signature)
    return null
  return decodePayload(payload)
}
