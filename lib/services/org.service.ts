import { api } from '@/lib/api'

export interface Org {
  _id: string
  name: string
  handle: string
  description?: string
  email?: string
  website?: string
  logoUrl?: string
  sports?: string[]
  ownerId: string
  lifecycleStatus: string
  verificationStatus: string
  /** What the organisation told Gaffer, and HQ's decision (see Gaffer HQ). */
  application?: { socialLinks?: string[]; phone?: string; proofUrl?: string; rejectionReason?: string }
  suspension?: { reason?: string }
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
  sports?: string[]
  ownerId?: string
  userFullName?: string
  /** Details Gaffer HQ uses to review a new organisation. */
  phone?: string
  socialLinks?: string[]
  proofUrl?: string
}

// GET /orgs
export async function listOrgs(): Promise<Org[]> {
  const data = await api.get<{ orgs: Org[] }>('/orgs')
  return data.orgs
}

// GET /orgs/handle/:handle
export async function getOrgByHandle(handle: string): Promise<Org> {
  const data = await api.get<{ org: Org }>(`/orgs/handle/${handle}`)
  return data.org
}

// GET /orgs/:orgId
export async function getOrg(orgId: string): Promise<Org> {
  const data = await api.get<{ org: Org }>(`/orgs/${orgId}`)
  return data.org
}

// POST /orgs
export async function createOrg(payload: CreateOrgPayload): Promise<Org> {
  const data = await api.post<{ org: Org }>('/orgs', payload)
  return data.org
}

// POST /orgs/:orgId/reapply — a rejected organisation fixes its details and applies again
export async function reapplyOrg(orgId: string, changes: { description?: string; phone?: string; socialLinks?: string[] }): Promise<Org> {
  const data = await api.post<{ org: Org }>(`/orgs/${orgId}/reapply`, changes)
  return data.org
}

// PUT /orgs/:orgId
export async function updateOrg(orgId: string, payload: Partial<CreateOrgPayload>): Promise<Org> {
  const data = await api.put<{ org: Org }>(`/orgs/${orgId}`, payload)
  return data.org
}

// DELETE /orgs/:orgId
export async function deleteOrg(orgId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/orgs/${orgId}`)
}

// PATCH /orgs/:orgId/logo — upload via Cloudinary (multipart/form-data)
export async function updateOrgLogo(orgId: string, file: File): Promise<{ success: boolean; data: { imageUrl: string; publicId: string }; org: Org }> {
  const formData = new FormData()
  formData.append('file', file)
  return api.patch(`/orgs/${orgId}/logo`, formData)
}

// GET /orgs/:orgId/members
export async function listMembers(orgId: string): Promise<OrgMember[]> {
  const data = await api.get<{ members: OrgMember[] }>(`/orgs/${orgId}/members`)
  return data.members
}

// POST /orgs/:orgId/members
export async function addMember(
  orgId: string,
  userId: string,
  role: 'admin' | 'manager' | 'staff' | 'viewer' = 'viewer',
): Promise<OrgMember> {
  const data = await api.post<{ member: OrgMember }>(`/orgs/${orgId}/members`, { userId, role })
  return data.member
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
  const data = await api.patch<{ member: OrgMember }>(`/orgs/${orgId}/members/${userId}`, payload)
  return data.member
}

// GET /orgs/:orgId/invites
export async function listInvites(orgId: string): Promise<OrgInvite[]> {
  const data = await api.get<{ invites: OrgInvite[] }>(`/orgs/${orgId}/invites`)
  return data.invites
}

// POST /orgs/:orgId/invites
export async function createInvite(
  orgId: string,
  email: string,
  role: string = 'viewer',
): Promise<OrgInvite> {
  const data = await api.post<{ invite: OrgInvite }>(`/orgs/${orgId}/invites`, { email, role })
  return data.invite
}

// POST /orgs/:orgId/invites/:inviteId/resend
export async function resendInvite(orgId: string, inviteId: string): Promise<OrgInvite> {
  const data = await api.post<{ invite: OrgInvite }>(`/orgs/${orgId}/invites/${inviteId}/resend`)
  return data.invite
}

// DELETE /orgs/:orgId/invites/:inviteId
export async function cancelInvite(orgId: string, inviteId: string): Promise<OrgInvite> {
  const data = await api.delete<{ invite: OrgInvite }>(`/orgs/${orgId}/invites/${inviteId}`)
  return data.invite
}

// POST /orgs/:orgId/invites/:inviteId/accept
export async function acceptInvite(orgId: string, inviteId: string): Promise<OrgInvite> {
  const data = await api.post<{ invite: OrgInvite }>(`/orgs/${orgId}/invites/${inviteId}/accept`)
  return data.invite
}
// POST /orgs/:orgId/upload
export async function uploadOrgAsset(orgId: string, file: File): Promise<{ url: string; publicId: string }> {
  const formData = new FormData()
  formData.append('file', file)
  return api.post(`/orgs/${orgId}/upload`, formData)
}
