'use client'

import React from 'react'
import { Plus } from 'lucide-react'

interface EmptySlotCardProps {
  onClick?: () => void
  className?: string
  position?: string
}

/**
 * EmptySlotCard — pitch formation placeholder.
 *
 * Matches the visual language of PitchPlayerCard's slot base plate so the
 * formation grid reads as a cohesive system. The slot is intentionally
 * dimmer than filled cards so populated jerseys stand out more.
 */
export const EmptySlotCard: React.FC<EmptySlotCardProps> = ({
  onClick,
  className = '',
  position,
}) => {
  return (
    <button
      onClick={onClick}
      aria-label={position ? `Add ${position}` : 'Add player'}
      className={`relative flex flex-col items-center justify-center group transition-all duration-200 active:scale-95 ${className}`}
      style={{
        width: 64,
        height: 98,
        outline: 'none',
        background: 'none',
        border: 'none',
        padding: 0,
      }}
    >
      {/* Slot base plate — dimmer version of PitchPlayerCard slot */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 14,
          background:
            'linear-gradient(175deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.18) 100%)',
          boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,0.07)',
            'inset 0 -8px 16px rgba(0,0,0,0.16)',
            '0 4px 12px rgba(0,0,0,0.20)',
          ].join(', '),
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Dashed inner outline — signals "available slot" */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none"
        style={{
          inset: 8,
          borderRadius: 9,
          border: '1px dashed rgba(255,255,255,0.14)',
        }}
      />

      {/* Plus icon */}
      <Plus
        className="relative z-10 text-white/40 group-hover:text-white/70 transition-colors duration-200"
        size={18}
        strokeWidth={2}
      />

      {/* Position label */}
      {position && (
        <span
          className="relative z-10 mt-1"
          style={{
            fontSize: 8,
            fontWeight: 800,
            color: 'rgba(255,255,255,0.28)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            lineHeight: 1,
          }}
        >
          {position}
        </span>
      )}
    </button>
  )
}
