import { api } from '@/lib/api'

export interface PlayerStatEntry {
  playerId: { _id: string; firstName: string; lastName: string }
  teamId: { _id: string; name: string; handle: string }
  goals?: number
  assists?: number
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

// GET /tournaments/:tournamentId/stats/players/top-scorers — PUBLIC
export async function getTopScorers(tournamentId: string): Promise<PlayerStatEntry[]> {
  return api.get<PlayerStatEntry[]>(`/tournaments/${tournamentId}/stats/players/top-scorers`, { public: true })
}

// GET /tournaments/:tournamentId/stats/players/top-assists — PUBLIC
export async function getTopAssists(tournamentId: string): Promise<PlayerStatEntry[]> {
  return api.get<PlayerStatEntry[]>(`/tournaments/${tournamentId}/stats/players/top-assists`, { public: true })
}

// GET /tournaments/:tournamentId/stats/players/discipline — PUBLIC
export async function getDisciplineStats(tournamentId: string): Promise<PlayerStatEntry[]> {
  return api.get<PlayerStatEntry[]>(`/tournaments/${tournamentId}/stats/players/discipline`, { public: true })
}

// GET /tournaments/:tournamentId/stats/teams — PUBLIC
export async function getTeamStats(tournamentId: string): Promise<TeamStatEntry[]> {
  return api.get<TeamStatEntry[]>(`/tournaments/${tournamentId}/stats/teams`, { public: true })
}

// GET /tournaments/:tournamentId/stats/teams/attack — PUBLIC
export async function getTeamAttackStats(tournamentId: string): Promise<TeamStatEntry[]> {
  return api.get<TeamStatEntry[]>(`/tournaments/${tournamentId}/stats/teams/attack`, { public: true })
}

// GET /tournaments/:tournamentId/stats/teams/discipline — PUBLIC
export async function getTeamDisciplineStats(tournamentId: string): Promise<TeamStatEntry[]> {
  return api.get<TeamStatEntry[]>(`/tournaments/${tournamentId}/stats/teams/discipline`, { public: true })
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
