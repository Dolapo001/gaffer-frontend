'use client'

import { motion } from 'framer-motion'
import { Star, Trophy } from 'lucide-react'
import type { FantasyTeam } from '@/lib/services/fantasy.service'

interface LeagueSummaryCardProps {
  fantasyTeam: FantasyTeam | null
  rank: number | null
  onGoToFantasy?: () => void
}

export function LeagueSummaryCard({ fantasyTeam, rank, onGoToFantasy }: LeagueSummaryCardProps) {
  if (!fantasyTeam) {
    return (
      <div className="w-full px-4 mb-4">
        <div
          className="rounded-[24px] p-5 border border-white/5"
          style={{ background: 'linear-gradient(135deg, #1a1b2e 0%, #141525 100%)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center">
              <Trophy size={13} className="text-gaffer-orange" />
            </div>
            <span className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-[2px]">
              Fantasy Team
            </span>
          </div>
          <p className="text-white font-display font-bold text-base mb-1">No fantasy team yet</p>
          <p className="text-white/40 text-xs font-body mb-4 leading-relaxed">
            Create your squad to track points and ranking inside this league.
          </p>
          <button
            onClick={onGoToFantasy}
            className="text-xs font-chakra font-black text-gaffer-orange uppercase tracking-widest"
          >
            Set Up Team →
          </button>
        </div>
      </div>
    )
  }

  const stats: { label: string; value: string | number }[] = [
    { label: 'GW Pts',  value: fantasyTeam.totalPoints ?? 0 },
    { label: 'Total',   value: fantasyTeam.totalPoints ?? 0 },
    { label: 'Rank',    value: rank != null ? `#${rank}` : '—' },
  ]

  return (
    <div className="w-full px-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[24px] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1E1240 0%, #2D1B58 60%, #1a1b2e 100%)',
          border: '1px solid rgba(210,181,255,0.12)',
          boxShadow: '0 16px 48px rgba(120,60,220,0.18)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-[2px] mb-0.5">
              Your Fantasy Team
            </p>
            <p className="text-white font-display font-bold text-lg leading-tight truncate max-w-[200px]">
              {fantasyTeam.teamName}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D2B5FF]/20 to-[#FF8904]/10 border border-[#D2B5FF]/10 flex items-center justify-center flex-shrink-0">
            <Star size={18} className="text-[#D2B5FF]" />
          </div>
        </div>

        {/* Stat pills */}
        <div className="px-4 pb-5 grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white/[0.05] rounded-xl py-3 px-2 text-center border border-white/[0.06]"
            >
              <p className="text-white font-display font-black text-xl leading-tight">{s.value}</p>
              <p className="text-white/35 text-[9px] font-chakra font-bold uppercase tracking-wider mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
