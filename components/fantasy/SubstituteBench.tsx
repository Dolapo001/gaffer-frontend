'use client'

import { type FantasySquadPlayer } from '@/lib/fantasyMockData'
import { PlayerCard } from './PlayerCard'

const BENCH_LABELS: Record<string, string> = {
  GK: 'GKP',
  DEF: '1.DEF',
  MID: '2.MID',
  FWD: '3.FWD',
}

interface SubstituteBenchProps {
  benchPlayers: FantasySquadPlayer[]
  selectedId: string | null
  onSelectPlayer: (id: string) => void
}

export function SubstituteBench({
  benchPlayers,
  selectedId,
  onSelectPlayer,
}: SubstituteBenchProps) {
  return (
    <div>
      {/* Bench header */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <div className="flex-1 h-px bg-gaffer-border" />
        <span className="text-[10px] font-display font-bold text-gaffer-muted tracking-widest uppercase">
          Substitute
        </span>
        <div className="flex-1 h-px bg-gaffer-border" />
      </div>

      {/* Bench row */}
      <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl py-4 px-2 mx-4">
        <div className="flex justify-around">
          {benchPlayers.map((player) => (
            <div key={player.id} className="flex flex-col items-center gap-1">
              {/* Position label */}
              <span className="text-[8px] font-display font-bold text-gaffer-muted tracking-wider">
                {BENCH_LABELS[player.position] ?? player.position}
              </span>
              <PlayerCard
                player={player}
                selected={selectedId === player.id}
                size="sm"
                onClick={() => onSelectPlayer(player.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
