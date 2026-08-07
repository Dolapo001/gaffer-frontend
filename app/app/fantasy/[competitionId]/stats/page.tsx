'use client'

import { useParams } from 'next/navigation'
import { FantasyStatsTab } from '@/components/fantasy/stats/FantasyStatsTab'

export default function FantasyStatsPage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  return <FantasyStatsTab competitionId={competitionId} />
}
