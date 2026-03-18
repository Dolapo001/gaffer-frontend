'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'

interface TournamentBannerProps {
  hasTourn?: boolean
  onCreateClick?: () => void
}

export function TournamentBanner({ hasTourn = false, onCreateClick }: TournamentBannerProps) {
  const router = useRouter()
  const { role, setRole } = useAuthStore()

  if (hasTourn) return null

  const handleClick = () => {
    if (role === 'personal') {
      setRole('organization')
      router.push('/admin')
    } else if (onCreateClick) {
      onCreateClick()
    }
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gaffer-card border border-gaffer-border">
      {/* Decorative trophy background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <Trophy size={120} className="text-gaffer-orange" />
      </div>
      {/* Subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gaffer-orange/5 to-transparent" />

      <div className="relative py-10 px-6 flex flex-col items-center text-center gap-4">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gaffer-surface border border-gaffer-border flex items-center justify-center">
          <Trophy size={24} className="text-gaffer-orange" />
        </div>
        <p className="font-body text-gaffer-muted text-sm">
          You Don&apos;t have any Tournament
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleClick}
          className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-orange-gradient-btn text-white font-display font-bold text-sm shadow-orange-glow"
        >
          <Plus size={16} />
          Create Tournament
        </motion.button>
      </div>
    </div>
  )
}
