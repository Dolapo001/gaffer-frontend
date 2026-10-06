/**
 * Unit tests for lib/services/fantasy.service.ts
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
  ApiError: class ApiError extends Error {
    code: string
    status: number
    constructor(status: number, code: string, message: string) {
      super(message)
      this.code = code
      this.status = status
    }
  },
}))

import { api, ApiError } from '@/lib/api'
import {
  enableFantasy,
  enrollPlayers,
  syncTournamentPlayers,
  createGameweeks,
  getFantasySeason,
  listGameweeks,
  listFantasyPlayers,
  getTeamPricing,
  getPlayerPricing,
  setPlayerPrice,
  validateTeamPricing,
  finalizeTeamPricing,
  finalizeAllPricing,
  createFantasyTeam,
  getMyFantasyTeam,
  getFantasyStats,
  setSquad,
  makeTransfer,
  activateChip,
  getLeaderboard,
  getGameweekLeaderboard,
  getPlayerHistory,
} from '@/lib/services/fantasy.service'

const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>

const COMPETITION_ID = '507f1f77bcf86cd799439011'
const TEAM_ID = 'team-001'

beforeEach(() => {
  vi.clearAllMocks()
})

// ── enableFantasy ──────────────────────────────────────────────────────────────

describe('enableFantasy()', () => {
  it('calls POST /fantasy/:competitionId/enable with squadBudget', async () => {
    const season = { _id: 's1', competitionId: COMPETITION_ID, squadBudget: 100, pricingFinalized: false, registrationOpen: true, createdAt: '' }
    mockApi.post.mockResolvedValue(season)

    const result = await enableFantasy(COMPETITION_ID, 100)

    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/enable`, { squadBudget: 100 })
    expect(result.squadBudget).toBe(100)
  })
})

// ── enrollPlayers ──────────────────────────────────────────────────────────────

describe('enrollPlayers()', () => {
  it('calls POST /fantasy/:competitionId/players/enroll with the players list', async () => {
    const response = { data: { enrolled: 2, skipped: 0, errors: [] } }
    mockApi.post.mockResolvedValue(response)
    const players = [{ playerId: 'p1', teamId: 't1', position: 'GK' }]

    const result = await enrollPlayers(COMPETITION_ID, players)

    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/players/enroll`, { players })
    expect(result.data.enrolled).toBe(2)
  })
})

// ── syncTournamentPlayers ───────────────────────────────────────────────────────

describe('syncTournamentPlayers()', () => {
  it('calls POST /fantasy/:competitionId/players/sync', async () => {
    mockApi.post.mockResolvedValue({ data: { enrolled: 5, skipped: 1, errors: [] } })

    const result = await syncTournamentPlayers(COMPETITION_ID)

    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/players/sync`)
    expect(result.data.enrolled).toBe(5)
  })
})

// ── createGameweeks ────────────────────────────────────────────────────────────

describe('createGameweeks()', () => {
  it('calls POST /fantasy/:competitionId/gameweeks and unwraps the data envelope', async () => {
    const created = [{ _id: 'gw-1', name: 'Matchday 3', gameweekNumber: 3 }]
    mockApi.post.mockResolvedValue({ data: created })

    const result = await createGameweeks(COMPETITION_ID)

    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/gameweeks`)
    expect(result).toEqual(created)
  })
})

// ── getFantasySeason ───────────────────────────────────────────────────────────

describe('getFantasySeason()', () => {
  it('calls GET /fantasy/:competitionId/season and returns the season', async () => {
    const season = { _id: 's1', competitionId: COMPETITION_ID, squadBudget: 100, pricingFinalized: true, registrationOpen: true, createdAt: '' }
    mockApi.get.mockResolvedValue(season)

    const result = await getFantasySeason(COMPETITION_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/season`)
    expect(result?.squadBudget).toBe(100)
  })

  it('returns null when the backend reports FANTASY_SEASON_NOT_FOUND', async () => {
    mockApi.get.mockRejectedValue(new ApiError(404, 'FANTASY_SEASON_NOT_FOUND', 'not found'))

    const result = await getFantasySeason(COMPETITION_ID)

    expect(result).toBeNull()
  })

  it('rethrows other errors', async () => {
    mockApi.get.mockRejectedValue(new ApiError(500, 'INTERNAL_ERROR', 'server error'))

    await expect(getFantasySeason(COMPETITION_ID)).rejects.toThrow('server error')
  })
})

// ── listGameweeks ──────────────────────────────────────────────────────────────

describe('listGameweeks()', () => {
  it('calls GET /fantasy/:competitionId/gameweeks and returns a bare array response', async () => {
    const gw = [{ _id: 'gw1', competitionId: COMPETITION_ID, roundId: 'r1', name: 'GW1', deadline: '', lockStatus: 'open' as const, number: 1 }]
    mockApi.get.mockResolvedValue(gw)

    const result = await listGameweeks(COMPETITION_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/gameweeks`)
    expect(result).toHaveLength(1)
  })

  it('unwraps a { gameweeks } envelope', async () => {
    const gw = { gameweeks: [{ _id: 'gw1', competitionId: COMPETITION_ID, roundId: 'r1', name: 'GW1', deadline: '', lockStatus: 'open' as const, number: 1 }] }
    mockApi.get.mockResolvedValue(gw)

    const result = await listGameweeks(COMPETITION_ID)

    expect(result).toHaveLength(1)
  })

  it('unwraps a { data } envelope', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    const result = await listGameweeks(COMPETITION_ID)

    expect(result).toEqual([])
  })

  it('returns an empty array for an unrecognized shape', async () => {
    mockApi.get.mockResolvedValue({ unexpected: true })

    const result = await listGameweeks(COMPETITION_ID)

    expect(result).toEqual([])
  })
})

// ── listFantasyPlayers ─────────────────────────────────────────────────────────

describe('listFantasyPlayers()', () => {
  it('calls GET /fantasy/:competitionId/players with query params', async () => {
    mockApi.get.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 50 })

    await listFantasyPlayers(COMPETITION_ID, { page: 2, pageSize: 50, position: 'GK' })

    const calledUrl = mockApi.get.mock.calls[0][0] as string
    expect(calledUrl).toContain(`/fantasy/${COMPETITION_ID}/players?`)
    expect(calledUrl).toContain('page=2')
    expect(calledUrl).toContain('pageSize=50')
    expect(calledUrl).toContain('position=GK')
  })

  it('omits the query string when no params are given', async () => {
    mockApi.get.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20 })

    await listFantasyPlayers(COMPETITION_ID)

    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/players`)
  })
})

// ── pricing endpoints ──────────────────────────────────────────────────────────

describe('getTeamPricing()', () => {
  it('calls GET /fantasy/:competitionId/pricing/teams', async () => {
    mockApi.get.mockResolvedValue({})
    await getTeamPricing(COMPETITION_ID)
    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/pricing/teams`)
  })
})

describe('getPlayerPricing()', () => {
  it('calls GET /fantasy/:competitionId/pricing/teams/:teamId/players', async () => {
    mockApi.get.mockResolvedValue({})
    await getPlayerPricing(COMPETITION_ID, TEAM_ID)
    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/pricing/teams/${TEAM_ID}/players`)
  })
})

describe('setPlayerPrice()', () => {
  it('calls PUT /fantasy/:competitionId/pricing/teams/:teamId/players/:fantasyPlayerId', async () => {
    mockApi.put.mockResolvedValue({})
    await setPlayerPrice(COMPETITION_ID, TEAM_ID, 'fp-1', 'elite', 12.5)
    expect(mockApi.put).toHaveBeenCalledWith(
      `/fantasy/${COMPETITION_ID}/pricing/teams/${TEAM_ID}/players/fp-1`,
      { tier: 'elite', price: 12.5 }
    )
  })
})

describe('validateTeamPricing()', () => {
  it('calls POST /fantasy/:competitionId/pricing/teams/:teamId/validate', async () => {
    mockApi.post.mockResolvedValue({ valid: true })
    const result = await validateTeamPricing(COMPETITION_ID, TEAM_ID)
    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/pricing/teams/${TEAM_ID}/validate`)
    expect(result.valid).toBe(true)
  })
})

describe('finalizeTeamPricing()', () => {
  it('calls POST /fantasy/:competitionId/pricing/teams/:teamId/finalize', async () => {
    mockApi.post.mockResolvedValue({ message: 'Finalized' })
    await finalizeTeamPricing(COMPETITION_ID, TEAM_ID)
    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/pricing/teams/${TEAM_ID}/finalize`)
  })
})

describe('finalizeAllPricing()', () => {
  it('calls POST /fantasy/:competitionId/pricing/finalize', async () => {
    mockApi.post.mockResolvedValue({ message: 'All finalized' })
    await finalizeAllPricing(COMPETITION_ID)
    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/pricing/finalize`)
  })
})

// ── createFantasyTeam ──────────────────────────────────────────────────────────

describe('createFantasyTeam()', () => {
  it('calls POST /fantasy/:competitionId/team with the team name', async () => {
    mockApi.post.mockResolvedValue({ _id: TEAM_ID, teamName: 'My XI' })
    const result = await createFantasyTeam(COMPETITION_ID, 'My XI')
    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/team`, { teamName: 'My XI' })
    expect(result._id).toBe(TEAM_ID)
  })
})

// ── getMyFantasyTeam ───────────────────────────────────────────────────────────

describe('getMyFantasyTeam()', () => {
  it('calls GET /fantasy/:competitionId/team/me and returns a bare team response', async () => {
    mockApi.get.mockResolvedValue({ _id: TEAM_ID })
    const result = await getMyFantasyTeam(COMPETITION_ID)
    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/team/me`)
    expect(result?._id).toBe(TEAM_ID)
  })

  it('unwraps a { data } envelope', async () => {
    mockApi.get.mockResolvedValue({ data: { _id: TEAM_ID } })
    const result = await getMyFantasyTeam(COMPETITION_ID)
    expect(result?._id).toBe(TEAM_ID)
  })

  it('returns null when the team does not exist yet', async () => {
    mockApi.get.mockRejectedValue({ code: 'TEAM_NOT_FOUND' })
    const result = await getMyFantasyTeam(COMPETITION_ID)
    expect(result).toBeNull()
  })

  it('rethrows other errors', async () => {
    mockApi.get.mockRejectedValue({ code: 'SERVER_ERROR' })
    await expect(getMyFantasyTeam(COMPETITION_ID)).rejects.toEqual({ code: 'SERVER_ERROR' })
  })
})

// ── getFantasyStats ────────────────────────────────────────────────────────────

describe('getFantasyStats()', () => {
  it('calls GET /fantasy/:competitionId/stats and returns the stats', async () => {
    mockApi.get.mockResolvedValue({ yourSC: 50, averageSC: 40, highestSC: 90 })
    const result = await getFantasyStats(COMPETITION_ID)
    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/stats`)
    expect(result.yourSC).toBe(50)
  })

  // No made-up zeros on screen: callers hide the stats (MyTeamTab) or show "-" (league header)
  it('propagates errors instead of returning zeroed stats', async () => {
    mockApi.get.mockRejectedValue(new Error('down'))
    await expect(getFantasyStats(COMPETITION_ID)).rejects.toThrow('down')
  })
})

// ── setSquad ───────────────────────────────────────────────────────────────────

describe('setSquad()', () => {
  it('calls PUT /fantasy/:competitionId/team/squad with the squad payload', async () => {
    mockApi.put.mockResolvedValue({ _id: TEAM_ID })
    const payload = { startingXI: ['p1'], bench: ['p2'], captainId: 'p1', viceCaptainId: 'p2' }

    await setSquad(COMPETITION_ID, payload)

    expect(mockApi.put).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/team/squad`, payload)
  })
})

// ── makeTransfer ───────────────────────────────────────────────────────────────

describe('makeTransfer()', () => {
  it('calls POST /fantasy/:competitionId/team/transfers with in/out player IDs', async () => {
    mockApi.post.mockResolvedValue({ message: 'Transfer made', cost: -4, type: 'points' })

    const result = await makeTransfer(COMPETITION_ID, 'p-in', 'p-out')

    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/team/transfers`, {
      playerInId: 'p-in',
      playerOutId: 'p-out',
    })
    expect(result.cost).toBe(-4)
  })

  it('passes through optional coin-cost fields when the backend returns them', async () => {
    mockApi.post.mockResolvedValue({ message: 'Transfer made', cost: 0, type: 'coins', coinCost: 20, walletBalance: 80 })

    const result = await makeTransfer(COMPETITION_ID, 'p-in', 'p-out')

    expect(result.coinCost).toBe(20)
    expect(result.walletBalance).toBe(80)
  })
})

// ── activateChip ───────────────────────────────────────────────────────────────

describe('activateChip()', () => {
  it('calls POST /fantasy/:competitionId/team/chips with chipType and gameweekId', async () => {
    mockApi.post.mockResolvedValue({ message: 'Chip activated' })

    await activateChip(COMPETITION_ID, 'TRIPLE_CAPTAIN', 'gw-1')

    expect(mockApi.post).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/team/chips`, {
      chipType: 'TRIPLE_CAPTAIN',
      gameweekId: 'gw-1',
    })
  })
})

// ── getLeaderboard / getGameweekLeaderboard ───────────────────────────────────

describe('getLeaderboard()', () => {
  it('calls GET /fantasy/:competitionId/leaderboard with a page param', async () => {
    mockApi.get.mockResolvedValue({ leaderboard: [], total: 0, page: 1, pageSize: 20 })
    await getLeaderboard(COMPETITION_ID, 2)
    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/leaderboard?page=2`)
  })

  it('defaults to page 1', async () => {
    mockApi.get.mockResolvedValue({ leaderboard: [], total: 0, page: 1, pageSize: 20 })
    await getLeaderboard(COMPETITION_ID)
    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/leaderboard?page=1`)
  })
})

describe('getGameweekLeaderboard()', () => {
  it('calls GET /fantasy/:competitionId/leaderboard/gameweek/:gameweekId', async () => {
    mockApi.get.mockResolvedValue({ leaderboard: [], total: 0, page: 1, pageSize: 20 })
    await getGameweekLeaderboard(COMPETITION_ID, 'gw-1', 3)
    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/leaderboard/gameweek/gw-1?page=3`)
  })
})

// ── getPlayerHistory ───────────────────────────────────────────────────────────

describe('getPlayerHistory()', () => {
  it('calls GET /fantasy/:competitionId/players/:fantasyPlayerId/history and unwraps the data envelope', async () => {
    const entry = {
      _id: 'h1',
      gameweekId: { _id: 'gw1', name: 'GW1', gameweekNumber: 1, deadline: '' },
      totalPoints: 8,
      goalsScored: 1,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      ownGoals: 0,
      appeared: true,
    }
    mockApi.get.mockResolvedValue({ data: [entry] })

    const result = await getPlayerHistory(COMPETITION_ID, 'fp-1')

    expect(mockApi.get).toHaveBeenCalledWith(`/fantasy/${COMPETITION_ID}/players/fp-1/history`)
    expect(result).toHaveLength(1)
    expect(result[0].totalPoints).toBe(8)
  })
})
