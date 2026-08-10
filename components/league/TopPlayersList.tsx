'use client';

import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopPlayersListProps {
  title: string;
  players?: any[];
  statKey: 'goals' | 'assists' | 'cleanSheets' | 'yellowCards' | 'redCards';
  statLabel: string;
  onSeeAll?: () => void;
  onSelectPlayer?: (playerId: string, rawPlayer?: any) => void;
  maxDisplay?: number;
}

export function TopPlayersList({ title, players, statKey, statLabel, onSeeAll, onSelectPlayer, maxDisplay }: TopPlayersListProps) {
  const hasData = players && players.length > 0;

  const filtered = hasData ? players.filter((p) => (p?.[statKey] || (p as any)?.stats?.[statKey] || 0) > 0) : [];
  const displayItems = maxDisplay ? filtered.slice(0, maxDisplay) : filtered;

  const list = displayItems.map((p, i) => {
    const playerObj = p?.playerId || {};
    const teamObj = p?.teamId || {};
    const firstName = playerObj?.firstName || '';
    const lastName = playerObj?.lastName || '';
    const fullName = firstName ? `${firstName} ${lastName}`.trim() : (p?.playerName || 'Player');
    const teamName = teamObj?.shortName || teamObj?.name || '';

    return {
      id: playerObj?._id || p?._id,
      name: fullName,
      teamName,
      value: p?.[statKey] ?? (p as any)?.stats?.[statKey] ?? 0,
      photo: playerObj?.photoUrl || null,
      raw: p,
    };
  });

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
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-[#D2B5FF] text-[13px] font-medium hover:text-white transition-colors"
          >
            See All
          </button>
        )}
      </div>

      <div className="flex items-center text-[#94a3b8] mb-4 text-[11px] font-bold uppercase tracking-widest px-1">
        <span className="w-8 text-left">#</span>
        <span className="flex-1">Player</span>
        <span className="w-12 text-right">{statLabel}</span>
      </div>

      <div className="flex flex-col gap-1.5 overflow-hidden">
        {list.map((player, i) => {
          const rankColor =
            i === 0
              ? 'text-yellow-400 font-black'
              : i === 1
                ? 'text-slate-300 font-bold'
                : i === 2
                  ? 'text-amber-600 font-bold'
                  : 'text-white/40';

          return (
            <motion.div
              key={player.id || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => onSelectPlayer?.(player.id, player.raw)}
              className="flex items-center py-2.5 px-2 border-b border-white/5 last:border-0 hover:bg-white/[0.06] rounded-xl transition-all group cursor-pointer"
            >
              {/* Rank */}
              <span className={`w-8 text-xs font-chakra ${rankColor}`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
              </span>

              {/* Player Avatar & Details */}
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-[#10111d] border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                  {player.photo ? (
                    <img src={player.photo} className="w-full h-full object-cover object-top" alt="" />
                  ) : (
                    <span className="text-white/40 text-[10px] uppercase font-black">{player.name[0]}</span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-[13px] font-bold truncate tracking-wide uppercase group-hover:text-gaffer-orange transition-colors">
                    {player.name}
                  </span>
                  {player.teamName && (
                    <span className="text-white/40 text-[10px] font-chakra font-medium truncate">
                      {player.teamName}
                    </span>
                  )}
                </div>
              </div>

              {/* Stat Value */}
              <span className="text-[14px] font-black text-white w-12 text-right tracking-tight italic">
                {player.value}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
