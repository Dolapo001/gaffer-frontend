/**
 * Fantasy Service
 *
 * Wraps all fantasy-team-related API calls. Falls back to mock data
 * until the backend is connected.
 */

import { apiClient } from '@/lib/apiClient'
import { SQUAD, type FantasySquadPlayer } from '@/lib/fantasyMockData'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export interface FantasyTeam {
  id: string
  name: string
  totalPoints: number
  gameweek: number
  squad: FantasySquadPlayer[]
}

export interface TransferResult {
  success: boolean
  transfersRemaining: number
}

export const fantasyService = {
  /** Fetch the authenticated user's fantasy squad. */
  async getSquad(userId: string): Promise<FantasySquadPlayer[]> {
    if (USE_MOCK) {
      await delay(600)
      return SQUAD
    }
    return apiClient.get<FantasySquadPlayer[]>(`/fantasy/users/${userId}/squad`)
  },

  /** Save an updated squad (after substitutions / captain changes). */
  async saveSquad(
    userId: string,
    squad: FantasySquadPlayer[],
  ): Promise<{ success: boolean }> {
    if (USE_MOCK) {
      await delay(400)
      return { success: true }
    }
    return apiClient.put<{ success: boolean }>(`/fantasy/users/${userId}/squad`, { squad })
  },

  /** Make a transfer (sell one player, buy another). */
  async makeTransfer(
    userId: string,
    outPlayerId: string,
    inPlayerId: string,
  ): Promise<TransferResult> {
    if (USE_MOCK) {
      await delay(500)
      return { success: true, transfersRemaining: 1 }
    }
    return apiClient.post<TransferResult>(`/fantasy/users/${userId}/transfers`, {
      outPlayerId,
      inPlayerId,
    })
  },

  /** Fetch total and per-gameweek points for a user. */
  async getPoints(userId: string): Promise<{ total: number; gameweek: number; history: { gw: number; pts: number }[] }> {
    if (USE_MOCK) {
      await delay(400)
      return { total: 312, gameweek: 54, history: [] }
    }
    return apiClient.get(`/fantasy/users/${userId}/points`)
  },
}
