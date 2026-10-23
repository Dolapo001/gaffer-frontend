import { api } from '@/lib/api'

export interface PublicPlayer {
  id: string
  name: string
  fullName: string
  position: string | null
  jerseyNumber: number | null
  nationality: string | null
  photoUrl: string | null
}

export interface PlayerTotals {
  matches: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  cleanSheets: number
  avgRating: number | null
}

export interface PlayerTournament {
  id: string
  name: string
  status: string
  startDate: string | null
  team: { name: string; logoUrl: string | null } | null
  matches: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  cleanSheets: number
  avgRating: number | null
}

export interface PlayerProfile {
  player: PublicPlayer
  teams: { id: string; name: string; handle: string; logoUrl: string | null; role: string }[]
  totals: PlayerTotals
  tournaments: PlayerTournament[]
  followers: number
  isFollowing: boolean
}

export interface PlayerMatch {
  fixtureId: string
  date: string
  tournament: string | null
  status: string
  home: { name: string; logoUrl: string | null } | null
  away: { name: string; logoUrl: string | null } | null
  score: { home: number; away: number } | null
  result: 'W' | 'D' | 'L' | null
  played: boolean
  started: boolean
  benched: boolean
  rating: number | null
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  ownGoals: number
}

export interface PlayerFantasy {
  competitionId: string
  tournament: string
  position: string | null
  price: number | null
  selectedPercent: number
  totalPoints: number
  pointsPerMatch: number
  form: number | null
  rounds: { round: number; name: string; points: number; appeared: boolean }[]
  priceHistory: { round: number; price: number }[]
}

export interface SearchResults {
  players: (PublicPlayer & { team: { name: string; logoUrl: string | null } | null })[]
  teams: { id: string; name: string; handle: string; logoUrl: string | null }[]
  competitions: { id: string; name: string; status: string }[]
  matches: { id: string; date: string; status: string; tournament: string | null; home: { name: string; logoUrl: string | null } | null; away: { name: string; logoUrl: string | null } | null; score: { home: number; away: number } | null }[]
}

export type SearchType = 'all' | 'player' | 'team' | 'match' | 'competition'

export const getPlayerProfile = (id: string) => api.get<PlayerProfile>(`/profiles/players/${id}`)

export async function getPlayerMatches(id: string): Promise<PlayerMatch[]> {
  const d = await api.get<{ matches: PlayerMatch[] }>(`/profiles/players/${id}/matches`)
  return d.matches ?? []
}

export async function getPlayerFantasy(id: string): Promise<PlayerFantasy[]> {
  const d = await api.get<{ fantasy: PlayerFantasy[] }>(`/profiles/players/${id}/fantasy`)
  return d.fantasy ?? []
}

export const searchEverything = (q: string, type: SearchType = 'all') => api.get<SearchResults>(`/search?q=${encodeURIComponent(q)}&type=${type}`)

// ── Follows ─────────────────────────────────────────────────────────────────

export type FollowTarget = 'user' | 'org' | 'team' | 'player'

export const followTarget = (targetType: FollowTarget, targetId: string) =>
  api.post<{ following: boolean; followers: number }>('/follows', { targetType, targetId })

export const unfollowTarget = (targetType: FollowTarget, targetId: string) =>
  api.delete<{ following: boolean; followers: number }>(`/follows/${targetType}/${targetId}`)

export async function getFollowStatus(targetType: FollowTarget, ids: string[]): Promise<Record<string, boolean>> {
  if (ids.length === 0) return {}
  const d = await api.get<{ following: Record<string, boolean> }>(`/follows/status?targetType=${targetType}&ids=${ids.join(',')}`)
  return d.following ?? {}
}
