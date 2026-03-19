/**
 * Admin Service
 *
 * Wraps all organisation-admin API calls (tournaments, teams, groups,
 * schedule, players). Falls back to mock data until the backend is live.
 */

import { apiClient } from '@/lib/apiClient'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminTeam {
  id: string
  name: string
  logoUrl?: string
  playerCount: number
}

export interface AdminGroup {
  id: string
  name: string
  teams: AdminTeam[]
}

export interface Tournament {
  id: string
  name: string
  slug: string
  format: 'league' | 'knockout' | 'group+knockout'
  status: 'draft' | 'active' | 'completed'
  teamCount: number
  startDate?: string
  endDate?: string
}

export interface ScheduledMatch {
  id: string
  homeTeamId: string
  awayTeamId: string
  scheduledAt: string
  venue?: string
  status: 'scheduled' | 'live' | 'finished'
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const adminService = {
  // ── Tournaments ──────────────────────────────────────────────────────────

  async getTournaments(orgId: string): Promise<Tournament[]> {
    if (USE_MOCK) {
      await delay(500)
      return []
    }
    return apiClient.get<Tournament[]>(`/admin/orgs/${orgId}/tournaments`)
  },

  async createTournament(orgId: string, data: Partial<Tournament>): Promise<Tournament> {
    if (USE_MOCK) {
      await delay(600)
      return { id: crypto.randomUUID(), name: data.name ?? 'New Tournament', slug: data.name?.toLowerCase().replace(/\s+/g, '-') ?? '', format: 'league', status: 'draft', teamCount: 0 }
    }
    return apiClient.post<Tournament>(`/admin/orgs/${orgId}/tournaments`, data)
  },

  // ── Teams ────────────────────────────────────────────────────────────────

  async getTeams(orgId: string): Promise<AdminTeam[]> {
    if (USE_MOCK) {
      await delay(400)
      return []
    }
    return apiClient.get<AdminTeam[]>(`/admin/orgs/${orgId}/teams`)
  },

  async createTeam(orgId: string, data: Partial<AdminTeam>): Promise<AdminTeam> {
    if (USE_MOCK) {
      await delay(500)
      return { id: crypto.randomUUID(), name: data.name ?? 'New Team', playerCount: 0 }
    }
    return apiClient.post<AdminTeam>(`/admin/orgs/${orgId}/teams`, data)
  },

  // ── Groups ───────────────────────────────────────────────────────────────

  async getGroups(orgId: string): Promise<AdminGroup[]> {
    if (USE_MOCK) {
      await delay(400)
      return []
    }
    return apiClient.get<AdminGroup[]>(`/admin/orgs/${orgId}/groups`)
  },

  async createGroup(orgId: string, data: Partial<AdminGroup>): Promise<AdminGroup> {
    if (USE_MOCK) {
      await delay(500)
      return { id: crypto.randomUUID(), name: data.name ?? 'New Group', teams: [] }
    }
    return apiClient.post<AdminGroup>(`/admin/orgs/${orgId}/groups`, data)
  },

  // ── Schedule ─────────────────────────────────────────────────────────────

  async getSchedule(orgId: string): Promise<ScheduledMatch[]> {
    if (USE_MOCK) {
      await delay(500)
      return []
    }
    return apiClient.get<ScheduledMatch[]>(`/admin/orgs/${orgId}/schedule`)
  },

  async scheduleMatch(orgId: string, data: Partial<ScheduledMatch>): Promise<ScheduledMatch> {
    if (USE_MOCK) {
      await delay(500)
      return { id: crypto.randomUUID(), homeTeamId: data.homeTeamId ?? '', awayTeamId: data.awayTeamId ?? '', scheduledAt: data.scheduledAt ?? new Date().toISOString(), status: 'scheduled' }
    }
    return apiClient.post<ScheduledMatch>(`/admin/orgs/${orgId}/schedule`, data)
  },

  async updateMatchResult(matchId: string, homeScore: number, awayScore: number): Promise<ScheduledMatch> {
    if (USE_MOCK) {
      await delay(400)
      return { id: matchId, homeTeamId: '', awayTeamId: '', scheduledAt: '', status: 'finished' }
    }
    return apiClient.patch<ScheduledMatch>(`/admin/matches/${matchId}/result`, { homeScore, awayScore })
  },
}
