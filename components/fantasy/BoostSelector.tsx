'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BOOST_OPTIONS, type BoostType } from '@/lib/fantasyMockData'

interface BoostSelectorProps {
  active: BoostType
  onToggle: (boost: BoostType) => void
  deadlineLabel?: string
  deadlineValue?: string
  compact?: boolean
}

// x positions (px) of each chip in the 327-wide SVG viewBox
const CHIP_X = [9, 87, 166, 244]
const CHIP_W = 74
const SVG_W = 327

export function BoostSelector({
  active,
  onToggle,
  deadlineLabel = 'Gameweek 1 Transfer Deadline:',
  deadlineValue = 'Sat 14 Feb, 14:30',
  compact = false,
}: BoostSelectorProps) {
  return (
    <section className={`w-full bg-[#1a1b23]/90 backdrop-blur-xl text-white rounded-2xl border border-white/10 shadow-2xl ${compact ? 'px-2 py-2' : 'px-4 py-5'}`}>
      {!compact && (
        <div className="text-center mb-4">
          <h2 className="text-[14px] font-bold leading-[20px] tracking-tight text-white/90">
            {deadlineLabel}
          </h2>
          <p className="mt-[2px] text-[18px] font-bold leading-[24px] tracking-tight text-white">
            {deadlineValue}
          </p>
        </div>
      )}

      {/* SVG chip design with transparent interactive overlays */}
      <div className="relative w-full">
        <img
          src="/images/upper.svg"
          alt="Boost chips"
          className="w-full h-auto block"
          draggable={false}
        />

        {BOOST_OPTIONS.map((boost, idx) => {
          const isActive = active === boost.id
          const leftPct = (CHIP_X[idx] / SVG_W) * 100
          const widthPct = (CHIP_W / SVG_W) * 100

          return (
            <motion.button
              key={boost.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onToggle(isActive ? null : boost.id)}
              aria-pressed={isActive}
              aria-label={boost.label}
              className={[
                'absolute top-0 bottom-0 rounded-[14px] transition-all',
                isActive
                  ? 'ring-2 ring-[#ff6b00] bg-[#ff6b00]/15'
                  : 'hover:bg-white/5',
              ].join(' ')}
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
              }}
            />
          )
        })}
      </div>
    </section>
  )
}
