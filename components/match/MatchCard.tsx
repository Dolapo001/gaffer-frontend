'use client'

/**
 * MatchCard.tsx
 *
 * Example wrapper that combines the PitchView with a match header and a
 * formation legend.  Drop this into any page to get a fully self-contained
 * tactical board card.
 *
 * Usage:
 *   <MatchCard
 *     homeTeam={{ name: 'Engineering', color: '#FF6B00' }}
 *     awayTeam={{ name: 'Law', color: '#3b82f6' }}
 *     homePlayers={HOME_POSITIONS}
 *     awayPlayers={AWAY_POSITIONS}
 *     homeFormation="4-3-3"
 *     awayFormation="4-4-2"
 *   />
 */

import { PitchView, type PitchPlayerMarker } from './PitchView'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamInfo {
  name: string
  shortName?: string
  formation?: string
  /** Tailwind-compatible hex or class colour used for player markers */
  color: string
}

interface MatchCardProps {
  homeTeam: TeamInfo
  awayTeam: TeamInfo
  /** Player marker positions for the home side (use PitchView coordinate space) */
  homePlayers?: PitchPlayerMarker[]
  /** Player marker positions for the away side */
  awayPlayers?: PitchPlayerMarker[]
  /** Extra Tailwind classes for the card wrapper */
  className?: string
}

// ─── Formation legend dot ─────────────────────────────────────────────────────

function LegendDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MatchCard({
  homeTeam,
  awayTeam,
  homePlayers = [],
  awayPlayers = [],
  className = '',
}: MatchCardProps) {
  // Inject each team's colour into the player markers
  const coloredHome: PitchPlayerMarker[] = homePlayers.map((p) => ({
    ...p,
    color: p.color ?? homeTeam.color,
  }))
  const coloredAway: PitchPlayerMarker[] = awayPlayers.map((p) => ({
    ...p,
    color: p.color ?? awayTeam.color,
  }))

  return (
    <div
      className={[
        'rounded-2xl overflow-hidden bg-gaffer-surface border border-gaffer-border shadow-card',
        className,
      ].join(' ')}
    >
      {/* ── Pitch ──────────────────────────────────────────────────────────── */}
      <PitchView players={[...coloredHome, ...coloredAway]} />

      {/* ── Formation legend ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gaffer-border">
        {/* Home team */}
        <div className="flex items-center gap-2">
          <LegendDot color={homeTeam.color} />
          <span className="text-white text-xs font-display font-bold">
            {homeTeam.shortName ?? homeTeam.name}
          </span>
          {homeTeam.formation && (
            <span className="text-gaffer-muted text-[10px] font-body">
              {homeTeam.formation}
            </span>
          )}
        </div>

        <span className="text-gaffer-subtle text-[10px] font-body">vs</span>

        {/* Away team */}
        <div className="flex items-center gap-2">
          {awayTeam.formation && (
            <span className="text-gaffer-muted text-[10px] font-body">
              {awayTeam.formation}
            </span>
          )}
          <span className="text-white text-xs font-display font-bold">
            {awayTeam.shortName ?? awayTeam.name}
          </span>
          <LegendDot color={awayTeam.color} />
        </div>
      </div>
    </div>
  )
}

// ─── Example usage with hardcoded positions ──────────────────────────────────
//
// Import this demo anywhere to see the pitch in action:
//
//   import { MatchCardDemo } from '@/components/match/MatchCard'
//   <MatchCardDemo />

/** 4-3-3 home positions (orange) — coordinates in 300×430 space */
const DEMO_HOME: PitchPlayerMarker[] = [
  { id: 'h-gk',  x: 150, y: 390, label: 'GK' },
  { id: 'h-rb',  x:  65, y: 318, label: 'RB' },
  { id: 'h-cb1', x: 111, y: 308, label: 'CB' },
  { id: 'h-cb2', x: 189, y: 308, label: 'CB' },
  { id: 'h-lb',  x: 235, y: 318, label: 'LB' },
  { id: 'h-cm1', x:  88, y: 230, label: 'CM' },
  { id: 'h-cm2', x: 150, y: 218, label: 'CM' },
  { id: 'h-cm3', x: 212, y: 230, label: 'CM' },
  { id: 'h-rw',  x:  88, y: 145, label: 'RW' },
  { id: 'h-st',  x: 150, y: 128, label: 'ST' },
  { id: 'h-lw',  x: 212, y: 145, label: 'LW' },
]

/** 4-3-3 away positions (blue) — mirrored */
const DEMO_AWAY: PitchPlayerMarker[] = [
  { id: 'a-gk',  x: 150, y:  40, label: 'GK', color: '#3b82f6' },
  { id: 'a-rb',  x:  65, y: 112, label: 'RB', color: '#3b82f6' },
  { id: 'a-cb1', x: 111, y: 122, label: 'CB', color: '#3b82f6' },
  { id: 'a-cb2', x: 189, y: 122, label: 'CB', color: '#3b82f6' },
  { id: 'a-lb',  x: 235, y: 112, label: 'LB', color: '#3b82f6' },
  { id: 'a-cm1', x:  88, y: 200, label: 'CM', color: '#3b82f6' },
  { id: 'a-cm2', x: 150, y: 212, label: 'CM', color: '#3b82f6' },
  { id: 'a-cm3', x: 212, y: 200, label: 'CM', color: '#3b82f6' },
  { id: 'a-rw',  x:  88, y: 285, label: 'RW', color: '#3b82f6' },
  { id: 'a-st',  x: 150, y: 302, label: 'ST', color: '#3b82f6' },
  { id: 'a-lw',  x: 212, y: 285, label: 'LW', color: '#3b82f6' },
]

export function MatchCardDemo() {
  return (
    <div className="px-4 py-6 bg-gaffer-bg min-h-screen">
      <MatchCard
        homeTeam={{ name: 'Engineering', shortName: 'ENG', color: '#FF6B00', formation: '4-3-3' }}
        awayTeam={{ name: 'Law', shortName: 'LAW', color: '#3b82f6', formation: '4-3-3' }}
        homePlayers={DEMO_HOME}
        awayPlayers={DEMO_AWAY}
      />
    </div>
  )
}
