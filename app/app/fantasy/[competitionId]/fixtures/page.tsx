'use client'

import { useParams } from 'next/navigation'
import { FantasyFixturesTab } from '@/components/fantasy/fixtures/FantasyFixturesTab'

export default function FantasyFixturesPage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  return <FantasyFixturesTab competitionId={competitionId} />
}
