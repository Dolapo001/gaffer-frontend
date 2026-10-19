import { api } from '@/lib/api'

export interface CoachPlayer {
  id: string
  name: string
  fullName: string
  position: string | null
  jerseyNumber: number | null
  photoUrl: string | null
}

export interface CoachFixture {
  id: string
  kickoffAt: string
  venue: string | null
  status: 'scheduled' | 'live' | 'halftime'
  home: boolean
  opponent: { name: string; shortName?: string; logoUrl: string | null } | null
  lineup: { starters: string[]; status: 'pending' | 'approved' } | null
}

export interface CoachTeam {
  teamId: string
  name: string
  handle: string
  logoUrl: string | null
  recruitmentLink: string
  squadConfirmedAt: string | null
  squad: CoachPlayer[]
  fixtures: CoachFixture[]
}

const PENDING_KEY = 'gaffer-pending-coach-token'

/** A coach invite link opened by someone who is not signed in yet: remember it, and finish after they sign in or sign up. */
export const pendingCoachToken = {
  get: (): string | null => { try { return localStorage.getItem(PENDING_KEY) } catch { return null } },
  set: (t: string) => { try { localStorage.setItem(PENDING_KEY, t) } catch { /* private mode */ } },
  clear: () => { try { localStorage.removeItem(PENDING_KEY) } catch { /* private mode */ } },
}

// GET /coach/invites/:token — public: what the invite is for
export const peekCoachInvite = (token: string) =>
  api.get<{ teamName: string; logoUrl: string | null; orgName: string | null }>(`/coach/invites/${token}`, { public: true })

// POST /coach/invites/:token/accept
export const acceptCoachInvite = (token: string) =>
  api.post<{ teamId: string; teamName: string | null }>(`/coach/invites/${token}/accept`)

// GET /coach/me — the teams this person coaches
export async function getMyCoachTeams(): Promise<CoachTeam[]> {
  const data = await api.get<{ teams: CoachTeam[] }>('/coach/me')
  return data.teams ?? []
}

// POST /coach/teams/:teamId/confirm-squad
export const confirmSquad = (teamId: string) =>
  api.post<{ squadConfirmedAt: string; players: number }>(`/coach/teams/${teamId}/confirm-squad`)

// POST /coach/fixtures/:fixtureId/lineup
export const submitCoachLineup = (fixtureId: string, starters: string[]) =>
  api.post<{ message: string; starters: number }>(`/coach/fixtures/${fixtureId}/lineup`, { starters })

// Organisation side: POST /coach/teams/:teamId/invite
export const createCoachInvite = (teamId: string) =>
  api.post<{ link: string; expiresAt: string; teamName: string }>(`/coach/teams/${teamId}/invite`)
