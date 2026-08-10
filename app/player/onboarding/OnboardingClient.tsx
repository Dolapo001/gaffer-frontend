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

// localStorage (not sessionStorage) so the URL survives across iOS PWA launches.
// When iOS opens the installed PWA at its start_url instead of the invite URL,
// the splash page reads this key and redirects the player to the correct form.
const INVITE_STORAGE_KEY = 'gaffer-pending-invite-url'

interface OnboardingClientProps {
  token: string
}

export function OnboardingClient({ token }: OnboardingClientProps) {
  const router = useRouter()
  const validation = useInviteValidation(token || undefined, 'player')
  const [isDone, setIsDone] = useState(false)

  // Store the invite URL so the iOS PWA can recover it if it starts at root
  // or splash instead of the invite URL (known iOS standalone deep-link limitation).
  useEffect(() => {
    if (token && typeof window !== 'undefined') {
      localStorage.setItem(INVITE_STORAGE_KEY, window.location.href)
    }
  }, [token])

  const handleSuccess = () => {
    setIsDone(true)
    localStorage.removeItem(INVITE_STORAGE_KEY)
    setTimeout(() => router.replace('/app/dashboard'), 3000)
  }

  return (
    <>
      {/* Underlying page */}
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
