'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { hqService } from '@/lib/services/hq.service'

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4">
      <p className="text-xs uppercase tracking-wider text-gaffer-muted font-body">{label}</p>
      <p className="font-chakra font-bold text-3xl text-white mt-1">{value}</p>
      {hint && <p className="text-xs text-gaffer-muted font-body mt-1">{hint}</p>}
    </div>
  )
}

function SignupChart({ data }: { data: { date: string; signups: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.signups))
  const w = 600
  const h = 140
  const bar = w / data.length
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} role="img" aria-label="New users per day, last 30 days" className="w-full h-auto">
      {data.map((d, i) => {
        const bh = (d.signups / max) * h
        return (
          <g key={d.date}>
            <rect x={i * bar + 2} y={h - bh} width={bar - 4} height={Math.max(bh, d.signups ? 2 : 0)} rx={2} className="fill-gaffer-orange">
              <title>{`${d.date}: ${d.signups}`}</title>
            </rect>
          </g>
        )
      })}
      <line x1={0} y1={h} x2={w} y2={h} className="stroke-gaffer-border" />
      <text x={0} y={h + 15} className="fill-gaffer-muted" fontSize={11}>{data[0]?.date}</text>
      <text x={w} y={h + 15} textAnchor="end" className="fill-gaffer-muted" fontSize={11}>{data[data.length - 1]?.date}</text>
    </svg>
  )
}

export default function HqOverviewPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['hq', 'stats'], queryFn: hqService.stats, refetchInterval: 60_000 })

  if (isLoading) return <p className="text-gaffer-muted font-body">Loading numbers…</p>
  if (error || !data) return <p role="alert" className="text-red-400 font-body">Could not load the numbers.</p>

  const { users, organisations, leagues } = data

  return (
    <div className="space-y-8 max-w-5xl">
      <h1 className="font-display font-extrabold text-3xl">Overview</h1>

      {organisations.pending > 0 && (
        <Link
          href="/hq/organisations?tab=pending"
          className="block rounded-2xl border border-gaffer-orange/50 bg-gaffer-orange/10 p-4 font-body"
        >
          <b>{organisations.pending}</b> {organisations.pending === 1 ? 'organisation is' : 'organisations are'} waiting for your approval. Review them.
        </Link>
      )}

      <section aria-labelledby="users-h" className="space-y-3">
        <h2 id="users-h" className="font-display font-bold text-xl">Users</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Total users" value={users.total} />
          <Stat label="Joined today" value={users.today} />
          <Stat label="Last 7 days" value={users.last7Days} />
          <Stat label="Last 30 days" value={users.last30Days} />
        </div>
        <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4">
          <p className="text-sm font-body text-gaffer-muted mb-2">New users per day</p>
          <SignupChart data={data.signupsByDay} />
        </div>
      </section>

      <section aria-labelledby="leagues-h" className="space-y-3">
        <h2 id="leagues-h" className="font-display font-bold text-xl">Leagues</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Leagues" value={leagues.total} />
          <Stat label="Players joined" value={leagues.playersJoined} hint="Total joins across leagues" />
          <Stat label="Fantasy teams" value={leagues.fantasyTeams} />
          <Stat label="Live now" value={leagues.byStatus.live ?? 0} />
        </div>
      </section>

      <section aria-labelledby="orgs-h" className="space-y-3">
        <h2 id="orgs-h" className="font-display font-bold text-xl">Organisations</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Pending" value={organisations.pending} />
          <Stat label="Approved" value={organisations.approved} />
          <Stat label="Rejected" value={organisations.rejected} />
          <Stat label="Suspended" value={organisations.suspended} />
          <Stat label="Deleted" value={organisations.deleted} />
        </div>
      </section>
    </div>
  )
}
