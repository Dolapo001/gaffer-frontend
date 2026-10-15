'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { getTournamentInsights } from '@/lib/services/insights.service'
import { InsightsView } from '@/components/insights/InsightsView'
import { getErrorMessage } from '@/lib/api'

export default function TournamentInsightsPage() {
  const { id } = useParams<{ id: string }>()
  const { data, isLoading, error } = useQuery({ queryKey: ['insights', id], queryFn: () => getTournamentInsights(id) })
  return (
    <div className="min-h-screen bg-[#0F111A] text-white p-4 pb-24 space-y-4">
      <Link href={`/admin/tournaments/${id}`} className="inline-flex items-center gap-1 text-sm text-white/60">
        <ChevronLeft size={16} /> Tournament
      </Link>
      <h1 className="text-lg font-black uppercase tracking-tight">Insights</h1>
      {isLoading && <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />}
      {error && <p role="alert" className="text-sm text-red-300">{getErrorMessage(error)}</p>}
      {data && <InsightsView data={data} />}
    </div>
  )
}
