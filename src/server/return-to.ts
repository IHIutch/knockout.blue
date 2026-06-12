/**
 * Where to land after the OAuth round-trip. The page that starts sign-in
 * records its own path in a short-lived cookie (the authorization redirect
 * leaves our origin, so this is the only state that survives), and the
 * callback sends the user straight back there.
 */

const COOKIE_NAME = 'kb_return_to'

/** Same lifetime as the OAuth state entries — a stale value is useless. */
const MAX_AGE = 600

export const RETURN_TO_COOKIE = COOKIE_NAME
export const RETURN_TO_MAX_AGE = MAX_AGE

/** Clears the cookie; safe to send unconditionally alongside other Set-Cookies. */
export const CLEAR_RETURN_TO_HEADER = `${COOKIE_NAME}=; Path=/; Max-Age=0`

/**
 * Accept only same-origin absolute paths ("/groups/C"), rejecting anything
 * that could redirect off-site ("https://…", "//evil.example") or is
 * implausibly long. Returns null when unusable.
 */
export function sanitizeReturnTo(path: unknown): string | null {
  if (typeof path !== 'string' || path.length === 0 || path.length > 512)
    return null
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\'))
    return null
  return path
}

/** Read and sanitize the cookie straight off a raw Request. */
export function readReturnTo(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader)
    return null
  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE_NAME) {
      try {
        return sanitizeReturnTo(decodeURIComponent(rest.join('=')))
      }
      catch {
        return null
      }
    }
  }
  return null
}
