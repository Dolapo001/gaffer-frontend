'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { hqService } from '@/lib/services/hq.service'
import { errorText } from '@/components/hq/ui'

const dayLabel = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

function Tile({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4">
      <p className="text-xs text-gaffer-muted font-body">{label}</p>
      <p className="font-chakra font-bold text-3xl text-white mt-1">{value}</p>
      {hint && <p className="text-xs text-gaffer-muted font-body mt-1">{hint}</p>}
    </div>
  )
}

function Bars({ rows, label }: { rows: { day: string; count: number }[]; label: string }) {
  if (!rows.length) return <p className="text-sm text-gaffer-muted font-body">Nothing recorded yet.</p>
  const max = Math.max(...rows.map((r) => r.count), 1)
  return (
    <ul aria-label={label} className="space-y-1.5">
      {rows.map((r) => (
        <li key={r.day} className="flex items-center gap-3 text-sm font-body">
          <span className="w-14 shrink-0 text-gaffer-muted">{dayLabel(r.day)}</span>
          <span className="h-3 rounded-full bg-gaffer-orange" style={{ width: `${Math.max(4, (r.count / max) * 100)}%`, maxWidth: 'calc(100% - 6rem)' }} />
          <span className="text-white font-semibold">{r.count}</span>
        </li>
      ))}
    </ul>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
      <h3 className="font-display font-bold text-lg">{title}</h3>
      {children}
    </div>
  )
}

export function TournamentReport({ id }: { id: string }) {
  const { data, error, isLoading } = useQuery({ queryKey: ['hq', 'report', id], queryFn: () => hqService.tournamentReport(id) })
  const [copied, setCopied] = useState(false)

  if (isLoading) return <p className="text-gaffer-muted font-body">Counting…</p>
  if (error || !data) return <p role="alert" className="text-red-400 font-body text-sm">{errorText(error)}</p>
  const { report: r, summary } = data

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section aria-label="Tournament report" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-bold text-xl">Tournament report</h2>
        <button onClick={copy} className="px-3 py-2 rounded-xl text-sm font-body font-semibold bg-gaffer-orange text-black">
          {copied ? 'Copied' : 'Copy summary for a post'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="People who joined" value={r.joins.total} hint={r.joins.firstDay ? `${r.joins.firstDay.count} on day one (${dayLabel(r.joins.firstDay.day)})` : undefined} />
        <Tile label="Started a Fantasy team" value={r.fantasy.teamsStarted} hint={r.fantasy.joinedButNoTeam ? `${r.fantasy.joinedButNoTeam} joined but did not start one` : undefined} />
        <Tile label="Finished their team" value={r.fantasy.completeTeams} hint={`${r.fantasy.completionRate}% of those who started`} />
        <Tile label="Busiest day" value={r.activity.peak ? r.activity.peak.count : 0} hint={r.activity.peak ? `people active on ${dayLabel(r.activity.peak.day)}` : 'No activity yet'} />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Block title="Joins per day"><Bars rows={r.joins.perDay} label="Joins per day" /></Block>
        <Block title="People active per day">
          <p className="text-xs text-gaffer-muted font-body">{r.activity.note}</p>
          <Bars rows={r.activity.perDay} label="People active per day" />
          <p className="text-sm font-body text-gaffer-muted">Average: {r.activity.averagePerDay} a day</p>
        </Block>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Block title="Visitors per day (whole site)">
          <p className="text-xs text-gaffer-muted font-body">{r.activity.visitorsNote}</p>
          <Bars rows={r.activity.visitorsPerDay} label="Visitors per day" />
        </Block>
        <Block title="Fantasy">
          <ul className="text-sm font-body space-y-1">
            <li>{r.fantasy.transfers.total} transfers by {r.fantasy.transfers.managers} managers</li>
            <li>{r.fantasy.chips.total} chips played by {r.fantasy.chips.managers} managers{Object.keys(r.fantasy.chips.byType).length ? ` (${Object.entries(r.fantasy.chips.byType).map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`).join(', ')})` : ''}</li>
            <li>Points: average {r.fantasy.points.average}, middle {r.fantasy.points.median}, highest {r.fantasy.points.highest}, lowest {r.fantasy.points.lowest}</li>
          </ul>
          {r.fantasy.rounds.length > 0 && (
            <table className="w-full text-sm font-body">
              <thead><tr className="text-left text-gaffer-muted"><th className="font-normal py-1">Round</th><th className="font-normal">Teams</th><th className="font-normal">Average</th><th className="font-normal">Highest</th></tr></thead>
              <tbody>{r.fantasy.rounds.map((g, i) => <tr key={`${g.name}-${i}`} className="border-t border-gaffer-border"><td className="py-1">{g.name}</td><td>{g.teamsScored}</td><td>{g.average}</td><td>{g.highest}</td></tr>)}</tbody>
            </table>
          )}
        </Block>
      </div>

      {r.fantasy.top.length > 0 && (
        <Block title="Top Fantasy managers">
          <ol className="text-sm font-body space-y-1">
            {r.fantasy.top.map((t) => <li key={t.rank} className="flex justify-between gap-3"><span>{t.rank}. {t.manager} <span className="text-gaffer-muted">({t.team})</span></span><span className="font-semibold">{t.points}</span></li>)}
          </ol>
        </Block>
      )}

      <Block title="On the pitch">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile label="Teams" value={r.football.teams} />
          <Tile label="Matches played" value={r.football.matches.completed} hint={`of ${r.football.matches.total}`} />
          <Tile label="Goals" value={r.football.goals} hint={`${r.football.avgGoals} a match`} />
          <Tile label="Draws" value={r.football.draws} hint={r.football.decidedByPenalties ? `${r.football.decidedByPenalties} settled on penalties` : undefined} />
        </div>
        {r.football.groups.length > 0 && (
          <ul className="text-sm font-body space-y-1">
            {r.football.groups.map((g) => <li key={g.name}><span className="font-semibold">{g.name}:</span> <span className="text-gaffer-muted">{g.teams.join(', ')}</span></li>)}
          </ul>
        )}
        <p className="text-sm font-body text-gaffer-muted">Matches per day</p>
        <Bars rows={r.football.matchDays} label="Matches per day" />
      </Block>
    </section>
  )
}
