/**
 * Route helpers
 *
 * The backend returns invite links as RELATIVE paths:
 *   { invite: { inviteLink: "/player/onboarding?token=abc123" } }
 *
 * buildInviteLink() prepends window.location.origin to produce a full,
 * shareable URL. Never hardcode a domain here — always derive it at runtime.
 */

export function buildInviteLink(relativeLink: string): string {
  if (typeof window === 'undefined') return relativeLink
  const normalized = relativeLink.startsWith('/') ? relativeLink : `/${relativeLink}`
  return `${window.location.origin}${normalized}`
}
