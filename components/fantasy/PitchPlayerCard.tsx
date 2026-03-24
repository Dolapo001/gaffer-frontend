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
  kitImageUrl?: string   // kept for API compat, ignored
  jersey?: JerseyProps
  className?: string
  onClick?: () => void
  selected?: boolean
  highlightMode?: 'none' | 'sub_out' | 'sub_in_valid'
  points?: number
  kitAreaClassName?: string // kept for API compat, ignored
  status?: 'fit' | 'injured' | 'warning'
  captaincy?: 'C' | 'V' | null
}

/**
 * PitchPlayerCard — premium jersey-first player tile.
 *
 * Depth system (back → front):
 *   1. Slot base     — barely-visible dark oval defines the position
 *   2. Contact shadow — blurred ellipse grounds the shirt on the pitch
 *   3. Jersey SVG    — main visual object, slightly perspective-tilted
 *   4. Top highlight  — radial gradient simulates fabric lighting
 *   5. Nameplate     — compact, attached, light shadow
 *   6. Badges        — top layer, pinned to shirt corners
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
  const resolvedJersey = normalizeJerseyConfig(
    jersey ?? { primaryColor: '#4a5568', secondaryColor: '#718096', jerseyPattern: 'solid' }
  )

  // State glow — only applied in selected / sub states
  let jerseyGlow = ''
  if (selected)                          jerseyGlow = 'drop-shadow(0 0 7px rgba(255,107,0,0.80))'
  else if (highlightMode === 'sub_out')      jerseyGlow = 'drop-shadow(0 0 7px rgba(220,38,38,0.80))'
  else if (highlightMode === 'sub_in_valid') jerseyGlow = 'drop-shadow(0 0 7px rgba(34,197,94,0.80))'

  // Nameplate colours
  const plateBg =
    status === 'warning' ? '#FFEB3B'
    : status === 'injured' ? '#EF4444'
    : 'rgba(255,255,255,0.92)'

  const plateNameColor =
    status === 'fit' ? '#160022' : status === 'warning' ? '#000' : '#fff'

  const plateFixtColor =
    status === 'fit' || status === 'warning' ? 'rgba(55,0,60,0.55)' : 'rgba(255,255,255,0.75)'

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center group transition-all duration-200 outline-none select-none ${
        selected ? 'scale-[1.08] z-10' : ''
      } ${className}`}
      style={{ width: 64, background: 'none', border: 'none', padding: 0 }}
    >

      {/* ── Layer 1: Slot base ────────────────────────────────────────────────
          Barely-visible dark oval behind the entire tile.
          Defines the player's position without looking like a card.          */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '4px -5px -2px -5px',
          borderRadius: 12,
          background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0.16) 0%, transparent 72%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* ── Layers 2–4: Jersey hero area ───────────────────────────────────── */}
      <div
        className="relative w-full flex justify-center"
        style={{
          // Subtle perspective tilt — top angles slightly away from viewer,
          // giving the "jersey lying on the pitch" sensation.
          transform: 'perspective(600px) rotateX(-4deg)',
          transformOrigin: 'center bottom',
          zIndex: 1,
        }}
      >
        {/* ── Layer 2: Contact shadow ──────────────────────────────────────
            Blurred oval at the jersey hem — grounding the shirt on the field. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: 1,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 46,
            height: 7,
            background: 'rgba(0,0,0,0.30)',
            filter: 'blur(5px)',
            borderRadius: '50%',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />

        {/* ── Layer 3: Jersey SVG ──────────────────────────────────────────── */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            filter: jerseyGlow || undefined,
          }}
        >
          {/* ── Layer 4: Fabric top-highlight ─────────────────────────────
              Radial gradient simulating a light source above the shirt.
              Sits on top of the jersey SVG (which already has internal shading)
              for an extra dimension of fabric depth.                        */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              borderRadius: '6px 6px 0 0',
              background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.11) 0%, transparent 68%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          />

          {/* Jersey — 10% larger than before (68×76 vs 64×72) */}
          <JerseySvg
            primaryColor={resolvedJersey.primaryColor}
            secondaryColor={resolvedJersey.secondaryColor}
            jerseyPattern={resolvedJersey.jerseyPattern}
            teamCode={jersey?.teamCode}
            width={68}
            height={76}
            className="relative z-10 group-hover:-translate-y-[2px] transition-transform duration-200"
          />
        </div>

        {/* ── Layer 6: Badges — pinned to jersey corners ───────────────────
            z-20 keeps them above the highlight overlay.                     */}

        {/* Captaincy — upper-left shoulder */}
        {captaincy && (
          <div
            className={`absolute z-20 ${captaincy === 'C' ? 'bg-[#ff6b00]' : 'bg-[#6B46C1]'}
              flex items-center justify-center rounded-full border border-white/40`}
            style={{
              top: 4, left: 4,
              width: 14, height: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
            }}
          >
            <span className="text-white leading-none font-black" style={{ fontSize: 7.5 }}>
              {captaincy}
            </span>
          </div>
        )}

        {/* Status — upper-right shoulder */}
        {status !== 'fit' && (
          <div
            className={`absolute z-20 flex items-center justify-center rounded-[3px]
              ${status === 'warning' ? 'bg-yellow-400' : 'bg-red-500'}`}
            style={{
              top: 4, right: 4,
              width: 13, height: 13,
              boxShadow: '0 1px 3px rgba(0,0,0,0.40)',
            }}
          >
            <span
              className={`leading-none font-black ${status === 'warning' ? 'text-black' : 'text-white'}`}
              style={{ fontSize: 8 }}
            >
              !
            </span>
          </div>
        )}

        {/* Points pill — hovers just above top-right corner of tile */}
        {points !== undefined && (
          <div
            className="absolute z-20 bg-[#ff6b00] text-white font-black leading-none"
            style={{
              top: -6, right: -2,
              fontSize: 8.5,
              padding: '2px 5px',
              borderRadius: 5,
              boxShadow: '0 1px 5px rgba(255,107,0,0.55)',
              border: '0.5px solid rgba(255,255,255,0.18)',
            }}
          >
            {points}
          </div>
        )}
      </div>

      {/* ── Layer 5: Nameplate ────────────────────────────────────────────────
          Compact, attached directly below the jersey.
          Lighter shadow than before so it doesn't compete with the shirt.   */}
      <div
        className="w-full flex flex-col items-center rounded-[3px]"
        style={{
          background: plateBg,
          paddingTop: 2,
          paddingBottom: 3,
          paddingLeft: 2,
          paddingRight: 2,
          marginTop: 1,          // tight — nameplate feels attached, not separate
          boxShadow: '0 1px 5px rgba(0,0,0,0.20)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <p
          className="w-full text-center truncate font-black uppercase leading-none"
          style={{ fontSize: 9, color: plateNameColor, letterSpacing: '0.01em' }}
        >
          {playerName || 'Player'}
        </p>
        <p
          className="w-full text-center truncate font-medium uppercase leading-none"
          style={{ fontSize: 7.5, color: plateFixtColor, marginTop: 2.5, letterSpacing: '0.02em' }}
        >
          {fixture || 'TBC'}
        </p>
      </div>
    </button>
  )
}

export default PitchPlayerCard
