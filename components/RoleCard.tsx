'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface RoleCardProps {
  title: string
  description: string
  icon: ReactNode
  selected: boolean
  onSelect: () => void
}

export function RoleCard({
  title,
  description,
  icon,
  selected,
  onSelect,
}: RoleCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      className={`
        relative flex flex-col items-center gap-3 p-4 pt-6 rounded-2xl
        border-2 transition-all duration-200 text-center
        overflow-hidden w-full
        ${selected
          ? 'border-gaffer-orange bg-gaffer-orange/10 shadow-orange-glow'
          : 'border-gaffer-border bg-gaffer-card/60 hover:border-gaffer-subtle'
        }
      `}
    >
      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${selected ? 'bg-gaffer-orange/20' : 'bg-gaffer-surface'}`}>
        {icon}
      </div>

      {/* Content */}
      <div className="space-y-1 pb-1">
        <h3 className={`font-display font-bold text-sm tracking-wide ${selected ? 'text-gaffer-orange' : 'text-white'}`}>
          {title}
        </h3>
        <p className="text-gaffer-muted text-[11px] font-body leading-tight">
          {description}
        </p>
      </div>

      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-orange-gradient-btn flex items-center justify-center"
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </motion.button>
  )
}
