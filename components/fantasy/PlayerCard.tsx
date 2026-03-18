'use client'

import { motion } from 'framer-motion'
import { type FantasySquadPlayer } from '@/lib/fantasyMockData'

// ─── Jersey SVG Icon ─────────────────────────────────────────────────────────

function JerseyIcon({ color, size = 36 }: { color: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Shirt body */}
      <path
        d="M9 10 L3 16 L8 19 L8 32 L28 32 L28 19 L33 16 L27 10 C25 14 11 14 9 10Z"
        fill={color}
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="0.8"
      />
      {/* Collar */}
      <path
        d="M13 10 Q18 15 23 10"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Sleeve highlight */}
      <path
        d="M3 16 L8 19"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M33 16 L28 19"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Shirt centre line */}
      <line
        x1="18"
        y1="15"
        x2="18"
        y2="29"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="0.8"
        strokeDasharray="2 2"
      />
    </svg>
  )
}

// ─── Captain / Vice-captain badge ────────────────────────────────────────────

function CaptainBadge({ isVice = false }: { isVice?: boolean }) {
  return (
    <div
      className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-display font-black z-10 ${
        isVice ? 'bg-gaffer-muted text-white' : 'bg-gaffer-orange text-white shadow-orange-glow'
      }`}
    >
      {isVice ? 'V' : 'C'}
    </div>
  )
}

// ─── PlayerCard ──────────────────────────────────────────────────────────────

interface PlayerCardProps {
  player: FantasySquadPlayer
  selected: boolean
  size?: 'sm' | 'md'
  onClick: () => void
}

export function PlayerCard({
  player,
  selected,
  size = 'md',
  onClick,
}: PlayerCardProps) {
  const jerseySize = size === 'sm' ? 30 : 36
  const nameClass = size === 'sm' ? 'text-[8px] max-w-[44px]' : 'text-[9px] max-w-[52px]'
  const metaClass = size === 'sm' ? 'text-[7px]' : 'text-[8px]'

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.9 }}
      className="relative flex flex-col items-center gap-0.5 group"
    >
      {/* Jersey + captain badge */}
      <div className="relative">
        <motion.div
          animate={
            selected
              ? { filter: 'drop-shadow(0 0 8px rgba(255,107,0,0.8))' }
              : { filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }
          }
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {player.avatarUrl ? (
            <div className={`rounded-xl overflow-hidden border ${selected ? 'border-[#ff6b00]' : 'border-white/10'}`} style={{ width: jerseySize, height: jerseySize }}>
              <img src={player.avatarUrl} alt={player.name} className="w-full h-full object-cover object-top" />
            </div>
          ) : (
            <JerseyIcon color={player.teamColor} size={jerseySize} />
          )}
        </motion.div>

        {player.isCaptain && <CaptainBadge />}
        {player.isViceCaptain && <CaptainBadge isVice />}

        {/* Selection ring */}
        {selected && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 rounded-full border-2 border-gaffer-orange pointer-events-none"
            style={{ borderRadius: '50%' }}
          />
        )}
      </div>

      {/* Name + meta pill */}
      <div
        className={`rounded-md px-1.5 py-0.5 text-center transition-colors ${
          selected ? 'bg-gaffer-orange' : 'bg-black/70 backdrop-blur-sm'
        }`}
      >
        <p
          className={`text-white font-body font-semibold leading-none truncate ${nameClass}`}
        >
          {player.shortName}
        </p>
        <p className={`text-white/80 font-body leading-none mt-0.5 ${metaClass}`}>
          {player.teamCode}({player.pitchRow === 0 ? player.position : player.position}) {player.points}
        </p>
      </div>
    </motion.button>
  )
}
