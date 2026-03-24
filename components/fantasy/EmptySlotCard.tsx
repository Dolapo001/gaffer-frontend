'use client'

import React from 'react'
import { Plus } from 'lucide-react'

interface EmptySlotCardProps {
  onClick?: () => void
  className?: string
  position?: string
}

/**
 * EmptySlotCard — low-contrast ghost placeholder.
 *
 * Intentionally much lower visual weight than a filled PitchPlayerCard:
 *   • Very faint dashed border (was 0.22, now 0.14 opacity)
 *   • Near-transparent background (0.03)
 *   • Ghost nameplate strip barely visible (0.05)
 *
 * This ensures filled jerseys dominate; empty slots fade into the pitch.
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
      {/* Ghost jersey area — same 68×76 space as filled tile */}
      <div
        className="w-full flex flex-col items-center justify-center"
        style={{
          width: 68,
          height: 76,
          borderRadius: 8,
          // Low-opacity dashed border — readable but not competing
          border: '1px dashed rgba(255,255,255,0.14)',
          background: 'rgba(255,255,255,0.03)',
        }}
      >
        <Plus
          className="text-white/25 group-hover:text-white/50 transition-colors"
          size={16}
          strokeWidth={2}
        />
        {position && (
          <span
            className="mt-1 uppercase font-semibold text-white/18 group-hover:text-white/35 transition-colors"
            style={{ fontSize: 6.5, letterSpacing: '0.06em' }}
          >
            {position}
          </span>
        )}
      </div>

      {/* Ghost nameplate — matches filled tile height, near invisible */}
      <div
        style={{
          width: '100%',
          height: 25,
          borderRadius: 3,
          marginTop: 1,
          background: 'rgba(255,255,255,0.05)',
        }}
      />
    </button>
  )
}
