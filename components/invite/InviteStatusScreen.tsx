'use client'

/**
 * InviteStatusScreen
 *
 * Shared fullscreen states for invite-onboarding pages:
 *   loading  – spinning indicator
 *   invalid  – red shield
 *   expired  – clock icon
 *   used     – already-checked icon
 *   done     – success checkmark
 *
 * Import once, use in both player and organisation onboarding.
 */

import { motion } from 'framer-motion'
import { ShieldAlert, Clock, CheckCheck, CheckCircle2, RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ── Loading ───────────────────────────────────────────────────────────────────

export function InviteLoadingScreen() {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
    >
      <RefreshCw size={32} className="text-gaffer-orange animate-spin" />
      <p className="text-white/40 text-sm font-body">Validating your invite…</p>
    </motion.div>
  )
}

// ── Error (invalid / expired / used) ─────────────────────────────────────────

type ErrorVariant = 'invalid' | 'expired' | 'used'

const ERROR_CONFIG: Record<ErrorVariant, { icon: React.ElementType; title: string }> = {
  invalid: { icon: ShieldAlert, title: 'Invalid Invite' },
  expired: { icon: Clock,       title: 'Invite Expired' },
  used:    { icon: CheckCheck,  title: 'Already Used'   },
}

interface InviteErrorScreenProps {
  variant: ErrorVariant
  message: string
}

export function InviteErrorScreen({ variant, message }: InviteErrorScreenProps) {
  const router = useRouter()
  const { icon: Icon, title } = ERROR_CONFIG[variant]

  return (
    <motion.div
      key={variant}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4"
    >
      <div className="w-20 h-20 rounded-[28px] bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <Icon size={36} className="text-red-400" />
      </div>
      <div>
        <h2 className="font-chakra font-black text-xl uppercase text-white mb-2">{title}</h2>
        <p className="text-white/40 text-sm font-body leading-relaxed max-w-xs mx-auto">
          {message}
        </p>
      </div>
      <button
        onClick={() => router.push('/')}
        className="mt-2 text-gaffer-orange font-display font-bold text-sm"
      >
        Go to Homepage
      </button>
    </motion.div>
  )
}

// ── Done ─────────────────────────────────────────────────────────────────────

interface InviteDoneScreenProps {
  heading: string
  subtext: string
}

export function InviteDoneScreen({ heading, subtext }: InviteDoneScreenProps) {
  return (
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
          {heading}
        </h2>
        <p className="text-white/50 text-sm font-body leading-relaxed whitespace-pre-line">
          {subtext}
        </p>
      </div>
    </motion.div>
  )
}
