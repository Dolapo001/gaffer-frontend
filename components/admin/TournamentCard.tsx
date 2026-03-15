'use client'

import { motion } from 'framer-motion'
import { Trophy, Users, Calendar, MapPin, ChevronRight } from 'lucide-react'
import type { Tournament } from '@/store/tournamentStore'

const statusStyles = {
  upcoming: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Upcoming' },
  ongoing:  { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', label: 'Live' },
  completed: { bg: 'bg-gaffer-card', border: 'border-gaffer-border', text: 'text-gaffer-muted', label: 'Ended' },
}

const sportEmoji: Record<string, string> = {
  football: '⚽', basketball: '🏀', cricket: '🏏', tennis: '🎾', other: '🏆',
}

interface TournamentCardProps {
  tournament: Tournament
  onClick?: () => void
}

export function TournamentCard({ tournament, onClick }: TournamentCardProps) {
  const style = statusStyles[tournament.status]
  const progress = Math.round((tournament.registeredTeams / tournament.maxTeams) * 100)

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 cursor-pointer hover:border-gaffer-orange/30 transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gaffer-surface flex items-center justify-center text-xl flex-shrink-0">
          {sportEmoji[tournament.sport] || '🏆'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-display font-bold text-white text-sm truncate">{tournament.name}</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-body font-semibold px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.text}`}>
              {style.label}
            </span>
            <span className="text-gaffer-subtle text-[10px] font-body capitalize">{tournament.format}</span>
          </div>
        </div>
        <ChevronRight size={16} className="text-gaffer-subtle flex-shrink-0 mt-0.5" />
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar size={12} className="text-gaffer-subtle" />
          <span className="text-gaffer-muted text-xs font-body truncate">
            {new Date(tournament.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin size={12} className="text-gaffer-subtle" />
          <span className="text-gaffer-muted text-xs font-body truncate">{tournament.location}</span>
        </div>
      </div>

      {/* Team capacity bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Users size={12} className="text-gaffer-subtle" />
            <span className="text-gaffer-muted text-xs font-body">
              {tournament.registeredTeams} / {tournament.maxTeams} teams
            </span>
          </div>
          <span className="text-gaffer-orange text-xs font-body font-medium">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-gaffer-surface rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-orange-gradient-btn rounded-full"
          />
        </div>
      </div>
    </motion.div>
  )
}
