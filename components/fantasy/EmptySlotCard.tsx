'use client'

import React from 'react'
import { Plus } from 'lucide-react'

interface EmptySlotCardProps {
  onClick?: () => void
  className?: string
  position?: string
}

/**
 * EmptySlotCard — ghost placeholder matching the spatial rhythm of PitchPlayerCard.
 *
 * Layout mirrors the filled tile exactly:
 *   • Ghost jersey area  (64 × 72) — dashed outline, same proportions as the real jersey
 *   • Ghost nameplate    (27px)    — faint strip below, same height as the real nameplate
 *
 * Lower contrast than filled tiles so active players dominate visually.
 */
export const EmptySlotCard: React.FC<EmptySlotCardProps> = ({
  onClick,
  className = '',
  position,
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center group active:scale-95 transition-all outline-none select-none ${className}`}
      style={{ width: 64, background: 'none', border: 'none', padding: 0 }}
    >
      {/* Glassmorphic Container matching Figma empty slots */}
      <div
        className="w-full h-full flex flex-col items-center justify-center transition-all duration-300 hover:bg-black/40 bg-black/30 rounded-lg shadow-lg"
        style={{
          width: 58,
          height: 74,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      >
        <Plus
          className="text-white transition-all transform group-hover:scale-110"
          size={24}
          strokeWidth={2}
        />
      </div>
    </button>
  )
}
