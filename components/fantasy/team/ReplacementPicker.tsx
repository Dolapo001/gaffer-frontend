'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { fillReplacement, listFantasyPlayers, type FantasyPlayer, type PendingReplacement } from '@/lib/services/fantasy.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { formatSquadValue } from '@/lib/format'

/**
 * Picks the player who takes an empty place left by a position change. Only players of the position that is missing,
 * not already in the squad and affordable from the bank are offered. Free: no transfer is used.
 */
export function ReplacementPicker({ competitionId, place, bank, squadIds, onClose }: {
  competitionId: string
  place: PendingReplacement
  bank: number
  squadIds: string[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const toast = useToastStore()
  const { data, isLoading } = useQuery({
    queryKey: ['fantasy-players', competitionId, 'replacement', place.position, bank],
    queryFn: () => listFantasyPlayers(competitionId, { position: place.position, maxPrice: bank, pageSize: 50, sortBy: 'price' }),
  })
  const options = (data?.data ?? []).filter((p) => !squadIds.includes(p._id))

  const pick = useMutation({
    mutationFn: (p: FantasyPlayer) => fillReplacement(competitionId, p._id, place.removedPlayerId),
    onSuccess: (_r, p) => {
      qc.invalidateQueries({ queryKey: ['fantasy-team-me', competitionId] })
      toast.addToast(`${p.playerId?.displayName?.trim() || `${p.playerId?.firstName ?? ''} ${p.playerId?.lastName ?? ''}`.trim()} is in your squad. No transfer used.`, 'success')
      onClose()
    },
    onError: (e) => toast.addToast(getErrorMessage(e), 'error'),
  })

  const name = (p: FantasyPlayer) => p.playerId?.displayName?.trim() || `${p.playerId?.firstName ?? ''} ${p.playerId?.lastName ?? ''}`.trim()

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={`Pick a ${place.position}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-auto bg-gaffer-surface border-t border-gaffer-border rounded-t-[2rem] p-5 space-y-3 max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-display font-bold uppercase tracking-tight">Pick a {place.position}</h3>
            <p className="text-gaffer-muted text-xs">Replaces {place.name} · free, no transfer used · bank {formatSquadValue(bank)}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white"><X size={18} /></button>
        </div>
        {isLoading ? (
          [0, 1, 2].map((i) => <div key={i} className="h-14 bg-gaffer-card rounded-2xl animate-pulse" />)
        ) : options.length === 0 ? (
          <p className="text-sm text-gaffer-muted">No {place.position} you can afford with {formatSquadValue(bank)} is available.</p>
        ) : (
          options.map((p) => (
            <button
              key={p._id}
              onClick={() => pick.mutate(p)}
              disabled={pick.isPending}
              className="w-full flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-2xl p-3 text-left hover:border-gaffer-orange/40 disabled:opacity-50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{name(p)}</p>
                <p className="text-gaffer-muted text-xs">{(p.teamId as any)?.name ?? ''}</p>
              </div>
              <span className="text-gaffer-orange font-display font-bold text-sm">{formatSquadValue(p.price)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
