/**
 * Invite links come from the server with the server's idea of the site address (FRONTEND_URL).
 * Rebuild them on the address the person is using right now, so a missing or wrong setting
 * never hands out a localhost link.
 */
export function onThisSite(url: string): string {
  if (typeof window === 'undefined' || !url) return url
  try {
    const u = new URL(url, window.location.origin)
    return `${window.location.origin}${u.pathname}${u.search}`
  } catch {
    return url
  }
}
