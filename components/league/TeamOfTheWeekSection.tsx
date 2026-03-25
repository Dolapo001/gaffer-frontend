'use client'

import { motion } from 'framer-motion'
import { JerseySvg } from '@/components/jersey/JerseySvg'
import type { PlayerStatEntry } from '@/lib/services/stats.service'

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Deterministic jersey color from a team name string */
function colorFromTeamName(name: string): { primary: string; secondary: string } {
  const palette = [
    { primary: '#FF6B00', secondary: '#1a1b2e' },
    { primary: '#4568DC', secondary: '#ffffff' },
    { primary: '#00AA44', secondary: '#ffffff' },
    { primary: '#B06AB3', secondary: '#ffffff' },
    { primary: '#E7000B', secondary: '#ffffff' },
    { primary: '#00D1FF', secondary: '#1a1b2e' },
    { primary: '#FFD700', secondary: '#1a1b2e' },
    { primary: '#FF4400', secondary: '#ffffff' },
    { primary: '#9C27B0', secondary: '#ffffff' },
    { primary: '#009688', secondary: '#ffffff' },
    { primary: '#795548', secondary: '#ffffff' },
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return palette[Math.abs(hash) % palette.length]
}

function playerFullName(p: PlayerStatEntry): string {
  const pid = p.playerId
  if (typeof pid === 'string') return 'Player'
  return `${pid.firstName} ${pid.lastName}`
}

function playerFirstName(p: PlayerStatEntry): string {
  const pid = p.playerId
  if (typeof pid === 'string') return 'Player'
  return pid.firstName
}

function teamDisplayName(p: PlayerStatEntry): string {
  return typeof p.teamId === 'string' ? '' : (p.teamId.shortName ?? p.teamId.name)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PlayerSlot({
  player,
  index,
  stat,
}: {
  player: PlayerStatEntry
  index: number
  stat: number
}) {
  const teamName = typeof player.teamId === 'string' ? 'Unknown' : player.teamId.name
  const { primary, secondary } = colorFromTeamName(teamName)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex flex-col items-center gap-0.5"
    >
      {/* Stat badge */}
      <div
        className="text-[8px] font-chakra font-black px-1.5 py-0.5 rounded-full mb-0.5"
        style={{ background: primary, color: secondary }}
      >
        {stat}
      </div>

      <JerseySvg
        width={40}
        height={45}
        primaryColor={primary}
        secondaryColor={secondary}
        jerseyPattern="solid"
        brandingText=""
      />

      {/* Name */}
      <p
        className="text-white font-chakra font-black uppercase text-center leading-none"
        style={{ fontSize: '7px', maxWidth: '44px' }}
      >
        {playerFirstName(player)}
      </p>
      <p
        className="text-white/40 font-chakra uppercase text-center leading-none"
        style={{ fontSize: '6px', maxWidth: '44px' }}
      >
        {teamDisplayName(player)}
      </p>
    </motion.div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface TeamOfTheWeekSectionProps {
  players: PlayerStatEntry[]
  statKey: 'goals' | 'assists'
  onSeeAll?: () => void
}

export function TeamOfTheWeekSection({
  players,
  statKey,
  onSeeAll,
}: TeamOfTheWeekSectionProps) {
  // Take top 11 for a formation visual
  const top11 = players.slice(0, 11)

  if (top11.length < 3) {
    return (
      <div className="w-full px-4 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-white font-display font-bold text-sm uppercase tracking-wide">
            Top Performers
          </h2>
        </div>
        <div className="bg-[#1a1b2e]/60 rounded-[24px] p-10 border border-white/5 text-center">
          <p className="text-white/20 font-chakra font-black uppercase tracking-widest text-[11px]">
            No stats recorded yet
          </p>
        </div>
      </div>
    )
  }

  // Build formation rows: FWD / MID / DEF / GK (top→bottom visual, attacking first)
  // Distribute players across 4 rows regardless of actual position
  const rows: PlayerStatEntry[][] = [
    top11.slice(0, 3),   // Row 1 — 3 players (top scorers — "FWD")
    top11.slice(3, 6),   // Row 2 — 3 players
    top11.slice(6, 9),   // Row 3 — 3 players
    top11.slice(9, 11),  // Row 4 — remaining
  ].filter((r) => r.length > 0)

  return (
    <div className="w-full px-4 mb-6">
      {/* Section heading */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-white font-display font-bold text-sm uppercase tracking-wide">
          Top Performers
        </h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-[#D2B5FF] text-[11px] font-display font-medium hover:text-white transition-colors"
          >
            See All
          </button>
        )}
      </div>

      {/* Pitch card */}
      <div
        className="relative rounded-[24px] overflow-hidden py-6 px-4"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(69,104,220,0.12) 0%, transparent 70%), linear-gradient(180deg, #111a2e 0%, #0d1220 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Pitch lines overlay */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 320 260"
          preserveAspectRatio="none"
        >
          {/* Centre circle */}
          <circle cx="160" cy="130" r="36" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          {/* Centre line */}
          <line x1="20" y1="130" x2="300" y2="130" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          {/* Outer border */}
          <rect x="20" y="14" width="280" height="232" rx="4" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          {/* Penalty areas */}
          <rect x="90" y="14" width="140" height="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          <rect x="90" y="206" width="140" height="40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
        </svg>

        {/* Player rows */}
        <div className="relative z-10 flex flex-col gap-5">
          {rows.map((row, ri) => (
            <div
              key={ri}
              className="flex items-end justify-around"
            >
              {row.map((player, pi) => (
                <PlayerSlot
                  key={player.playerId?._id ?? `${ri}-${pi}`}
                  player={player}
                  index={ri * 3 + pi}
                  stat={player[statKey] ?? 0}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Footer label */}
        <p className="relative z-10 text-center text-white/15 text-[8px] font-chakra font-black uppercase tracking-[3px] mt-5">
          Based on {statKey === 'goals' ? 'Goals Scored' : 'Assists'}
        </p>
      </div>
    </div>
  )
}
