import { pendingCoachToken } from '@/lib/services/coach.service'

/** Where to go after signing in or up: a coach invite that is waiting comes first, then the usual home. */
export function afterAuthPath(role: string | null | undefined): string {
  const coach = pendingCoachToken.get()
  if (coach) return `/coach/join/${coach}`
  return role === 'organization' ? '/admin' : '/app/dashboard'
}
