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
      whileTap={{ scale: 0.98 }}
      className={`
        relative flex flex-col items-center gap-6 p-6 rounded-[32px]
        border-2 transition-all duration-300 text-center
        overflow-hidden w-full backdrop-blur-md
        ${selected
          ? 'bg-white/10 border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
          : 'bg-white/5 border-white/5 hover:border-white/10'
        }
      `}
    >
      {/* Circular Image wrapper */}
      <div className={`
        relative w-28 h-28 rounded-full p-1 border-2 transition-all duration-300
        ${selected ? 'border-[#FF8904]' : 'border-white/10'}
      `}>
        <div className="w-full h-full rounded-full overflow-hidden">
          <img 
            src={imageSrc} 
            alt={title} 
            className="w-full h-full object-cover" 
          />
        </div>
      </div>

      {/* Content */}
      <div className="w-full space-y-2">
        <h3 className="font-chakra font-bold text-xl text-white tracking-tight">
          {title}
        </h3>
        <p className="text-white/40 text-[13px] font-chakra font-medium leading-tight">
          {description}
        </p>
      </div>

      {/* Selected Glow */}
      {selected && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF8904]/5 to-transparent pointer-events-none" />
      )}
    </motion.button>
  )
}
