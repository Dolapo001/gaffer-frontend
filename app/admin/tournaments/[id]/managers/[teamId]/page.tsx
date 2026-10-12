'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ManagerTeamView } from '@/components/fantasy/managers/ManagerTeamView'

export default function AdminManagerPage() {
  const { id, teamId } = useParams<{ id: string; teamId: string }>()
  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-4 pb-24 space-y-4">
      <Link href={`/admin/tournaments/${id}/managers`} className="inline-flex items-center gap-1 text-sm text-white/60">
        <ChevronLeft size={16} /> All managers
      </Link>
      <ManagerTeamView competitionId={id} teamId={teamId} />
    </div>
  )
}
