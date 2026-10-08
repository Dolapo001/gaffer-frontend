import { asArray } from '@/lib/asArray'
import { api, ApiError } from '@/lib/api'
import type { JerseyPattern } from '@/components/jersey/jerseyUtils'
import { mockFantasyTeam, mockPlayers } from '@/lib/testing-mocks/premierLeague'
// TODO: REMOVE MOCK DATA BEFORE PROD

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
  // Scoring lifecycle — 'completed' is the reliable signal that a gameweek's
  // points are final. The backend never transitions lockStatus away from
  // 'open', so don't gate "has this GW been played" on lockStatus.
  completionStatus: 'pending' | 'scoring' | 'completed'
  gameweekNumber: number
  stage?: 'group_stage' | 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final'
}

export interface StageRules {
  name: string
  freeTransfers: number
  maxPerRealTeam: number
  isUnlimitedTransfers: boolean
}

export function getStageRules(stage?: string): StageRules {
  switch (stage) {
    case 'round_of_16':
      return { name: 'Round of 16', freeTransfers: 99, maxPerRealTeam: 4, isUnlimitedTransfers: true }
    case 'quarter_finals':
      return { name: 'Quarter-Finals', freeTransfers: 3, maxPerRealTeam: 5, isUnlimitedTransfers: false }
    case 'semi_finals':
      return { name: 'Semi-Finals', freeTransfers: 5, maxPerRealTeam: 6, isUnlimitedTransfers: false }
    case 'final':
      return { name: 'Final', freeTransfers: 5, maxPerRealTeam: 8, isUnlimitedTransfers: false }
    default:
      return { name: 'Group Stage', freeTransfers: 1, maxPerRealTeam: 3, isUnlimitedTransfers: false }
  }
}

export interface FantasyPlayer {
  _id: string
  playerId: {
    _id: string
    firstName: string
    lastName: string
    position?: string
    picture?: string
  }
  teamId: {
    _id: string
    name: string
    shortName?: string
    handle: string
    logoUrl?: string
    // Backend populates as `jersey` (home kit). homeJersey kept for backwards-compat.
    jersey?: {
      primaryColor: string
      secondaryColor: string
      jerseyPattern: JerseyPattern
    }
    homeJersey?: {
      primaryColor: string
      secondaryColor: string
      jerseyPattern: JerseyPattern
    }
  }
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  price: number
  sellPrice?: number
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
  /** True once a valid 15-player squad has been saved. A named team without a squad is false. */
  isComplete?: boolean
  formation?: string
  transfersRemaining?: number
  bankBalance?: number
  // Optional — only present once the backend ships the coin-based transfer
  // economy (see BACKEND_CONTRACT.md). Read defensively: when absent, the
  // transfers UI falls back to today's points-hit model unchanged.
  freeTransfersRemaining?: number | null
  /** True before the season's first deadline (or in an unlimited stage) */
  unlimitedTransfers?: boolean
  /** The gameweek squad changes and transfers currently apply to */
  editingGameweekId?: string | null
  transferCostMode?: 'points' | 'coins'
  createdAt: string
}

// Overall (season) and per-gameweek leaderboards come back in genuinely
// different shapes from the backend — overall entries carry a flat userId +
// totalPoints (from FantasyTeam), gameweek entries nest userId under
// fantasyTeamId and use netPoints/grossPoints (from FantasyTeamGameweek).
// Both are wrapped in { data: [...] }, not { leaderboard: [...] }.
export interface OverallLeaderboardEntry {
  rank: number
  _id: string
  teamName: string
  userId: { _id: string; fullName?: string; username?: string; avatarUrl?: string }
  totalPoints: number
  lastGwPoints?: number
}

export interface OverallLeaderboardResponse {
  data: OverallLeaderboardEntry[]
  total: number
  page: number
  pageSize: number
}

export interface GameweekLeaderboardEntry {
  rank: number
  _id: string
  fantasyTeamId: { _id: string; teamName: string; userId: { _id: string; fullName?: string; username?: string } }
  grossPoints: number
  netPoints: number
  benchBoostActive?: boolean
}

export interface GameweekLeaderboardResponse {
  data: GameweekLeaderboardEntry[]
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
// Backend returns { data: FantasyGameweek[] } — one new gameweek per round
// that doesn't already have one; rounds that already have a gameweek are
// silently skipped (safe to call repeatedly as new rounds get added).
export async function createGameweeks(competitionId: string): Promise<FantasyGameweek[]> {
  const res = await api.post<{ data: FantasyGameweek[] }>(`/fantasy/${competitionId}/gameweeks`)
  return res.data
}

// GET /fantasy/:competitionId/season
export async function getFantasySeason(competitionId: string): Promise<FantasySeason | null> {
  if (!/^[0-9a-fA-F]{24}$/.test(competitionId)) return null
  try {
    // The backend wraps this in { data } — without unwrapping, squadBudget was
    // always undefined and every league silently used the 100m default.
    const res = await api.get<FantasySeason | { data: FantasySeason }>(`/fantasy/${competitionId}/season`)
    return (res && 'data' in res && res.data) ? (res as any).data as FantasySeason : res as FantasySeason
  } catch (err) {
    if (err instanceof ApiError && (err.code === 'FANTASY_SEASON_NOT_FOUND' || err.status === 400)) return null
    throw err
  }
}

// GET /fantasy/:competitionId/gameweeks
export async function listGameweeks(competitionId: string): Promise<FantasyGameweek[]> {
  if (!/^[0-9a-fA-F]{24}$/.test(competitionId)) return []
  const res = await api.get<FantasyGameweek[] | { gameweeks: FantasyGameweek[] } | { data: FantasyGameweek[] }>(
    `/fantasy/${competitionId}/gameweeks`,
  )
  if (Array.isArray(res)) return res
  if ('gameweeks' in res) return asArray<FantasyGameweek>(res.gameweeks)
  if ('data' in res) return asArray<FantasyGameweek>(res.data)
  return []
}

// GET /fantasy/:competitionId/players
export async function listFantasyPlayers(
  competitionId: string,
  params?: { page?: number; pageSize?: number; position?: string; teamId?: string; sortBy?: 'price' | 'totalPoints'; maxPrice?: number },
): Promise<{ data: FantasyPlayer[]; total: number; page: number; pageSize: number }> {
  if (!/^[0-9a-fA-F]{24}$/.test(competitionId)) return { data: [], total: 0, page: 1, pageSize: 100 };
  
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : ''
  return api.get(`/fantasy/${competitionId}/players${qs}`)
}

// Pricing endpoints
export async function getTeamPricing(competitionId: string): Promise<unknown> {
  if (!/^[0-9a-fA-F]{24}$/.test(competitionId)) return { teams: [] }
  return api.get(`/fantasy/${competitionId}/pricing/teams`)
}

export async function getPlayerPricing(competitionId: string, teamId: string): Promise<unknown> {
  if (!/^[0-9a-fA-F]{24}$/.test(competitionId)) return { players: [] }
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
export async function getMyFantasyTeam(competitionId: string): Promise<FantasyTeam | null> {
  if (!/^[0-9a-fA-F]{24}$/.test(competitionId)) return null;

  try {
    const res = await api.get<FantasyTeam | { data: FantasyTeam }>(`/fantasy/${competitionId}/team/me`)
    return (res && 'data' in res && res.data) ? (res as any).data as FantasyTeam : res as FantasyTeam
  } catch (error: any) {
    if (error.code === 'TEAM_NOT_FOUND') {
      return null
    }
    throw error
  }
}
// GET /fantasy/:competitionId/team/me/gameweek/:gameweekId
export async function getMyFantasyTeamHistory(competitionId: string, gameweekId: string): Promise<FantasyTeam | null> {
  if (!/^[0-9a-fA-F]{24}$/.test(competitionId)) return null;

  try {
    const res = await api.get<FantasyTeam | { data: FantasyTeam }>(`/fantasy/${competitionId}/team/me/gameweek/${gameweekId}`)
    return (res && 'data' in res && res.data) ? (res as any).data as FantasyTeam : res as FantasyTeam
  } catch (error: any) {
    if (error.code === 'TEAM_NOT_FOUND') {
      return null
    }
    throw error
  }
}

export interface FantasySeasonStats {
  yourSC: number
  averageSC: number
  highestSC: number
}

// GET /fantasy/:competitionId/stats
// Errors propagate (React Query then shows nothing) instead of turning into
// made-up zeros on screen
export async function getFantasyStats(competitionId: string): Promise<FantasySeasonStats> {
  const res = await api.get<FantasySeasonStats | { data: FantasySeasonStats }>(`/fantasy/${competitionId}/stats`)
  const stats = (res && 'data' in res && res.data) ? (res as any).data : res
  if (!stats) throw new Error('No fantasy stats returned')
  return stats as FantasySeasonStats
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
): Promise<{
  message: string
  cost: number
  type: string
  // Optional — present only once the backend ships coin-priced transfers.
  coinCost?: number
  walletBalance?: number
}> {
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
): Promise<OverallLeaderboardResponse> {
  return api.get<OverallLeaderboardResponse>(`/fantasy/${competitionId}/leaderboard?page=${page}`)
}

// GET /fantasy/:competitionId/leaderboard/gameweek/:gameweekId
export async function getGameweekLeaderboard(
  competitionId: string,
  gameweekId: string,
  page: number = 1,
): Promise<GameweekLeaderboardResponse> {
  return api.get<GameweekLeaderboardResponse>(
    `/fantasy/${competitionId}/leaderboard/gameweek/${gameweekId}?page=${page}`,
  )
}

export interface PlayerHistoryEntry {
  _id: string
  gameweekId: { 
    _id: string; 
    name: string; 
    gameweekNumber: number; 
    deadline: string 
  }
  totalPoints: number
  goalsScored: number
  assists: number
  yellowCards: number
  redCards: number
  ownGoals: number
  appeared: boolean
  
  goalPoints?: number
  assistPoints?: number
  yellowCardPoints?: number
  redCardPoints?: number
  ownGoalPoints?: number
  appearancePoints?: number
  cleanSheetPoints?: number
  goalsConcededPoints?: number
  penaltyMissPoints?: number
  penaltySavePoints?: number
  savePoints?: number
  bonusPoints?: number
}

// GET /fantasy/:competitionId/players/:fantasyPlayerId/history
export async function getPlayerHistory(
  competitionId: string,
  fantasyPlayerId: string,
): Promise<PlayerHistoryEntry[]> {
  const result = await api.get<{ data: PlayerHistoryEntry[] }>(
    `/fantasy/${competitionId}/players/${fantasyPlayerId}/history`,
  )
  return result.data
}

export interface GameweekTopPlayer {
  fantasyPlayerId: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  totalPoints: number
  player: {
    _id: string
    firstName: string
    lastName: string
    picture?: string
  }
  team: {
    _id: string
    name: string
    shortName?: string
    logoUrl?: string
    jersey?: {
      primaryColor: string
      secondaryColor: string
      jerseyPattern: JerseyPattern
    }
  }
}

// GET /fantasy/:competitionId/gameweeks/:gameweekId/top-players
export async function getGameweekTopPlayers(
  competitionId: string,
  gameweekId: string,
): Promise<GameweekTopPlayer[]> {
  const result = await api.get<{ data: GameweekTopPlayer[] }>(
    `/fantasy/${competitionId}/gameweeks/${gameweekId}/top-players`,
  )
  return result.data
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
