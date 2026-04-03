/**
 * Unit tests for lib/services/team.service.ts
 *
 * Verifies correct endpoint paths, request bodies, and response parsing.
 * The `api` client is mocked so no real HTTP requests are made.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

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
  createTeam,
  listTeams,
  getTeam,
  updateTeam,
  archiveTeam,
  addPlayer,
  listPlayers,
  updatePlayer,
  removePlayer,
  createPlayerInvite,
  listPlayerInvites,
  revokePlayerInvite,
} from '@/lib/services/team.service'

const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>

const ORG_ID = 'org-001'
const TEAM_ID = 'team-001'
const PLAYER_ID = 'player-001'

function makeTeam(overrides = {}) {
  return {
    _id: TEAM_ID,
    orgId: ORG_ID,
    name: 'Test FC',
    handle: 'test_fc',
    sport: 'Football',
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makePlayer(overrides = {}) {
  return {
    _id: PLAYER_ID,
    firstName: 'Charlie',
    lastName: 'Smith',
    squadStatus: 'active' as const,
    teamId: TEAM_ID,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── createTeam ────────────────────────────────────────────────────────────────

describe('createTeam()', () => {
  it('calls POST /orgs/:orgId/teams and returns the created team', async () => {
    const team = makeTeam()
    mockApi.post.mockResolvedValue({ team })

    const payload = { name: 'Test FC', handle: 'test_fc', sport: 'Football' }
    const result = await createTeam(ORG_ID, payload)

    expect(mockApi.post).toHaveBeenCalledWith(`/orgs/${ORG_ID}/teams`, payload)
    expect(result._id).toBe(TEAM_ID)
    expect(result.name).toBe('Test FC')
  })
})

// ── listTeams ─────────────────────────────────────────────────────────────────

describe('listTeams()', () => {
  it('calls GET /orgs/:orgId/teams and returns the teams array', async () => {
    const team = makeTeam()
    mockApi.get.mockResolvedValue({ teams: [team] })

    const result = await listTeams(ORG_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/orgs/${ORG_ID}/teams`)
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe(TEAM_ID)
  })

  it('returns an empty array when no teams exist', async () => {
    mockApi.get.mockResolvedValue({ teams: [] })
    const result = await listTeams(ORG_ID)
    expect(result).toEqual([])
  })
})

// ── getTeam ───────────────────────────────────────────────────────────────────

describe('getTeam()', () => {
  it('calls GET /teams/:teamId and returns the team', async () => {
    const team = makeTeam()
    mockApi.get.mockResolvedValue({ team })

    const result = await getTeam(TEAM_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/teams/${TEAM_ID}`)
    expect(result._id).toBe(TEAM_ID)
  })
})

// ── updateTeam ────────────────────────────────────────────────────────────────

describe('updateTeam()', () => {
  it('calls PATCH /teams/:teamId with the patch payload', async () => {
    const updated = makeTeam({ name: 'Updated FC' })
    mockApi.patch.mockResolvedValue({ team: updated })

    const result = await updateTeam(TEAM_ID, { name: 'Updated FC' })

    expect(mockApi.patch).toHaveBeenCalledWith(`/teams/${TEAM_ID}`, { name: 'Updated FC' })
    expect(result.name).toBe('Updated FC')
  })
})

// ── archiveTeam ───────────────────────────────────────────────────────────────

describe('archiveTeam()', () => {
  it('calls DELETE /teams/:teamId', async () => {
    mockApi.delete.mockResolvedValue({ message: 'Team archived' })

    const result = await archiveTeam(TEAM_ID)

    expect(mockApi.delete).toHaveBeenCalledWith(`/teams/${TEAM_ID}`)
    expect(result.message).toContain('archived')
  })
})

// ── addPlayer ─────────────────────────────────────────────────────────────────

describe('addPlayer()', () => {
  it('calls POST /teams/:teamId/players with the player payload', async () => {
    const player = makePlayer()
    mockApi.post.mockResolvedValue({ player })

    const payload = { firstName: 'Charlie', lastName: 'Smith', position: 'Forward' }
    const result = await addPlayer(TEAM_ID, payload)

    expect(mockApi.post).toHaveBeenCalledWith(`/teams/${TEAM_ID}/players`, payload)
    expect(result._id).toBe(PLAYER_ID)
    expect(result.firstName).toBe('Charlie')
  })
})

// ── listPlayers ───────────────────────────────────────────────────────────────

describe('listPlayers()', () => {
  it('calls GET /teams/:teamId/players and returns the players array', async () => {
    const player = makePlayer()
    mockApi.get.mockResolvedValue({ players: [player] })

    const result = await listPlayers(TEAM_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/teams/${TEAM_ID}/players`)
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe(PLAYER_ID)
  })
})

// ── updatePlayer ──────────────────────────────────────────────────────────────

describe('updatePlayer()', () => {
  it('calls PATCH /teams/:teamId/players/:playerId with the patch', async () => {
    const updated = makePlayer({ role: 'captain' })
    mockApi.patch.mockResolvedValue({ player: updated })

    const result = await updatePlayer(TEAM_ID, PLAYER_ID, { role: 'captain' })

    expect(mockApi.patch).toHaveBeenCalledWith(
      `/teams/${TEAM_ID}/players/${PLAYER_ID}`,
      { role: 'captain' }
    )
    expect(result.role).toBe('captain')
  })
})

// ── removePlayer ──────────────────────────────────────────────────────────────

describe('removePlayer()', () => {
  it('calls DELETE /teams/:teamId/players/:playerId', async () => {
    mockApi.delete.mockResolvedValue({ message: 'Player removed' })

    const result = await removePlayer(TEAM_ID, PLAYER_ID)

    expect(mockApi.delete).toHaveBeenCalledWith(`/teams/${TEAM_ID}/players/${PLAYER_ID}`)
    expect(result.message).toContain('removed')
  })
})

// ── createPlayerInvite ────────────────────────────────────────────────────────

describe('createPlayerInvite()', () => {
  it('calls POST /teams/:teamId/player-invites with the email', async () => {
    const invite = { email: 'player@test.com', expiresAt: '', inviteLink: 'https://gaffer.io/invite/xyz' }
    mockApi.post.mockResolvedValue({ invite })

    const result = await createPlayerInvite(TEAM_ID, 'player@test.com')

    expect(mockApi.post).toHaveBeenCalledWith(`/teams/${TEAM_ID}/player-invites`, { email: 'player@test.com' })
    expect(result.invite.inviteLink).toBeTruthy()
  })
})

// ── listPlayerInvites ─────────────────────────────────────────────────────────

describe('listPlayerInvites()', () => {
  it('calls GET /teams/:teamId/player-invites and returns invites array', async () => {
    const invite = { _id: 'invite-001', email: 'player@test.com', teamId: TEAM_ID, expiresAt: '', status: 'pending' as const, inviteLink: '', createdAt: '' }
    mockApi.get.mockResolvedValue({ invites: [invite] })

    const result = await listPlayerInvites(TEAM_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/teams/${TEAM_ID}/player-invites`)
    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('pending')
  })
})

// ── revokePlayerInvite ────────────────────────────────────────────────────────

describe('revokePlayerInvite()', () => {
  it('calls POST /player-invites/:inviteId/revoke', async () => {
    mockApi.post.mockResolvedValue({ message: 'Invite revoked' })

    const result = await revokePlayerInvite('invite-001')

    expect(mockApi.post).toHaveBeenCalledWith('/player-invites/invite-001/revoke')
    expect(result.message).toContain('revoked')
  })
})
