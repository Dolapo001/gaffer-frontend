'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { hqService } from '@/lib/services/hq.service'
import { getHqInsights } from '@/lib/services/insights.service'
import { InsightsView } from '@/components/insights/InsightsView'
import { errorText } from '@/components/hq/ui'

export default function HqInsightsPage() {
  const [competitionId, setCompetitionId] = useState('')
  const { data: tournaments } = useQuery({
    queryKey: ['hq', 'tournaments', 'for-insights'],
    queryFn: () => hqService.listTournaments({ page: 1 }),
  })
  const { data, isLoading, error } = useQuery({
    queryKey: ['hq', 'insights', competitionId],
    queryFn: () => getHqInsights(competitionId || undefined),
  })

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="font-display font-extrabold text-3xl">Insights</h1>
        <p className="text-sm font-body text-gaffer-muted mt-1">Who is picked, captained and transferred, how managers and matches are doing, and how the platform is growing.</p>
      </div>
      <label className="block text-sm font-body text-gaffer-muted">Show
        <select
          value={competitionId}
          onChange={(e) => setCompetitionId(e.target.value)}
          className="mt-1 block w-full md:w-96 rounded-xl bg-gaffer-surface border border-gaffer-border px-3 py-2 font-body text-white"
        >
          <option value="">All tournaments</option>
          {(tournaments?.tournaments ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </label>
      {isLoading && <div className="h-40 rounded-2xl bg-white/5 animate-pulse" />}
      {error && <p role="alert" className="text-sm text-red-400 font-body">{errorText(error)}</p>}
      {data && <InsightsView data={data} />}
    </div>
  )
}
