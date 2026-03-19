import { api } from '@/lib/api'

export interface Standing {
  teamId: {
    _id: string
    name: string
    handle: string
    logoUrl?: string
  }
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
}

export interface StandingsResponse {
  standings: Standing[]
  total: number
  page: number
  pageSize: number
}

// GET /competitions/:competitionId/standings — PUBLIC
export async function getStandings(
  competitionId: string,
  params?: { page?: number; limit?: number },
): Promise<StandingsResponse> {
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : ''
  return api.get<StandingsResponse>(`/competitions/${competitionId}/standings${qs}`, { public: true })
}
