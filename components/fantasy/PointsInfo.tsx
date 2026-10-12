'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFantasySeason } from '@/lib/services/fantasy.service'
import { STANDARD_SCORING, pointsRows } from '@/lib/pointsList'

/** "How points work" for managers: what earns and loses points in this tournament's size of game. */
export function PointsInfo({ competitionId }: { competitionId: string }) {
  const [open, setOpen] = useState(false)
  const { data: season } = useQuery({
    queryKey: ['fantasy-season', competitionId],
    queryFn: () => getFantasySeason(competitionId),
    enabled: !!competitionId,
  })
  const rows = pointsRows(season?.resolvedScoring ?? STANDARD_SCORING)

  return (
    <section aria-label="How points work" className="rounded-2xl bg-gaffer-card border border-gaffer-border">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <span className="text-white font-display font-bold text-sm uppercase tracking-tight">How points work</span>
        <span className="text-gaffer-muted text-xs">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <dl className="px-4 pb-4 space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 text-xs">
              <dt className="text-white/60 shrink-0">{r.label}</dt>
              <dd className="text-white font-bold text-right">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
