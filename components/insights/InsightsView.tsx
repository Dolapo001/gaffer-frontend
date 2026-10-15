'use client'

import { useState } from 'react'
import type { InsightPlayer, InsightsData } from '@/lib/services/insights.service'

type Tab = 'players' | 'managers' | 'matches' | 'platform'

const CHIP_NAMES: Record<string, string> = {
  BENCH_BOOST: 'Bench Boost',
  TRIPLE_CAPTAIN: 'Triple Captain',
  WILDCARD: 'Wildcard',
  FREE_HIT: 'Free Hit',
}

function Stat({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-2xl bg-[#1E2032] border border-white/5 px-4 py-3">
      <p className="text-2xl font-black text-white tabular-nums">{value}</p>
      <p className="text-xs text-white/50 mt-0.5">{label}</p>
      {note && <p className="text-[11px] text-white/30 mt-0.5">{note}</p>}
    </div>
  )
}

/** One question, answered as a short ranked list. */
function Card({ title, question, children }: { title: string; question: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-[#1E2032] border border-white/5 p-4">
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-white/40 mt-0.5 mb-3">{question}</p>
      {children}
    </section>
  )
}

function Empty() {
  return <p className="text-sm text-white/30 py-2">Nothing yet.</p>
}

interface Row { key: string; name: string; sub?: string; value: string; amount: number }

function Ranked({ rows }: { rows: Row[] }) {
  if (!rows.length) return <Empty />
  const max = Math.max(...rows.map((r) => r.amount), 1)
  return (
    <ol className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.key}>
          <div className="flex items-baseline gap-3">
            <span className="w-5 text-xs text-white/30 tabular-nums">{i + 1}</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm text-white truncate">{r.name}</span>
              {r.sub && <span className="block text-[11px] text-white/40 truncate">{r.sub}</span>}
            </span>
            <span className="text-sm font-bold text-white tabular-nums">{r.value}</span>
          </div>
          <div className="ml-8 mt-1 h-1 rounded-full bg-white/5" aria-hidden="true">
            <div className="h-1 rounded-full bg-orange-500" style={{ width: `${Math.max(4, (r.amount / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ol>
  )
}

const sub = (p: InsightPlayer) => [p.position, p.club].filter(Boolean).join(' · ')
const playerRows = (list: InsightPlayer[], value: (p: InsightPlayer) => string, amount: (p: InsightPlayer) => number): Row[] =>
  list.map((p) => ({ key: p.id, name: p.name, sub: sub(p), value: value(p), amount: amount(p) }))
const pctRows = (list: InsightPlayer[]) => playerRows(list, (p) => `${p.pct}%`, (p) => p.pct ?? 0)
const countRows = (list: InsightPlayer[]) => playerRows(list, (p) => String(p.count ?? 0), (p) => p.count ?? 0)

function PlayersTab({ d }: { d: InsightsData }) {
  const p = d.players
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Most picked" question="The share of managers who have this player in their squad."><Ranked rows={pctRows(p.mostPicked)} /></Card>
      <Card title="Most captained" question="Who managers have as captain right now."><Ranked rows={playerRows(p.mostCaptained, (x) => `${x.count} · ${x.pct}%`, (x) => x.count ?? 0)} /></Card>
      <Card title="Captained most often" question="Across every round played so far."><Ranked rows={countRows(p.captainedMostRounds)} /></Card>
      <Card title="Most vice-captained" question="Who managers have as vice-captain right now."><Ranked rows={playerRows(p.mostViceCaptained, (x) => `${x.count} · ${x.pct}%`, (x) => x.count ?? 0)} /></Card>
      <Card title="Most started" question="The share of managers who start this player."><Ranked rows={pctRows(p.mostStarted)} /></Card>
      <Card title="Highest points" question="Total Fantasy points scored."><Ranked rows={playerRows(p.topPoints, (x) => `${x.points} pts`, (x) => x.points ?? 0)} /></Card>
      <Card title="Most transferred in" question="Who managers are buying."><Ranked rows={countRows(p.transfersIn)} /></Card>
      <Card title="Most transferred out" question="Who managers are selling."><Ranked rows={countRows(p.transfersOut)} /></Card>
      <Card title="Hidden gems" question="Scored well but owned by 10% of managers or fewer.">
        <Ranked rows={playerRows(p.hiddenGems, (x) => `${x.points} pts`, (x) => x.points ?? 0).map((r, i) => ({ ...r, sub: `${r.sub ?? ''}${r.sub ? ' · ' : ''}owned by ${p.hiddenGems[i].ownershipPct}%` }))} />
      </Card>
    </div>
  )
}

function ManagersTab({ d }: { d: InsightsData }) {
  const m = d.managers
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="Top managers" question="Highest total Fantasy points.">
        <Ranked rows={m.top.map((t) => ({ key: `${t.rank}${t.teamName}`, name: t.teamName, sub: t.manager, value: `${t.points} pts`, amount: t.points }))} />
      </Card>
      <Card title="Best single rounds" question="The highest score in one round.">
        <Ranked rows={m.bestRounds.map((t, i) => ({ key: `${i}${t.teamName}`, name: t.teamName, sub: t.manager, value: `${t.points} pts`, amount: t.points }))} />
      </Card>
      <Card title="Chips played" question="How many times each chip has been used.">
        <Ranked rows={m.chips.map((c) => ({ key: c.chip, name: CHIP_NAMES[c.chip] ?? c.chip, value: String(c.count), amount: c.count }))} />
      </Card>
    </div>
  )
}

function MatchesTab({ d }: { d: InsightsData }) {
  const t = d.tournament
  const rows = (list: { id: string; name: string; count: number }[]): Row[] => list.map((x) => ({ key: x.id, name: x.name, value: String(x.count), amount: x.count }))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Matches played" value={t.matchesPlayed} />
        <Stat label="Goals" value={t.goals} />
        <Stat label="Goals per match" value={t.goalsPerMatch} />
        <Stat label="Yellow cards" value={t.yellowCards} />
        <Stat label="Red cards" value={t.redCards} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Top scorers" question="Goals scored, penalties included."><Ranked rows={rows(t.topScorers)} /></Card>
        <Card title="Top assists" question="Assists on goals."><Ranked rows={rows(t.topAssists)} /></Card>
        <Card title="Man of the Match" question="Awards won."><Ranked rows={rows(t.manOfTheMatch)} /></Card>
        <Card title="Clean sheets" question="Matches a team did not concede."><Ranked rows={rows(t.cleanSheets)} /></Card>
      </div>
    </div>
  )
}

function PlatformTab({ d }: { d: InsightsData }) {
  const p = d.platform
  if (!p) return <Empty />
  const max = Math.max(...p.signupsByDay.map((x) => x.count), 1)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Users" value={p.users} />
        <Stat label="Sign-ups, last 30 days" value={p.signupsLast30Days} />
        <Stat label="Active in the last 7 days" value={p.activeLast7Days} />
        <Stat label="Alerts turned on" value={`${p.alertsOnPct}%`} note={`${p.alertsOn} users`} />
        <Stat label="Organisations" value={p.organisations} />
        {Object.entries(p.tournamentsByStatus).map(([status, n]) => <Stat key={status} label={`Tournaments: ${status}`} value={n} />)}
      </div>
      <Card title="Sign-ups by day" question="New accounts over the last 30 days.">
        {p.signupsByDay.length === 0 ? <Empty /> : (
          <div className="flex items-end gap-1 h-24" role="img" aria-label="Sign-ups by day">
            {p.signupsByDay.map((s) => (
              <div key={s.day} className="flex-1 bg-orange-500/80 rounded-t" style={{ height: `${Math.max(6, (s.count / max) * 100)}%` }} title={`${s.day}: ${s.count}`} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

/**
 * Everything knowable about a tournament (or, for HQ, all of them): the headline numbers first, then plain ranked
 * lists grouped as Players, Managers and Matches. HQ also gets a Platform tab.
 */
export function InsightsView({ data }: { data: InsightsData }) {
  const [tab, setTab] = useState<Tab>('players')
  const h = data.headline
  const tabs: Array<[Tab, string]> = [['players', 'Players'], ['managers', 'Managers'], ['matches', 'Matches'], ...(data.platform ? ([['platform', 'Platform']] as Array<[Tab, string]>) : [])]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Managers" value={h.managers} />
        <Stat label="Teams picked" value={h.teamsPicked} note={h.joinedNoTeam ? `${h.joinedNoTeam} joined without a team` : undefined} />
        <Stat label="Average points" value={h.averageManagerPoints} />
        <Stat label="Average team value" value={h.averageTeamValue ?? '-'} />
      </div>

      <div role="tablist" aria-label="Insights" className="flex gap-1 p-1 rounded-2xl bg-[#1E2032] border border-white/5 w-fit max-w-full overflow-x-auto">
        {tabs.map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`px-4 h-9 rounded-xl text-sm font-bold whitespace-nowrap ${tab === id ? 'bg-orange-500 text-black' : 'text-white/60 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'players' && <PlayersTab d={data} />}
      {tab === 'managers' && <ManagersTab d={data} />}
      {tab === 'matches' && <MatchesTab d={data} />}
      {tab === 'platform' && <PlatformTab d={data} />}

      <p className="text-[11px] text-white/30">Updated {new Date(data.generatedAt).toLocaleString()}</p>
    </div>
  )
}
