'use client'

import { motion } from 'framer-motion'
import { Info, Flame } from 'lucide-react'

interface LeagueItemProps {
  id: string
  name: string
  dateRange: string
  avatar?: string
  verified?: boolean
  onClick?: () => void
}

export function LeagueItem({
  name,
  dateRange,
  verified = true,
  onClick,
}: LeagueItemProps) {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 py-3.5 cursor-pointer group"
    >
      {/* League Avatar */}
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gaffer-orange flex items-center justify-center shadow-orange-glow">
        <Flame size={18} className="text-white" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-white font-body font-semibold text-sm truncate">
            {name}
          </span>
          {verified && (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="flex-shrink-0">
              <circle cx="6.5" cy="6.5" r="6.5" fill="#FF6B00" />
              <path d="M3.5 6.5l2 2 4-4" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <p className="text-gaffer-muted text-xs font-body mt-0.5">{dateRange}</p>
      </div>

      {/* Info icon */}
      <button
        onClick={(e) => e.stopPropagation()}
        className="flex-shrink-0 w-8 h-8 rounded-full border border-gaffer-border flex items-center justify-center text-gaffer-subtle hover:text-white hover:border-gaffer-orange/40 transition-all"
      >
        <Info size={14} />
      </button>
    </motion.div>
  )
}
