import { api } from '@/lib/api'

export interface OrgMember {
  userId: {
    _id: string
    fullName: string
    email: string
  }
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  status: 'active' | 'invited' | 'removed'
  joinedAt?: string
  createdAt: string
}

export interface OrgInvite {
  _id: string
  invitedEmail: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  status: 'invited'
  invitedAt: string
  expiresAt: string
}

// GET /orgs/:orgId/members
export async function listMembers(orgId: string): Promise<OrgMember[]> {
  const data = await api.get<{ members: OrgMember[] }>(`/orgs/${orgId}/members`)
  return data.members
}

// POST /orgs/:orgId/invites
export async function sendInvite(
  orgId: string,
  email: string,
  role: string = 'viewer'
): Promise<OrgInvite> {
  const data = await api.post<{ invite: OrgInvite }>(`/orgs/${orgId}/invites`, { email, role })
  return data.invite
}

// GET /orgs/:orgId/invites
export async function listInvites(orgId: string): Promise<OrgInvite[]> {
  const data = await api.get<{ invites: OrgInvite[] }>(`/orgs/${orgId}/invites`)
  return data.invites
}

// DELETE /orgs/:orgId/invites/:inviteId
export async function revokeInvite(orgId: string, inviteId: string): Promise<void> {
  await api.delete(`/orgs/${orgId}/invites/${inviteId}`)
}

// POST /orgs/:orgId/invites/:inviteId/resend
export async function resendInvite(orgId: string, inviteId: string): Promise<OrgInvite> {
  const data = await api.post<{ invite: OrgInvite }>(`/orgs/${orgId}/invites/${inviteId}/resend`)
  return data.invite
}

// PATCH /orgs/:orgId/members/:userId
export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: string
): Promise<OrgMember> {
  const data = await api.patch<{ member: OrgMember }>(`/orgs/${orgId}/members/${userId}`, { role })
  return data.member
}

// DELETE /orgs/:orgId/members/:userId
export async function removeMember(orgId: string, userId: string): Promise<void> {
  await api.delete(`/orgs/${orgId}/members/${userId}`)
}
