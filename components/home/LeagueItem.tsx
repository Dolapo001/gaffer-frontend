'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

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
  avatar,
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
      <div className="flex-shrink-0 w-11 h-11 rounded-full overflow-hidden shadow-orange-glow">
        {avatar ? (
          <Image src={avatar} alt={name} width={44} height={44} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FF8904] to-[#E7000B] flex items-center justify-center">
            <span className="text-white font-black text-sm uppercase tracking-wide">
              {name.split(' ').slice(0, 2).map(w => w[0]).join('')}
            </span>
          </div>
        )}
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

    </motion.div>
  )
}
