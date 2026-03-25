'use client'

import { motion } from 'framer-motion'
import { Calendar, Clock, Lock, Users } from 'lucide-react'
import type { FantasyGameweek, FantasyTeam } from '@/lib/services/fantasy.service'

interface GameweekSummaryCardProps {
  gameweek: FantasyGameweek | null
  fantasyTeam: FantasyTeam | null
}

function formatDeadline(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ', ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}

export function GameweekSummaryCard({ gameweek, fantasyTeam }: GameweekSummaryCardProps) {
  if (!gameweek) {
    return (
      <div className="w-full px-4 mb-4">
        <div className="bg-[#1a1b2e]/60 rounded-[24px] p-5 border border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-gaffer-orange" />
          </div>
          <div>
            <p className="text-white font-display font-bold text-sm">No active gameweek</p>
            <p className="text-white/40 text-[11px] font-body">
              Fantasy gameweeks will appear here once created.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const squadCount = fantasyTeam
    ? (fantasyTeam.startingXI?.length ?? 0) + (fantasyTeam.bench?.length ?? 0)
    : 0
  const isLocked = gameweek.lockStatus === 'locked'

  return (
    <div className="w-full px-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[24px] p-5 border border-white/5"
        style={{ background: 'linear-gradient(135deg, #111a2e 0%, #1a1b2e 100%)' }}
      >
        {/* Row: label + lock badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#FF8904]/10 border border-[#FF8904]/20 flex items-center justify-center">
              <Calendar size={11} className="text-[#FF8904]" />
            </div>
            <span className="text-[10px] font-chakra font-black text-white/40 uppercase tracking-[2px]">
              Gameweek
            </span>
          </div>
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-chakra font-black uppercase tracking-widest ${
              isLocked
                ? 'bg-red-500/10 text-red-400 border border-red-500/10'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
            }`}
          >
            {isLocked ? <Lock size={8} /> : <Clock size={8} />}
            <span className="ml-0.5">{isLocked ? 'Locked' : 'Open'}</span>
          </div>
        </div>

        {/* GW name */}
        <p className="text-white font-display font-black text-2xl mb-4 leading-tight">
          {gameweek.name}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Users size={11} className="text-white/30" />
              <span className="text-[9px] font-chakra font-black text-white/30 uppercase tracking-wider">
                Squad
              </span>
            </div>
            <p className="text-white font-display font-black text-xl leading-tight">
              {squadCount}
              <span className="text-white/30 text-sm font-medium">/15</span>
            </p>
          </div>

          <div className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock size={11} className="text-white/30" />
              <span className="text-[9px] font-chakra font-black text-white/30 uppercase tracking-wider">
                Deadline
              </span>
            </div>
            <p className="text-white font-body font-bold text-[10px] leading-snug">
              {formatDeadline(gameweek.deadline)}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
