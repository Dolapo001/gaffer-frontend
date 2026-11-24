import { pendingCoachToken } from '@/lib/services/coach.service'
import { pendingStaffCode } from '@/lib/services/member.service'

/**
 * Only invite pages may be named in a `?next=` on the sign-in pages: they are the pages that are opened from a shared
 * link in an ordinary browser and must be finished there. Anything else (other sites, other pages) is ignored.
 */
export function inviteNextPath(next: string | null | undefined): string | null {
  if (!next || !/^\/(coach\/join|join)\/[A-Za-z0-9_-]+$/.test(next)) return null
  return next
}

/** The sign-in or sign-up address that brings a person back to this invite page afterwards. */
export const authUrlForInvite = (page: '/auth/login' | '/auth/signup', invitePath: string) =>
  `${page}?next=${encodeURIComponent(invitePath)}`

/**
 * True while someone is in the middle of an invite: the sign-in address names an invite page, or one is waiting in
 * storage. Browsers (iOS Safari especially) keep their own storage apart from the installed app, so the address is
 * the dependable signal and storage is the backup.
 */
export function inviteInProgress(search?: string): boolean {
  if (typeof window === 'undefined') return false
  const next = new URLSearchParams(search ?? window.location.search).get('next')
  return !!inviteNextPath(next) || !!pendingCoachToken.get() || !!pendingStaffCode.get()
}

/** Where to go after signing in or up: an invite that is waiting comes first, then the usual home. */
export function afterAuthPath(role: string | null | undefined, next?: string | null): string {
  const named = inviteNextPath(next ?? (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null))
  if (named) return named
  const staff = pendingStaffCode.get()
  if (staff) return `/join/${staff}`
  const coach = pendingCoachToken.get()
  if (coach) return `/coach/join/${coach}`
  return role === 'organization' ? '/admin' : '/app/dashboard'
}
