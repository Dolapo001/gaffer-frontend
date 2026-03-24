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
      {/* Ghost jersey silhouette */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{
          width: 64,
          height: 72,
          borderRadius: 8,
          border: '1.5px dashed rgba(255,255,255,0.22)',
          background: 'rgba(255,255,255,0.04)',
        }}
      >
        <Plus
          className="text-white/35 group-hover:text-white/65 transition-colors"
          size={17}
          strokeWidth={2.5}
        />
        {position && (
          <span
            className="mt-1 uppercase font-bold text-white/25 group-hover:text-white/45 transition-colors"
            style={{ fontSize: 7, letterSpacing: '0.06em' }}
          >
            {position}
          </span>
        )}
      </div>

      {/* Ghost nameplate — matches the filled tile's nameplate height */}
      <div
        style={{
          width: '100%',
          height: 27,
          borderRadius: 3,
          marginTop: 2,
          background: 'rgba(255,255,255,0.07)',
        }}
      />
    </button>
  )
}
