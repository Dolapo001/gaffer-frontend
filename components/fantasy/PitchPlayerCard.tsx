'use client'

import React from 'react'
import { RealisticJersey } from '@/components/jersey/RealisticJersey'
import { normalizeJerseyConfig, type JerseyPattern } from '@/components/jersey/jerseyUtils'

export interface JerseyProps {
  primaryColor: string
  secondaryColor: string
  jerseyPattern: JerseyPattern
  teamCode?: string
}

interface PitchPlayerCardProps {
  playerName: string
  fixture: string
  jersey?: JerseyProps
  className?: string
  onClick?: () => void
  selected?: boolean
  highlightMode?: 'none' | 'sub_out' | 'sub_in_valid'
  status?: 'fit' | 'injured' | 'warning'
  captaincy?: 'C' | 'V' | null
}

export const PitchPlayerCard: React.FC<PitchPlayerCardProps> = ({
  playerName,
  fixture,
  jersey,
  className = '',
  onClick,
  selected = false,
  highlightMode = 'none',
  status = 'fit',
  captaincy = null,
}) => {
  const resolvedJersey = normalizeJerseyConfig(
    jersey ?? { primaryColor: '#4a5568', secondaryColor: '#718096', jerseyPattern: 'solid' }
  )

  let jerseyGlow = ''
  if (selected) jerseyGlow = 'drop-shadow(0 0 8px rgba(255,107,0,0.8))'
  else if (highlightMode === 'sub_out') jerseyGlow = 'drop-shadow(0 0 8px rgba(220,38,38,0.8))'
  else if (highlightMode === 'sub_in_valid') jerseyGlow = 'drop-shadow(0 0 8px rgba(34,197,94,0.8))'

  const plateBg =
    status === 'warning' ? '#FFEB3B'
    : status === 'injured' ? '#EF4444'
    : 'rgba(255,255,255,0.95)'

  const plateNameColor = (status === 'fit' || status === 'warning') ? '#1a0028' : '#fff'
  const plateFixtColor = (status === 'fit' || status === 'warning') ? 'rgba(55,0,60,0.6)' : 'rgba(255,255,255,0.8)'

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center group transition-all duration-150 outline-none select-none ${
        selected ? 'scale-105 z-10' : ''
      } ${className}`}
      style={{ width: 64, background: 'none', border: 'none', padding: 0 }}
    >
      {/* ── Figma Spec Glass Card Container ── */}
       <div 
        className="relative flex flex-col items-center transition-all duration-300"
        style={{
          width: 51.3, 
          height: 72.1, 
          borderRadius: 4, 
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'rgba(255, 255, 255, 0.15)', 
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
        }}
      >
        {/* JERSEY CONTAINER — Scaled to 54 width to ensure both sleeves are visible */}
        <div className="absolute" style={{ top: 9.7, left: (51.3 - 44.4) / 2, width: 44.4, height: 58.5, overflow: 'visible' }}>
            <div style={{ filter: jerseyGlow || undefined }} className="w-full h-full flex items-center justify-center">
              <RealisticJersey
                primaryColor={resolvedJersey.primaryColor}
                secondaryColor={resolvedJersey.secondaryColor}
                width={54} 
                height={59.4}
              />
            </div>
        </div>

        {/* ── NAMEPLATE (Two-Tone overlapping jersey) ── */}
        <div
          className="absolute z-10 w-full flex flex-col items-center shadow-lg"
          style={{
            top: 49.13,
            left: 0,
            width: 51.3,
            height: 23,
            borderRadius: '0 0 4px 4px',
            overflow: 'hidden',
            borderTop: '0.5px solid rgba(0,0,0,0.1)',
          }}
        >
          {/* Top Half: Player Name */}
          <div className="w-full bg-white flex items-center justify-center pt-1.5" style={{ height: '52%' }}>
            <p
              className="w-full text-center truncate font-black leading-none px-1.5"
              style={{ fontSize: 8.2, color: '#310b42' }}
            >
              {playerName || 'Player'}
            </p>
          </div>
          {/* Bottom Half: Fixture */}
          <div className="w-full bg-[#f3f0f5] flex items-center justify-center pt-0.5 border-t border-black/5" style={{ height: '48%' }}>
             <p
              className="w-full text-center truncate font-bold uppercase leading-none px-1.5"
              style={{ fontSize: 6.2, color: '#4a0e63', opacity: 0.8 }}
            >
              {fixture || 'TBC'}
            </p>
          </div>
        </div>
      </div>
    </button>
  )
}

export default PitchPlayerCard
