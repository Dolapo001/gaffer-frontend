'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useInviteValidation } from '@/lib/hooks/useInviteValidation'
import {
  InviteLoadingScreen,
  InviteErrorScreen,
  InviteDoneScreen,
} from '@/components/invite/InviteStatusScreen'
import { InviteForm } from '@/components/player/InviteForm'

const INVITE_STORAGE_KEY = 'gaffer-pending-invite-url'

interface OnboardingClientProps {
  token: string
}

export function OnboardingClient({ token }: OnboardingClientProps) {
  const router = useRouter()
  const validation = useInviteValidation(token || undefined, 'player')
  const [isDone, setIsDone] = useState(false)

  // Store the invite URL so the iOS PWA can recover it if it starts at root
  // instead of the invite URL (known iOS standalone deep-link limitation).
  useEffect(() => {
    if (token && typeof window !== 'undefined') {
      sessionStorage.setItem(INVITE_STORAGE_KEY, window.location.href)
    }
  }, [token])

  const handleSuccess = () => {
    setIsDone(true)
    sessionStorage.removeItem(INVITE_STORAGE_KEY)
    setTimeout(() => router.replace('/app/dashboard'), 3000)
  }

  return (
    <>
      {/* ── Coming Soon Modal ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(10,11,18,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', damping: 28, stiffness: 260 }}
          className="w-full max-w-sm rounded-[28px] overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #1a1d2e 0%, #12141f 100%)', border: '1px solid rgba(255,107,0,0.18)' }}
        >
          {/* Orange glow top bar */}
          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #FF6B00, #ff9a00)' }} />

          <div className="px-7 pt-8 pb-9 flex flex-col items-center text-center gap-5">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.25)' }}>
              ⚽
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-body font-bold uppercase tracking-[0.3em] text-orange-400">
                Coming Soon
              </p>
              <h2 className="font-chakra font-black text-2xl uppercase tracking-tight text-white leading-tight">
                Player Onboarding
              </h2>
              <p className="text-white/50 text-sm font-body leading-relaxed">
                We&apos;re putting the finishing touches on this feature. Players will be able to join their team directly from an invite link very soon.
              </p>
            </div>

            <div className="w-full rounded-2xl px-4 py-3 text-left"
              style={{ background: 'rgba(255,107,0,0.07)', border: '1px solid rgba(255,107,0,0.15)' }}>
              <p className="text-[11px] font-body font-bold uppercase tracking-widest text-orange-400/70 mb-1">Your invite is saved</p>
              <p className="text-white/60 text-xs font-body">
                Your invite link will work once this feature goes live. Check back soon.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Underlying page (blurred behind modal) */}
      <div className="min-h-screen bg-[#0F111A] text-white flex flex-col font-inter">
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

            {/* Loading */}
            {!isDone && validation.status === 'loading' && (
              <InviteLoadingScreen key="loading" />
            )}

            {/* Error states */}
            {!isDone && (validation.status === 'invalid' || validation.status === 'expired' || validation.status === 'used') && (
              <InviteErrorScreen
                key={validation.status}
                variant={validation.status}
                message={validation.message}
              />
            )}

            {/* Valid — show form */}
            {!isDone && validation.status === 'valid' && (
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
                    {validation.invite.email}
                  </p>
                  {validation.invite.teamName && (
                    <p className="text-white/40 text-xs font-body mt-1">
                      Team: {validation.invite.teamName}
                    </p>
                  )}
                </div>

                <InviteForm token={token} onSuccess={handleSuccess} />
              </motion.div>
            )}

            {/* Done */}
            {isDone && (
              <InviteDoneScreen
                key="done"
                heading="You're In!"
                subtext={`You have successfully joined the team.\nRedirecting you now…`}
              />
            )}

          </AnimatePresence>
        </main>
      </div>
    </>
  )
}
