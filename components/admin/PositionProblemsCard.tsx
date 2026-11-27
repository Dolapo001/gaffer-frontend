'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { getPositionProblems, setFantasyPosition, type FantasyPosition } from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

/**
 * Managers' squads that stopped adding up because a player's Fantasy position changed after they were bought (for
 * example a midfielder turned defender leaves 6 defenders). Lists the players whose change back repairs those squads;
 * one tap puts it right. Shown only when there is a problem.
 */
export function PositionProblemsCard({ competitionId }: { competitionId: string }) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const { data } = useQuery({
    queryKey: ['fantasy-position-problems', competitionId],
    queryFn: () => getPositionProblems(competitionId),
  })
  const fix = useMutation({
    mutationFn: ({ id, position }: { id: string; position: FantasyPosition }) => setFantasyPosition(competitionId, id, position),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fantasy-position-problems', competitionId] })
      qc.invalidateQueries({ queryKey: ['player-pricing', competitionId] })
      toast.addToast('Fixed. Managers’ squads add up again.', 'success')
    },
    onError: (e) => toast.addToast(getErrorMessage(e), 'error'),
  })

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
        {data.brokenSquads} {squads} because a player&apos;s position changed after they were bought. Change that player back in
        Fantasy and the squads are valid again. Their position on the real team does not change.
        {recent.length === 0 && data.candidates.length > 1 ? ' Pick the player whose position you changed.' : ''}
      </p>
      {data.candidates.length === 0 ? (
        <p className="text-sm text-yellow-300">No single position change fixes these squads. Contact support.</p>
      ) : (
        <ul className="divide-y divide-white/5">
          {data.candidates.map((c) => (
            <li key={c.fantasyPlayerId} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold truncate">
                  {c.name}
                  {c.team ? <span className="text-gaffer-muted font-normal"> · {c.team}</span> : null}
                  {c.recentlyChanged && <span className="ml-2 text-[10px] font-bold uppercase text-yellow-300">recently changed</span>}
                </p>
                <p className="text-gaffer-muted text-[11px]">
                  Now {c.current} · fixes {c.squadsFixed} {c.squadsFixed === 1 ? 'squad' : 'squads'} as {c.suggested}
                </p>
              </div>
              <button
                onClick={() => fix.mutate({ id: c.fantasyPlayerId, position: c.suggested })}
                disabled={fix.isPending}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white bg-gaffer-orange disabled:opacity-40"
              >
                Change back to {c.suggested}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
