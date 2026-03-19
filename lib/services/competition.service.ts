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
  status: 'draft' | 'published' | 'archived'
  format?: string
  stages?: Stage[]
  createdBy: { fullName: string | null; email: string }
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
}

export interface CreateCompetitionPayload {
  name: string
  sport: string
  gender: 'male' | 'female' | 'mixed'
  startDate: string
  endDate: string
  bannerUrl?: string
}

// GET /orgs/:orgId/competitions
export async function listCompetitions(orgId: string): Promise<Competition[]> {
  return api.get<Competition[]>(`/orgs/${orgId}/competitions`)
}

// POST /orgs/:orgId/competitions
export async function createCompetition(orgId: string, payload: CreateCompetitionPayload): Promise<Competition> {
  return api.post<Competition>(`/orgs/${orgId}/competitions`, payload)
}

// GET /competitions/:competitionId — PUBLIC
export async function getCompetition(competitionId: string): Promise<Competition> {
  return api.get<Competition>(`/competitions/${competitionId}`, { public: true })
}

// PATCH /competitions/:competitionId
export async function updateCompetition(
  competitionId: string,
  payload: Partial<CreateCompetitionPayload>,
): Promise<Competition> {
  return api.patch<Competition>(`/competitions/${competitionId}`, payload)
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
  return api.patch<Competition>(`/competitions/${competitionId}/format`, { format })
}

// PATCH /competitions/:competitionId/stages
export async function setStages(competitionId: string, stages: Stage[]): Promise<Competition> {
  return api.patch<Competition>(`/competitions/${competitionId}/stages`, { stages })
}

// POST /competitions/:competitionId/publish
export async function publishCompetition(competitionId: string): Promise<Competition> {
  return api.post<Competition>(`/competitions/${competitionId}/publish`)
}

// GET /competitions/:competitionId/teams — PUBLIC
export async function listCompetitionTeams(competitionId: string): Promise<CompetitionTeam[]> {
  return api.get<CompetitionTeam[]>(`/competitions/${competitionId}/teams`, { public: true })
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

// DELETE /competitions/:competitionId/teams/:teamId
export async function removeCompetitionTeam(
  competitionId: string,
  teamId: string,
): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/competitions/${competitionId}/teams/${teamId}`)
}
