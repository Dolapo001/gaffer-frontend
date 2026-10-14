'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { advanceKnockout, generateFixtures, type KnockoutProposal } from '@/lib/services/fixture.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const field = 'w-full h-10 bg-[#181928] border border-white/10 rounded-xl px-3 text-white text-sm font-chakra font-bold'
const btn = 'px-4 py-2.5 rounded-xl bg-gaffer-surface border border-white/10 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40'

const label = (t: { name?: string; shortName?: string }) => t.name?.replace(/\s+[a-z0-9]{6,}$/i, '') || t.shortName || 'Team'
const pitchList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

/** A local date-time field value (YYYY-MM-DDTHH:mm) to an ISO string with the timezone. */
const toIso = (v: string) => (v ? new Date(v).toISOString() : undefined)

/**
 * Builds a knockout for any number of teams. Round 1 uses every registered team. After each round, "Create next round"
 * works out who goes through (winners, byes and the best losers), shows the pairings, and creates the round once the
 * organiser agrees. Every match it creates can still be edited afterwards.
 */
export function KnockoutBuilderCard({ competitionId, teamCount, hasRounds }: { competitionId: string; teamCount: number; hasRounds: boolean }) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const [pairing, setPairing] = useState<'random' | 'seeded'>('seeded')
  const [start, setStart] = useState('')
  const [pitches, setPitches] = useState('Pitch A, Pitch B')
  const [spacing, setSpacing] = useState('40')
  const [breakMins, setBreakMins] = useState('30')
  const [proposal, setProposal] = useState<KnockoutProposal | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['fixtures', competitionId] })
    qc.invalidateQueries({ queryKey: ['rounds', competitionId] })
    qc.invalidateQueries({ queryKey: ['competition', competitionId] })
    qc.invalidateQueries({ queryKey: ['gameweeks', competitionId] })
    qc.invalidateQueries({ queryKey: ['fantasy-gameweeks', competitionId] })
  }
  const options = () => ({
    pairing,
    venues: pitchList(pitches),
    spacingMinutes: Number(spacing) || 40,
  })

  const first = useMutation({
    mutationFn: () => {
      if (!start) throw new Error('Choose the kick-off time of the first match')
      const d = new Date(start)
      return generateFixtures(competitionId, { type: 'knockout', startDate: d.toISOString(), kickoffTime: `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, ...options() })
    },
    onSuccess: (r) => { toast.addToast(`Round 1 created: ${r.fixturesCreated} matches`, 'success'); refresh() },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const preview = useMutation({
    mutationFn: () => advanceKnockout(competitionId, { preview: true, pairing }),
    onSuccess: (p) => { setBlocked(null); setProposal(p) },
    onError: (err) => { setProposal(null); setBlocked(getErrorMessage(err)) },
  })
  const create = useMutation({
    mutationFn: () => advanceKnockout(competitionId, {
      ...options(),
      startAt: toIso(start),
      breakMinutes: Number(breakMins) || 30,
      // Exactly the pairings that were shown, so a random draw does not change at the last moment
      pairs: proposal?.pairs?.map((p) => [p.home.id, p.away.id] as [string, string]),
    }),
    onSuccess: (p) => { toast.addToast(`${p.roundName} created`, 'success'); setProposal(null); refresh() },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  return (
    <section aria-label="Knockout builder" className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3 mb-4">
      <div>
        <h4 className="text-white font-display font-bold text-sm uppercase tracking-tight">Knockout rounds</h4>
        <p className="text-gaffer-muted text-xs mt-1">
          {hasRounds
            ? 'When a round is finished, create the next one. The winners go through, plus the best losing teams when the numbers need filling.'
            : `${teamCount} teams are registered. Any number works: an odd number gives the top seed a bye, and the best losers fill the next round.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-[11px] text-white/50 col-span-2">{hasRounds ? 'First kick-off of the next round (optional)' : 'First kick-off'}
          <input type="datetime-local" className={field} value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label className="text-[11px] text-white/50 col-span-2">Pitches (separate with commas)
          <input className={field} value={pitches} onChange={(e) => setPitches(e.target.value)} placeholder="Pitch A, Pitch B" />
        </label>
        <label className="text-[11px] text-white/50">Minutes between kick-offs
          <input inputMode="numeric" className={field} value={spacing} onChange={(e) => setSpacing(e.target.value.replace(/\D/g, ''))} />
        </label>
        {hasRounds ? (
          <label className="text-[11px] text-white/50">Break after the last match
            <input inputMode="numeric" className={field} value={breakMins} onChange={(e) => setBreakMins(e.target.value.replace(/\D/g, ''))} />
          </label>
        ) : null}
        <div className="col-span-2 flex gap-2" role="radiogroup" aria-label="Pairing">
          {(['seeded', 'random'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={pairing === m} onClick={() => setPairing(m)}
              className={`flex-1 h-10 rounded-xl text-xs font-black border ${pairing === m ? 'bg-orange-500 text-black border-orange-500' : 'bg-[#181928] text-white/70 border-white/10'}`}>
              {m === 'seeded' ? 'Seeded (best v worst)' : 'Random draw'}
            </button>
          ))}
        </div>
      </div>

      {!hasRounds ? (
        <button className={btn} onClick={() => first.mutate()} disabled={first.isPending || teamCount < 2}>
          {first.isPending ? 'Creating…' : 'Create round 1'}
        </button>
      ) : (
        <button className={btn} onClick={() => preview.mutate()} disabled={preview.isPending}>
          {preview.isPending ? 'Checking…' : 'Preview next round'}
        </button>
      )}

      {blocked && <p className="text-xs text-yellow-300/90">{blocked}</p>}

      {proposal?.done && proposal.champion && (
        <p className="rounded-xl bg-green-500/10 border border-green-500/30 p-3 text-sm text-green-300 font-bold">
          Champions: {label(proposal.champion)}
        </p>
      )}

      {proposal && !proposal.done && (
        <div className="space-y-3">
          <p className="text-sm text-white font-bold">{proposal.roundName}: {proposal.size} teams</p>
          {proposal.bestLosers && proposal.bestLosers.length > 0 && (
            <div className="rounded-xl bg-[#181928] border border-white/5 p-3 space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-white/40">Best losers going through</p>
              {proposal.bestLosers.map((l) => (
                <p key={l.id} className="text-xs text-white/80">{label(l)} <span className="text-white/40">lost {l.gf}-{l.ga}</span></p>
              ))}
              {proposal.otherLosers && proposal.otherLosers.length > 0 && (
                <p className="text-[11px] text-white/40 pt-1">Out: {proposal.otherLosers.map((l) => `${label(l)} (${l.gf}-${l.ga})`).join(', ')}</p>
              )}
            </div>
          )}
          <ul className="space-y-1">
            {(proposal.pairs ?? []).map((p, i) => (
              <li key={i} className="text-sm text-white rounded-xl bg-[#181928] border border-white/5 px-3 py-2">{label(p.home)} <span className="text-white/40">v</span> {label(p.away)}</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button className={btn} onClick={() => create.mutate()} disabled={create.isPending}>{create.isPending ? 'Creating…' : `Create ${proposal.roundName}`}</button>
            <button className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest" onClick={() => preview.mutate()}>Draw again</button>
          </div>
        </div>
      )}
    </section>
  )
}
