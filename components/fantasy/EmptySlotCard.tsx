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
      {/* Glassmorphic Container */}
      <div
        className="w-full h-full flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-[#37003C]/40"
        style={{
          width: 64,
          height: 106, // Total height to wrap jersey + nameplate + padding
          borderRadius: 8,
          border: '0.34px solid rgba(255, 255, 255, 0.35)',
          background: 'rgba(55, 0, 60, 0.25)', // #37003C at 25%
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 1.02px 1.7px rgba(0, 0, 0, 0.08)',
          padding: '4px 0',
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <Plus
            className="text-white/60 group-hover:text-white transition-all transform group-hover:scale-110"
            size={24}
            strokeWidth={2}
          />
          {position && (
            <span
              className="uppercase font-black text-white/40 group-hover:text-white transition-colors tracking-[0.1em]"
              style={{ fontSize: 9 }}
            >
              {position}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
