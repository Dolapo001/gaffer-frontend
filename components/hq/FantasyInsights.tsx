'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { hqService, type HqInsightRow } from '@/lib/services/hq.service'
import { errorText } from '@/components/hq/ui'

type Unit = 'managers' | 'transfers'

function List({ title, rows, unit, total }: { title: string; rows: HqInsightRow[]; unit: Unit; total: number }) {
  const [copied, setCopied] = useState(false)
  const label = unit === 'managers' ? 'Managers' : 'Transfers'
  const copy = async () => {
    const text = [title, ...rows.map((r, i) => `${i + 1}. ${r.name}${r.team ? ` (${r.team})` : ''} - ${r.count} (${r.pct}%)`)].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <div className="rounded-2xl bg-gaffer-bg border border-gaffer-border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-body font-semibold">{title}</h3>
        {rows.length > 0 && <button onClick={copy} className="text-xs font-body text-gaffer-orange">{copied ? 'Copied' : 'Copy'}</button>}
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gaffer-muted font-body">Nothing yet.</p>
      ) : (
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="text-left text-xs text-gaffer-muted">
              <th className="w-6 font-normal">#</th><th className="font-normal">Player</th><th className="font-normal">Team</th>
              <th className="text-right font-normal">{label}</th><th className="text-right font-normal">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.playerId} className="border-t border-gaffer-border/60">
                <td className="py-1.5 text-gaffer-muted">{i + 1}</td>
                <td className="py-1.5 font-semibold">{r.name}</td>
                <td className="py-1.5 text-gaffer-muted">{r.team ?? ''}</td>
                <td className="py-1.5 text-right tabular-nums">{r.count}</td>
                <td className="py-1.5 text-right tabular-nums text-gaffer-muted">{r.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="text-[11px] text-gaffer-muted font-body">% of {unit === 'managers' ? `${total} managers` : `${total} transfers`}</p>
    </div>
  )
}

/** Gaffer HQ: the Fantasy top-10 lists for one tournament, one gameweek at a time. */
export function FantasyInsights({ id }: { id: string }) {
  const [gw, setGw] = useState<string | undefined>(undefined)
  const { data, error, isLoading } = useQuery({
    queryKey: ['hq', 'fantasy-insights', id, gw ?? 'latest'],
    queryFn: () => hqService.fantasyInsights(id, gw),
    staleTime: 30_000,
  })

  if (isLoading) return <p className="text-gaffer-muted font-body">Counting…</p>
  if (error || !data) return <p role="alert" className="text-red-400 font-body text-sm">{errorText(error)}</p>
  if (!data.gameweek) {
    return (
      <section aria-label="Fantasy top 10 lists" className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4">
        <h2 className="font-display font-bold text-xl">Fantasy top 10 lists</h2>
        <p className="text-sm text-gaffer-muted font-body mt-1">This tournament has no Fantasy gameweeks yet.</p>
      </section>
    )
  }
  const g = data.gameweek

  return (
    <section aria-label="Fantasy top 10 lists" className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-xl">Fantasy top 10 lists</h2>
          <p className="text-xs text-gaffer-muted font-body">
            {data.managers} managers · {g.basis === 'frozen' ? 'squads saved at the deadline, these numbers will not change' : 'deadline not reached yet, these numbers are still moving'}
          </p>
        </div>
        <label className="text-xs text-gaffer-muted font-body">
          Gameweek
          <select
            value={g.id}
            onChange={(e) => setGw(e.target.value)}
            className="ml-2 rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 text-sm text-white"
          >
            {data.gameweeks.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <List title="Most owned players" rows={data.mostOwned} unit="managers" total={data.managers} />
        <List title="Most captained players" rows={data.mostCaptained} unit="managers" total={data.managers} />
        <List title="Most transferred in" rows={data.transfersIn} unit="transfers" total={data.transferCount ?? 0} />
        <List title="Most transferred out" rows={data.transfersOut} unit="transfers" total={data.transferCount ?? 0} />
      </div>
    </section>
  )
}
