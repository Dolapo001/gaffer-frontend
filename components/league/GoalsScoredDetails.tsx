import { useState } from 'react';
import { ChevronLeft, Triangle, Minus } from 'lucide-react';
import { ALL_PLAYERS, getTeamCrest } from '@/lib/leagueMockData';

interface ScorerDetail {
  id: string;
  name: string;
  goals: number;
  teamLogo: string;
  trend: 'up' | 'down' | 'stable';
  portrait: string;
  teamName: string;
}

const detailedScorers: ScorerDetail[] = [...ALL_PLAYERS]
  .sort((a, b) => b.goals - a.goals)
  .map((p, i) => ({
    id: p.id,
    name: p.name,
    goals: p.goals,
    teamName: p.teamName,
    teamLogo: getTeamCrest(p.teamId),
    portrait: `https://i.pravatar.cc/200?u=${p.id}`,
    trend: i === 0 ? 'stable' : i % 3 === 0 ? 'down' : 'up',
  }));

export function GoalsScoredDetails({ onBack }: { onBack: () => void }) {
  const [selectedPlayer, setSelectedPlayer] = useState<ScorerDetail>(detailedScorers[0]);

  return (
    <div
      className="mx-auto relative flex flex-col pb-6"
      style={{
        width: '328.53px',
        height: '711.38px',
        borderRadius: '28.03px',
        backgroundColor: '#181928',
        fontFamily: "'Poppins', sans-serif",
        overflow: 'hidden',
        paddingTop: '38.55px'
      }}
    >
      {/* Header (Step 508 Specs) */}
      <div
        className="relative flex items-center px-6 mb-8"
        style={{
          width: '328.53px',
          height: '49.06px'
        }}
      >
        <button
          onClick={onBack}
          className="absolute text-white hover:opacity-70 transition-opacity flex items-center justify-center"
          style={{
            width: '21.03px',
            height: '21.03px',
            top: '14.02px',
            left: '14.89px'
          }}
        >
          <ChevronLeft size={21.03} />
        </button>
        <h1 className="flex-1 text-center text-white text-[18px] font-bold tracking-tight">Goals Scored</h1>
      </div>

      {/* Featured Player Card (Step 517 Specs) */}
      <div
        style={{
          paddingLeft: '14.02px',
          marginTop: '13.14px',
          marginBottom: '28.15px'
        }}
      >
        <div
          className="relative bg-[#1a1b2e] rounded-[24px] overflow-hidden flex shadow-lg"
          style={{
            width: '300.5px',
            height: '169.1px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          {/* Card Content Left */}
          <div className="flex-1 p-4 flex flex-col justify-between z-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {selectedPlayer.teamLogo && (
                  <img
                    src={selectedPlayer.teamLogo}
                    alt={selectedPlayer.teamName}
                    className="w-5 h-5 object-contain"
                  />
                )}
                <span className="text-white text-[12px] opacity-80">{selectedPlayer.teamName}</span>
              </div>

              <h2
                className="text-white text-[20px] font-bold mb-0.5"
                style={{ lineHeight: '1.2', maxWidth: '140px' }}
              >
                {selectedPlayer.name}
              </h2>
              <span className="text-white text-[11px] opacity-60">Goals Score</span>
            </div>

            <span className="text-[#FF9100] text-[42px] font-bold leading-none">{selectedPlayer.goals}</span>
          </div>

          {/* Player Image (Step 523 Specs) */}
          <div
            className="absolute z-0"
            style={{
              width: '147.77px',
              height: '121px',
              top: '46.52px',
              left: '146.02px'
            }}
          >
            {selectedPlayer.portrait && (
              <img
                src={selectedPlayer.portrait}
                alt={selectedPlayer.name}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </div>
      </div>

      {/* Scorers List (Step 550 Specs) */}
      <div
        className="overflow-y-auto no-scrollbar"
        style={{
          width: '299px',
          height: '371.46px',
          paddingLeft: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '21.03px'
        }}
      >
        {detailedScorers.map((scorer) => (
          <button
            key={scorer.id}
            onClick={() => setSelectedPlayer(scorer)}
            className={`w-full flex items-center gap-4 group text-left transition-all p-2 rounded-xl h-[45px] ${selectedPlayer.id === scorer.id ? 'bg-white/5 border border-white/10' : 'hover:bg-white/[0.02]'}`}
          >
            {/* Trend Indicator */}
            <div className="w-6 flex justify-center">
              {scorer.trend === 'up' && <Triangle size={12} className="fill-[#00D1FF] text-[#00D1FF]" />}
              {scorer.trend === 'down' && <Triangle size={12} className="fill-[#FF9100] text-[#FF9100] rotate-180" />}
              {scorer.trend === 'stable' && <Minus size={16} className="text-[#94A3B8]" strokeWidth={3} />}
            </div>

            {/* Team Logo/Avatar */}
            <div className="w-10 h-10 rounded-full bg-[#2a2b45] flex items-center justify-center overflow-hidden shrink-0">
              {scorer.teamLogo ? (
                <img src={scorer.teamLogo} alt={scorer.teamName} className="w-8 h-8 object-contain" />
              ) : (
                <div className="w-full h-full bg-indigo-900/40" />
              )}
            </div>

            {/* Name */}
            <span className={`flex-1 text-[14px] font-medium transition-colors ${selectedPlayer.id === scorer.id ? 'text-[#00D1FF]' : 'text-white'}`}>{scorer.name}</span>

            {/* Score */}
            <span className="text-white text-[18px] font-bold">{scorer.goals}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
