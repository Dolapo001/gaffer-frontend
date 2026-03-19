/**
 * League Service
 *
 * Wraps all league/match-related API calls. Falls back to mock data
 * until the backend is connected.
 */

import { apiClient } from '@/lib/apiClient'
import {
  STANDINGS,
  MATCHES,
  TOP_PLAYERS,
  ALL_PLAYERS,
  type Standing,
  type Match,
  type Player,
} from '@/lib/leagueMockData'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const leagueService = {
  /** Fetch standings for a league. */
  async getStandings(leagueId: string): Promise<Standing[]> {
    if (USE_MOCK) {
      await delay(500)
      return STANDINGS
    }
    return apiClient.get<Standing[]>(`/leagues/${leagueId}/standings`)
  },

  /** Fetch all matches (optionally filtered by status). */
  async getMatches(
    leagueId: string,
    status?: 'scheduled' | 'live' | 'finished',
  ): Promise<Match[]> {
    if (USE_MOCK) {
      await delay(500)
      return status ? MATCHES.filter((m) => m.status === status) : MATCHES
    }
    const qs = status ? `?status=${status}` : ''
    return apiClient.get<Match[]>(`/leagues/${leagueId}/matches${qs}`)
  },

  /** Fetch a single match by ID. */
  async getMatch(matchId: string): Promise<Match> {
    if (USE_MOCK) {
      await delay(300)
      const match = MATCHES.find((m) => m.id === matchId)
      if (!match) throw new Error(`Match ${matchId} not found`)
      return match
    }
    return apiClient.get<Match>(`/matches/${matchId}`)
  },

  /** Fetch top scorers for a league. */
  async getTopScorers(leagueId: string, limit = 10): Promise<Player[]> {
    if (USE_MOCK) {
      await delay(400)
      return [...TOP_PLAYERS].sort((a, b) => b.goals - a.goals).slice(0, limit)
    }
    return apiClient.get<Player[]>(`/leagues/${leagueId}/top-scorers?limit=${limit}`)
  },

  /** Fetch all players in a league. */
  async getPlayers(leagueId: string): Promise<Player[]> {
    if (USE_MOCK) {
      await delay(400)
      return ALL_PLAYERS
    }
    return apiClient.get<Player[]>(`/leagues/${leagueId}/players`)
  },
}
