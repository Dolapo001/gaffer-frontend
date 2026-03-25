'use client'

import React from 'react'
import { RealisticJersey } from '@/components/jersey/RealisticJersey'
import { normalizeJerseyConfig } from '@/components/jersey/jerseyUtils'
import type { JerseyPattern } from '@/components/jersey/jerseyUtils'

export interface JerseyProps {
  primaryColor: string
  secondaryColor: string
  jerseyPattern: JerseyPattern
  teamCode?: string
}

interface PitchPlayerCardProps {
  playerName: string
  fixture: string
  /** Kept for API compatibility — ignored, JerseySvg always renders. */
  kitImageUrl?: string
  jersey?: JerseyProps
  className?: string
  onClick?: () => void
  selected?: boolean
  highlightMode?: 'none' | 'sub_out' | 'sub_in_valid'
  points?: number
  /** Kept for API compatibility — ignored in new layout. */
  kitAreaClassName?: string
  status?: 'fit' | 'injured' | 'warning'
  captaincy?: 'C' | 'V' | null
}

/**
 * PitchPlayerCard — jersey-first player tile.
 *
 * Design philosophy:
 *   • The jersey sits DIRECTLY on the pitch — no card container behind it.
 *   • Only the compact nameplate below the jersey has a background.
 *   • Badges float above the jersey, not the tile border.
 *   • Selected / highlight states are expressed via jersey filter glow, not
 *     a border around a container box.
 *
 * This makes each player feel like a kit object placed on the field rather
 * than a card sitting in a grid — matching the premium fantasy-game aesthetic.
 */
export const PitchPlayerCard: React.FC<PitchPlayerCardProps> = ({
  playerName,
  fixture,
  jersey,
  className = '',
  onClick,
  selected = false,
  highlightMode = 'none',
  points,
  status = 'fit',
  captaincy = null,
}) => {
  // ── Resolve jersey colours ────────────────────────────────────────────────
  const resolvedJersey = normalizeJerseyConfig(
    jersey ?? { primaryColor: '#4a5568', secondaryColor: '#718096', jerseyPattern: 'solid' }
  )

  // ── Jersey state glow — replaces the old container ring ──────────────────
  let jerseyGlow = ''
  if (selected)                        jerseyGlow = 'drop-shadow(0 0 6px rgba(255,107,0,0.75))'
  else if (highlightMode === 'sub_out')    jerseyGlow = 'drop-shadow(0 0 6px rgba(220,38,38,0.75))'
  else if (highlightMode === 'sub_in_valid') jerseyGlow = 'drop-shadow(0 0 6px rgba(34,197,94,0.75))'

  // ── Nameplate colours (status-aware) ─────────────────────────────────────
  const plateBg =
    status === 'warning' ? '#FFEB3B'
    : status === 'injured' ? '#EF4444'
    : 'rgba(255,255,255,0.93)'

  const plateNameColor =
    status === 'fit' ? '#1a0028'
    : status === 'warning' ? '#000'
    : '#fff'

  const plateFixtColor =
    status === 'fit' || status === 'warning' ? 'rgba(55,0,60,0.60)' : 'rgba(255,255,255,0.78)'

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center group transition-all duration-150 outline-none select-none ${
        selected ? 'scale-105 z-10' : ''
      } ${className}`}
      style={{ width: 64, background: 'none', border: 'none', padding: 0 }}
    >
      {/* ── Designer Glass Container — Persists even after adding player ─────────── */}
      <div 
        className="w-full flex flex-col items-center transition-all duration-300"
        style={{
          width: 64,
          height: 106,
          borderRadius: 8,
          border: '0.17px solid rgba(255, 255, 255, 0.35)',
          background: 'rgba(55, 0, 60, 0.25)', // #37003C at 25% (exact Figma value)
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0.52px 0.87px 0 rgba(0, 0, 0, 0.08)', // exact Figma shadow
          padding: '4px 0',
        }}
      >
        {/* ── Jersey hero — Zoomed / Cropped to fill the card ─────────── */}
        <div className="relative w-full h-[82px] overflow-hidden flex justify-center items-start">
          {/* Captaincy badge */}
          {captaincy && (
            <div
              className={`absolute z-30 top-1 left-1.5 w-4.5 h-4.5 rounded-full
                flex items-center justify-center border border-white/40 shadow-md
                ${captaincy === 'C' ? 'bg-[#ff6b00]' : 'bg-[#6B46C1]'}`}
            >
              <span className="text-white text-[9px] font-black leading-none">{captaincy}</span>
            </div>
          )}

          {/* Status badge — Triangle for warning, Square for unavailable */}
          {status !== 'fit' && (
            <div
              className="absolute z-30 top-1 right-1.5 flex items-center justify-center shadow-md"
              style={{
                width: 15,
                height: 15,
                backgroundColor: status === 'warning' ? '#FACC15' : '#EF4444',
                clipPath: status === 'warning' 
                  ? 'polygon(50% 0%, 0% 100%, 100% 100%)' // Triangle
                  : 'none', // Square
                borderRadius: status === 'warning' ? '0' : '2px',
              }}
            >
              <span 
                className={`font-black leading-none ${status === 'warning' ? 'text-black mt-1' : 'text-white'}`}
                style={{ fontSize: status === 'warning' ? 8 : 9 }}
              >
                !
              </span>
            </div>
          )}

          {/* Points pill — Floating premium badge */}
          {points !== undefined && (
            <div
              className="absolute z-30 -top-1 -right-1 bg-[#ff6b00] text-white
                text-[9px] font-black leading-none px-[5px] py-[2.5px] rounded shadow-md"
              style={{ boxShadow: '0 1px 5px rgba(255,107,0,0.50)', border: '0.5px solid rgba(255,255,255,0.3)' }}
            >
              {points}
            </div>
          )}

          {/* The jersey — scaled up to fill the card width and overlap the bottom */}
          <div style={{ filter: jerseyGlow || undefined }} className="w-full h-full">
            <RealisticJersey
              primaryColor={resolvedJersey.primaryColor}
              secondaryColor={resolvedJersey.secondaryColor}
              width={80} 
              height={80}
              className="transition-transform duration-150 transform -translate-y-1"
            />
          </div>
        </div>

        {/* ── Overlapping nameplate — Covers the bottom of the jersey ─────────── */}
        <div
          className="relative z-10 w-[58px] flex flex-col items-center rounded-sm -translate-y-[12px]"
          style={{
            background: plateBg,
            paddingTop: 3,
            paddingBottom: 4,
            boxShadow: '0 4px 8px rgba(0,0,0,0.25)',
          }}
        >
          <p
            className="w-full text-center truncate font-black uppercase leading-none px-1"
            style={{ fontSize: 9, color: plateNameColor, letterSpacing: '-0.01em' }}
          >
            {playerName || 'Player'}
          </p>
          <p
            className="w-full text-center truncate font-bold uppercase leading-none px-1"
            style={{ fontSize: 7.5, color: plateFixtColor, marginTop: 2, letterSpacing: '0.01em' }}
          >
            {fixture || 'TBC'}
          </p>
        </div>
      </div>
    </button>
  )
}

export default PitchPlayerCard
