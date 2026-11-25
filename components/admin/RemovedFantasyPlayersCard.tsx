'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { UserX } from 'lucide-react'
import { listRemovedFantasyPlayers, restoreFantasyPlayer } from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { formatDateTime } from '@/lib/dates'

/**
 * Players out of Fantasy in this tournament. A player leaves Fantasy when they are removed from their team's squad (or
 * when the organiser takes them out). Managers who already had them keep them, scoring nothing, and can replace them
 * for free. The organiser can bring a player back here.
 */
export function RemovedFantasyPlayersCard({ competitionId }: { competitionId: string }) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const { data: removed = [] } = useQuery({
    queryKey: ['fantasy-removed-players', competitionId],
    queryFn: () => listRemovedFantasyPlayers(competitionId),
  })
  const restore = useMutation({
    mutationFn: (id: string) => restoreFantasyPlayer(competitionId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fantasy-removed-players', competitionId] })
      qc.invalidateQueries({ queryKey: ['fantasy-players', competitionId] })
      toast.addToast('Player is back in Fantasy.', 'success')
    },
    onError: (e) => toast.addToast(getErrorMessage(e), 'error'),
  })

  if (removed.length === 0) return null

  return (
    <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-6 space-y-3">
      <div className="flex items-center gap-2">
        <UserX size={16} className="text-red-300" />
        <h3 className="font-display font-bold text-white uppercase tracking-tight">Players out of Fantasy</h3>
      </div>
      <p className="text-gaffer-muted text-xs">
        Nobody can pick these players and they score nothing. Managers who already had them keep them and can replace them for free.
      </p>
      <ul className="divide-y divide-white/5">
        {removed.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{p.name} <span className="text-gaffer-muted font-normal">· {p.position}{p.team ? ` · ${p.team}` : ''}</span></p>
              <p className="text-gaffer-muted text-[11px]">
                {p.reason === 'organiser' ? 'Taken out by the organiser' : 'Left the squad'} · {formatDateTime(p.removedAt)}
                {p.managersWithPlayer > 0 ? ` · still in ${p.managersWithPlayer} ${p.managersWithPlayer === 1 ? 'squad' : 'squads'}` : ''}
              </p>
            </div>
            <button
              onClick={() => restore.mutate(p.id)}
              disabled={restore.isPending}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-white border border-gaffer-border hover:bg-white/5 disabled:opacity-40"
            >
              Restore
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
