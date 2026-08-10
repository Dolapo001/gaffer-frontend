'use client'

import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { listFixtures } from '@/lib/services/fixture.service'
import { listCompetitionTeams } from '@/lib/services/competition.service'
import { GroupedFixturesView } from '@/components/league/GroupedFixturesView'

export default function LeagueMatchesPage() {
  const router = useRouter()
  const { leagueId } = useParams<{ leagueId: string }>()

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['fixtures', leagueId],
    queryFn: () => listFixtures(leagueId),
    refetchInterval: 20_000,
  })

  const { data: compTeams } = useQuery({
    queryKey: ['competition-teams', leagueId],
    queryFn: () => listCompetitionTeams(leagueId),
  })

  return (
    <GroupedFixturesView
      fixtures={fixtures}
      compTeams={compTeams}
      isLoading={isLoading}
      onFixtureClick={(id) => router.push(`/app/match/${id}`)}
    />
  )
}
