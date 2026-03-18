'use client'

import { motion } from 'framer-motion'
import { Trophy, Users, Calendar, MapPin, ChevronRight, Check } from 'lucide-react'
import type { Tournament } from '@/store/tournamentStore'

const statusStyles = {
  upcoming: { color: 'text-blue-400', label: 'upcoming' },
  ongoing:  { color: 'text-green-500', label: 'live' },
  completed: { color: 'text-red-500', label: 'ended' },
}

interface TournamentCardProps {
  tournament: Tournament
  onClick?: () => void
}

export function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  const style = statusStyles[tournament.status as keyof typeof statusStyles] || statusStyles.upcoming
  const logoSrc = tournament.name.toLowerCase().includes('abuad') 
    ? '/images/abuad_fa.png' 
    : '/images/game_changer.png'

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-[#1C1F2D] border border-white/5 rounded-[24px] p-5 cursor-pointer hover:border-white/10 transition-all flex items-center justify-between group shadow-lg"
    >
      <div className="flex items-center gap-4">
        {/* Tournament Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-black/20">
            <img src={logoSrc} className="w-full h-full object-cover" alt="" />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-chakra font-black text-base text-white uppercase tracking-tight leading-none pt-0.5">
              {tournament.name}
            </h3>
            <div className="w-4 h-4 bg-[#FF4D00] rounded-full flex items-center justify-center shrink-0">
              <Check size={10} strokeWidth={4} className="text-white" />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-white/40 text-[11px] font-bold tracking-wide uppercase">
              {new Date(tournament.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()} - 
              {new Date(tournament.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()}
            </span>
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${style.color}`}>
              {style.label}
            </span>
          </div>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:text-white transition-colors shrink-0">
        <ChevronRight size={18} />
      </div>
    </motion.div>
  )
}
