import { pendingCoachToken } from '@/lib/services/coach.service'
import { pendingStaffCode } from '@/lib/services/member.service'

/** Where to go after signing in or up: an invite that is waiting comes first, then the usual home. */
export function afterAuthPath(role: string | null | undefined): string {
  const staff = pendingStaffCode.get()
  if (staff) return `/join/${staff}`
  const coach = pendingCoachToken.get()
  if (coach) return `/coach/join/${coach}`
  return role === 'organization' ? '/admin' : '/app/dashboard'
}
