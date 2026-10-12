'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateFantasyScoring, type FantasySeason } from '@/lib/services/fantasy.service'
import { STANDARD_SCORING, pointsRows } from '@/lib/pointsList'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const field = 'w-full h-10 bg-[#181928] border border-white/10 rounded-xl px-3 text-white text-sm font-chakra font-bold'

/**
 * The organiser's view of the points for this tournament: the standard points for its size of game, which can be
 * changed. Changes apply the next time a match is scored.
 */
export function ScoringCard({ competitionId, season }: { competitionId: string; season: FantasySeason }) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const rules = season.resolvedScoring ?? STANDARD_SCORING
  const [editing, setEditing] = useState(false)
  const [goal, setGoal] = useState({ GK: String(rules.goal.GK), DEF: String(rules.goal.DEF), MID: String(rules.goal.MID), FWD: String(rules.goal.FWD) })
  const [assist, setAssist] = useState(String(rules.assist))
  const [sheet, setSheet] = useState({ GK: String(rules.cleanSheet.GK), DEF: String(rules.cleanSheet.DEF) })
  const [per, setPer] = useState(String(rules.concededPer))

  const done = (msg: string) => () => {
    qc.invalidateQueries({ queryKey: ['fantasy-season', competitionId] })
    toast.addToast(msg, 'success')
    setEditing(false)
  }
  const save = useMutation({
    mutationFn: () =>
      updateFantasyScoring(competitionId, {
        goal: { GK: Number(goal.GK), DEF: Number(goal.DEF), MID: Number(goal.MID), FWD: Number(goal.FWD) },
        assist: Number(assist),
        cleanSheet: { GK: Number(sheet.GK), DEF: Number(sheet.DEF) },
        concededPer: Number(per),
      }),
    onSuccess: done('Points saved. They apply the next time a match is scored.'),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })
  const reset = useMutation({
    mutationFn: () => updateFantasyScoring(competitionId, { reset: true }),
    onSuccess: done('Points are back to the standard for this game'),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const num = (set: (s: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value.replace(/[^\d-]/g, ''))
  const valid = [...Object.values(goal), assist, ...Object.values(sheet), per].every((v) => v !== '' && v !== '-' && Number.isInteger(Number(v)))

  return (
    <section aria-label="Points" className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
      <div>
        <h4 className="text-white font-display font-bold text-sm uppercase tracking-tight">Points</h4>
        <p className="text-gaffer-muted text-xs mt-1">What managers earn for the {season.resolvedRules?.playersPerSide ?? 11}-a-side game. Managers can see this list.</p>
      </div>
      {!editing ? (
        <>
          <dl className="space-y-1.5">
            {pointsRows(rules).map((r) => (
              <div key={r.label} className="flex justify-between gap-4 text-xs">
                <dt className="text-white/60 shrink-0">{r.label}</dt>
                <dd className="text-white font-bold text-right">{r.value}</dd>
              </div>
            ))}
          </dl>
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="px-4 py-2.5 rounded-xl bg-gaffer-surface border border-white/10 text-white text-xs font-black uppercase tracking-widest">Change points</button>
            {!!season.scoring && (
              <button onClick={() => reset.mutate()} disabled={reset.isPending} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest disabled:opacity-40">Use standard</button>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-white/50">Goal</p>
          <div className="grid grid-cols-4 gap-2">
            {(['GK', 'DEF', 'MID', 'FWD'] as const).map((p) => (
              <label key={p} className="text-[11px] text-white/50">{p}
                <input inputMode="numeric" className={field} value={goal[p]} onChange={num((v) => setGoal({ ...goal, [p]: v }))} />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[11px] text-white/50">Assist
              <input inputMode="numeric" className={field} value={assist} onChange={num(setAssist)} />
            </label>
            <label className="text-[11px] text-white/50">Goals conceded: lose 1 per
              <input inputMode="numeric" className={field} value={per} onChange={num(setPer)} />
            </label>
            <label className="text-[11px] text-white/50">Clean sheet GK
              <input inputMode="numeric" className={field} value={sheet.GK} onChange={num((v) => setSheet({ ...sheet, GK: v }))} />
            </label>
            <label className="text-[11px] text-white/50">Clean sheet DEF
              <input inputMode="numeric" className={field} value={sheet.DEF} onChange={num((v) => setSheet({ ...sheet, DEF: v }))} />
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => save.mutate()} disabled={!valid || save.isPending} className="px-4 py-2.5 rounded-xl bg-gaffer-surface border border-white/10 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40">{save.isPending ? 'Saving…' : 'Save points'}</button>
            <button onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest">Cancel</button>
          </div>
        </div>
      )}
    </section>
  )
}
