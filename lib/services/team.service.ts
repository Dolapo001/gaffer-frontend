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
  playerCount?: number
  maxPlayers?: number
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
  role?: 'player' | 'captain' | 'coach'
  squadStatus: 'active' | 'injured' | 'suspended' | 'removed'
  price?: number
  playerId?: any // populated Player document when fetching TeamPlayers
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
  const data = await api.post<{ team: Team }>(`/orgs/${orgId}/teams`, payload)
  return data.team
}

// GET /orgs/:orgId/teams
export async function listTeams(orgId: string): Promise<Team[]> {
  const data = await api.get<{ teams: Team[] }>(`/orgs/${orgId}/teams`)
  return data.teams
}

// GET /teams/:teamId
export async function getTeam(teamId: string): Promise<Team> {
  const data = await api.get<{ team: Team }>(`/teams/${teamId}`)
  return data.team
}

// PATCH /teams/:teamId
export async function updateTeam(teamId: string, payload: Partial<CreateTeamPayload>): Promise<Team> {
  const data = await api.patch<{ team: Team }>(`/teams/${teamId}`, payload)
  return data.team
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
  role?: 'player' | 'captain' | 'coach'
}

// POST /teams/:teamId/players
export async function addPlayer(teamId: string, payload: AddPlayerPayload): Promise<Player> {
  const data = await api.post<{ player: Player }>(`/teams/${teamId}/players`, payload)
  return data.player
}

// GET /teams/:teamId/players
export async function listPlayers(teamId: string): Promise<Player[]> {
  const data = await api.get<{ players: Player[] }>(`/teams/${teamId}/players`)
  return data.players
}

// PATCH /teams/:teamId/players/:playerId
export async function updatePlayer(
  teamId: string,
  playerId: string,
  payload: { role?: 'player' | 'captain' | 'coach'; squadStatus?: string; jerseyNumber?: number; price?: number },
): Promise<Player> {
  const data = await api.patch<{ player: Player }>(`/teams/${teamId}/players/${playerId}`, payload)
  return data.player
}

// DELETE /teams/:teamId/players/:playerId
export async function removePlayer(teamId: string, playerId: string): Promise<{ message: string }> {
  return api.delete<{ message: string }>(`/teams/${teamId}/players/${playerId}`)
}

// POST /teams/:teamId/players/:playerId/photo  (multipart)
export async function uploadPlayerPhoto(
  teamId: string,
  playerId: string,
  file: File,
): Promise<{ photoUrl: string; photoPublicId: string }> {
  const form = new FormData()
  form.append('photo', file)
  const data = await api.post<{ player: any }>(
    `/teams/${teamId}/players/${playerId}/photo`,
    form,
  )
  return { photoUrl: data.player.photoUrl, photoPublicId: data.player.photoPublicId }
}

// POST /teams/:teamId/player-invites
export async function createPlayerInvite(
  teamId: string,
  email: string,
): Promise<{ email: string; expiresAt: string; inviteLink: string }> {
  // Backend returns { message, invite: { email, expiresAt, inviteLink } }
  const data = await api.post<{ invite: { email: string; expiresAt: string; inviteLink: string } }>(
    `/teams/${teamId}/player-invites`,
    { email },
  )
  return data.invite
}

// GET /teams/:teamId/player-invites
export async function listPlayerInvites(teamId: string): Promise<PlayerInvite[]> {
  const data = await api.get<{ invites: PlayerInvite[] }>(`/teams/${teamId}/player-invites`)
  return data.invites
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

// ── Public Routes (Recruitment) ──────────────────────────────────────────

// GET /public/teams/:teamHandle
export async function getPublicTeamByHandle(handle: string): Promise<Team> {
  const data = await api.get<{ team: Team }>(`/public/teams/${handle}`, { public: true })
  return data.team
}

// POST /public/teams/:teamHandle/register
export async function registerPublicPlayer(handle: string, payload: AddPlayerPayload): Promise<{ message: string; player: Player }> {
  return api.post(`/public/teams/${handle}/register`, payload, { public: true })
}

// POST /public/teams/:teamHandle/players/:playerId/photo  (multipart, no auth)
export async function uploadPublicPlayerPhoto(
  teamHandle: string,
  playerId: string,
  file: File,
): Promise<void> {
  const form = new FormData()
  form.append('photo', file)
  await api.post(`/public/teams/${teamHandle}/players/${playerId}/photo`, form, { public: true })
}
