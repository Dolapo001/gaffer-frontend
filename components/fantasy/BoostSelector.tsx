'use client'

import { motion } from 'framer-motion'
import { Zap, Star, Shuffle, Play } from 'lucide-react'
import { BOOST_OPTIONS, type BoostType } from '@/lib/fantasyMockData'

const BOOST_ICONS: Record<NonNullable<BoostType>, React.ReactNode> = {
  benchBoost: <Zap size={18} className="text-gaffer-orange" />,
  tripleCaptain: <Star size={18} className="text-gaffer-orange" />,
  wildcard: <Shuffle size={18} className="text-gaffer-orange" />,
  freePlay: <Play size={18} className="text-gaffer-orange" />,
}

interface BoostSelectorProps {
  active: BoostType
  onToggle: (boost: BoostType) => void
}

export function BoostSelector({ active, onToggle }: BoostSelectorProps) {
  return (
    <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide pb-1">
      {BOOST_OPTIONS.map((boost) => {
        const isActive = active === boost.id
        return (
          <motion.button
            key={boost.id}
            whileTap={{ scale: 0.94 }}
            onClick={() => onToggle(isActive ? null : boost.id)}
            className={`flex-shrink-0 flex flex-col items-center gap-1.5 rounded-2xl border px-3 pt-3 pb-2 min-w-[72px] transition-all ${
              isActive
                ? 'bg-gaffer-orange/10 border-gaffer-orange shadow-orange-glow'
                : 'bg-gaffer-card border-gaffer-border'
            }`}
          >
            {/* Icon ring */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                isActive
                  ? 'bg-gaffer-orange/20 border-gaffer-orange/50'
                  : 'bg-gaffer-surface border-gaffer-border'
              }`}
            >
              {BOOST_ICONS[boost.id]}
            </div>

            {/* Label */}
            <span
              className={`text-[9px] font-body font-semibold text-center leading-tight transition-colors ${
                isActive ? 'text-gaffer-orange' : 'text-gaffer-muted'
              }`}
            >
              {boost.label}
            </span>

            {/* Play / Active pill */}
            <motion.div
              animate={
                isActive
                  ? { backgroundColor: '#FF6B00', color: '#fff' }
                  : { backgroundColor: 'rgba(255,107,0,0.12)', color: '#FF6B00' }
              }
              transition={{ duration: 0.2 }}
              className="rounded-full px-3 py-0.5"
            >
              <span className="text-[9px] font-display font-bold">
                {isActive ? 'Active' : 'Play'}
              </span>
            </motion.div>
          </motion.button>
        )
      })}
    </div>
  )
}
