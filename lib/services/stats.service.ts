import { api } from '@/lib/api'
import type { JerseyPattern } from '@/components/jersey/jerseyUtils'

export interface PlayerStatEntry {
  playerId: { _id: string; firstName: string; lastName: string; handle?: string; photoUrl?: string; position?: string }
  teamId: { _id: string; name: string; handle: string; shortName?: string }
  goals?: number
  assists?: number
  cleanSheets?: number
  yellowCards?: number
  redCards?: number
  appearances?: number
}

export interface TeamStatEntry {
  teamId: { _id: string; name: string; handle: string; logoUrl?: string }
  played?: number
  goalsFor?: number
  goalsAgainst?: number
  wins?: number
  draws?: number
  losses?: number
  yellowCards?: number
  redCards?: number
  shotsOnTarget?: number
  cornersFor?: number
}

// Dispatcher for dynamic stat types
export async function fetchPlayerStats(tournamentId: string, statType: string, limit: number = 100): Promise<PlayerStatEntry[]> {
  const normalized = statType.toLowerCase()
  if (normalized.includes('assist')) {
    return getTopAssists(tournamentId, limit)
  }
  if (normalized.includes('clean')) {
    return getCleanSheets(tournamentId, limit)
  }
  if (normalized.includes('card') || normalized.includes('discipline')) {
    return getDisciplineStats(tournamentId, limit)
  }
  return getTopScorers(tournamentId, limit)
}

// GET /tournaments/:tournamentId/stats/players/top-scorers — PUBLIC
export async function getTopScorers(tournamentId: string, limit: number = 100): Promise<PlayerStatEntry[]> {
  const data = await api.get<{ results: PlayerStatEntry[] }>(`/tournaments/${tournamentId}/stats/players/top-scorers?limit=${limit}`, { public: true })
  // Backwards compatibility/mapping nested stats if needed
  return (data.results || []).map(r => ({
    ...r,
    goals: (r as any).stats?.goals ?? r.goals,
    assists: (r as any).stats?.assists ?? r.assists,
    cleanSheets: (r as any).stats?.cleanSheets ?? r.cleanSheets,
    yellowCards: (r as any).stats?.yellowCards ?? r.yellowCards,
    redCards: (r as any).stats?.redCards ?? r.redCards,
  }))
}

// GET /tournaments/:tournamentId/stats/players/top-assists — PUBLIC
export async function getTopAssists(tournamentId: string, limit: number = 100): Promise<PlayerStatEntry[]> {
  const data = await api.get<{ results: PlayerStatEntry[] }>(`/tournaments/${tournamentId}/stats/players/top-assists?limit=${limit}`, { public: true })
  return (data.results || []).map(r => ({
    ...r,
    goals: (r as any).stats?.goals ?? r.goals,
    assists: (r as any).stats?.assists ?? r.assists,
    cleanSheets: (r as any).stats?.cleanSheets ?? r.cleanSheets,
    yellowCards: (r as any).stats?.yellowCards ?? r.yellowCards,
    redCards: (r as any).stats?.redCards ?? r.redCards,
  }))
}

// GET /tournaments/:tournamentId/stats/players/clean-sheets — PUBLIC
export async function getCleanSheets(tournamentId: string, limit: number = 100): Promise<PlayerStatEntry[]> {
  const data = await api.get<{ results: PlayerStatEntry[] }>(`/tournaments/${tournamentId}/stats/players/clean-sheets?limit=${limit}`, { public: true })
  return (data.results || []).map(r => ({
    ...r,
    goals: (r as any).stats?.goals ?? r.goals,
    assists: (r as any).stats?.assists ?? r.assists,
    cleanSheets: (r as any).stats?.cleanSheets ?? r.cleanSheets,
    yellowCards: (r as any).stats?.yellowCards ?? r.yellowCards,
    redCards: (r as any).stats?.redCards ?? r.redCards,
  }))
}

// GET /tournaments/:tournamentId/stats/players/discipline — PUBLIC
export async function getDisciplineStats(tournamentId: string, limit: number = 100): Promise<PlayerStatEntry[]> {
  const data = await api.get<{ results: PlayerStatEntry[] }>(`/tournaments/${tournamentId}/stats/players/discipline?limit=${limit}`, { public: true })
  return (data.results || []).map(r => ({
    ...r,
    goals: (r as any).stats?.goals ?? r.goals,
    assists: (r as any).stats?.assists ?? r.assists,
    yellowCards: (r as any).stats?.yellowCards ?? r.yellowCards,
    redCards: (r as any).stats?.redCards ?? r.redCards,
  }))
}

// GET /tournaments/:tournamentId/stats/teams — PUBLIC
export async function getTeamStats(tournamentId: string): Promise<TeamStatEntry[]> {
  const data = await api.get<{ results: TeamStatEntry[] }>(`/tournaments/${tournamentId}/stats/teams`, { public: true })
  return (data.results || []).map(r => ({
    ...r,
    ...((r as any).stats || {}), // Backend might wrap them in stats
  }))
}

// GET /tournaments/:tournamentId/stats/teams/attack — PUBLIC
export async function getTeamAttackStats(tournamentId: string): Promise<TeamStatEntry[]> {
  const data = await api.get<{ results: TeamStatEntry[] }>(`/tournaments/${tournamentId}/stats/teams/attack`, { public: true })
  return (data.results || []).map(r => ({
    ...r,
    ...((r as any).stats || {}),
  }))
}

// GET /tournaments/:tournamentId/stats/teams/discipline — PUBLIC
export async function getTeamDisciplineStats(tournamentId: string): Promise<TeamStatEntry[]> {
  const data = await api.get<{ results: TeamStatEntry[] }>(`/tournaments/${tournamentId}/stats/teams/discipline`, { public: true })
  return (data.results || []).map(r => ({
    ...r,
    ...((r as any).stats || {}),
  }))
}

// POST /tournaments/:tournamentId/rebuild — requires admin+
export async function rebuildTournamentStats(tournamentId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/tournaments/${tournamentId}/rebuild`)
}

// POST /tournaments/:tournamentId/fixtures/:fixtureId/rebuild — requires admin+
export async function rebuildFixtureStats(
  tournamentId: string,
  fixtureId: string,
): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/tournaments/${tournamentId}/fixtures/${fixtureId}/rebuild`)
}

// ── Team of the Week ────────────────────────────────────────────────────────

export interface TOTWPlayer {
  id: string
  name: string
  fullName: string
  position: 'GK' | 'DEF' | 'MID' | 'FWD'
  points: number
  rating?: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  teamName: string
  logoUrl?: string | null
  jersey: {
    primaryColor: string
    secondaryColor: string
    jerseyPattern: JerseyPattern
  }
  status: 'normal' | 'warning' | 'suspended'
}

export interface TOTWResponse {
  results: TOTWPlayer[]
  formation: string
  selectedGameweek?: number
  maxGameweek?: number
}

// GET /tournaments/:tournamentId/totw — PUBLIC
export async function getTOTW(tournamentId: string, gameweek?: number): Promise<TOTWResponse> {
  const qs = gameweek ? `?gameweek=${gameweek}` : ''
  const data = await api.get<TOTWResponse>(`/tournaments/${tournamentId}/totw${qs}`, { public: true })
  return {
    results: data.results ?? [],
    formation: data.formation ?? '4-3-3',
    selectedGameweek: data.selectedGameweek ?? 1,
    maxGameweek: data.maxGameweek ?? 1,
  }
}
