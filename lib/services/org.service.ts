import { api } from '@/lib/api'

export interface Org {
  _id: string
  name: string
  handle: string
  description?: string
  email?: string
  website?: string
  logoUrl?: string
  sport?: string
  ownerId: string
  lifecycleStatus: string
  verificationStatus: string
  createdAt: string
  updatedAt: string
}

export interface OrgMember {
  _id: string
  userId: { _id: string; fullName: string | null; email: string }
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  status: 'active' | 'removed' | 'invited'
  createdAt: string
}

export interface OrgInvite {
  _id: string
  orgId: string
  invitedEmail: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  status: 'invited' | 'accepted' | 'cancelled'
  expiresAt: string
  invitedBy: string
  createdAt: string
}

export interface CreateOrgPayload {
  name: string
  handle: string
  description?: string
  email?: string
  website?: string
  logoUrl?: string
  sport?: string
  ownerId?: string
}

// GET /orgs
export async function listOrgs(): Promise<Org[]> {
  return api.get<Org[]>('/orgs')
}

// GET /orgs/handle/:handle
export async function getOrgByHandle(handle: string): Promise<Org> {
  return api.get<Org>(`/orgs/handle/${handle}`)
}

// GET /orgs/:orgId
export async function getOrg(orgId: string): Promise<Org> {
  return api.get<Org>(`/orgs/${orgId}`)
}

// POST /orgs
export async function createOrg(payload: CreateOrgPayload): Promise<Org> {
  return api.post<Org>('/orgs', payload)
}

// PUT /orgs/:orgId
export async function updateOrg(orgId: string, payload: Partial<CreateOrgPayload>): Promise<Org> {
  return api.put<Org>(`/orgs/${orgId}`, payload)
}

// DELETE /orgs/:orgId
export async function deleteOrg(orgId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/orgs/${orgId}`)
}

// PATCH /orgs/:orgId/logo
export async function updateOrgLogo(orgId: string, logoUrl: string): Promise<Org> {
  return api.patch<Org>(`/orgs/${orgId}/logo`, { logoUrl })
}

// GET /orgs/:orgId/members
export async function listMembers(orgId: string): Promise<OrgMember[]> {
  return api.get<OrgMember[]>(`/orgs/${orgId}/members`)
}

// POST /orgs/:orgId/members
export async function addMember(
  orgId: string,
  userId: string,
  role: 'admin' | 'manager' | 'staff' | 'viewer' = 'viewer',
): Promise<OrgMember> {
  return api.post<OrgMember>(`/orgs/${orgId}/members`, { userId, role })
}

// DELETE /orgs/:orgId/members/:memberId  (memberId = userId)
export async function removeMember(orgId: string, userId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/orgs/${orgId}/members/${userId}`)
}

// PATCH /orgs/:orgId/members/:memberId
export async function updateMember(
  orgId: string,
  userId: string,
  payload: { role?: string; status?: string },
): Promise<OrgMember> {
  return api.patch<OrgMember>(`/orgs/${orgId}/members/${userId}`, payload)
}

// GET /orgs/:orgId/invites
export async function listInvites(orgId: string): Promise<OrgInvite[]> {
  return api.get<OrgInvite[]>(`/orgs/${orgId}/invites`)
}

// POST /orgs/:orgId/invites
export async function createInvite(
  orgId: string,
  email: string,
  role: string = 'viewer',
): Promise<OrgInvite> {
  return api.post<OrgInvite>(`/orgs/${orgId}/invites`, { email, role })
}

// POST /orgs/:orgId/invites/:inviteId/resend
export async function resendInvite(orgId: string, inviteId: string): Promise<OrgInvite> {
  return api.post<OrgInvite>(`/orgs/${orgId}/invites/${inviteId}/resend`)
}

// DELETE /orgs/:orgId/invites/:inviteId
export async function cancelInvite(orgId: string, inviteId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/orgs/${orgId}/invites/${inviteId}`)
}

// POST /orgs/:orgId/invites/:inviteId/accept
export async function acceptInvite(orgId: string, inviteId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/orgs/${orgId}/invites/${inviteId}/accept`)
}
