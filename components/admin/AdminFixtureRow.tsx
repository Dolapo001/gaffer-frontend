'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { startMatch, cancelLive, deleteFixture, teamsWithoutApprovedLineup, penaltiesSuffix } from '@/lib/services/fixture.service'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useToast } from '@/store/toastStore'

interface AdminFixtureRowProps {
  fixture: any
  onClick: () => void
}

// Same compact visual language as CompactFixtureRow, plus admin-only actions
// (Go Live toggle, delete) — used by the admin Schedule page's grouped list.
export function AdminFixtureRow({ fixture, onClick }: AdminFixtureRowProps) {
  const { addToast } = useToast()
  const qc = useQueryClient()
  const isLive = fixture.status === 'live' || fixture.status === 'halftime'
  const isCompleted = fixture.status === 'completed'
  const [live, setLive] = useState(isLive)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // Teams without an approved lineup, when the admin tries to go live
  const [missingLineups, setMissingLineups] = useState<string[] | null>(null)
  const [checkingLineups, setCheckingLineups] = useState(false)

  useEffect(() => setLive(isLive), [isLive])

  const home = fixture.homeTeamId && typeof fixture.homeTeamId === 'object' ? fixture.homeTeamId : { name: 'Home' }
  const away = fixture.awayTeamId && typeof fixture.awayTeamId === 'object' ? fixture.awayTeamId : { name: 'Away' }
  const kickoff = fixture.kickoffAt ? new Date(fixture.kickoffAt) : new Date()
  const dateLabel = kickoff.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
  const time = kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  const toggleMutation = useMutation({
    mutationFn: (next: boolean) => (next ? startMatch(fixture._id) : cancelLive(fixture._id)),
    onSuccess: (_, next) => {
      qc.invalidateQueries({ queryKey: ['fixtures'] })
      addToast(next ? 'Match is now LIVE!' : 'Match set back to scheduled.', 'success')
    },
    onError: (err: any) => {
      setLive((v) => !v)
      addToast(err?.message || 'Failed to update match status', 'error')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteFixture(fixture._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fixtures'] })
      addToast('Fixture deleted.', 'success')
      setShowDeleteConfirm(false)
    },
    onError: (err: any) => addToast(err?.message || 'Failed to delete fixture', 'error'),
  })

  const goLive = (next: boolean) => {
    setLive(next)
    toggleMutation.mutate(next)
  }

  const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (toggleMutation.isPending || checkingLineups) return
    const next = e.target.checked
    if (!next) return goLive(false)
    // Warn (never block) when a side has no approved lineup
    setCheckingLineups(true)
    const missing = await teamsWithoutApprovedLineup(fixture._id, { home: home.name, away: away.name })
    setCheckingLineups(false)
    if (missing.length) setMissingLineups(missing)
    else goLive(true)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLive) {
      addToast('Cannot delete a live fixture. Turn off live first.', 'error')
      return
    }
    setShowDeleteConfirm(true)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
        className="w-full flex items-center gap-3 bg-gaffer-surface border border-gaffer-border rounded-xl px-3 py-2.5 text-left hover:border-gaffer-orange/30 transition-colors cursor-pointer"
      >
        <div className="w-11 flex-shrink-0 flex flex-col items-start gap-0.5">
          <span className="text-gaffer-muted text-[9px] font-black">{dateLabel}</span>
          <span className={`text-[9px] font-black uppercase ${isLive ? 'text-gaffer-orange' : 'text-gaffer-muted'}`}>
            {isCompleted ? 'FT' : isLive ? 'LIVE' : time}
          </span>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <span className="text-white text-[13px] font-semibold truncate">{home.name}</span>
          <span className="text-white text-[13px] font-semibold truncate">{away.name}</span>
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <span className="text-white text-[13px] font-black">{isCompleted || isLive ? fixture.score?.home ?? 0 : ''}</span>
          <span className="text-white text-[13px] font-black">{isCompleted || isLive ? fixture.score?.away ?? 0 : ''}</span>
          {isCompleted && penaltiesSuffix(fixture) && <span className="text-white/50 text-[10px] font-bold whitespace-nowrap">{penaltiesSuffix(fixture)}</span>}
        </div>

        {!isCompleted && (
          <label
            className={`relative inline-flex items-center flex-shrink-0 ${toggleMutation.isPending || checkingLineups ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <input type="checkbox" className="sr-only peer" checked={live} onChange={handleToggle} disabled={toggleMutation.isPending || checkingLineups} />
            <div className="w-9 h-5 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gaffer-orange" />
          </label>
        )}

        <button
          onClick={handleDeleteClick}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:bg-red-500/20 hover:text-red-400 transition-all flex-shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <ConfirmDialog
        open={!!missingLineups}
        title="No confirmed lineup"
        message={`No confirmed lineup for ${(missingLineups ?? []).join(' and ')}. Fantasy appearance and clean-sheet points can't be calculated without one. Start anyway?`}
        cancelLabel="Add lineup"
        confirmLabel="Start anyway"
        onCancel={() => { setMissingLineups(null); onClick() }}
        onDismiss={() => setMissingLineups(null)}
        onConfirm={() => { setMissingLineups(null); goLive(true) }}
      />

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center px-6"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gaffer-card border border-gaffer-border rounded-2xl p-6 w-full max-w-sm space-y-4"
            >
              <h3 className="font-chakra font-black text-white text-lg uppercase tracking-tight">Delete Fixture?</h3>
              <p className="text-gaffer-muted text-sm">
                Are you sure you want to delete <span className="text-white font-bold">{home.name} vs {away.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl border border-gaffer-border text-gaffer-muted font-bold text-sm uppercase hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm uppercase hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
