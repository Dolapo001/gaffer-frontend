'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, X } from 'lucide-react'
import { deleteGameweek, previewGameweekDeletion } from '@/lib/services/fantasy.service'
import { getErrorMessage } from '@/lib/api'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * Deleting a Fantasy gameweek, after a check. The server lists what goes (matches, results, Fantasy points, transfers,
 * chips given back) and how later gameweeks are renumbered; Delete only works once the organiser types the word.
 */
export function DeleteGameweekDialog({ competitionId, gameweekId, onClose, onDeleted }: {
  competitionId: string
  gameweekId: string
  onClose: () => void
  onDeleted?: (message: string) => void
}) {
  const qc = useQueryClient()
  const [typed, setTyped] = useState('')
  const preview = useQuery({
    queryKey: ['gameweek-deletion-preview', competitionId, gameweekId],
    queryFn: () => previewGameweekDeletion(competitionId, gameweekId),
    staleTime: 0,
  })
  const p = preview.data
  const remove = useMutation({
    mutationFn: () => deleteGameweek(competitionId, gameweekId, typed.trim()),
    onSuccess: (r) => {
      // Matches, tables, points and gameweek numbers all change: refresh everything that may show them
      qc.invalidateQueries()
      onDeleted?.(r.message)
      onClose()
    },
  })

  const r = p?.removes
  const lines = r ? [
    r.matches ? `${plural(r.matches, 'match', 'matches')}${r.playedMatches ? ` (${r.playedMatches} played: results, goals, cards and the league table)` : ''}` : null,
    r.managersWithPoints ? `Fantasy points for ${plural(r.managersWithPoints, 'manager', 'managers')} (season totals are recalculated)` : null,
    r.transfers ? plural(r.transfers, 'transfer', 'transfers') : null,
    r.chipsGivenBack ? `${plural(r.chipsGivenBack, 'chip', 'chips')} used in it, given back to the managers` : null,
    r.priceChanges ? 'Player price changes made after it' : null,
  ].filter(Boolean) as string[] : []

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-label="Delete gameweek">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm max-h-[90vh] overflow-y-auto bg-gaffer-card border border-gaffer-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-chakra font-black text-white text-lg uppercase tracking-tight">
            Delete {p ? `Gameweek ${p.gameweek.number}` : 'gameweek'}?
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-white/30 hover:text-white"><X size={16} /></button>
        </div>

        {preview.isLoading && <p className="text-gaffer-muted text-sm">Checking what this gameweek contains…</p>}
        {preview.isError && <p role="alert" className="text-red-400 text-sm">{getErrorMessage(preview.error)}</p>}

        {p && (
          <>
            <p className="text-gaffer-muted text-sm"><span className="text-white font-bold">{p.gameweek.name}</span> (Gameweek {p.gameweek.number})</p>

            {p.blockedReason ? (
              <p role="alert" className="text-sm text-yellow-300 flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" />{p.blockedReason}</p>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-white">This removes the round and:</p>
                  {lines.length ? (
                    <ul className="text-sm text-gaffer-muted list-disc pl-5 space-y-1 mt-1">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
                  ) : (
                    <p className="text-sm text-gaffer-muted mt-1">Nothing else: it has no matches or Fantasy data yet.</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-white">Numbering</p>
                  {p.renumbers.length ? (
                    <ul className="text-sm text-gaffer-muted space-y-1 mt-1">
                      {p.renumbers.map((m) => (
                        <li key={m.from}>Gameweek {m.from} becomes Gameweek {m.to}{m.newName !== m.name ? ` (${m.name} → ${m.newName})` : ''}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gaffer-muted mt-1">The next gameweek you create will be Gameweek {p.gameweek.number}.</p>
                  )}
                </div>
                <label className="block text-xs text-gaffer-muted">
                  Type <span className="font-bold text-white">{p.confirmWord}</span> to confirm. This cannot be undone.
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoCapitalize="characters"
                    autoComplete="off"
                    className="mt-1 w-full rounded-xl bg-gaffer-bg border border-gaffer-border px-3 py-2 text-white text-sm"
                    aria-label={`Type ${p.confirmWord} to confirm`}
                  />
                </label>
              </div>
            )}

            {remove.isError && <p role="alert" className="text-red-400 text-sm">{getErrorMessage(remove.error)}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gaffer-border text-gaffer-muted font-bold text-sm uppercase hover:bg-white/5">Cancel</button>
              <button
                onClick={() => remove.mutate()}
                disabled={!!p.blockedReason || typed.trim() !== p.confirmWord || remove.isPending}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm uppercase hover:bg-red-500 disabled:opacity-40"
              >
                {remove.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
