'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ManagerTeamView } from '@/components/fantasy/managers/ManagerTeamView'

export default function FantasyManagerPage() {
  const { competitionId, teamId } = useParams<{ competitionId: string; teamId: string }>()
  return (
    <div className="p-4 space-y-4">
      <Link href={`/app/fantasy/${competitionId}/managers`} className="inline-flex items-center gap-1 text-sm text-white/60">
        <ChevronLeft size={16} /> All managers
      </Link>
      <ManagerTeamView competitionId={competitionId} teamId={teamId} />
    </div>
  )
}
