'use client'

import { useParams } from 'next/navigation'
import { MyTeamTab } from '@/components/fantasy/team/MyTeamTab'

export default function FantasyTeamPage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  return <MyTeamTab competitionId={competitionId} />
}
