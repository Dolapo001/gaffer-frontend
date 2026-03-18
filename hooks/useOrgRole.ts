'use client'

import { useQuery } from '@tanstack/react-query'
import { listMembers } from '@/lib/services/org.service'
import { useAuthStore, hasMinRole, type OrgRole } from '@/store/authStore'

/**
 * Returns the authenticated user's role in the given org.
 * Returns `undefined` while loading, `null` if not a member.
 */
export function useOrgRole(orgId: string | null | undefined) {
  const { user } = useAuthStore()

  const { data: members } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => listMembers(orgId!),
    enabled: !!orgId && !!user,
    staleTime: 5 * 60_000,
  })

  if (!orgId || !user) return null
  if (!members) return undefined // loading

  // Check if user is org owner by comparing userId
  const member = members.find((m) => {
    const uid = typeof m.userId === 'object' ? (m.userId as any)._id : m.userId
    return uid === user.id
  })

  return (member?.role as OrgRole) ?? null
}

/**
 * Returns true if the current user has at least `minRole` in the org.
 * Returns false while loading or if not a member.
 */
export function useHasMinRole(orgId: string | null | undefined, minRole: OrgRole): boolean {
  const role = useOrgRole(orgId)
  if (!role) return false
  return hasMinRole(role, minRole)
}
