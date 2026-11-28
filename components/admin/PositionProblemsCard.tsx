'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { getPositionProblems, removeFromBrokenSquads, setFantasyPosition, type FantasyPosition } from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

/**
 * Managers' squads that stopped adding up because a player's Fantasy position changed after they were bought (for
 * example a midfielder turned defender leaves 6 defenders). Two ways out:
 *  - keep the new position: the player leaves those squads, the managers get their money back and pick a replacement
 *    for free (only while a gameweek is open for squad changes)
 *  - change the player back in Fantasy
 * Shown only when there is a problem.
 */
export function PositionProblemsCard({ competitionId }: { competitionId: string }) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const { data } = useQuery({
    queryKey: ['fantasy-position-problems', competitionId],
    queryFn: () => getPositionProblems(competitionId),
  })
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['fantasy-position-problems', competitionId] })
    qc.invalidateQueries({ queryKey: ['player-pricing', competitionId] })
  }
  const changeBack = useMutation({
    mutationFn: ({ id, position }: { id: string; position: FantasyPosition }) => setFantasyPosition(competitionId, id, position),
    onSuccess: () => {
      refresh()
      toast.addToast('Fixed. Managers’ squads add up again.', 'success')
    },
    onError: (e) => toast.addToast(getErrorMessage(e), 'error'),
  })
  const takeOut = useMutation({
    mutationFn: ({ id, position }: { id: string; position: FantasyPosition }) => removeFromBrokenSquads(competitionId, id, position),
    onSuccess: (r) => {
      refresh()
      const n = r?.removedFrom ?? 0
      toast.addToast(`Taken out of ${n} ${n === 1 ? 'squad' : 'squads'}. Those managers were refunded and asked to pick a replacement.`, 'success')
    },
    onError: (e) => toast.addToast(getErrorMessage(e), 'error'),
  })
  const busy = changeBack.isPending || takeOut.isPending

  if (!data || data.brokenSquads === 0) return null
  const recent = data.candidates.filter((c) => c.recentlyChanged)
  const squads = data.brokenSquads === 1 ? 'manager’s squad no longer adds up' : 'managers’ squads no longer add up'

  return (
    <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className="text-red-300" />
        <h3 className="font-display font-bold text-white uppercase tracking-tight">Squads broken by a position change</h3>
      </div>
      <p className="text-gaffer-muted text-xs">
        {data.brokenSquads} {squads} because a player&apos;s position changed after they were bought.{' '}
        {data.replacementOpen
          ? 'Keep the new position: the player leaves those squads, the managers get their money back and pick a replacement for free before the deadline. Or change the player back in Fantasy.'
          : 'No gameweek is open for squad changes, so managers can’t pick a replacement now. Change the player back in Fantasy and the squads are valid again.'}
        {recent.length === 0 && data.candidates.length > 1 ? ' Pick the player whose position you changed.' : ''}
      </p>
      {data.candidates.length === 0 ? (
        <p className="text-sm text-yellow-300">No single position change fixes these squads. Contact support.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {data.candidates.map((c) => (
            <li key={c.fantasyPlayerId} className="py-2.5 space-y-2">
              <div className="min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {c.name}
                  {c.team ? <span className="text-gaffer-muted font-normal"> · {c.team}</span> : null}
                  {c.recentlyChanged && <span className="ml-2 text-[10px] font-bold uppercase text-yellow-300">recently changed</span>}
                </p>
                <p className="text-gaffer-muted text-[11px]">
                  Now {c.current} · in {c.squadsFixed} broken {c.squadsFixed === 1 ? 'squad' : 'squads'} as a {c.suggested}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.replacementOpen && (
                  <button
                    onClick={() => takeOut.mutate({ id: c.fantasyPlayerId, position: c.suggested })}
                    disabled={busy}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white bg-gaffer-orange disabled:opacity-40"
                  >
                    Keep {c.current}, refund managers
                  </button>
                )}
                <button
                  onClick={() => changeBack.mutate({ id: c.fantasyPlayerId, position: c.suggested })}
                  disabled={busy}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-40 ${
                    data.replacementOpen ? 'text-white border border-white/20' : 'text-white bg-gaffer-orange'
                  }`}
                >
                  Change back to {c.suggested}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
