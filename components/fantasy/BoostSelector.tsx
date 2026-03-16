'use client'

import { motion } from 'framer-motion'
import { Timer } from 'lucide-react'
import { BOOST_OPTIONS, type BoostType } from '@/lib/fantasyMockData'

interface BoostSelectorProps {
  active: BoostType
  onToggle: (boost: BoostType) => void
}

export function BoostSelector({ active, onToggle }: BoostSelectorProps) {
  return (
    <div className="flex gap-2 px-4">
      {BOOST_OPTIONS.map((boost) => {
        const isActive = active === boost.id
        const isFree = boost.id === 'freePlay'

        return (
          <motion.div
            key={boost.id}
            whileTap={{ scale: 0.95 }}
            className={[
              'flex-1 flex flex-col items-center gap-2 rounded-2xl px-1 pt-3 pb-2.5',
              'transition-all duration-200',
              // Card background
              isFree
                ? 'bg-[#FFF0E6]'
                : isActive
                  ? 'bg-gaffer-card border border-gaffer-orange/40 shadow-orange-glow'
                  : 'bg-gaffer-card border border-gaffer-border',
            ].join(' ')}
          >
            {/* ── Timer icon ring ──────────────────────────────────────────── */}
            <div
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center',
                'border-2',
                isFree
                  ? 'border-gaffer-orange bg-[#FFF0E6]'
                  : isActive
                    ? 'border-gaffer-orange bg-gaffer-orange/15'
                    : 'border-gaffer-orange bg-gaffer-surface',
              ].join(' ')}
            >
              <Timer
                size={18}
                strokeWidth={2}
                className="text-gaffer-orange"
              />
            </div>

            {/* ── Label ────────────────────────────────────────────────────── */}
            <span
              className={[
                'text-[9px] font-body font-semibold text-center leading-tight',
                isFree ? 'text-gaffer-orange' : 'text-gaffer-muted',
              ].join(' ')}
            >
              {boost.label}
            </span>

            {/* ── Play button (all cards including Free) ───────────────────── */}
            <button
              type="button"
              onClick={() => onToggle(isActive ? null : boost.id)}
              className={[
                'w-full rounded-lg py-1 transition-all duration-200',
                'font-display text-[10px] font-bold',
                isFree
                  ? 'bg-[#FFF0E6] text-gaffer-orange border border-gaffer-orange/30'
                  : isActive
                    ? 'bg-gaffer-orange text-white'
                    : 'bg-white/90 text-gaffer-bg',
              ].join(' ')}
            >
              Play
            </button>
          </motion.div>
        )
      })}
    </div>
  )
}
