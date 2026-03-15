'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'

interface RoleCardProps {
  title: string
  description: string
  icon: ReactNode
  imageSrc: string
  selected: boolean
  onSelect: () => void
}

export function RoleCard({
  title,
  description,
  icon,
  imageSrc,
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
        relative flex flex-col items-center gap-3 p-0 rounded-2xl
        border-2 transition-all duration-200 text-center
        overflow-hidden w-full
        ${selected
          ? 'border-gaffer-orange shadow-orange-glow'
          : 'border-gaffer-border hover:border-gaffer-subtle'
        }
      `}
    >
      {/* Background image */}
      <div className="relative w-full h-28 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt={title} className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
        {/* Icon centered on image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selected ? 'bg-gaffer-orange/80' : 'bg-black/50'}`}>
            {icon}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`w-full px-3 pb-4 space-y-1 ${selected ? 'bg-gaffer-orange/10' : 'bg-gaffer-card/60'}`}>
        <h3 className={`font-display font-bold text-sm tracking-wide pt-1 ${selected ? 'text-gaffer-orange' : 'text-white'}`}>
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
