'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react'
import { validatePlayerInvite } from '@/lib/services/team.service'
import { getErrorMessage } from '@/lib/api'
import { InviteForm } from '@/components/player/InviteForm'

type ValidateState =
  | { status: 'loading' }
  | { status: 'invalid'; message: string }
  | { status: 'valid'; invite: { _id: string; email: string; teamId: string } }
  | { status: 'done' }

interface OnboardingClientProps {
  token: string
}

/**
 * OnboardingClient — handles the full player onboarding lifecycle:
 *
 *  1. Token missing  → "Invalid invite link"
 *  2. Validate token → POST /player-invites/validate
 *  3. Invalid        → "This invite link is invalid or expired"
 *  4. Valid          → render InviteForm
 *  5. Success        → confirmation screen → redirect
 */
export function OnboardingClient({ token }: OnboardingClientProps) {
  const router = useRouter()
  const [validateState, setValidateState] = useState<ValidateState>({ status: 'loading' })

  useEffect(() => {
    if (!token) {
      setValidateState({ status: 'invalid', message: 'Invalid invite link. No token found.' })
      return
    }

    validatePlayerInvite(token)
      .then((res) => setValidateState({ status: 'valid', invite: res.invite }))
      .catch((err) => {
        setValidateState({
          status: 'invalid',
          message: getErrorMessage(err) || 'This invite link is invalid or expired.',
        })
      })
  }, [token])

  const handleSuccess = () => {
    setValidateState({ status: 'done' })
    // Give the player a moment to read the success screen, then redirect
    setTimeout(() => router.replace('/app/dashboard'), 3000)
  }

  return (
    <div className="min-h-screen bg-[#0F111A] text-white flex flex-col font-inter">
      {/* Header */}
      <header className="px-6 pt-14 pb-6 shrink-0">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-body font-bold text-white/30 uppercase tracking-[0.25em]">
            Gaffer FC
          </span>
          <h1 className="font-chakra font-black text-2xl uppercase tracking-tight italic text-white">
            Join Your Team
          </h1>
        </div>
      </header>

      <main className="flex-1 px-6 pb-16 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* ── Loading ── */}
          {validateState.status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
            >
              <RefreshCw size={32} className="text-orange-500 animate-spin" />
              <p className="text-white/40 text-sm font-body">Validating your invite…</p>
            </motion.div>
          )}

          {/* ── Invalid ── */}
          {validateState.status === 'invalid' && (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4"
            >
              <div className="w-20 h-20 rounded-[28px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert size={36} className="text-red-400" />
              </div>
              <div>
                <h2 className="font-chakra font-black text-xl uppercase text-white mb-2">
                  Invalid Invite
                </h2>
                <p className="text-white/40 text-sm font-body leading-relaxed max-w-xs mx-auto">
                  {validateState.message}
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="mt-2 text-orange-500 font-display font-bold text-sm"
              >
                Go to Homepage
              </button>
            </motion.div>
          )}

          {/* ── Valid → show form ── */}
          {validateState.status === 'valid' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* Invite context card */}
              <div className="bg-[#1C1F2D] rounded-[24px] p-5 border border-white/5 mb-6">
                <p className="text-[11px] font-body font-bold text-white/30 uppercase tracking-widest mb-1">
                  Invited as
                </p>
                <p className="text-white font-display font-bold text-base">
                  {validateState.invite.email}
                </p>
              </div>

              <InviteForm token={token} onSuccess={handleSuccess} />
            </motion.div>
          )}

          {/* ── Done ── */}
          {validateState.status === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center px-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
                className="w-24 h-24 rounded-[32px] bg-green-500/10 border border-green-500/20 flex items-center justify-center"
              >
                <CheckCircle2 size={44} className="text-green-400" />
              </motion.div>
              <div>
                <h2 className="font-chakra font-black text-2xl uppercase text-white mb-2 italic">
                  You&apos;re In!
                </h2>
                <p className="text-white/50 text-sm font-body leading-relaxed">
                  You have successfully joined the team.
                  <br />
                  Redirecting you now…
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
