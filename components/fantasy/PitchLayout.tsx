'use client'

import { type FantasySquadPlayer, getJerseyUrl } from '@/lib/fantasyMockData'
import { PitchPlayerCard, type JerseyProps } from './PitchPlayerCard'
import { EmptySlotCard } from './EmptySlotCard'
import { normalizeJerseyConfig } from '@/components/jersey/jerseyUtils'

/** Always returns a JerseyProps — uses team.jersey if present, falls back to teamColor solid kit */
function toJersey(player: FantasySquadPlayer): JerseyProps {
  const jc = normalizeJerseyConfig(
    player.jersey ?? { primaryColor: player.teamColor, secondaryColor: '#ffffff', jerseyPattern: 'solid' }
  )
  return { primaryColor: jc.primaryColor, secondaryColor: jc.secondaryColor, jerseyPattern: jc.jerseyPattern, teamCode: player.teamCode }
}

/**
 * When a gameweek-scoped fixture map is supplied, use it — it's authoritative
 * for "does this team have a fixture in the round being viewed." A null
 * entry means the team truly has none that round (real TBC). Only falls
 * back to "this team's next fixture anywhere" when no map was passed at all
 * (e.g. the squad-builder screen, which isn't scoped to any gameweek).
 */
function getFixtureLabel(player: FantasySquadPlayer, fixtureLabelByTeamId?: Record<string, string | null>): string {
  if (fixtureLabelByTeamId && player.teamId && player.teamId in fixtureLabelByTeamId) {
    return fixtureLabelByTeamId[player.teamId!] ?? player.teamCode
  }
  const next = player.nextFixtures[0]
  if (!next) return player.teamCode
  const oppCode = next.awayCode === player.teamCode ? next.homeCode : next.awayCode
  const isHome = next.homeCode === player.teamCode
  return `${oppCode} (${isHome ? 'H' : 'A'})`
}

// ─── Pitch SVG markings ───────────────────────────────────────────────────────

// ─── Pitch SVG markings ───────────────────────────────────────────────────────

export function PitchMarkings() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden rounded-xl">
      {/* ── Layer 1: The "Mow Lines" (CSS Grass Texture) ── */}
      <div 
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            #3E611E 0%,
            #3E611E 10%,
            #4B7429 10%,
            #4B7429 20%
          )`,
          backgroundSize: '200% 100%',
        }}
      />

      {/* ── Layer 2: Grass Grain & Noise (SVG Filter) ── */}
      <svg className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay pointer-events-none">
        <filter id="grass-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grass-noise)" />
      </svg>

      {/* ── Layer 3: Stadium Ambient Lighting (Vignette) ── */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.4) 110%)',
          pointerEvents: 'none'
        }}
      />

      {/* ── Layer 4: Field Markings (SVG) ── */}
      <svg
        viewBox="0 0 329 402"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full drop-shadow-[0_0_2px_rgba(255,255,255,0.4)]"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g clipPath="url(#clip0_pitch_layout)">
          {/* Penalty area (top) */}
          <path
            d="M250.809 33.2852L265.555 72.4229H63.5635L81.6396 33.2852H250.809Z"
            stroke="white"
            strokeWidth="1.2"
            strokeOpacity="0.8"
          />

          {/* Outer field boundary */}
          <path
            d="M344.992 101.749L339.03 293.21H-6.02539L-10.9941 100.21L23.6104 33.2803L311.866 31.2061L344.992 101.749Z"
            stroke="white"
            strokeWidth="1.5"
            strokeOpacity="0.8"
          />

          {/* Centre circle (perspective) */}
          <ellipse cx="166.5" cy="294.73" rx="85" ry="48.5" stroke="white" strokeWidth="1.8" strokeOpacity="0.7" />

          {/* Goal area (6-yard box) */}
          <path
            d="M215.401 33.0352L220.059 53.4053H108.073L115.524 33.0352H215.401Z"
            stroke="white"
            strokeWidth="1"
            strokeOpacity="0.8"
          />

          {/* Goal mouth */}
          <path d="M195.5 10.9146V32.8267H137.5V10.9146H195.5Z" stroke="white" strokeOpacity="0.6" strokeWidth="1" />

          {/* Penalty arc */}
          <path 
            d="M115.001 72.9014C123.896 80.563 143.832 85.9013 167 85.9014C190.168 85.9014 210.105 80.5631 219 72.9014" 
            stroke="white" 
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />
        </g>

        <defs>
          <clipPath id="clip0_pitch_layout">
            <rect width="329" height="402" fill="white" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

interface PitchLayoutProps {
  pitchPlayers: FantasySquadPlayer[]
  selectedId: string | null
  substitutingOutId?: string | null
  budget: number
  onSelectPlayer: (id: string) => void
  selectionMode?: boolean
  className?: string
  /** Points to show on each card for the currently-viewed gameweek, keyed by player id. Omit to hide all badges. */
  pointsByPlayerId?: Record<string, number | null>
  /** This gameweek's opponent per team _id (null = no fixture that round = TBC). Omit to fall back to "next fixture anywhere". */
  fixtureLabelByTeamId?: Record<string, string | null>
}

export function PitchLayout({
  pitchPlayers,
  selectedId,
  substitutingOutId,
  budget,
  onSelectPlayer,
  selectionMode = false,
  className,
  pointsByPlayerId,
  fixtureLabelByTeamId,
}: PitchLayoutProps) {
  // Define fixed slots for selection mode
  // Row 3: GK (2 slots)
  // Row 2: DEF (5 slots)
  // Row 1: MID (5 slots)
  // Row 0: FWD (3 slots)
  const slotConfig = [
    { row: 3, count: 2, position: 'GK' },
    { row: 2, count: 5, position: 'DEF' },
    { row: 1, count: 5, position: 'MID' },
    { row: 0, count: 3, position: 'FWD' },
  ]

  const rows = [3, 2, 1, 0].map((row) => {
    const playersInRow = pitchPlayers.filter((p) => p.pitchRow === row)
    const config = slotConfig.find((c) => c.row === row)
    return {
      row,
      players: playersInRow,
      totalSlots: config?.count || 0,
      position: config?.position || '',
    }
  })

  return (
    <div className={className ?? "relative w-full aspect-[4/5]"}>
      <PitchMarkings />

      {/* Player rows */}
      {/*
        justify-around  — evenly distributes the 4 formation rows across the
                          full pitch height so GK/DEF/MID/FWD zones feel natural
        gap-[6px]       — minimal gap; rows self-space via justify-around
        pt-6 pb-8       — leaves the goal area and centre circle visible
        gap-2 per row   — 8 px between players; 5×64 + 4×8 = 352px fits 360px screens
      */}
      <div className="absolute inset-0 flex flex-col justify-around gap-[6px] pt-6 pb-8 px-2">
        {rows.map((rowData, ri) => (
          <div key={ri} className="flex flex-row justify-center gap-2 w-full">
            {selectionMode ? (
              // In selection mode, we show all slots
              Array.from({ length: rowData.totalSlots }).map((_, si) => {
                const player = rowData.players[si]
                if (player) {
                  return (
                    <PitchPlayerCard
                      key={player.id}
                      playerName={player.shortName}
                      fixture={getFixtureLabel(player, fixtureLabelByTeamId)}
                      jersey={toJersey(player)}
                      selected={selectedId === player.id}
                      highlightMode={substitutingOutId === player.id ? 'sub_out' : 'none'}
                      onClick={() => onSelectPlayer(player.id)}
                      status={player.status || 'fit'}
                      captaincy={player.isCaptain ? 'C' : player.isViceCaptain ? 'V' : null}
                      points={pointsByPlayerId?.[player.id] ?? null}
                    />
                  )
                }
                return (
                  <EmptySlotCard
                    key={`empty-${rowData.row}-${si}`}
                    position={rowData.position}
                    onClick={() => {
                        onSelectPlayer(`empty-${rowData.position}-${si}`)
                    }}
                  />
                )
              })
            ) : (
              // In normal mode, only show players
              rowData.players.map((player) => (
                <PitchPlayerCard
                  key={player.id}
                  playerName={player.shortName}
                  fixture={getFixtureLabel(player, fixtureLabelByTeamId)}
                  jersey={toJersey(player)}
                  selected={selectedId === player.id}
                  highlightMode={substitutingOutId === player.id ? 'sub_out' : 'none'}
                  onClick={() => onSelectPlayer(player.id)}
                  status={player.status || 'fit'}
                  captaincy={player.isCaptain ? 'C' : player.isViceCaptain ? 'V' : null}
                  points={pointsByPlayerId?.[player.id] ?? null}
                />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
