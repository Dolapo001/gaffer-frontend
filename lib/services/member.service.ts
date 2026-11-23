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

// ── Staff invite link: one shareable link per organisation ──────────────────

export interface StaffInviteLink {
  id: string
  url: string
  code: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  uses: number
  createdAt: string
}

// GET /orgs/:orgId/invite-link
export async function getInviteLink(orgId: string): Promise<StaffInviteLink | null> {
  const data = await api.get<{ link: StaffInviteLink | null }>(`/orgs/${orgId}/invite-link`)
  return data.link
}

// POST /orgs/:orgId/invite-link — makes a new link; the old one stops working
export async function createInviteLink(orgId: string, role: string): Promise<StaffInviteLink> {
  const data = await api.post<{ link: StaffInviteLink }>(`/orgs/${orgId}/invite-link`, { role })
  return data.link
}

// DELETE /orgs/:orgId/invite-link
export async function revokeInviteLink(orgId: string): Promise<void> {
  await api.delete(`/orgs/${orgId}/invite-link`)
}

// GET /invite/link/:code — public
export const peekStaffLink = (code: string) =>
  api.get<{ orgName: string; logoUrl: string | null; invitedBy: string | null; role: string }>(`/invite/link/${code}`, { public: true })

// POST /invite/link/:code/join
export const joinStaffLink = (code: string) =>
  api.post<{ orgId: string; orgName: string; role: string; alreadyMember: boolean }>(`/invite/link/${code}/join`)

/** A staff link opened before signing in: kept so the person comes back to it after signing in or up. */
const PENDING_STAFF_KEY = 'gaffer-pending-staff-link'
export const pendingStaffCode = {
  get: (): string | null => { try { return localStorage.getItem(PENDING_STAFF_KEY) } catch { return null } },
  set: (c: string) => { try { localStorage.setItem(PENDING_STAFF_KEY, c) } catch { /* private mode */ } },
  clear: () => { try { localStorage.removeItem(PENDING_STAFF_KEY) } catch { /* private mode */ } },
}
