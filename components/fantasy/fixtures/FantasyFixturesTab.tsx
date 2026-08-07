'use client'

import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { listFixtures } from '@/lib/services/fixture.service'
import { listCompetitionTeams } from '@/lib/services/competition.service'
import { GroupedFixturesView } from '@/components/league/GroupedFixturesView'

export function FantasyFixturesTab({ competitionId }: { competitionId: string }) {
  const router = useRouter()

  const { data: fixtures, isLoading } = useQuery({
    queryKey: ['fantasy-fixtures', competitionId],
    queryFn: () => listFixtures(competitionId),
  })

  const { data: compTeams } = useQuery({
    queryKey: ['competition-teams', competitionId],
    queryFn: () => listCompetitionTeams(competitionId),
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
