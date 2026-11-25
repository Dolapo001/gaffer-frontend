'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, X } from 'lucide-react'
import { deleteFixture, previewFixtureDeletion } from '@/lib/services/fixture.service'
import { getErrorMessage } from '@/lib/api'

/**
 * Deleting a match, with a check first. The server says what deleting will undo (result, goals, cards, Fantasy
 * points). A match that has been played is only deleted after the organiser types the confirmation word, so a
 * finished match cannot be removed by a stray tap.
 */
export function DeleteMatchDialog({ fixtureId, onClose, onDeleted }: { fixtureId: string; onClose: () => void; onDeleted?: (message: string) => void }) {
  const qc = useQueryClient()
  const [typed, setTyped] = useState('')
  const preview = useQuery({ queryKey: ['fixture-deletion-preview', fixtureId], queryFn: () => previewFixtureDeletion(fixtureId), staleTime: 0 })
  const p = preview.data
  const needsWord = !!p?.confirmWord
  const wordOk = !needsWord || typed.trim() === p?.confirmWord

  const remove = useMutation({
    mutationFn: () => deleteFixture(fixtureId, needsWord ? typed.trim() : undefined),
    onSuccess: (r) => {
      // Results, tables, stats and Fantasy points all change: refresh everything that may show them
      qc.invalidateQueries()
      onDeleted?.(r.message)
      onClose()
    },
  })

  const u = p?.undoes
  const lines = u ? [
    u.resultInTable && p.match.score ? `The ${p.match.score.home}-${p.match.score.away} result, and the league table` : null,
    u.goals ? `${u.goals} ${u.goals === 1 ? 'goal' : 'goals'}` : null,
    u.yellowCards ? `${u.yellowCards} yellow ${u.yellowCards === 1 ? 'card' : 'cards'}` : null,
    u.redCards ? `${u.redCards} red ${u.redCards === 1 ? 'card' : 'cards'}` : null,
    u.events ? `All ${u.events} match events and the players' match stats` : null,
    u.fantasyPointRows && u.fantasyGameweek ? `Fantasy points from this match (${u.fantasyGameweek.name}), with every manager's totals recalculated` : null,
  ].filter(Boolean) as string[] : []

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-label="Delete match">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gaffer-card border border-gaffer-border rounded-2xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-chakra font-black text-white text-lg uppercase tracking-tight">Delete match?</h3>
          <button onClick={onClose} aria-label="Close" className="text-white/30 hover:text-white"><X size={16} /></button>
        </div>

        {preview.isLoading && <p className="text-gaffer-muted text-sm">Checking what this match changed…</p>}
        {preview.isError && <p role="alert" className="text-red-400 text-sm">{getErrorMessage(preview.error)}</p>}

        {p && (
          <>
            <p className="text-gaffer-muted text-sm">
              <span className="text-white font-bold">{p.match.home} vs {p.match.away}</span>
              {p.played ? ' has been played.' : ' has not been played yet.'}
            </p>

            {p.blockedReason ? (
              <p role="alert" className="text-sm text-yellow-300 flex gap-2"><AlertTriangle size={16} className="shrink-0 mt-0.5" />{p.blockedReason}</p>
            ) : p.played ? (
              <div className="space-y-2">
                <p className="text-sm text-white">Deleting it also removes:</p>
                <ul className="text-sm text-gaffer-muted list-disc pl-5 space-y-1">
                  {lines.map((l) => <li key={l}>{l}</li>)}
                </ul>
                {p.keepsPriceChanges && (
                  <p className="text-xs text-yellow-300">Fantasy player prices already changed after that gameweek stay as they are.</p>
                )}
                <label className="block text-xs text-gaffer-muted pt-1">
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
            ) : (
              <p className="text-sm text-gaffer-muted">This cannot be undone.</p>
            )}

            {remove.isError && <p role="alert" className="text-red-400 text-sm">{getErrorMessage(remove.error)}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gaffer-border text-gaffer-muted font-bold text-sm uppercase hover:bg-white/5">
                Cancel
              </button>
              <button
                onClick={() => remove.mutate()}
                disabled={!!p.blockedReason || !wordOk || remove.isPending}
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
