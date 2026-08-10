/**
 * Unit tests for lib/services/competition.service.ts
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
  listCompetitions,
  createCompetition,
  getCompetition,
  updateCompetition,
  deleteCompetition,
  setFormat,
  setStages,
  publishCompetition,
  listCompetitionTeams,
  registerTeams,
  assignTeamGroups,
  removeCompetitionTeam,
} from '@/lib/services/competition.service'

const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>

const ORG_ID = 'org-001'
const COMP_ID = 'comp-001'
const TEAM_ID = 'team-001'

function makeCompetition(overrides = {}) {
  return {
    _id: COMP_ID,
    orgId: ORG_ID,
    name: 'Test Cup',
    sport: 'Football',
    gender: 'male' as const,
    startDate: '2025-01-01',
    endDate: '2025-06-01',
    status: 'draft' as const,
    createdBy: { fullName: 'Charlie', email: 'charlie@test.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ── listCompetitions ──────────────────────────────────────────────────────────

// listCompetitions() always appends the local "pl-mock-123" test competition
// (see lib/testing-mocks/premierLeague.ts) alongside whatever the API
// returns, so the organizer flow can be exercised without real tournament
// data. TODO: REMOVE MOCK DATA BEFORE PROD — drop the `+ 1` / mock-id checks
// below once that fallback is removed.
describe('listCompetitions()', () => {
  it('calls GET /orgs/:orgId/competitions and returns the array plus the mock competition', async () => {
    const comp = makeCompetition()
    mockApi.get.mockResolvedValue({ competitions: [comp] })

    const result = await listCompetitions(ORG_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/orgs/${ORG_ID}/competitions`)
    expect(result).toHaveLength(2)
    expect(result[0]._id).toBe(COMP_ID)
    expect(result[1]._id).toBe('pl-mock-123')
  })

  it('returns only the mock competition when no real competitions exist', async () => {
    mockApi.get.mockResolvedValue({ competitions: [] })
    const result = await listCompetitions(ORG_ID)
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('pl-mock-123')
  })
})

// ── createCompetition ─────────────────────────────────────────────────────────

describe('createCompetition()', () => {
  it('calls POST /orgs/:orgId/competitions with the payload', async () => {
    const comp = makeCompetition()
    mockApi.post.mockResolvedValue({ competition: comp })

    const payload = { name: 'Test Cup', sport: 'Football', gender: 'male' as const, startDate: '2025-01-01', endDate: '2025-06-01' }
    const result = await createCompetition(ORG_ID, payload)

    expect(mockApi.post).toHaveBeenCalledWith(`/orgs/${ORG_ID}/competitions`, payload)
    expect(result._id).toBe(COMP_ID)
    expect(result.name).toBe('Test Cup')
  })
})

// ── getCompetition ────────────────────────────────────────────────────────────

describe('getCompetition()', () => {
  it('calls GET /competitions/:competitionId and returns the competition', async () => {
    const comp = makeCompetition()
    mockApi.get.mockResolvedValue({ competition: comp })

    const result = await getCompetition(COMP_ID)

    expect(mockApi.get).toHaveBeenCalledWith(
      `/competitions/${COMP_ID}`,
      expect.objectContaining({ public: true })
    )
    expect(result._id).toBe(COMP_ID)
  })
})

// ── updateCompetition ─────────────────────────────────────────────────────────

describe('updateCompetition()', () => {
  it('calls PATCH /competitions/:competitionId with the patch payload', async () => {
    const updated = makeCompetition({ name: 'Updated Cup' })
    mockApi.patch.mockResolvedValue({ competition: updated })

    const result = await updateCompetition(COMP_ID, { name: 'Updated Cup' })

    expect(mockApi.patch).toHaveBeenCalledWith(`/competitions/${COMP_ID}`, { name: 'Updated Cup' })
    expect(result.name).toBe('Updated Cup')
  })
})

// ── archiveCompetition ────────────────────────────────────────────────────────

describe('deleteCompetition()', () => {
  it('calls DELETE /competitions/:competitionId', async () => {
    mockApi.delete.mockResolvedValue({ message: 'Competition archived' })

    const result = await deleteCompetition(COMP_ID)

    expect(mockApi.delete).toHaveBeenCalledWith(`/competitions/${COMP_ID}`)
    expect(result.message).toContain('archived')
  })
})

// ── setFormat ─────────────────────────────────────────────────────────────────

describe('setFormat()', () => {
  it('calls PATCH /competitions/:competitionId/format with the format', async () => {
    const comp = makeCompetition({ format: 'league' })
    mockApi.patch.mockResolvedValue({ competition: comp })

    const result = await setFormat(COMP_ID, 'league')

    expect(mockApi.patch).toHaveBeenCalledWith(`/competitions/${COMP_ID}/format`, { format: 'league' })
    expect(result.format).toBe('league')
  })
})

// ── setStages ─────────────────────────────────────────────────────────────────

describe('setStages()', () => {
  it('calls PATCH /competitions/:competitionId/stages with stages array', async () => {
    const stages = [{ type: 'groups' as const, groups: [{ name: 'Group A' }] }]
    const comp = makeCompetition({ stages })
    mockApi.patch.mockResolvedValue({ competition: comp })

    const result = await setStages(COMP_ID, stages)

    expect(mockApi.patch).toHaveBeenCalledWith(`/competitions/${COMP_ID}/stages`, { stages })
    expect(result.stages).toEqual(stages)
  })
})

// ── publishCompetition ────────────────────────────────────────────────────────

describe('publishCompetition()', () => {
  it('calls POST /competitions/:competitionId/publish', async () => {
    const comp = makeCompetition({ status: 'published' })
    mockApi.post.mockResolvedValue({ competition: comp })

    const result = await publishCompetition(COMP_ID)

    expect(mockApi.post).toHaveBeenCalledWith(`/competitions/${COMP_ID}/publish`)
    expect(result.status).toBe('published')
  })
})

// ── listCompetitionTeams ──────────────────────────────────────────────────────

describe('listCompetitionTeams()', () => {
  it('calls GET /competitions/:competitionId/teams and returns teams array', async () => {
    const teams = [{ _id: TEAM_ID, teamId: TEAM_ID, name: 'Team A', handle: 'team_a', sport: 'Football' }]
    mockApi.get.mockResolvedValue({ teams })

    const result = await listCompetitionTeams(COMP_ID)

    expect(mockApi.get).toHaveBeenCalledWith(
      `/competitions/${COMP_ID}/teams`,
      expect.objectContaining({ public: true })
    )
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe(TEAM_ID)
  })
})

// ── registerTeams ─────────────────────────────────────────────────────────────

describe('registerTeams()', () => {
  it('calls POST /competitions/:competitionId/teams with teams array', async () => {
    mockApi.post.mockResolvedValue({ message: 'Teams registered' })

    const teams = [{ teamId: TEAM_ID, seed: 1 }]
    const result = await registerTeams(COMP_ID, teams)

    expect(mockApi.post).toHaveBeenCalledWith(`/competitions/${COMP_ID}/teams`, { teams })
    expect(result.message).toContain('registered')
  })
})

// ── assignTeamGroups ──────────────────────────────────────────────────────────

describe('assignTeamGroups()', () => {
  it('calls PATCH /competitions/:competitionId/teams with assignments', async () => {
    mockApi.patch.mockResolvedValue({ message: 'Groups assigned' })

    const assignments = [{ teamId: TEAM_ID, groupName: 'Group A', seed: 1 }]
    const result = await assignTeamGroups(COMP_ID, assignments)

    expect(mockApi.patch).toHaveBeenCalledWith(`/competitions/${COMP_ID}/teams`, { assignments })
    expect(result.message).toContain('assigned')
  })
})

// ── removeCompetitionTeam ─────────────────────────────────────────────────────

describe('removeCompetitionTeam()', () => {
  it('calls DELETE /competitions/:competitionId/teams/:teamId', async () => {
    mockApi.delete.mockResolvedValue({ message: 'Team removed' })

    const result = await removeCompetitionTeam(COMP_ID, TEAM_ID)

    expect(mockApi.delete).toHaveBeenCalledWith(`/competitions/${COMP_ID}/teams/${TEAM_ID}`)
    expect(result.message).toContain('removed')
  })
})
