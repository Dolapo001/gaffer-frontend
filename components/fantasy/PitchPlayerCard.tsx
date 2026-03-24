'use client'

import React from 'react'
import { JerseySvg } from '@/components/jersey/JerseySvg'
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
          border: '0.34px solid rgba(255, 255, 255, 0.35)',
          background: 'rgba(55, 0, 60, 0.25)', // #37003C at 25%
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 1.02px 1.7px rgba(0, 0, 0, 0.08)',
          padding: '4px 0',
        }}
      >
        {/* ── Jersey hero ─────────── */}
        <div className="relative w-full flex justify-center scale-90 -translate-y-1">
          {/* Captaincy badge */}
          {captaincy && (
            <div
              className={`absolute z-20 top-0 left-1 w-4 h-4 rounded-full
                flex items-center justify-center border border-white/50 shadow-md
                ${captaincy === 'C' ? 'bg-[#ff6b00]' : 'bg-[#6B46C1]'}`}
            >
              <span className="text-white text-[8px] font-black leading-none">{captaincy}</span>
            </div>
          )}

          {/* Status badge */}
          {status !== 'fit' && (
            <div
              className={`absolute z-20 top-0 right-1 w-3.5 h-3.5 rounded-[3px]
                flex items-center justify-center shadow-md
                ${status === 'warning' ? 'bg-yellow-400' : 'bg-red-500'}`}
            >
              <span className={`text-[9px] font-black leading-none ${status === 'warning' ? 'text-black' : 'text-white'}`}>
                !
              </span>
            </div>
          )}

          {/* Points pill */}
          {points !== undefined && (
            <div
              className="absolute z-20 -top-2.5 -right-0.5 bg-[#ff6b00] text-white
                text-[9px] font-black leading-none px-[5px] py-[2px] rounded shadow-md"
              style={{ boxShadow: '0 1px 5px rgba(255,107,0,0.50)' }}
            >
              {points}
            </div>
          )}

          {/* The jersey */}
          <div style={{ filter: jerseyGlow || undefined }}>
            <JerseySvg
              primaryColor={resolvedJersey.primaryColor}
              secondaryColor={resolvedJersey.secondaryColor}
              jerseyPattern={resolvedJersey.jerseyPattern}
              teamCode={jersey?.teamCode}
              width={60}
              height={68}
              className="group-hover:scale-105 transition-transform duration-150"
            />
          </div>
        </div>

        {/* ── Compact nameplate ─────────── */}
        <div
          className="w-[58px] flex flex-col items-center rounded-[3px] -mt-1"
          style={{
            background: plateBg,
            paddingTop: 2,
            paddingBottom: 3,
            boxShadow: '0 2px 4px rgba(0,0,0,0.20)',
          }}
        >
          <p
            className="w-full text-center truncate font-black uppercase leading-none px-1"
            style={{ fontSize: 8.5, color: plateNameColor, letterSpacing: '-0.01em' }}
          >
            {playerName || 'Player'}
          </p>
          <p
            className="w-full text-center truncate font-semibold uppercase leading-none px-1"
            style={{ fontSize: 7, color: plateFixtColor, marginTop: 2, letterSpacing: '0.01em' }}
          >
            {fixture || 'TBC'}
          </p>
        </div>
      </div>
    </button>
  )
}

export default PitchPlayerCard
