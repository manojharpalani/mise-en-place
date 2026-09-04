/**
 * The app's own base URL — driven entirely by where it's actually running
 * (NEXT_PUBLIC_APP_URL), never a hardcoded domain. Defaults to localhost
 * for local dev. Set NEXT_PUBLIC_APP_URL in .env once a real domain exists.
 */
const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const APP_URL = rawAppUrl.replace(/\/$/, '')

/** APP_URL without the protocol, for display — e.g. "localhost:3000". */
export const APP_HOST = APP_URL.replace(/^https?:\/\//, '')

/** Build a full absolute URL for `path` against the app's current base URL. */
export function absoluteUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${APP_URL}${p}`
}

/** Build a host+path string for on-screen display (no protocol) — e.g. "localhost:3000/s/my-store". */
export function displayUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${APP_HOST}${p}`
}
