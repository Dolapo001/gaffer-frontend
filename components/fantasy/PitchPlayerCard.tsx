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
        selected ? 'scale-110 z-10' : ''
      } ${className}`}
      style={{ width: 64, background: 'none', border: 'none', padding: 0 }}
    >
      {/* ── Jersey hero — NO container, sits directly on the pitch ───────── */}
      <div className="relative w-full flex justify-center">

        {/* Captaincy badge — upper-left, anchored to jersey */}
        {captaincy && (
          <div
            className={`absolute z-20 top-1 left-1.5 w-[15px] h-[15px] rounded-full
              flex items-center justify-center border border-white/50 shadow-md
              ${captaincy === 'C' ? 'bg-[#ff6b00]' : 'bg-[#6B46C1]'}`}
          >
            <span className="text-white text-[8px] font-black leading-none">{captaincy}</span>
          </div>
        )}

        {/* Status badge — upper-right, anchored to jersey */}
        {status !== 'fit' && (
          <div
            className={`absolute z-20 top-1 right-1.5 w-[14px] h-[14px] rounded-[3px]
              flex items-center justify-center shadow-md
              ${status === 'warning' ? 'bg-yellow-400' : 'bg-red-500'}`}
          >
            <span className={`text-[9px] font-black leading-none ${status === 'warning' ? 'text-black' : 'text-white'}`}>
              !
            </span>
          </div>
        )}

        {/* Points pill — floats at top-right corner */}
        {points !== undefined && (
          <div
            className="absolute z-20 -top-2 -right-0.5 bg-[#ff6b00] text-white
              text-[9px] font-black leading-none px-[5px] py-[2px] rounded shadow-md"
            style={{ boxShadow: '0 1px 5px rgba(255,107,0,0.50)' }}
          >
            {points}
          </div>
        )}

        {/* The jersey — glow filter handles selected / sub states */}
        <div style={{ filter: jerseyGlow || undefined }}>
          <JerseySvg
            primaryColor={resolvedJersey.primaryColor}
            secondaryColor={resolvedJersey.secondaryColor}
            jerseyPattern={resolvedJersey.jerseyPattern}
            teamCode={jersey?.teamCode}
            width={64}
            height={72}
            className="group-hover:scale-105 transition-transform duration-150"
          />
        </div>
      </div>

      {/* ── Compact nameplate — the only background element ─────────────── */}
      <div
        className="w-full flex flex-col items-center rounded-[3px]"
        style={{
          background: plateBg,
          paddingTop: 3,
          paddingBottom: 4,
          marginTop: 2,
          boxShadow: '0 2px 6px rgba(0,0,0,0.30)',
        }}
      >
        <p
          className="w-full text-center truncate font-black uppercase leading-none"
          style={{ fontSize: 9.5, color: plateNameColor, letterSpacing: '-0.01em' }}
        >
          {playerName || 'Player'}
        </p>
        <p
          className="w-full text-center truncate font-semibold uppercase leading-none"
          style={{ fontSize: 8, color: plateFixtColor, marginTop: 3, letterSpacing: '0.01em' }}
        >
          {fixture || 'TBC'}
        </p>
      </div>
    </button>
  )
}

export default PitchPlayerCard
