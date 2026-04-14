'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPlayerInvite } from '@/lib/services/team.service'
import { buildInviteLink } from '@/lib/routes'
import { CopyLink } from '@/components/CopyLink'
import { ApiError, getErrorMessage } from '@/lib/api'
import { useUIStore } from '@/store/uiStore'

interface InvitePlayerModalProps {
  teamId: string
  isOpen: boolean
  onClose: () => void
}

type ModalState =
  | { step: 'form' }
  | { step: 'success'; email: string; fullLink: string }

/**
 * InvitePlayerModal — bottom-sheet modal for managers to invite a player by email.
 *
 * Flow:
 *  1. Manager enters player email → POST /teams/:teamId/player-invites
 *  2. Backend sends invite email automatically (Resend)
 *  3. Success screen shows confirmation + fallback copy-link button
 *
 * The invite link returned by the backend is RELATIVE (/player/onboarding?token=…).
 * We prepend window.location.origin via buildInviteLink() before displaying/copying.
 */
export function InvitePlayerModal({ teamId, isOpen, onClose }: InvitePlayerModalProps) {
  const qc = useQueryClient()
  const { hideNavbar, showNavbar } = useUIStore()
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [state, setState] = useState<ModalState>({ step: 'form' })

  useEffect(() => {
    if (isOpen) {
      hideNavbar()
    } else {
      showNavbar()
    }
    // Cleanup on unmount to ensure navbar is restored
    return () => {
      showNavbar()
    }
  }, [isOpen, hideNavbar, showNavbar])

  const reset = () => {
    setEmail('')
    setFieldError(null)
    setState({ step: 'form' })
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const inviteMutation = useMutation({
    mutationFn: (emailAddr: string) => createPlayerInvite(teamId, emailAddr),
    onSuccess: (data, emailAddr) => {
      qc.invalidateQueries({ queryKey: ['player-invites', teamId] })
      const fullLink = buildInviteLink(data.inviteLink)
      setState({ step: 'success', email: emailAddr, fullLink })
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.code === 'INVALID_INVITE_DATA' || err.status === 422) {
          setFieldError(err.message || 'Invalid email address.')
          return
        }
        if (err.code === 'FORBIDDEN' || err.status === 403) {
          setFieldError("You don't have permission to invite players to this team.")
          return
        }
      }
      setFieldError(getErrorMessage(err))
    },
  })

  const handleSubmit = () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setFieldError('Email is required.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setFieldError('Please enter a valid email address.')
      return
    }
    setFieldError(null)
    inviteMutation.mutate(trimmed)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Fullscreen modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[100] bg-gaffer-surface flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-12 pb-3 border-b border-gaffer-border">
              <div>
                <h2 className="font-display font-bold text-white text-lg">
                  {state.step === 'success' ? 'Invite Sent!' : 'Invite Player'}
                </h2>
                <p className="text-gaffer-muted text-xs font-body mt-0.5">
                  {state.step === 'success'
                    ? 'An email has been sent to the player'
                    : 'An invite email will be sent automatically'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-gaffer-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5 pb-10 space-y-5">
              <AnimatePresence mode="wait" initial={false}>

                {/* ── Form step ── */}
                {state.step === 'form' && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    className="space-y-5"
                  >
                    <div className="space-y-2">
                      <label className="block text-xs font-body font-medium text-white/80">
                        Player Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (fieldError) setFieldError(null)
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        placeholder="player@example.com"
                        className={`w-full px-4 py-3 rounded-xl bg-gaffer-card border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none transition-colors ${
                          fieldError
                            ? 'border-red-500/60 focus:border-red-500'
                            : 'border-gaffer-border focus:border-gaffer-orange'
                        }`}
                      />
                      {fieldError && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-1.5 text-red-400 text-xs font-body"
                        >
                          <AlertCircle size={12} />
                          {fieldError}
                        </motion.p>
                      )}
                    </div>

                    <button
                      onClick={handleSubmit}
                      disabled={!email.trim() || inviteMutation.isPending}
                      className="w-full py-4 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {inviteMutation.isPending ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Mail size={16} />
                          Send Invite
                        </>
                      )}
                    </button>
                  </motion.div>
                )}

                {/* ── Success step ── */}
                {state.step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    className="space-y-5"
                  >
                    {/* Confirmation banner */}
                    <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                      <CheckCircle2 size={20} className="text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-green-400 font-display font-bold text-sm">
                          Invite sent to {(state as { step: 'success'; email: string; fullLink: string }).email}
                        </p>
                        <p className="text-white/40 text-xs font-body mt-0.5">
                          An email has been sent to the player with their invite link.
                        </p>
                      </div>
                    </div>

                    {/* Fallback copy link */}
                    <div className="space-y-2">
                      <p className="text-[11px] font-body font-bold text-gaffer-muted uppercase tracking-widest">
                        Fallback — share this link manually
                      </p>
                      <div className="bg-gaffer-card border border-gaffer-border rounded-xl px-4 py-3">
                        <p className="text-white/40 text-xs font-mono truncate mb-3">
                          {(state as { step: 'success'; email: string; fullLink: string }).fullLink}
                        </p>
                        <CopyLink
                          link={(state as { step: 'success'; email: string; fullLink: string }).fullLink}
                          className="w-full"
                        />
                      </div>
                      <p className="text-white/25 text-[11px] font-body text-center">
                        Link expires in 7 days · Single-use only
                      </p>
                    </div>

                    {/* Invite another */}
                    <button
                      onClick={reset}
                      className="w-full py-3 rounded-xl bg-gaffer-card border border-gaffer-border text-white/60 font-display font-bold text-sm hover:text-white transition-colors"
                    >
                      Invite Another Player
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
