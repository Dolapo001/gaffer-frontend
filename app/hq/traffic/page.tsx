'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { hqService, type HqTraffic } from '@/lib/services/hq.service'

const ACTION_LABELS: Record<string, string> = {
  cta_get_started: 'Tapped Get started or Sign up',
  signup_completed: 'Created an account',
  login: 'Logged in',
  league_joined: 'Joined a league',
  fantasy_team_created: 'Created a Fantasy team',
  captain_set: 'Saved a squad with a captain',
  transfer_made: 'Made a transfer',
  match_viewed: 'Opened a match',
  comment_posted: 'Posted a comment',
  reaction_given: 'Reacted with a flame',
  repost_made: 'Reposted',
  post_shared: 'Shared a post',
  app_installed: 'Installed the app',
  notifications_enabled: 'Turned on notifications',
}

const SOURCE_LABELS: Record<string, string> = { direct: 'Direct or unknown', whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', x: 'X', google: 'Google', tiktok: 'TikTok' }

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4">
      <p className="text-xs uppercase tracking-wider text-gaffer-muted font-body">{label}</p>
      <p className="font-chakra font-bold text-3xl text-white mt-1">{value}</p>
      {hint && <p className="text-xs text-gaffer-muted font-body mt-1">{hint}</p>}
    </div>
  )
}

function DailyChart({ data }: { data: HqTraffic['daily'] }) {
  const max = Math.max(1, ...data.map((d) => d.visitors))
  const w = 600
  const h = 140
  const bar = w / data.length
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} role="img" aria-label="Visitors per day" className="w-full h-auto">
      {data.map((d, i) => {
        const bh = (d.visitors / max) * h
        return (
          <rect key={d.day} x={i * bar + 2} y={h - bh} width={Math.max(bar - 4, 1)} height={Math.max(bh, d.visitors ? 2 : 0)} rx={2} className="fill-gaffer-orange">
            <title>{`${d.day}: ${d.visitors} visitors, ${d.pageviews} page views`}</title>
          </rect>
        )
      })}
      <line x1={0} y1={h} x2={w} y2={h} className="stroke-gaffer-border" />
      <text x={0} y={h + 15} className="fill-gaffer-muted" fontSize={11}>{data[0]?.day}</text>
      <text x={w} y={h + 15} textAnchor="end" className="fill-gaffer-muted" fontSize={11}>{data[data.length - 1]?.day}</text>
    </svg>
  )
}

function Bars({ rows }: { rows: { label: string; value: number; note?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  if (rows.length === 0) return <p className="text-sm text-gaffer-muted font-body">Nothing yet.</p>
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm font-body">
            <span className="truncate">{r.label}</span>
            <span className="text-white font-semibold shrink-0">{r.value}{r.note && <span className="text-gaffer-muted font-normal"> · {r.note}</span>}</span>
          </div>
          <div className="h-2 rounded-full bg-gaffer-bg mt-1 overflow-hidden"><div className="h-full rounded-full bg-gaffer-orange" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}

export default function HqTrafficPage() {
  const [days, setDays] = useState(30)
  const { data, isLoading, error } = useQuery({ queryKey: ['hq', 'traffic', days], queryFn: () => hqService.traffic(days), refetchInterval: 60_000 })

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold text-3xl">Traffic</h1>
          <p className="text-sm text-gaffer-muted font-body mt-1">Who visits and what they do, the landing page included. Counted by Nigerian day. Bots are left out.</p>
        </div>
        <div className="flex gap-1" role="tablist" aria-label="Period">
          {[7, 30, 90].map((d) => (
            <button key={d} role="tab" aria-selected={days === d} onClick={() => setDays(d)} className={`px-4 h-10 rounded-xl text-sm font-body font-semibold border ${days === d ? 'bg-gaffer-orange text-black border-gaffer-orange' : 'border-gaffer-border text-gaffer-muted hover:text-white'}`}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-gaffer-muted font-body">Loading numbers…</p>}
      {error && <p role="alert" className="text-red-400 font-body">Could not load the traffic numbers.</p>}

      {data && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="Summary">
            <Stat label="Visitors today" value={data.today?.visitors ?? 0} hint={`${data.today?.newVisitors ?? 0} new`} />
            <Stat label={`Visitors, ${days} days`} value={data.uniqueVisitors} hint="Different people" />
            <Stat label="Page views" value={data.pageviews} hint={`Last ${days} days`} />
            <Stat label="Sessions today" value={data.today?.sessions ?? 0} hint="Separate visits" />
          </section>

          <section className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4">
            <p className="text-sm font-body text-gaffer-muted mb-2">Visitors per day</p>
            <DailyChart data={data.daily} />
          </section>

          <section aria-labelledby="funnel-h" className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
            <h2 id="funnel-h" className="font-display font-bold text-xl">From first visit to playing</h2>
            <Bars rows={data.funnel.map((f) => ({ label: f.label, value: f.visitors, note: `${f.percentOfFirst}%` }))} />
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <section className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
              <h2 className="font-display font-bold text-xl">What people do</h2>
              <Bars rows={data.actions.map((a) => ({ label: ACTION_LABELS[a.name] ?? a.name, value: a.count, note: `${a.visitors} ${a.visitors === 1 ? 'person' : 'people'}` }))} />
            </section>
            <section className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
              <h2 className="font-display font-bold text-xl">Where visitors come from</h2>
              <Bars rows={data.sources.map((s) => ({ label: SOURCE_LABELS[s.source] ?? s.source, value: s.visitors }))} />
            </section>
            <section className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
              <h2 className="font-display font-bold text-xl">Most visited pages</h2>
              <Bars rows={data.topPages.map((p) => ({ label: p.path, value: p.views }))} />
            </section>
            <section className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
              <h2 className="font-display font-bold text-xl">Phone or laptop</h2>
              <Bars rows={Object.entries(data.devices).map(([k, v]) => ({ label: k === 'mobile' ? 'Phone' : k === 'desktop' ? 'Laptop or desktop' : 'Tablet', value: v }))} />
            </section>
          </div>
        </>
      )}
    </div>
  )
}
