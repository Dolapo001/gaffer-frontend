'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ManagersList } from '@/components/fantasy/managers/ManagersList'

export default function AdminManagersPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-4 pb-24 space-y-4">
      <Link href={`/admin/tournaments/${id}`} className="inline-flex items-center gap-1 text-sm text-white/60">
        <ChevronLeft size={16} /> Tournament
      </Link>
      <h1 className="text-lg font-display font-black uppercase tracking-tight">Fantasy managers</h1>
      <p className="text-xs text-white/40">Everyone in this tournament and the team they picked.</p>
      <ManagersList competitionId={id} basePath={`/admin/tournaments/${id}/managers`} />
    </div>
  )
}
