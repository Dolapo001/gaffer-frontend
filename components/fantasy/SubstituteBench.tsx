'use client'

import { type FantasySquadPlayer, getJerseyUrl } from '@/lib/fantasyMockData'
import { PitchPlayerCard, type JerseyProps } from './PitchPlayerCard'
import { normalizeJerseyConfig } from '@/components/jersey/jerseyUtils'

function toJersey(player: FantasySquadPlayer): JerseyProps {
  const jc = normalizeJerseyConfig(
    player.jersey ?? { primaryColor: player.teamColor, secondaryColor: '#ffffff', jerseyPattern: 'solid' }
  )
  return { primaryColor: jc.primaryColor, secondaryColor: jc.secondaryColor, jerseyPattern: jc.jerseyPattern, teamCode: player.teamCode }
}

const BENCH_LABELS: Record<string, string> = {
  GK: 'GKP',
  DEF: '1.DEF',
  MID: '2.MID',
  FWD: '3.FWD',
}

interface SubstituteBenchProps {
  benchPlayers: FantasySquadPlayer[]
  selectedId: string | null
  substitutingOutId?: string | null
  onSelectPlayer: (id: string) => void
  players?: FantasySquadPlayer[]
}

export function SubstituteBench({
  benchPlayers,
  selectedId,
  substitutingOutId,
  onSelectPlayer,
  players = [],
}: SubstituteBenchProps) {
  const pOut = substitutingOutId ? players.find(p => p.id === substitutingOutId) : null;
  return (
    <div className="px-4 mt-8 relative z-10 w-full max-w-4xl mx-auto">
      {/* Main Container with the metallic gradient - more transparent */}
      <div className="bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-md rounded-[2rem] p-6 shadow-xl flex flex-col items-center border border-white/10">
        
        {/* Player Row Container */}
        <div className="flex flex-row justify-center gap-[28px] w-full mb-6">
          {benchPlayers.map((player) => {
            const isValidTarget = pOut && (pOut.position === 'GK') === (player.position === 'GK');
            
            return (
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
                  kitImageUrl={getJerseyUrl(player.teamCode, player.position)}
                  jersey={toJersey(player)}
                  points={player.points}
                  selected={selectedId === player.id}
                  highlightMode={substitutingOutId ? (isValidTarget ? 'sub_in_valid' : 'none') : 'none'}
                  onClick={() => onSelectPlayer(player.id)}
                  kitAreaClassName="bg-black/20"
                  className={`w-full shadow-sm transition-opacity duration-300 ${substitutingOutId && !isValidTarget ? 'opacity-30 grayscale' : 'opacity-100'}`}
                />
              </div>
            )
          })}
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-white font-bold text-2xl sm:text-3xl tracking-wider drop-shadow-md uppercase">
            Substitute
          </h2>
        </div>
      </div>
    </div>
  )
}
