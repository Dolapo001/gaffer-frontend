'use client'

import { motion } from 'framer-motion'
import { Trash2, Shield } from 'lucide-react'
import type { Player } from '@/store/tournamentStore'

const positionColors: Record<string, string> = {
  Goalkeeper: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  Defender:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Midfielder: 'text-green-400 bg-green-400/10 border-green-400/20',
  Striker:    'text-gaffer-orange bg-gaffer-orange/10 border-gaffer-orange/20',
  Forward:    'text-gaffer-orange bg-gaffer-orange/10 border-gaffer-orange/20',
}

interface PlayerCardProps {
  player: Player
  onRemove?: () => void
}

export function PlayerCard({ player, onRemove }: PlayerCardProps) {
  const posStyle = positionColors[player.position] || 'text-gaffer-muted bg-gaffer-card border-gaffer-border'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-xl p-3"
    >
      {/* Jersey number */}
      <div className="w-10 h-10 rounded-xl bg-orange-gradient-btn flex items-center justify-center flex-shrink-0 shadow-orange-glow">
        <span className="text-white font-display font-black text-base leading-none">
          {player.jerseyNumber}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-body font-semibold text-sm truncate">{player.name}</p>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] font-body font-medium px-1.5 py-0.5 rounded border ${posStyle}`}>
            {player.position}
          </span>
          <div className="flex items-center gap-1">
            <Shield size={10} className="text-gaffer-subtle" />
            <span className="text-gaffer-subtle text-[10px] font-body">{player.nationality}</span>
          </div>
        </div>
      </div>

      {/* Age */}
      <div className="text-right flex-shrink-0">
        <p className="text-gaffer-muted text-xs font-body">Age</p>
        <p className="text-white font-body font-semibold text-sm">{player.age}</p>
      </div>

      {/* Remove */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors flex-shrink-0"
        >
          <Trash2 size={13} />
        </button>
      )}
    </motion.div>
  )
}
