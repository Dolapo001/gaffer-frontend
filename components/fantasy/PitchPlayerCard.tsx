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
  /** Kept for API compatibility; ignored — JerseySvg is always rendered. */
  kitImageUrl?: string
  /**
   * Team home-kit config. When omitted the card renders a neutral grey
   * fallback jersey so no external image request is ever made.
   */
  jersey?: JerseyProps
  className?: string
  onClick?: () => void
  selected?: boolean
  highlightMode?: 'none' | 'sub_out' | 'sub_in_valid'
  points?: number
  kitAreaClassName?: string
  status?: 'fit' | 'injured' | 'warning'
  captaincy?: 'C' | 'V' | null
}

/**
 * PitchPlayerCard — 3D jersey object placed on the pitch.
 *
 * Visual layer stack (back → front):
 *   1. Slot base plate  — dark glass gradient + inset depth shadows
 *   2. Contact shadow   — blurred ellipse beneath jersey ("placed on pitch")
 *   3. Jersey SVG       — with perspective tilt for 3D lift
 *   4. Chest shine      — radial gradient highlight over jersey
 *   5. Micro badges     — captaincy / status anchored near jersey edge
 *   6. Points pill      — floating above slot corner
 *   7. Info label       — name + fixture strip at slot base
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
  // ── Jersey colours ─────────────────────────────────────────────────────────
  const resolvedJersey = normalizeJerseyConfig(
    jersey ?? { primaryColor: '#4a5568', secondaryColor: '#718096', jerseyPattern: 'solid' }
  )

  // ── Slot border + ambient glow (state-aware) ───────────────────────────────
  let borderColor = 'rgba(255,255,255,0.10)'
  let ambientGlow = ''

  if (highlightMode === 'sub_out') {
    borderColor = 'rgba(220,38,38,0.72)'
    ambientGlow = '0 0 14px rgba(220,38,38,0.32)'
  } else if (highlightMode === 'sub_in_valid') {
    borderColor = 'rgba(34,197,94,0.72)'
    ambientGlow = '0 0 14px rgba(34,197,94,0.30)'
  } else if (selected) {
    borderColor = 'rgba(255,107,0,0.82)'
    ambientGlow = '0 0 18px rgba(255,107,0,0.34)'
  }

  // ── Info bar colours (status-aware) ───────────────────────────────────────
  const infoBg =
    status === 'warning'
      ? '#FFEB3B'
      : status === 'injured'
      ? '#EF4444'
      : 'rgba(5,5,16,0.90)'

  const nameColor =
    status === 'fit'
      ? 'rgba(255,255,255,0.96)'
      : status === 'warning'
      ? '#111'
      : '#fff'

  const fixtureColor =
    status === 'fit'
      ? 'rgba(255,255,255,0.50)'
      : status === 'warning'
      ? '#444'
      : 'rgba(255,255,255,0.80)'

  // ── Jersey lift amount (selected = more lift) ──────────────────────────────
  const jerseyTransform = selected
    ? 'perspective(700px) rotateX(8deg) translateY(-6px)'
    : 'perspective(700px) rotateX(6deg) translateY(-2px)'

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center group transition-all duration-200 ${
        selected ? 'scale-[1.07] z-10' : ''
      } ${className}`}
      style={{ width: 64, outline: 'none', background: 'none', border: 'none', padding: 0 }}
    >
      {/* ── 1. Slot base plate ────────────────────────────────────────────────
          Dark glass container — the pitch "slot" the jersey object sits in.
          Three shadow layers create inset depth + outer elevation.          */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 14,
          background:
            'linear-gradient(175deg, rgba(255,255,255,0.07) 0%, rgba(0,0,0,0.26) 100%)',
          boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,0.11)',   // top inner highlight edge
            'inset 0 -10px 20px rgba(0,0,0,0.24)',    // bottom inner well
            '0 6px 20px rgba(0,0,0,0.30)',             // outer plate elevation
            ambientGlow,
          ].filter(Boolean).join(', '),
          border: `1px solid ${borderColor}`,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* ── 2. Jersey hero with perspective tilt ─────────────────────────────
          The whole jersey section is tilted on the X axis so it feels
          like a physical object leaning toward the viewer.                  */}
      <div
        className="relative z-10 w-full flex items-center justify-center"
        style={{
          paddingTop: 5,
          transform: jerseyTransform,
          transition: 'transform 0.20s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* ── 4. Chest shine — radial fabric highlight ────────────────────── */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none z-20"
          style={{
            top: '6%',
            left: '10%',
            right: '10%',
            height: '65%',
            borderRadius: '50%',
            background:
              'radial-gradient(ellipse at 50% 8%, rgba(255,255,255,0.20) 0%, transparent 62%)',
          }}
        />

        {/* Jersey SVG ─────────────────────────────────────────────────────── */}
        <JerseySvg
          primaryColor={resolvedJersey.primaryColor}
          secondaryColor={resolvedJersey.secondaryColor}
          jerseyPattern={resolvedJersey.jerseyPattern}
          teamCode={jersey?.teamCode}
          width={68}
          height={76}
          className="relative z-10 transition-transform duration-200 group-hover:-translate-y-0.5"
        />

        {/* ── 3. Contact shadow — "placed on pitch" illusion ──────────────── */}
        <div
          aria-hidden="true"
          className="absolute pointer-events-none z-0"
          style={{
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 44,
            height: 9,
            background: 'rgba(0,0,0,0.30)',
            filter: 'blur(7px)',
            borderRadius: '50%',
          }}
        />

        {/* ── 5a. Captaincy badge — anchored to jersey top-left ───────────── */}
        {captaincy && (
          <div
            aria-label={captaincy === 'C' ? 'Captain' : 'Vice Captain'}
            className="absolute z-30"
            style={{
              top: 7,
              left: 9,
              width: 15,
              height: 15,
              borderRadius: '50%',
              background: captaincy === 'C' ? '#ff6b00' : '#6B46C1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.38)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <span style={{ color: '#fff', fontSize: 8, fontWeight: 900, lineHeight: 1 }}>
              {captaincy}
            </span>
          </div>
        )}

        {/* ── 5b. Status badge — anchored to jersey top-right ─────────────── */}
        {status !== 'fit' && (
          <div
            className="absolute z-30"
            style={{
              top: 7,
              right: 9,
              width: 13,
              height: 13,
              borderRadius: 3,
              background: status === 'warning' ? '#FBBF24' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.50)',
              border: '0.5px solid rgba(255,255,255,0.22)',
            }}
          >
            <span
              style={{
                color: status === 'warning' ? '#000' : '#fff',
                fontSize: 9,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              !
            </span>
          </div>
        )}
      </div>

      {/* ── 6. Points pill — floats above slot top-right corner ──────────────
          Kept outside the tilted wrapper so it stays flat/readable.        */}
      {points !== undefined && (
        <div
          className="absolute z-40"
          style={{
            top: -5,
            right: -3,
            background: 'linear-gradient(135deg, #ff8c00, #ff5500)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 900,
            padding: '2px 5px',
            borderRadius: 6,
            lineHeight: 1,
            boxShadow:
              '0 2px 8px rgba(255,107,0,0.55), inset 0 1px 0 rgba(255,255,255,0.22)',
            border: '0.5px solid rgba(255,255,255,0.18)',
            letterSpacing: 0,
          }}
        >
          {points}
        </div>
      )}

      {/* ── 7. Info label ────────────────────────────────────────────────────
          Flat strip at base of slot — name on top, fixture below.          */}
      <div
        className="w-full relative z-10 flex flex-col items-center rounded-b-[14px] overflow-hidden"
        style={{
          paddingTop: 4,
          paddingBottom: 5,
          paddingLeft: 2,
          paddingRight: 2,
          background: infoBg,
          borderTop:
            status === 'fit'
              ? '0.5px solid rgba(255,255,255,0.07)'
              : 'none',
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 900,
            color: nameColor,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            lineHeight: 1,
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {playerName || 'Player'}
        </p>
        <p
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: fixtureColor,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            lineHeight: 1,
            marginTop: 3,
            textAlign: 'center',
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fixture || 'TBC'}
        </p>
      </div>
    </button>
  )
}

export default PitchPlayerCard
