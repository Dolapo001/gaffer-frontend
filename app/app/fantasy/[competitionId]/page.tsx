'use client'

import { useParams } from 'next/navigation'
import { FantasyHomeTab } from '@/components/fantasy/home/FantasyHomeTab'

export default function FantasyHomePage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  return <FantasyHomeTab competitionId={competitionId} />
}
