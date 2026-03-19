import { api } from '@/lib/api'

export interface Team {
  _id: string
  orgId: string
  name: string
  handle: string
  sport: string
  shortName?: string
  logoUrl?: string
  genderCategory?: 'male' | 'female' | 'mixed'
  homeVenue?: string
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface Player {
  _id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  position?: string
  jerseyNumber?: number
  nationality?: string
  role?: 'player' | 'goalkeeper' | 'captain'
  squadStatus: 'active' | 'injured' | 'suspended' | 'removed'
  teamId: string
  leftAt?: string
}

export interface PlayerInvite {
  _id: string
  email: string
  teamId: string
  expiresAt: string
  status: 'pending' | 'accepted' | 'revoked'
  inviteLink: string
  createdAt: string
}

export interface CreateTeamPayload {
  name: string
  handle: string
  sport: string
  shortName?: string
  logoUrl?: string
  genderCategory?: 'male' | 'female' | 'mixed'
  homeVenue?: string
}

// POST /orgs/:orgId/teams
export async function createTeam(orgId: string, payload: CreateTeamPayload): Promise<Team> {
  return api.post<Team>(`/orgs/${orgId}/teams`, payload)
}

// GET /orgs/:orgId/teams
export async function listTeams(orgId: string): Promise<Team[]> {
  return api.get<Team[]>(`/orgs/${orgId}/teams`)
}

// GET /teams/:teamId
export async function getTeam(teamId: string): Promise<Team> {
  return api.get<Team>(`/teams/${teamId}`)
}

// PATCH /teams/:teamId
export async function updateTeam(teamId: string, payload: Partial<CreateTeamPayload>): Promise<Team> {
  return api.patch<Team>(`/teams/${teamId}`, payload)
}

// DELETE /teams/:teamId
export async function archiveTeam(teamId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/teams/${teamId}`)
}

export interface AddPlayerPayload {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  dateOfBirth?: string
  position?: string
  jerseyNumber?: number
  nationality?: string
  role?: 'player' | 'goalkeeper' | 'captain'
}

// POST /teams/:teamId/players
export async function addPlayer(teamId: string, payload: AddPlayerPayload): Promise<Player> {
  return api.post<Player>(`/teams/${teamId}/players`, payload)
}

// GET /teams/:teamId/players
export async function listPlayers(teamId: string): Promise<Player[]> {
  return api.get<Player[]>(`/teams/${teamId}/players`)
}

// PATCH /teams/:teamId/players/:playerId
export async function updatePlayer(
  teamId: string,
  playerId: string,
  payload: { role?: string; squadStatus?: string; jerseyNumber?: number },
): Promise<Player> {
  return api.patch<Player>(`/teams/${teamId}/players/${playerId}`, payload)
}

// DELETE /teams/:teamId/players/:playerId
export async function removePlayer(teamId: string, playerId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/teams/${teamId}/players/${playerId}`)
}

// POST /teams/:teamId/player-invites
export async function createPlayerInvite(
  teamId: string,
  email: string,
): Promise<{ invite: { email: string; expiresAt: string; inviteLink: string } }> {
  return api.post(`/teams/${teamId}/player-invites`, { email })
}

// GET /teams/:teamId/player-invites
export async function listPlayerInvites(teamId: string): Promise<PlayerInvite[]> {
  return api.get<PlayerInvite[]>(`/teams/${teamId}/player-invites`)
}

// POST /player-invites/validate — PUBLIC
export async function validatePlayerInvite(
  token: string,
): Promise<{ invite: { email: string; teamId: string } }> {
  return api.post(`/player-invites/validate`, { token }, { public: true })
}

// POST /player-invites/accept — PUBLIC
export async function acceptPlayerInvite(payload: {
  token: string
  firstName: string
  lastName: string
  phone?: string
  dateOfBirth?: string
  position?: string
  jerseyNumber?: number
  nationality?: string
}): Promise<{ message: string }> {
  return api.post(`/player-invites/accept`, payload, { public: true })
}

// POST /player-invites/:inviteId/revoke
export async function revokePlayerInvite(inviteId: string): Promise<{ message: string }> {
  return api.post<{ message: string }>(`/player-invites/${inviteId}/revoke`)
}
