/**
 * Unit tests for lib/services/org.service.ts
 *
 * Tests the frontend org service API layer — verifies correct endpoint paths,
 * request bodies, and response parsing.
 *
 * The `api` client is mocked so no real HTTP requests are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the api client before importing the service
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/lib/api'
import {
  listOrgs,
  getOrgByHandle,
  getOrg,
  createOrg,
  updateOrg,
  deleteOrg,
  listMembers,
  addMember,
  removeMember,
  createInvite,
  cancelInvite,
  acceptInvite,
} from '@/lib/services/org.service'

const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>

const ORG_ID = 'org-001'
const USER_ID = 'user-001'

function makeOrg(overrides = {}) {
  return {
    _id: ORG_ID,
    name: 'Test Org',
    handle: 'test_org',
    ownerId: USER_ID,
    lifecycleStatus: 'active',
    verificationStatus: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── listOrgs ──────────────────────────────────────────────────────────────────

describe('listOrgs()', () => {
  it('calls GET /orgs and returns the orgs array', async () => {
    const org = makeOrg()
    mockApi.get.mockResolvedValue({ orgs: [org] })

    const result = await listOrgs()

    expect(mockApi.get).toHaveBeenCalledWith('/orgs')
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe(ORG_ID)
  })

  it('returns an empty array when no orgs exist', async () => {
    mockApi.get.mockResolvedValue({ orgs: [] })
    const result = await listOrgs()
    expect(result).toEqual([])
  })
})

// ── getOrgByHandle ────────────────────────────────────────────────────────────

describe('getOrgByHandle()', () => {
  it('calls GET /orgs/handle/:handle and returns the org', async () => {
    const org = makeOrg()
    mockApi.get.mockResolvedValue({ org })

    const result = await getOrgByHandle('test_org')

    expect(mockApi.get).toHaveBeenCalledWith('/orgs/handle/test_org')
    expect(result._id).toBe(ORG_ID)
  })
})

// ── getOrg ────────────────────────────────────────────────────────────────────

describe('getOrg()', () => {
  it('calls GET /orgs/:orgId and returns the org', async () => {
    const org = makeOrg()
    mockApi.get.mockResolvedValue({ org })

    const result = await getOrg(ORG_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/orgs/${ORG_ID}`)
    expect(result._id).toBe(ORG_ID)
  })
})

// ── createOrg ─────────────────────────────────────────────────────────────────

describe('createOrg()', () => {
  it('calls POST /orgs with the payload and returns the created org', async () => {
    const org = makeOrg()
    mockApi.post.mockResolvedValue({ org })

    const payload = { name: 'Test Org', handle: 'test_org', sport: 'Football' }
    const result = await createOrg(payload)

    expect(mockApi.post).toHaveBeenCalledWith('/orgs', payload)
    expect(result._id).toBe(ORG_ID)
    expect(result.name).toBe('Test Org')
  })
})

// ── updateOrg ─────────────────────────────────────────────────────────────────

describe('updateOrg()', () => {
  it('calls PUT /orgs/:orgId with the patch payload', async () => {
    const updated = makeOrg({ name: 'Updated Name' })
    mockApi.put.mockResolvedValue({ org: updated })

    const result = await updateOrg(ORG_ID, { name: 'Updated Name' })

    expect(mockApi.put).toHaveBeenCalledWith(`/orgs/${ORG_ID}`, { name: 'Updated Name' })
    expect(result.name).toBe('Updated Name')
  })
})

// ── deleteOrg ─────────────────────────────────────────────────────────────────

describe('deleteOrg()', () => {
  it('calls DELETE /orgs/:orgId', async () => {
    mockApi.delete.mockResolvedValue({ message: 'Organization deleted successfully' })

    const result = await deleteOrg(ORG_ID)

    expect(mockApi.delete).toHaveBeenCalledWith(`/orgs/${ORG_ID}`)
    expect(result.message).toContain('deleted')
  })
})

// ── listMembers ───────────────────────────────────────────────────────────────

describe('listMembers()', () => {
  it('calls GET /orgs/:orgId/members and returns the members array', async () => {
    const member = {
      _id: 'member-001',
      userId: { _id: USER_ID, fullName: 'Charlie', email: 'c@test.com' },
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    mockApi.get.mockResolvedValue({ members: [member] })

    const result = await listMembers(ORG_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/orgs/${ORG_ID}/members`)
    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('admin')
  })
})

// ── addMember ─────────────────────────────────────────────────────────────────

describe('addMember()', () => {
  it('calls POST /orgs/:orgId/members with userId and role', async () => {
    const member = { _id: 'member-001', userId: { _id: USER_ID }, role: 'viewer', status: 'active', createdAt: '' }
    mockApi.post.mockResolvedValue({ member })

    const result = await addMember(ORG_ID, USER_ID, 'viewer')

    expect(mockApi.post).toHaveBeenCalledWith(`/orgs/${ORG_ID}/members`, { userId: USER_ID, role: 'viewer' })
    expect(result.role).toBe('viewer')
  })

  it('defaults role to viewer', async () => {
    const member = { _id: 'member-001', userId: { _id: USER_ID }, role: 'viewer', status: 'active', createdAt: '' }
    mockApi.post.mockResolvedValue({ member })

    await addMember(ORG_ID, USER_ID)

    expect(mockApi.post).toHaveBeenCalledWith(
      `/orgs/${ORG_ID}/members`,
      { userId: USER_ID, role: 'viewer' }
    )
  })
})

// ── removeMember ─────────────────────────────────────────────────────────────

describe('removeMember()', () => {
  it('calls DELETE /orgs/:orgId/members/:userId', async () => {
    mockApi.delete.mockResolvedValue({ message: 'Member removed' })

    await removeMember(ORG_ID, USER_ID)

    expect(mockApi.delete).toHaveBeenCalledWith(`/orgs/${ORG_ID}/members/${USER_ID}`)
  })
})

// ── createInvite ─────────────────────────────────────────────────────────────

describe('createInvite()', () => {
  it('calls POST /orgs/:orgId/invites with email and role', async () => {
    const invite = {
      _id: 'invite-001', orgId: ORG_ID, invitedEmail: 'test@test.com',
      role: 'staff', status: 'invited', expiresAt: '', invitedBy: USER_ID, createdAt: '',
    }
    mockApi.post.mockResolvedValue({ invite })

    const result = await createInvite(ORG_ID, 'test@test.com', 'staff')

    expect(mockApi.post).toHaveBeenCalledWith(
      `/orgs/${ORG_ID}/invites`,
      { email: 'test@test.com', role: 'staff' }
    )
    expect(result._id).toBe('invite-001')
  })
})

// ── cancelInvite ─────────────────────────────────────────────────────────────

describe('cancelInvite()', () => {
  it('calls DELETE /orgs/:orgId/invites/:inviteId', async () => {
    const invite = { _id: 'invite-001', status: 'cancelled', orgId: ORG_ID, invitedEmail: '', role: 'viewer', expiresAt: '', invitedBy: '', createdAt: '' }
    mockApi.delete.mockResolvedValue({ invite })

    await cancelInvite(ORG_ID, 'invite-001')

    expect(mockApi.delete).toHaveBeenCalledWith(`/orgs/${ORG_ID}/invites/invite-001`)
  })
})

// ── acceptInvite ─────────────────────────────────────────────────────────────

describe('acceptInvite()', () => {
  it('calls POST /orgs/:orgId/invites/:inviteId/accept', async () => {
    const invite = { _id: 'invite-001', status: 'accepted', orgId: ORG_ID, invitedEmail: '', role: 'viewer', expiresAt: '', invitedBy: '', createdAt: '' }
    mockApi.post.mockResolvedValue({ invite })

    const result = await acceptInvite(ORG_ID, 'invite-001')

    expect(mockApi.post).toHaveBeenCalledWith(
      `/orgs/${ORG_ID}/invites/invite-001/accept`
    )
    expect(result.status).toBe('accepted')
  })
})
