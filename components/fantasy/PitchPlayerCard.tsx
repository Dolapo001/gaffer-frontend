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
        className="w-full flex flex-col items-center transition-all duration-300 overflow-hidden"
        style={{
          width: 53, // Precision Figma width: 52.97px
          height: 73, // Precision Figma height: 72.73px
          borderRadius: 2.77, // Precision Figma radius
          border: '0.17px solid rgba(255, 255, 255, 0.35)',
          background: 'rgba(55, 0, 60, 0.25)', // #37003C @ 25%
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 0.52px 0.87px rgba(0,0,0,0.08)',
          paddingTop: 3,
        }}
      >
        <div className="relative w-full h-[54px] flex justify-center items-start">
           <div style={{ filter: jerseyGlow || undefined }} className="w-full h-full transform scale-[1.3]">
             <RealisticJersey
               primaryColor={resolvedJersey.primaryColor}
               secondaryColor={resolvedJersey.secondaryColor}
               width={53} 
               height={53}
             />
           </div>
        </div>

        {/* ── Nameplate (Sticker Look) ── */}
        <div
          className="relative z-10 w-[48px] flex flex-col items-center -translate-y-[8px] rounded-[1px]"
          style={{
            background: plateBg,
            padding: '2px 0 3px 0',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          }}
        >
          <p
            className="w-full text-center truncate font-black uppercase leading-none px-0.5"
            style={{ fontSize: 7.5, color: plateNameColor, letterSpacing: '-0.01em' }}
          >
            {playerName || 'Player'}
          </p>
          <p
            className="w-full text-center truncate font-bold uppercase leading-none px-0.5 mt-1"
            style={{ fontSize: 6, color: plateFixtColor }}
          >
            {fixture || 'TBC'}
          </p>
        </div>
      </div>
    </button>
  )
}

export default PitchPlayerCard
