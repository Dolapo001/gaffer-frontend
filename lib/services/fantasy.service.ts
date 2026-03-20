import { api, ApiError } from '@/lib/api'

export interface FantasySeason {
  _id: string
  competitionId: string
  squadBudget: number
  pricingFinalized: boolean
  registrationOpen: boolean
  createdAt: string
}

export interface FantasyGameweek {
  _id: string
  competitionId: string
  roundId: string
  name: string
  deadline: string
  lockStatus: 'open' | 'locked'
  number: number
}

export interface FantasyPlayer {
  _id: string
  playerId: {
    _id: string
    firstName: string
    lastName: string
    position?: string
  }
  teamId: {
    _id: string
    name: string
    handle: string
    logoUrl?: string
  }
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  price: number
  tier?: 'marquee' | 'elite' | 'standard' | 'budget'
  totalPoints?: number
}

export interface FantasyTeam {
  _id: string
  userId: string
  competitionId: string
  teamName: string
  squad: FantasyPlayer[]
  startingXI: string[]
  bench: string[]
  captainId: string
  viceCaptainId: string
  totalPoints: number
  formation?: string
  transfersRemaining?: number
  createdAt: string
}

export interface FantasyLeaderboardEntry {
  rank: number
  userId: { _id: string; email: string; fullName?: string }
  teamName: string
  totalPoints: number
}

export interface LeaderboardResponse {
  leaderboard: FantasyLeaderboardEntry[]
  total: number
  page: number
  pageSize: number
}

// POST /fantasy/:competitionId/enable
export async function enableFantasy(
  competitionId: string,
  squadBudget?: number,
): Promise<FantasySeason> {
  return api.post<FantasySeason>(`/fantasy/${competitionId}/enable`, { squadBudget })
}

// POST /fantasy/:competitionId/players/enroll
export async function enrollPlayers(
  competitionId: string,
  players: { playerId: string; teamId: string; position: string }[],
): Promise<{ data: { enrolled: number; skipped: number; errors: unknown[] } }> {
  return api.post(`/fantasy/${competitionId}/players/enroll`, { players })
}

// POST /fantasy/:competitionId/players/sync
export async function syncTournamentPlayers(
  competitionId: string,
): Promise<{ data: { enrolled: number; skipped: number; errors: unknown[] } }> {
  return api.post(`/fantasy/${competitionId}/players/sync`)
}

// POST /fantasy/:competitionId/gameweeks
export async function createGameweeks(
  competitionId: string,
): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/fantasy/${competitionId}/gameweeks`)
}

// GET /fantasy/:competitionId/season
export async function getFantasySeason(competitionId: string): Promise<FantasySeason | null> {
  try {
    return await api.get<FantasySeason>(`/fantasy/${competitionId}/season`)
  } catch (err) {
    if (err instanceof ApiError && err.code === 'FANTASY_SEASON_NOT_FOUND') return null
    throw err
  }
}

// GET /fantasy/:competitionId/gameweeks
export async function listGameweeks(competitionId: string): Promise<FantasyGameweek[]> {
  return api.get<FantasyGameweek[]>(`/fantasy/${competitionId}/gameweeks`)
}

// GET /fantasy/:competitionId/players
export async function listFantasyPlayers(
  competitionId: string,
  params?: { page?: number; pageSize?: number; position?: string; teamId?: string },
): Promise<{ data: FantasyPlayer[]; total: number; page: number; pageSize: number }> {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : ''
  return api.get(`/fantasy/${competitionId}/players${qs}`)
}

// Pricing endpoints
export async function getTeamPricing(competitionId: string): Promise<unknown> {
  return api.get(`/fantasy/${competitionId}/pricing/teams`)
}

export async function getPlayerPricing(competitionId: string, teamId: string): Promise<unknown> {
  return api.get(`/fantasy/${competitionId}/pricing/teams/${teamId}/players`)
}

export async function setPlayerPrice(
  competitionId: string,
  teamId: string,
  fantasyPlayerId: string,
  tier: 'marquee' | 'elite' | 'standard' | 'budget',
  price: number,
): Promise<unknown> {
  return api.put(`/fantasy/${competitionId}/pricing/teams/${teamId}/players/${fantasyPlayerId}`, { tier, price })
}

export async function validateTeamPricing(
  competitionId: string,
  teamId: string,
): Promise<{ valid: boolean; errors?: string[] }> {
  return api.post<{ valid: boolean; errors?: string[] }>(
    `/fantasy/${competitionId}/pricing/teams/${teamId}/validate`,
  )
}

export async function finalizeTeamPricing(
  competitionId: string,
  teamId: string,
): Promise<{ message: string }> {
  return api.post<{ message: string }>(
    `/fantasy/${competitionId}/pricing/teams/${teamId}/finalize`,
  )
}

export async function finalizeAllPricing(competitionId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/fantasy/${competitionId}/pricing/finalize`)
}

// POST /fantasy/:competitionId/team
export async function createFantasyTeam(
  competitionId: string,
  teamName: string,
): Promise<FantasyTeam> {
  return api.post<FantasyTeam>(`/fantasy/${competitionId}/team`, { teamName })
}

// GET /fantasy/:competitionId/team/me
export async function getMyFantasyTeam(competitionId: string): Promise<FantasyTeam> {
  return api.get<FantasyTeam>(`/fantasy/${competitionId}/team/me`)
}

// PUT /fantasy/:competitionId/team/squad
export async function setSquad(
  competitionId: string,
  payload: {
    startingXI: string[]
    bench: string[]
    captainId: string
    viceCaptainId: string
  },
): Promise<FantasyTeam> {
  return api.put<FantasyTeam>(`/fantasy/${competitionId}/team/squad`, payload)
}

// POST /fantasy/:competitionId/team/transfers
export async function makeTransfer(
  competitionId: string,
  playerInId: string,
  playerOutId: string,
): Promise<{ message: string; cost: number; type: string }> {
  return api.post(`/fantasy/${competitionId}/team/transfers`, { playerInId, playerOutId })
}

// POST /fantasy/:competitionId/team/chips
export async function activateChip(
  competitionId: string,
  chipType: 'BENCH_BOOST' | 'WILDCARD' | 'FREE_HIT' | 'TRIPLE_CAPTAIN',
  gameweekId: string,
): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/fantasy/${competitionId}/team/chips`, { chipType, gameweekId })
}

// GET /fantasy/:competitionId/leaderboard
export async function getLeaderboard(
  competitionId: string,
  page: number = 1,
): Promise<LeaderboardResponse> {
  return api.get<LeaderboardResponse>(`/fantasy/${competitionId}/leaderboard?page=${page}`)
}

// GET /fantasy/:competitionId/leaderboard/gameweek/:gameweekId
export async function getGameweekLeaderboard(
  competitionId: string,
  gameweekId: string,
  page: number = 1,
): Promise<LeaderboardResponse> {
  return api.get<LeaderboardResponse>(
    `/fantasy/${competitionId}/leaderboard/gameweek/${gameweekId}?page=${page}`,
  )
}

// Fantasy squad validation rules (mirrors backend)
export const SQUAD_RULES = {
  totalSize: 15,
  startingXISize: 11,
  benchSize: 4,
  positions: { GK: 2, DEF: 5, MID: 5, FWD: 3 },
  startingXI: {
    GK: { min: 1, max: 1 },
    DEF: { min: 2, max: 5 },
    MID: { min: 2, max: 5 },
    FWD: { min: 1, max: 3 },
  },
  maxPerTeam: 3,
  benchSlot4: 'GK' as const, // last bench slot must be GK
} as const
