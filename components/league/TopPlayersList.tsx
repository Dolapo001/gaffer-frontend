'use client';

import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopPlayersListProps {
  title: string;
  players?: any[];
  statKey: 'goals' | 'assists';
  statLabel: string;
  onSeeAll?: () => void;
}

export function TopPlayersList({ title, players, statKey, statLabel, onSeeAll }: TopPlayersListProps) {
  const hasData = players && players.length > 0;
  
  const list = hasData ? players.slice(0, 6).map((p, i) => {
    const firstName = p?.playerId?.firstName || '';
    const lastName = p?.playerId?.lastName || '';
    const fullName = p?.playerId?.firstName ? `${firstName} ${lastName}` : (p?.playerName || 'Player');
    
    return {
      name: fullName,
      value: p?.[statKey] || 0,
      photo: p?.playerId?.photoUrl || null
    };
  }) : [];

  if (list.length === 0) {
    return (
      <div
        className="bg-[#1a1b2e]/60 rounded-[28.03px] p-10 backdrop-blur-md border border-white/5 flex flex-col items-center justify-center text-center w-full mb-6"
        style={{
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        <p className="text-white/20 font-black uppercase tracking-widest text-[11px] mb-2">{title}</p>
        <p className="text-white/10 font-bold uppercase tracking-widest text-[10px]">No stats recorded yet</p>
      </div>
    );
  }

  return (
    <div
      className="bg-[#1a1b2e]/60 rounded-[28.03px] p-6 backdrop-blur-md shadow-2xl flex flex-col w-full mb-6"
      style={{
        border: '1.31px solid rgba(255,255,255,0.08)',
        fontFamily: "'Poppins', sans-serif"
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-[15.3px] font-bold tracking-tight">
          {title}
        </h2>
        <button
          onClick={onSeeAll}
          className="text-[#D2B5FF] text-[13px] font-medium hover:text-white transition-colors"
        >
          See All
        </button>
      </div>

      <div className="flex items-center text-[#94a3b8] mb-4 text-[11px] font-bold uppercase tracking-widest px-1">
        <span className="flex-1">Player Name</span>
        <span className="w-10 text-right">{statLabel}</span>
      </div>

      <div className="flex flex-col gap-1.5 overflow-hidden">
        {list.map((player, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center py-2.5 px-1 border-b border-white/5 last:border-0 hover:bg-white/[0.04] rounded-lg transition-all group"
          >
            <div className="flex-1 flex items-center gap-3.5 min-w-0">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#10111d] border border-white/5 flex items-center justify-center shrink-0 shadow-inner">
                {player.photo ? (
                  <img src={player.photo} className="w-full h-full object-cover" alt="" />
                ) : (
                  <span className="text-white/40 text-[10px] uppercase font-black">{player.name[0]}</span>
                )}
              </div>
              <span className="text-white text-[13px] font-bold truncate tracking-wide uppercase">
                {player.name}
              </span>
            </div>
            <span className="text-[14px] font-black text-white w-10 text-right tracking-tight italic">
              {player.value}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
