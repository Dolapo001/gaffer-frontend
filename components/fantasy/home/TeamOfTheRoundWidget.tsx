'use client'

import { PitchMarkings } from '@/components/fantasy/PitchLayout'
import { PitchPlayerCard, type JerseyProps } from '@/components/fantasy/PitchPlayerCard'
import { normalizeJerseyConfig } from '@/components/jersey/jerseyUtils'
import { getImageUrl } from '@/lib/api'
import type { GameweekTopPlayer } from '@/lib/services/fantasy.service'
import { pickTeamOfTheRound, computeTeamTotals } from '@/lib/teamOfTheRound'

function toJersey(p: GameweekTopPlayer): JerseyProps {
  const jc = normalizeJerseyConfig(
    p.team?.jersey ?? { primaryColor: '#4a5568', secondaryColor: '#ffffff', jerseyPattern: 'solid' },
  )
  return { primaryColor: jc.primaryColor, secondaryColor: jc.secondaryColor, jerseyPattern: jc.jerseyPattern }
}

interface TeamOfTheRoundWidgetProps {
  players: GameweekTopPlayer[]
  roundName?: string
}

export function TeamOfTheRoundWidget({ players, roundName }: TeamOfTheRoundWidgetProps) {
  const xi = pickTeamOfTheRound(players)
  const { most, least } = computeTeamTotals(players)

  if (!xi) {
    return (
      <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-4">
        <h3 className="text-white font-display font-bold text-sm uppercase tracking-wide mb-2">Team of the Round</h3>
        <p className="text-gaffer-muted text-xs font-body text-center py-4">Not enough scored players yet.</p>
      </div>
    )
  }

  const rows = [
    { key: 'gk', players: [xi.gk] },
    { key: 'def', players: xi.def },
    { key: 'mid', players: xi.mid },
    { key: 'fwd', players: xi.fwd },
  ]

  return (
    <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-display font-bold text-sm uppercase tracking-wide">Team of the Round</h3>
        {roundName && <span className="text-gaffer-muted text-[10px] font-black uppercase tracking-widest">{roundName}</span>}
      </div>

      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex flex-col items-center gap-1">
          {least?.team.logoUrl && (
            <img src={getImageUrl(least.team.logoUrl)} className="w-6 h-6 rounded-full object-cover" alt={least.team.name} />
          )}
          <span className="text-white font-chakra font-black text-sm">{least?.totalPoints ?? '-'}</span>
          <span className="text-gaffer-muted text-[9px] font-black uppercase tracking-widest">Least Pts</span>
        </div>
        <div className="flex flex-col items-center bg-gaffer-bg border border-gaffer-border rounded-xl px-5 py-2">
          <span className="text-white font-chakra font-black text-xl">{xi.totalPoints}</span>
          <span className="text-gaffer-muted text-[9px] font-black uppercase tracking-widest">Points</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          {most?.team.logoUrl && (
            <img src={getImageUrl(most.team.logoUrl)} className="w-6 h-6 rounded-full object-cover" alt={most.team.name} />
          )}
          <span className="text-white font-chakra font-black text-sm">{most?.totalPoints ?? '-'}</span>
          <span className="text-gaffer-muted text-[9px] font-black uppercase tracking-widest">Most Pts</span>
        </div>
      </div>

      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden">
        <PitchMarkings />
        <div className="absolute inset-0 flex flex-col justify-around gap-[6px] pt-6 pb-8 px-2">
          {rows.map((row) => (
            <div key={row.key} className="flex flex-row justify-center gap-2 w-full">
              {row.players.map((p) => (
                <PitchPlayerCard
                  key={p.fantasyPlayerId}
                  playerName={`${p.player.firstName?.[0] ? p.player.firstName[0] + '. ' : ''}${p.player.lastName}`.trim()}
                  fixture={p.team.shortName || p.team.name}
                  jersey={toJersey(p)}
                  points={p.totalPoints}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
