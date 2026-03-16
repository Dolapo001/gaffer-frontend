'use client'

import { type FantasySquadPlayer } from '@/lib/fantasyMockData'
import { PitchPlayerCard } from './PitchPlayerCard'

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
    <div className="px-4 mt-8 relative z-10 w-full max-w-4xl mx-auto">
      {/* Main Container with the metallic gradient */}
      <div className="bg-gradient-to-b from-gray-200 to-gray-500 rounded-[2rem] p-6 shadow-xl flex flex-col items-center border border-white/20">
        
        {/* Player Row Container */}
        <div className="flex flex-row justify-center gap-[28px] w-full mb-6">
          {benchPlayers.map((player) => (
            <div key={player.id} className="flex flex-col items-center w-24 sm:w-28">
              
              {/* Position Label Area */}
              <div className="flex flex-col items-center mb-1">
                <span className="text-[#37003c] font-bold text-sm sm:text-base leading-tight">
                  {BENCH_LABELS[player.position] ?? player.position}
                </span>
                {/* Tiny placeholder text under position label */}
                <span className="text-[5px] sm:text-[6px] text-[#37003c]/50 tracking-widest uppercase mt-[1px] font-medium">
                  xxxxxxxxxx
                </span>
              </div>

              <PitchPlayerCard
                playerName={player.shortName}
                fixture={player.nextFixtures[0] ? `${player.nextFixtures[0].awayCode === player.teamCode ? player.nextFixtures[0].homeCode : player.nextFixtures[0].awayCode} (${player.nextFixtures[0].homeCode === player.teamCode ? 'H' : 'A'})` : 'TBC'}
                kitImageUrl={player.avatarUrl || ''}
                selected={selectedId === player.id}
                onClick={() => onSelectPlayer(player.id)}
                kitAreaClassName="bg-[#A59CAE]" // Muted purple/grey background for bench kits
                className="w-full shadow-sm"
              />
            </div>
          ))}
        </div>

        <div className="mt-2 text-center">
          <h2 className="text-white font-bold text-2xl sm:text-3xl tracking-wide drop-shadow-sm uppercase">
            Substitute
          </h2>
        </div>
      </div>
    </div>
  )
}
