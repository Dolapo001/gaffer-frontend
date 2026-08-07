'use client'

import { useParams } from 'next/navigation'
import { TournamentBracket } from '@/components/admin/TournamentBracket'

export default function LeagueKnockoutPage() {
  const { leagueId } = useParams<{ leagueId: string }>()
  return (
    <div className="py-4">
      <TournamentBracket competitionId={leagueId} />
    </div>
  )
}
