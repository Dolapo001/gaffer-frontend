import { api } from '@/lib/api'

export interface PlayerStatEntry {
  playerId: { _id: string; firstName: string; lastName: string; handle?: string; photoUrl?: string }
  teamId: { _id: string; name: string; handle: string; shortName?: string }
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
  const data = await api.get<{ results: PlayerStatEntry[] }>(`/tournaments/${tournamentId}/stats/players/top-scorers`, { public: true })
  // Backwards compatibility/mapping nested stats if needed
  return (data.results || []).map(r => ({
    ...r,
    goals: (r as any).stats?.goals ?? r.goals,
    assists: (r as any).stats?.assists ?? r.assists,
    yellowCards: (r as any).stats?.yellowCards ?? r.yellowCards,
    redCards: (r as any).stats?.redCards ?? r.redCards,
  }))
}

// GET /tournaments/:tournamentId/stats/players/top-assists — PUBLIC
export async function getTopAssists(tournamentId: string): Promise<PlayerStatEntry[]> {
  const data = await api.get<{ results: PlayerStatEntry[] }>(`/tournaments/${tournamentId}/stats/players/top-assists`, { public: true })
  return (data.results || []).map(r => ({
    ...r,
    goals: (r as any).stats?.goals ?? r.goals,
    assists: (r as any).stats?.assists ?? r.assists,
    yellowCards: (r as any).stats?.yellowCards ?? r.yellowCards,
    redCards: (r as any).stats?.redCards ?? r.redCards,
  }))
}

// GET /tournaments/:tournamentId/stats/players/discipline — PUBLIC
export async function getDisciplineStats(tournamentId: string): Promise<PlayerStatEntry[]> {
  const data = await api.get<{ results: PlayerStatEntry[] }>(`/tournaments/${tournamentId}/stats/players/discipline`, { public: true })
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
