'use client'

import { type FantasySquadPlayer } from '@/lib/fantasyMockData'
import { PlayerCard } from './PlayerCard'

// ─── Pitch SVG markings ───────────────────────────────────────────────────────

function PitchMarkings() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 320 480"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Outer boundary */}
      <rect
        x="8"
        y="8"
        width="304"
        height="464"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
        rx="2"
      />
      {/* Halfway line */}
      <line
        x1="8"
        y1="240"
        x2="312"
        y2="240"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />
      {/* Centre circle */}
      <circle
        cx="160"
        cy="240"
        r="38"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />
      {/* Centre spot */}
      <circle cx="160" cy="240" r="2.5" fill="rgba(255,255,255,0.4)" />

      {/* Top penalty area */}
      <rect
        x="78"
        y="8"
        width="164"
        height="68"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />
      {/* Top goal area */}
      <rect
        x="110"
        y="8"
        width="100"
        height="26"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.2"
      />
      {/* Top penalty spot */}
      <circle cx="160" cy="88" r="2.5" fill="rgba(255,255,255,0.4)" />
      {/* Top penalty arc */}
      <path
        d="M 118 76 A 42 42 0 0 1 202 76"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.2"
      />

      {/* Bottom penalty area */}
      <rect
        x="78"
        y="404"
        width="164"
        height="68"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />
      {/* Bottom goal area */}
      <rect
        x="110"
        y="446"
        width="100"
        height="26"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.2"
      />
      {/* Bottom penalty spot */}
      <circle cx="160" cy="392" r="2.5" fill="rgba(255,255,255,0.4)" />
      {/* Bottom penalty arc */}
      <path
        d="M 118 404 A 42 42 0 0 0 202 404"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.2"
      />
    </svg>
  )
}

// ─── Pitch stripe overlay ─────────────────────────────────────────────────────

function PitchStripes() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute inset-x-0"
          style={{
            top: `${i * 12.5}%`,
            height: '6.25%',
            backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.05)' : 'transparent',
          }}
        />
      ))}
    </div>
  )
}

// ─── PitchLayout ─────────────────────────────────────────────────────────────

interface PitchLayoutProps {
  pitchPlayers: FantasySquadPlayer[]
  selectedId: string | null
  budget: number
  onSelectPlayer: (id: string) => void
}

export function PitchLayout({
  pitchPlayers,
  selectedId,
  budget,
  onSelectPlayer,
}: PitchLayoutProps) {
  const rows = [0, 1, 2, 3].map((row) =>
    pitchPlayers.filter((p) => p.pitchRow === row)
  )

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[2/3]">
      {/* Green pitch gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-700 via-green-800 to-green-900" />
      <PitchStripes />
      <PitchMarkings />

      {/* Budget pill */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-black/60 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-1">
          <span className="text-emerald-400 font-display font-bold text-[10px] tracking-wide">
            BUDGET ₦{budget.toFixed(1)}m
          </span>
        </div>
      </div>

      {/* Player rows */}
      <div className="absolute inset-0 flex flex-col justify-around py-4 px-2">
        {rows.map((rowPlayers, ri) => (
          <div key={ri} className="flex items-center justify-around">
            {rowPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selected={selectedId === player.id}
                onClick={() => onSelectPlayer(player.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
