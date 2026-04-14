'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useInviteValidation } from '@/lib/hooks/useInviteValidation'
import {
  InviteLoadingScreen,
  InviteErrorScreen,
  InviteDoneScreen,
} from '@/components/invite/InviteStatusScreen'
import { OrgInviteForm } from '@/components/organization/OrgInviteForm'

interface OrgOnboardingClientProps {
  token: string
}

export function OrgOnboardingClient({ token }: OrgOnboardingClientProps) {
  const router = useRouter()
  const validation = useInviteValidation(token || undefined, 'organization')
  const [isDone, setIsDone] = useState(false)

  const handleSuccess = () => {
    setIsDone(true)
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
            Join the Organisation
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
          {!isDone &&
            (validation.status === 'invalid' ||
              validation.status === 'expired' ||
              validation.status === 'used') && (
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
                {validation.invite.orgName && (
                  <p className="text-white/40 text-xs font-body mt-1">
                    Organisation: {validation.invite.orgName}
                  </p>
                )}
              </div>

              <OrgInviteForm token={token} onSuccess={handleSuccess} />
            </motion.div>
          )}

          {/* Done */}
          {isDone && (
            <InviteDoneScreen
              key="done"
              heading="Welcome Aboard!"
              subtext={`You have successfully joined the organisation.\nRedirecting you now…`}
            />
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
