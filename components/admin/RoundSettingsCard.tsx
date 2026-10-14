'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateGameweekRules, type FantasyGameweek, type GameweekRules } from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const field = 'w-full h-10 bg-[#181928] border border-white/10 rounded-xl px-3 text-white text-sm font-chakra font-bold'

function RoundRow({ competitionId, gw }: { competitionId: string; gw: FantasyGameweek }) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const eff: GameweekRules = gw.effectiveRules ?? { freeTransfers: 1, unlimitedTransfers: false, maxPerClub: 3, transferHit: 4, deadlineLeadMinutes: 0 }
  const [open, setOpen] = useState(false)
  const [free, setFree] = useState(String(eff.freeTransfers))
  const [unlimited, setUnlimited] = useState(eff.unlimitedTransfers)
  const [perClub, setPerClub] = useState(String(eff.maxPerClub))
  const [hit, setHit] = useState(String(eff.transferHit))
  const [lead, setLead] = useState(String(eff.deadlineLeadMinutes))
  const finished = gw.completionStatus === 'completed'
  const custom = !!gw.rules && Object.keys(gw.rules).length > 0

  const done = (msg: string) => () => {
    qc.invalidateQueries({ queryKey: ['gameweeks', competitionId] })
    qc.invalidateQueries({ queryKey: ['fantasy-gameweeks', competitionId] })
    toast.addToast(msg, 'success')
    setOpen(false)
  }
  const save = useMutation({
    mutationFn: () =>
      updateGameweekRules(competitionId, gw._id, {
        unlimitedTransfers: unlimited,
        ...(unlimited ? {} : { freeTransfers: Number(free) }),
        maxPerClub: Number(perClub),
        transferHit: Number(hit),
        deadlineLeadMinutes: Number(lead),
      }),
    onSuccess: done(`${gw.name} saved`),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })
  const reset = useMutation({
    mutationFn: () => updateGameweekRules(competitionId, gw._id, { reset: true }),
    onSuccess: done(`${gw.name} is back to the usual rules`),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })
  const digits = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value.replace(/\D/g, ''))
  const valid = [perClub, hit, lead, ...(unlimited ? [] : [free])].every((v) => v !== '') && Number(perClub) >= 1

  return (
    <li className="rounded-xl bg-[#181928] border border-white/5">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left">
        <span className="min-w-0">
          <span className="block text-sm font-bold text-white truncate">{gw.name}</span>
          <span className="block text-[11px] text-white/50">
            {eff.unlimitedTransfers ? 'Unlimited transfers' : `${eff.freeTransfers} free transfer${eff.freeTransfers === 1 ? '' : 's'}`} · {eff.maxPerClub} per club
            {custom && <span className="ml-2 text-gaffer-orange">your rules</span>}
          </span>
        </span>
        <span className="text-white/40 text-xs shrink-0">{finished ? 'Finished' : open ? 'Close' : 'Change'}</span>
      </button>
      {open && !finished && (
        <div className="px-3 pb-3 space-y-3">
          <label className="flex items-center gap-2 text-xs text-white/70">
            <input type="checkbox" checked={unlimited} onChange={(e) => setUnlimited(e.target.checked)} />
            Unlimited free transfers in this round
          </label>
          <div className="grid grid-cols-2 gap-3">
            {!unlimited && (
              <label className="text-[11px] text-white/50">Free transfers
                <input inputMode="numeric" className={field} value={free} onChange={digits(setFree)} />
              </label>
            )}
            <label className="text-[11px] text-white/50">Most from one team
              <input inputMode="numeric" className={field} value={perClub} onChange={digits(setPerClub)} />
            </label>
            <label className="text-[11px] text-white/50">Points lost per extra transfer
              <input inputMode="numeric" className={field} value={hit} onChange={digits(setHit)} />
            </label>
            <label className="text-[11px] text-white/50">Lock squads (minutes before kick-off)
              <input inputMode="numeric" className={field} value={lead} onChange={digits(setLead)} />
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save.mutate()} disabled={!valid || save.isPending} className="px-4 py-2.5 rounded-xl bg-gaffer-surface border border-white/10 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40">
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
            {custom && (
              <button onClick={() => reset.mutate()} disabled={reset.isPending} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest disabled:opacity-40">
                Use usual rules
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  )
}

/**
 * Rules for each round of Fantasy, set by the organiser: free transfers, players from one team, the cost of an extra
 * transfer and when squads lock. A round you do not touch keeps the usual rules.
 */
export function RoundSettingsCard({ competitionId, gameweeks }: { competitionId: string; gameweeks: FantasyGameweek[] }) {
  if (!gameweeks.length) return null
  return (
    <section aria-label="Round settings" className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
      <div>
        <h4 className="text-white font-display font-bold text-sm uppercase tracking-tight">Round settings</h4>
        <p className="text-gaffer-muted text-xs mt-1">Set the Fantasy rules for each round. Managers see them when they change their team.</p>
      </div>
      <ul className="space-y-2">
        {gameweeks.map((gw) => <RoundRow key={`${gw._id}-${JSON.stringify(gw.effectiveRules)}`} competitionId={competitionId} gw={gw} />)}
      </ul>
    </section>
  )
}
