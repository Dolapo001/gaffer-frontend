'use client'

import { type FantasySquadPlayer, getJerseyUrl } from '@/lib/fantasyMockData'
import { PitchPlayerCard, type JerseyProps } from './PitchPlayerCard'
import { normalizeJerseyConfig } from '@/components/jersey/jerseyUtils'

function toJersey(player: FantasySquadPlayer): JerseyProps {
  const jc = normalizeJerseyConfig(
    player.jersey ?? { primaryColor: player.teamColor, secondaryColor: '#ffffff', jerseyPattern: 'solid' }
  )
  return {
    primaryColor: jc.primaryColor,
    secondaryColor: jc.secondaryColor,
    jerseyPattern: jc.jerseyPattern,
    teamCode: player.teamCode,
  }
}

function fixtureLabel(player: FantasySquadPlayer): string {
  const f = player.nextFixtures[0]
  if (!f) return 'TBC'
  const opp = f.awayCode === player.teamCode ? f.homeCode : f.awayCode
  const venue = f.homeCode === player.teamCode ? 'H' : 'A'
  return `${opp} (${venue})`
}

interface SubstituteBenchProps {
  benchPlayers: FantasySquadPlayer[]
  selectedId: string | null
  substitutingOutId?: string | null
  onSelectPlayer: (id: string) => void
  players?: FantasySquadPlayer[]
  compact?: boolean
}

export function SubstituteBench({
  benchPlayers,
  selectedId,
  substitutingOutId,
  onSelectPlayer,
  players = [],
  compact = false,
}: SubstituteBenchProps) {
  const pOut = substitutingOutId
    ? players.find((p) => p.id === substitutingOutId)
    : null

  return (
    <div className="relative z-10 w-full px-2">

      {/* ── Section divider ──────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-2 ${compact ? 'mb-1' : 'mb-4'}`}>
        <div className="h-px flex-1 bg-white/12" />
        <span
          className="text-white/45 font-bold uppercase tracking-[0.20em]"
          style={{ fontSize: 10 }}
        >
          Substitutes
        </span>
        <div className="h-px flex-1 bg-white/12" />
      </div>

      {/* ── Bench tile row ───────────────────────────────────────────────── */}
      {/*
        Dark semi-transparent background strip gives the bench area its own
        visual territory without a heavy card border or blur effect.
      */}
      <div
        className={`w-full flex justify-center gap-3 rounded-2xl px-2 ${compact ? 'py-2' : 'py-4'}`}
        style={{ background: 'rgba(0,0,0,0.22)' }}
      >
        {benchPlayers.map((player, idx) => {
          const isValidTarget =
            pOut &&
            (pOut.position === 'GK') === (player.position === 'GK')

          return (
            <div key={player.id} className="flex flex-col items-center gap-1">
              {/* Sub order number */}
              <span
                className="text-white/35 font-bold uppercase"
                style={{ fontSize: 9, letterSpacing: '0.04em' }}
              >
                {idx + 1}
              </span>

              <PitchPlayerCard
                playerName={player.shortName}
                fixture={fixtureLabel(player)}
                jersey={toJersey(player)}
                selected={selectedId === player.id}
                highlightMode={
                  substitutingOutId
                    ? isValidTarget
                      ? 'sub_in_valid'
                      : 'none'
                    : 'none'
                }
                onClick={() => onSelectPlayer(player.id)}
                className={`transition-opacity duration-200 ${
                  substitutingOutId && !isValidTarget
                    ? 'opacity-30 grayscale'
                    : 'opacity-100'
                }`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
