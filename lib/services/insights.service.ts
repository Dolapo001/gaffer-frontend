import { api } from '@/lib/api'

export interface InsightPlayer {
  id: string
  name: string
  position?: string
  club?: string
  /** How many (managers, rounds or transfers, depending on the list) */
  count?: number
  /** Share of managers, where that makes sense */
  pct?: number
  points?: number
  ownershipPct?: number
}

export interface InsightsData {
  generatedAt: string
  headline: {
    managers: number
    teamsPicked: number
    joinedNoTeam: number
    matchesPlayed: number
    goals: number
    averageManagerPoints: number
    averageTeamValue: number | null
  }
  players: {
    mostPicked: InsightPlayer[]
    mostStarted: InsightPlayer[]
    mostCaptained: InsightPlayer[]
    mostViceCaptained: InsightPlayer[]
    captainedMostRounds: InsightPlayer[]
    transfersIn: InsightPlayer[]
    transfersOut: InsightPlayer[]
    topPoints: InsightPlayer[]
    hiddenGems: InsightPlayer[]
  }
  managers: {
    top: { rank: number; teamName: string; manager: string; points: number }[]
    bestRounds: { teamName: string; manager: string; points: number }[]
    chips: { chip: string; count: number }[]
  }
  tournament: {
    matchesPlayed: number
    goals: number
    goalsPerMatch: number
    yellowCards: number
    redCards: number
    topScorers: { id: string; name: string; count: number }[]
    topAssists: { id: string; name: string; count: number }[]
    manOfTheMatch: { id: string; name: string; count: number }[]
    cleanSheets: { id: string; name: string; count: number }[]
  }
  platform?: {
    users: number
    signupsLast30Days: number
    signupsByDay: { day: string; count: number }[]
    activeLast7Days: number
    alertsOn: number
    alertsOnPct: number
    organisations: number
    tournamentsByStatus: Record<string, number>
  }
}

/** One tournament's insights (organiser). */
export async function getTournamentInsights(competitionId: string): Promise<InsightsData> {
  const res = await api.get<{ data: InsightsData }>(`/fantasy/${competitionId}/insights`)
  return res.data
}

/** HQ: one tournament, or every tournament when no id is given, plus the platform numbers. */
export async function getHqInsights(competitionId?: string): Promise<InsightsData> {
  const qs = competitionId ? `?competitionId=${competitionId}` : ''
  const res = await api.get<{ data: InsightsData }>(`/platform/insights${qs}`)
  return res.data
}
