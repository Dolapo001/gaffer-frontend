'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCompetition, updateCompetition, listCompetitionTeams } from '@/lib/services/competition.service'
import { listFixtures, updateFixture, deleteFixture, penaltiesSuffix, type Decider, type Fixture } from '@/lib/services/fixture.service'
import { DeciderToggles } from '@/components/admin/DeciderToggles'
import { listPlayers, updatePlayer, removePlayer, updateTeam } from '@/lib/services/team.service'
import { ActionButton, Pill, errorText } from '@/components/hq/ui'

const input = 'rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 font-body text-white text-sm w-full'
const toLocalInput = (iso?: string) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : '')
const teamName = (t: Fixture['homeTeamId']) => (typeof t === 'object' ? t.name : 'Team')

function Notice({ ok, text }: { ok: boolean; text: string | null }) {
  if (!text) return null
  return <p role={ok ? 'status' : 'alert'} className={`text-sm font-body ${ok ? 'text-green-300' : 'text-red-400'}`}>{text}</p>
}

function Details({ id }: { id: string }) {
  const qc = useQueryClient()
  const { data: comp } = useQuery({ queryKey: ['hq', 'comp', id], queryFn: () => getCompetition(id) })
  const [form, setForm] = useState<{ name?: string; startDate?: string; endDate?: string }>({})
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const save = useMutation({
    mutationFn: () =>
      updateCompetition(id, {
        ...(form.name !== undefined ? { name: form.name } : {}),
        ...(form.startDate ? { startDate: new Date(form.startDate).toISOString() } : {}),
        ...(form.endDate ? { endDate: new Date(form.endDate).toISOString() } : {}),
      }),
    onSuccess: () => { setForm({}); setMsg({ ok: true, text: 'Saved. Everyone sees the change now.' }); qc.invalidateQueries({ queryKey: ['hq'] }) },
    onError: (e) => setMsg({ ok: false, text: errorText(e) }),
  })
  if (!comp) return <p className="text-gaffer-muted font-body">Loading…</p>
  const dirty = Object.keys(form).length > 0
  return (
    <section className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display font-bold text-xl">Tournament details</h2>
        <Pill label={comp.status} tone="neutral" />
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        <label className="text-xs text-gaffer-muted font-body">Name<input className={input} value={form.name ?? comp.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="text-xs text-gaffer-muted font-body">Starts<input type="date" className={input} value={form.startDate ?? toDateInput(comp.startDate)} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
        <label className="text-xs text-gaffer-muted font-body">Ends<input type="date" className={input} value={form.endDate ?? toDateInput(comp.endDate)} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
      </div>
      <div className="flex items-center gap-3">
        <ActionButton tone="good" label={save.isPending ? 'Saving…' : 'Save changes'} onClick={() => save.mutate()} disabled={!dirty || save.isPending} />
        <Notice ok={msg?.ok ?? true} text={msg?.text ?? null} />
      </div>
    </section>
  )
}

function FixtureRow({ f }: { f: Fixture }) {
  const qc = useQueryClient()
  const [kickoff, setKickoff] = useState(toLocalInput(f.kickoffAt))
  const [venue, setVenue] = useState(f.venue ?? '')
  const [status, setStatus] = useState<Fixture['status']>(f.status)
  const [decider, setDecider] = useState<Decider>(f.decider ?? { extraTime: false, penalties: f.stageType === 'knockout' })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const started = ['live', 'halftime', 'completed'].includes(f.status)
  const save = useMutation({
    mutationFn: () => updateFixture(f._id, { kickoffAt: new Date(kickoff).toISOString(), venue, ...(status !== f.status ? { status } : {}), ...(started ? {} : { decider }) }),
    onSuccess: () => { setMsg({ ok: true, text: 'Saved' }); qc.invalidateQueries({ queryKey: ['hq', 'fixtures'] }) },
    onError: (e) => setMsg({ ok: false, text: errorText(e) }),
  })
  const remove = useMutation({
    mutationFn: () => deleteFixture(f._id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hq', 'fixtures'] }),
    onError: (e) => setMsg({ ok: false, text: errorText(e) }),
  })
  return (
    <li className="rounded-2xl bg-gaffer-bg border border-gaffer-border p-3 space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-body font-semibold">{teamName(f.homeTeamId)} <span className="text-gaffer-muted">v</span> {teamName(f.awayTeamId)}
          {started && <span className="ml-2 font-chakra">{f.score?.home ?? 0} - {f.score?.away ?? 0} {penaltiesSuffix(f)}</span>}
        </p>
        <Pill label={f.status} tone={f.status === 'live' ? 'good' : 'neutral'} />
      </div>
      <div className="grid md:grid-cols-3 gap-2">
        <input type="datetime-local" aria-label="Kick-off" className={input} value={kickoff} onChange={(e) => setKickoff(e.target.value)} disabled={started} />
        <input aria-label="Venue" className={input} placeholder="Venue" value={venue} onChange={(e) => setVenue(e.target.value)} />
        <select aria-label="Status" className={input} value={status} onChange={(e) => setStatus(e.target.value as Fixture['status'])} disabled={started}>
          {['scheduled', 'postponed', 'cancelled', ...(started ? [f.status] : [])].filter((v, i, a) => a.indexOf(v) === i).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {!started && <DeciderToggles value={decider} onChange={setDecider} />}
      <div className="flex flex-wrap items-center gap-2">
        <ActionButton tone="good" label={save.isPending ? 'Saving…' : 'Save'} onClick={() => save.mutate()} disabled={save.isPending || f.status === 'completed'} />
        <Link href={`/hq/match/${f._id}`} className="px-3 py-2 rounded-xl text-sm font-body font-semibold border border-gaffer-border hover:bg-gaffer-card">Open match console</Link>
        {!started && <ActionButton tone="bad" label="Delete" onClick={() => { if (window.confirm('Delete this fixture?')) remove.mutate() }} disabled={remove.isPending} />}
        <Notice ok={msg?.ok ?? true} text={msg?.text ?? null} />
      </div>
    </li>
  )
}

function Fixtures({ id }: { id: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['hq', 'fixtures', id], queryFn: () => listFixtures(id) })
  return (
    <section className="space-y-3">
      <h2 className="font-display font-bold text-xl">Fixtures</h2>
      {isLoading ? <p className="text-gaffer-muted font-body">Loading…</p> : !data || data.length === 0 ? <p className="text-gaffer-muted font-body">No fixtures yet.</p> : (
        <ul className="space-y-2">{data.map((f) => <FixtureRow key={f._id} f={f} />)}</ul>
      )}
    </section>
  )
}

function PlayerRow({ teamId, p }: { teamId: string; p: any }) {
  const qc = useQueryClient()
  const person = p.playerId ?? {}
  const [first, setFirst] = useState<string>(person.firstName ?? '')
  const [last, setLast] = useState<string>(person.lastName ?? '')
  const [position, setPosition] = useState<string>(person.position ?? '')
  const [jersey, setJersey] = useState<string>(person.jerseyNumber != null ? String(person.jerseyNumber) : '')
  const [squad, setSquad] = useState<string>(p.squadStatus ?? 'active')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const pid = person._id ?? p._id
  const save = useMutation({
    mutationFn: () => updatePlayer(teamId, pid, { firstName: first, lastName: last, position: position || undefined, jerseyNumber: jersey ? Number(jersey) : undefined, squadStatus: squad }),
    onSuccess: () => { setMsg({ ok: true, text: 'Saved' }); qc.invalidateQueries({ queryKey: ['hq', 'players', teamId] }) },
    onError: (e) => setMsg({ ok: false, text: errorText(e) }),
  })
  const remove = useMutation({
    mutationFn: () => removePlayer(teamId, pid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hq', 'players', teamId] }),
    onError: (e) => setMsg({ ok: false, text: errorText(e) }),
  })
  return (
    <li className="grid grid-cols-2 md:grid-cols-[1fr_1fr_5rem_4rem_7rem_auto] gap-2 items-center">
      <input aria-label="First name" className={input} value={first} onChange={(e) => setFirst(e.target.value)} />
      <input aria-label="Last name" className={input} value={last} onChange={(e) => setLast(e.target.value)} />
      <select aria-label="Position" className={input} value={position} onChange={(e) => setPosition(e.target.value)}>
        <option value="">—</option>{['GK', 'DEF', 'MID', 'FWD'].map((x) => <option key={x}>{x}</option>)}
      </select>
      <input aria-label="Shirt number" inputMode="numeric" className={input} value={jersey} onChange={(e) => setJersey(e.target.value.replace(/\D/g, '').slice(0, 3))} />
      <select aria-label="Squad status" className={input} value={squad} onChange={(e) => setSquad(e.target.value)}>
        {['active', 'injured', 'suspended', 'removed'].map((x) => <option key={x}>{x}</option>)}
      </select>
      <div className="flex items-center gap-2 col-span-2 md:col-span-1">
        <ActionButton tone="good" label="Save" onClick={() => save.mutate()} disabled={save.isPending} />
        <ActionButton tone="bad" label="Remove" onClick={() => { if (window.confirm(`Remove ${first} ${last} from the team?`)) remove.mutate() }} disabled={remove.isPending} />
        <Notice ok={msg?.ok ?? true} text={msg?.text ?? null} />
      </div>
    </li>
  )
}

function TeamCard({ team }: { team: { teamId: string; name: string; handle: string } }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(team.name)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const players = useQuery({ queryKey: ['hq', 'players', team.teamId], queryFn: () => listPlayers(team.teamId), enabled: open })
  const rename = useMutation({
    mutationFn: () => updateTeam(team.teamId, { name }),
    onSuccess: () => { setMsg({ ok: true, text: 'Saved' }); qc.invalidateQueries({ queryKey: ['hq'] }) },
    onError: (e) => setMsg({ ok: false, text: errorText(e) }),
  })
  return (
    <li className="rounded-2xl bg-gaffer-bg border border-gaffer-border p-3 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <input aria-label="Team name" className={`${input} max-w-xs`} value={name} onChange={(e) => setName(e.target.value)} />
        <ActionButton tone="good" label="Save name" onClick={() => rename.mutate()} disabled={rename.isPending || name === team.name || !name.trim()} />
        <ActionButton label={open ? 'Hide players' : 'Players'} onClick={() => setOpen(!open)} />
        <Notice ok={msg?.ok ?? true} text={msg?.text ?? null} />
      </div>
      {open && (players.isLoading ? <p className="text-gaffer-muted font-body">Loading…</p> : !players.data || players.data.length === 0 ? <p className="text-gaffer-muted font-body">No players.</p> : (
        <ul className="space-y-2">{players.data.map((p: any) => <PlayerRow key={p._id} teamId={team.teamId} p={p} />)}</ul>
      ))}
    </li>
  )
}

function Teams({ id }: { id: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['hq', 'teams', id], queryFn: () => listCompetitionTeams(id) })
  return (
    <section className="space-y-3">
      <h2 className="font-display font-bold text-xl">Teams and players</h2>
      {isLoading ? <p className="text-gaffer-muted font-body">Loading…</p> : !data || data.length === 0 ? <p className="text-gaffer-muted font-body">No teams yet.</p> : (
        <ul className="space-y-2">{data.map((t) => <TeamCard key={t.teamId} team={t} />)}</ul>
      )}
    </section>
  )
}

export default function HqTournamentPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/hq/tournaments" className="text-sm font-body text-gaffer-muted hover:text-white">← All tournaments</Link>
      <p className="text-sm font-body text-gaffer-muted">You are managing this tournament as Gaffer HQ. Changes show up for everyone straight away and are recorded in the audit log.</p>
      <Details id={params.id} />
      <Fixtures id={params.id} />
      <Teams id={params.id} />
    </div>
  )
}
