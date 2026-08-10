'use client'

import { useParams } from 'next/navigation'
import { FantasyStatsTab } from '@/components/fantasy/stats/FantasyStatsTab'

export default function LeagueStatsPage() {
  const { leagueId } = useParams<{ leagueId: string }>()
  return <FantasyStatsTab competitionId={leagueId} />
}
