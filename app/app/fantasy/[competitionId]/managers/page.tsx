'use client'

import { useParams } from 'next/navigation'
import { ManagersList } from '@/components/fantasy/managers/ManagersList'

export default function FantasyManagersPage() {
  const { competitionId } = useParams<{ competitionId: string }>()
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-display font-black text-white uppercase tracking-tight">All managers</h1>
      <ManagersList competitionId={competitionId} basePath={`/app/fantasy/${competitionId}/managers`} />
    </div>
  )
}
