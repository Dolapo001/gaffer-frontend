'use client';

import { ChevronRight } from 'lucide-react';
import { TOP_PLAYERS } from '@/lib/leagueMockData';

const scorers = [...TOP_PLAYERS]
  .sort((a, b) => b.goals - a.goals)
  .slice(0, 6)
  .map((p) => ({
    name: p.name,
    goals: p.goals,
    avatar: `https://i.pravatar.cc/100?u=${p.id}`,
  }));

export function TopScorers({ onSeeAll }: { onSeeAll?: () => void }) {
  return (
    <div className="w-full flex justify-center mb-20 px-4 text-white">
      <div
        className="bg-[#1a1b2e]/60 backdrop-blur-sm p-5 flex flex-col shadow-2xl"
        style={{
          width: '302.25px',
          height: '378.47px',
          borderRadius: '28.03px',
          border: '1.31px solid #2E2F3E',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[17px] font-bold tracking-tight">Top Scorer</h2>
          <button
            onClick={onSeeAll}
            className="text-[#a855f7] text-[13px] font-bold hover:text-[#d8b4fe] transition-colors"
          >
            See All
          </button>
        </div>

        {/* Column Headers */}
        <div className="flex items-center text-[#94a3b8] text-[12px] font-bold mb-3">
          <span className="flex-1">Player Name</span>
          <span className="w-12 text-right">Goals</span>
        </div>

        {/* Scorer Rows - Controlled height to fit container */}
        <div className="flex-1 overflow-hidden space-y-0.5">
          {scorers.map((scorer, i) => (
            <div
              key={i}
              className="flex items-center py-2.5 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors rounded-lg group"
            >
              <div className="flex-1 flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10 group-hover:border-[#a855f7]/50 transition-all bg-[#2a2b45]">
                  <img src={scorer.avatar} alt={scorer.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-[15px] font-bold tracking-tight">{scorer.name}</span>
              </div>
              <span className="w-12 text-right text-[15px] font-black">{scorer.goals}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
