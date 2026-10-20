import { api } from '@/lib/api'

export interface FantasyRecap {
  competitionId: string
  tournament: string
  managerName: string
  teamName: string
  totalPoints: number
  rank: number
  managers: number
  beatPercent: number
  roundsPlayed: number
  bestRound: { name: string; points: number; average: number } | null
  bestCaptain: { name: string; points: number; round: string } | null
  captainExtra: number
  starPlayer: { name: string; points: number } | null
  chips: string[]
  transfers: number
  transferHits: number
  title: string
  titleLine: string
}

// GET /fantasy-recaps/pending — tournaments the signed-in person has a recap for and has not seen
export async function getPendingRecaps(): Promise<{ competitionId: string; name: string }[]> {
  const data = await api.get<{ recaps: { competitionId: string; name: string }[] }>('/fantasy-recaps/pending')
  return data.recaps ?? []
}

// GET /fantasy-recaps/:competitionId
export const getFantasyRecap = (competitionId: string) => api.get<FantasyRecap>(`/fantasy-recaps/${competitionId}`)

// POST /fantasy-recaps/:competitionId/seen
export const markRecapSeen = (competitionId: string) => api.post<{ ok: boolean }>(`/fantasy-recaps/${competitionId}/seen`)
