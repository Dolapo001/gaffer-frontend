'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addShootoutKick,
  clearShootout,
  deleteShootoutKick,
  endMatch,
  getShootout,
  updateShootoutKick,
  type Fixture,
  type KickResult,
  type ShootoutKick,
} from '@/lib/services/fixture.service'
import { listPlayers } from '@/lib/services/team.service'
import { useToast } from '@/store/toastStore'

const idOf = (t: unknown): string => (t && typeof t === 'object' ? String((t as { _id?: string })._id ?? '') : String(t ?? ''))
const teamName = (t: Fixture['homeTeamId']): string => (typeof t === 'object' ? t.name : 'Team')

const RESULTS: { value: KickResult; label: string; cls: string }[] = [
  { value: 'scored', label: 'Scored', cls: 'bg-[#22C55E] text-white' },
  { value: 'missed', label: 'Missed', cls: 'bg-[#ef4444] text-white' },
  { value: 'saved', label: 'Saved', cls: 'bg-[#eab308] text-black' },
]

function takerLabel(k: ShootoutKick): string {
  const t = k.takerId
  return t && typeof t === 'object' ? `${t.firstName} ${t.lastName}`.trim() : 'No taker recorded'
}

/**
 * The admin's penalty shootout: record each kick (team, taker, result), fix or remove any kick, start over,
 * and confirm the result to end the match. Kicks never change the match score or any player's stats.
 */
export function ShootoutPanel({ fixture }: { fixture: Fixture }) {
  const qc = useQueryClient()
  const { addToast } = useToast()
  const homeId = idOf(fixture.homeTeamId)
  const awayId = idOf(fixture.awayTeamId)
  const [firstTeam, setFirstTeam] = useState<string | null>(null)
  const [takerId, setTakerId] = useState('')
  const ended = fixture.status === 'completed'

  const { data: shootout } = useQuery({
    queryKey: ['shootout', fixture._id],
    queryFn: () => getShootout(fixture._id),
    refetchInterval: ended ? false : 5_000,
  })

  const kickingTeamId = shootout?.nextTeamId ?? (shootout && shootout.kicks.length === 0 ? firstTeam : null)

  const { data: squad } = useQuery({
    queryKey: ['shootout-squad', kickingTeamId],
    queryFn: () => listPlayers(kickingTeamId!),
    enabled: !!kickingTeamId,
  })
  const takers = (Array.isArray(squad) ? squad : []).filter((p: any) => p.squadStatus !== 'removed' && p.playerId?._id)

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['shootout', fixture._id] })
    qc.invalidateQueries({ queryKey: ['fixture', fixture._id] })
    qc.invalidateQueries({ queryKey: ['fixtures'] })
  }
  const onError = (err: any) => addToast(err?.message || 'Could not save that change', 'error')

  const add = useMutation({
    mutationFn: (result: KickResult) => addShootoutKick(fixture._id, { teamId: kickingTeamId!, takerId: takerId || undefined, result }),
    onSuccess: () => { setTakerId(''); setFirstTeam(null); refresh() },
    onError,
  })
  const edit = useMutation({
    mutationFn: (v: { kickId: string; result: KickResult }) => updateShootoutKick(fixture._id, v.kickId, { result: v.result }),
    onSuccess: refresh,
    onError,
  })
  const remove = useMutation({
    mutationFn: (kickId: string) => deleteShootoutKick(fixture._id, kickId),
    onSuccess: refresh,
    onError,
  })
  const clear = useMutation({
    mutationFn: () => clearShootout(fixture._id),
    onSuccess: () => { setFirstTeam(null); refresh() },
    onError,
  })
  const finish = useMutation({
    mutationFn: () => endMatch(fixture._id),
    onSuccess: () => { addToast('Match ended', 'success'); refresh() },
    onError,
  })

  if (!shootout) return <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />

  const winnerName = shootout.winner === 'home' ? teamName(fixture.homeTeamId) : shootout.winner === 'away' ? teamName(fixture.awayTeamId) : null
  const kickingName = kickingTeamId === homeId ? teamName(fixture.homeTeamId) : kickingTeamId === awayId ? teamName(fixture.awayTeamId) : null

  return (
    <section aria-label="Penalty shootout" className="rounded-2xl bg-[#1E2032] border border-white/5 p-5 space-y-5">
      <div className="text-center">
        <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Penalty shootout{shootout.suddenDeath ? ' · sudden death' : ''}</p>
        <p className="font-chakra font-black text-4xl text-white mt-1" aria-live="polite">
          {teamName(fixture.homeTeamId)} {shootout.home} - {shootout.away} {teamName(fixture.awayTeamId)}
        </p>
        <p className="text-white/40 text-xs mt-1">The match score stays {fixture.score?.home ?? 0}-{fixture.score?.away ?? 0}. Penalties never count as goals.</p>
      </div>

      {winnerName ? (
        <div className="rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 p-4 text-center space-y-3">
          <p className="text-[#22C55E] font-bold">{winnerName} win {shootout.home}-{shootout.away} on penalties</p>
          {!ended ? (
            <>
              <button
                onClick={() => finish.mutate()}
                disabled={finish.isPending}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-[#FF8904] to-[#E7000B] text-white font-bold disabled:opacity-60"
              >
                {finish.isPending ? 'Ending…' : 'Confirm result and end match'}
              </button>
              <p className="text-white/40 text-xs">Wrong kick? Fix or remove it below first.</p>
            </>
          ) : (
            <p className="text-white/50 text-xs">Match ended. You can still correct a kick below.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {shootout.nextTeamId === null && shootout.kicks.length === 0 && !firstTeam ? (
            <div className="space-y-2">
              <p className="text-white text-sm font-medium">Who kicks first?</p>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: homeId, name: teamName(fixture.homeTeamId) }, { id: awayId, name: teamName(fixture.awayTeamId) }].map((t) => (
                  <button key={t.id} onClick={() => setFirstTeam(t.id)} className="h-12 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10">
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <p className="text-white text-sm font-medium">
                Next kick: <span className="text-orange-400">{kickingName}</span>
                {firstTeam && shootout.kicks.length === 0 && (
                  <button onClick={() => setFirstTeam(null)} className="ml-3 text-white/40 text-xs underline">change</button>
                )}
              </p>
              <select
                aria-label="Taker"
                value={takerId}
                onChange={(e) => setTakerId(e.target.value)}
                className="w-full h-12 bg-[#181928] border border-white/10 rounded-xl px-4 text-white text-sm"
              >
                <option value="">Who took it? (optional)</option>
                {takers.map((p: any) => (
                  <option key={p.playerId._id} value={p.playerId._id}>
                    {p.playerId.jerseyNumber != null ? `${p.playerId.jerseyNumber} · ` : ''}{p.playerId.firstName} {p.playerId.lastName}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-2">
                {RESULTS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => add.mutate(r.value)}
                    disabled={add.isPending || !kickingTeamId}
                    className={`h-12 rounded-xl text-sm font-bold disabled:opacity-50 ${r.cls}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-white/40 text-xs">Saved: the other team&apos;s goalkeeper is credited with the save.</p>
            </>
          )}
        </div>
      )}

      {shootout.kicks.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest">Kicks</p>
          <ol className="space-y-2">
            {shootout.kicks.map((k) => (
              <li key={k._id} className="flex items-center gap-3 rounded-xl bg-[#181928] border border-white/5 px-3 py-2">
                <span className="w-6 text-white/40 text-xs font-bold">{k.order}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-white text-sm truncate">{takerLabel(k)}</span>
                  <span className="block text-white/40 text-xs truncate">{idOf(k.teamId) === homeId ? teamName(fixture.homeTeamId) : teamName(fixture.awayTeamId)}</span>
                </span>
                <select
                  aria-label={`Result of kick ${k.order}`}
                  value={k.result}
                  onChange={(e) => edit.mutate({ kickId: k._id, result: e.target.value as KickResult })}
                  className="h-9 bg-[#1E2032] border border-white/10 rounded-lg px-2 text-white text-xs"
                >
                  {RESULTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <button
                  aria-label={`Remove kick ${k.order}`}
                  onClick={() => remove.mutate(k._id)}
                  disabled={remove.isPending}
                  className="w-9 h-9 rounded-lg bg-white/5 text-white/50 hover:text-red-400"
                >
                  ✕
                </button>
              </li>
            ))}
          </ol>
          <button
            onClick={() => { if (window.confirm('Clear every kick and start the shootout again?')) clear.mutate() }}
            disabled={clear.isPending}
            className="text-xs text-white/40 underline hover:text-red-400"
          >
            Start the shootout over
          </button>
        </div>
      )}
    </section>
  )
}
