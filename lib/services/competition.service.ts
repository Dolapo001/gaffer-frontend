import { api } from '@/lib/api'

export interface Competition {
  _id: string
  orgId: string
  name: string
  sport: string
  gender: 'male' | 'female' | 'mixed'
  startDate: string
  endDate: string
  bannerUrl?: string
  status: 'draft' | 'published' | 'live' | 'completed' | 'archived'
  format?: string
  stages?: Stage[]
  rules?: {
    winPoints: number
    drawPoints: number
    lossPoints: number
    perGoalPoints: number
    cleanSheetPoints: number
    structure: 'single' | 'aggregate'
  }
  createdBy: { fullName: string | null; email: string }
  joinCode?: string
  createdAt: string
  updatedAt: string
}

export interface Stage {
  type: 'groups' | 'knockout' | 'league'
  groups?: { name: string }[]
  startingRound?: string
}

export interface CompetitionTeam {
  _id: string
  teamId: string
  name: string
  handle: string
  logoUrl?: string
  sport: string
  genderCategory?: string
  seed?: number
  groupName?: string
  playerCount?: number
  maxPlayers?: number
}

export interface CreateCompetitionPayload {
  name: string
  sport: string
  gender: 'male' | 'female' | 'mixed'
  startDate: string
  endDate: string
  bannerUrl?: string
  format?: string
  rules?: {
    winPoints: number
    drawPoints: number
    lossPoints: number
    perGoalPoints: number
    cleanSheetPoints: number
    structure: 'single' | 'aggregate'
  }
}

// GET /orgs/:orgId/competitions
export async function listCompetitions(orgId: string): Promise<Competition[]> {
  const data = await api.get<{ competitions: Competition[] }>(`/orgs/${orgId}/competitions`)
  return data.competitions
}

// POST /orgs/:orgId/competitions
export async function createCompetition(orgId: string, payload: CreateCompetitionPayload): Promise<Competition> {
  const data = await api.post<{ competition: Competition }>(`/orgs/${orgId}/competitions`, payload)
  return data.competition
}

// GET /competitions/:competitionId — PUBLIC
export async function getCompetition(competitionId: string): Promise<Competition> {
  const data = await api.get<{ competition: Competition }>(`/competitions/${competitionId}`, { public: true })
  return data.competition
}

// PATCH /competitions/:competitionId
export async function updateCompetition(
  competitionId: string,
  payload: Partial<CreateCompetitionPayload>,
): Promise<Competition> {
  const data = await api.patch<{ competition: Competition }>(`/competitions/${competitionId}`, payload)
  return data.competition
}

// DELETE /competitions/:competitionId
export async function archiveCompetition(competitionId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/competitions/${competitionId}`)
}

// PATCH /competitions/:competitionId/format
export async function setFormat(
  competitionId: string,
  format: string,
): Promise<Competition> {
  const data = await api.patch<{ competition: Competition }>(`/competitions/${competitionId}/format`, { format })
  return data.competition
}

// PATCH /competitions/:competitionId/stages
export async function setStages(competitionId: string, stages: Stage[]): Promise<Competition> {
  const data = await api.patch<{ competition: Competition }>(`/competitions/${competitionId}/stages`, { stages })
  return data.competition
}

// POST /competitions/:competitionId/publish
export async function publishCompetition(competitionId: string): Promise<Competition> {
  const data = await api.post<{ competition: Competition }>(`/competitions/${competitionId}/publish`)
  return data.competition
}

// GET /competitions/:competitionId/teams — PUBLIC
export async function listCompetitionTeams(competitionId: string): Promise<CompetitionTeam[]> {
  const data = await api.get<{ teams: CompetitionTeam[] }>(`/competitions/${competitionId}/teams`, { public: true })
  return data.teams
}

// POST /competitions/:competitionId/teams
export async function registerTeams(
  competitionId: string,
  teams: { teamId: string; seed?: number; groupName?: string }[],
): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/competitions/${competitionId}/teams`, { teams })
}

// PATCH /competitions/:competitionId/teams
export async function assignTeamGroups(
  competitionId: string,
  assignments: { teamId: string; groupName: string; seed?: number }[],
): Promise<{ message: string }> {
  return api.patch<{ message: string }>(`/competitions/${competitionId}/teams`, { assignments })
}

// ── Public Routes ──────────────────────────────────────────────────────────

// GET /public/competitions/:slug
export async function getPublicCompetitionBySlug(slug: string): Promise<Competition> {
  const data = await api.get<{ competition: Competition }>(`/public/competitions/${slug}`, { public: true })
  return data.competition
}

// DELETE /competitions/:competitionId/teams/:teamId
export async function removeCompetitionTeam(
  competitionId: string,
  teamId: string,
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/competitions/${competitionId}/teams/${teamId}`)
}

// POST /competitions/join
export async function joinCompetition(code: string): Promise<Competition> {
  const data = await api.post<{ competition: Competition }>('/competitions/join', { code })
  return data.competition
}

// GET /competitions/joined
export async function listJoinedCompetitions(): Promise<Competition[]> {
  const data = await api.get<{ competitions: Competition[] }>('/competitions/joined')
  return data.competitions
}
