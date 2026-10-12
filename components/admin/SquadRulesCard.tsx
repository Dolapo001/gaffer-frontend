'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateFantasySeasonRules, type FantasySeason } from '@/lib/services/fantasy.service'
import { STANDARD_RULES } from '@/lib/squadRules'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

const field = 'w-full h-11 bg-[#181928] border border-white/10 rounded-xl px-3 text-white text-sm font-chakra font-bold'

/**
 * The organiser's squad rules for Fantasy: how many players a manager picks, how many sit on the bench, how many may
 * come from one team and the budget. They start from the size of the game and can be changed until managers have
 * built their teams (the server refuses after that).
 */
export function SquadRulesCard({ competitionId, season }: { competitionId: string; season: FantasySeason }) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const rules = season.resolvedRules ?? STANDARD_RULES
  const [squadSize, setSquadSize] = useState(String(rules.squadSize))
  const [benchSize, setBenchSize] = useState(String(rules.benchSize))
  const [maxPerClub, setMaxPerClub] = useState(String(rules.maxPerClub))
  const [budget, setBudget] = useState(String(season.squadBudget))

  const dirty =
    Number(squadSize) !== rules.squadSize ||
    Number(benchSize) !== rules.benchSize ||
    Number(maxPerClub) !== rules.maxPerClub ||
    Number(budget) !== season.squadBudget

  const save = useMutation({
    mutationFn: () =>
      updateFantasySeasonRules(competitionId, {
        squadSize: Number(squadSize),
        benchSize: Number(benchSize),
        maxPerClub: Number(maxPerClub),
        squadBudget: Number(budget),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fantasy-season', competitionId] })
      toast.addToast('Squad rules saved', 'success')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const starters = Number(squadSize) - Number(benchSize)

  return (
    <section aria-label="Squad rules" className="rounded-2xl bg-gaffer-card border border-gaffer-border p-4 space-y-3">
      <div>
        <h4 className="text-white font-display font-bold text-sm uppercase tracking-tight">Squad rules</h4>
        <p className="text-gaffer-muted text-xs mt-1">
          {rules.playersPerSide}-a-side. Managers pick {squadSize} players: {Number.isFinite(starters) ? starters : '?'} start and {benchSize} are on the bench.
          You can change these until managers have built their teams.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-[11px] text-white/50">Squad size
          <input inputMode="numeric" className={field} value={squadSize} onChange={(e) => setSquadSize(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="text-[11px] text-white/50">Bench
          <input inputMode="numeric" className={field} value={benchSize} onChange={(e) => setBenchSize(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="text-[11px] text-white/50">Most from one team
          <input inputMode="numeric" className={field} value={maxPerClub} onChange={(e) => setMaxPerClub(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="text-[11px] text-white/50">Budget (m)
          <input inputMode="decimal" className={field} value={budget} onChange={(e) => setBudget(e.target.value.replace(/[^\d.]/g, ''))} />
        </label>
      </div>
      <button
        onClick={() => save.mutate()}
        disabled={!dirty || save.isPending || !squadSize || !benchSize || !maxPerClub || !budget}
        className="px-4 py-2.5 rounded-xl bg-gaffer-surface border border-white/10 text-white text-xs font-black uppercase tracking-widest disabled:opacity-40"
      >
        {save.isPending ? 'Saving…' : 'Save rules'}
      </button>
    </section>
  )
}
