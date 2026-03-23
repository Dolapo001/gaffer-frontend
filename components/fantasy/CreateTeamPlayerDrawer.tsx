import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FantasySquadPlayer } from '@/lib/fantasyMockData';
import { X, Shield, MinusCircle } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useQuery } from '@tanstack/react-query';
import { getPlayerHistory } from '@/lib/services/fantasy.service';

import { useFantasyStore } from '@/store/fantasyStore';

interface CreateTeamPlayerDrawerProps {
  player: FantasySquadPlayer | null;
  onClose: () => void;
  onRemove?: (player: FantasySquadPlayer) => void;
  onTransfer?: (player: FantasySquadPlayer) => void;
}

const CreateTeamPlayerDrawer: React.FC<CreateTeamPlayerDrawerProps> = ({
  player,
  onClose,
  onRemove,
  onTransfer,
}) => {
  const { hideNavbar, showNavbar } = useUIStore();
  const { competitionId } = useFantasyStore();

  // Fetch real player history from backend
  const { data: history = [] } = useQuery({
    queryKey: ['playerHistory', competitionId, player?.id],
    queryFn: () => getPlayerHistory(competitionId || '', player!.id),
    enabled: !!player && !!competitionId && competitionId !== 'default',
  });

  useEffect(() => {
    if (player) {
      hideNavbar();
    } else {
      showNavbar();
    }
  }, [player, hideNavbar, showNavbar]);

  return (
    <AnimatePresence>
      {player && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Drawer Content */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#272836',
              borderTopLeftRadius: '40px',
              borderTopRightRadius: '40px',
            }}
            className="relative w-full border-t border-white/5 max-w-md mx-auto shadow-[0_-20px_60px_rgba(0,0,0,0.5)] flex flex-col p-6 pb-8 overflow-hidden"
          >
            {/* Handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[60px] h-1.5 bg-white/20 rounded-full" />
            
            {/* Player Info Header */}
            <div className="flex items-center gap-5 mt-4 mb-5">
              <div className="relative flex-shrink-0">
                <div className="w-[85px] h-[85px] rounded-full overflow-hidden bg-[#2D2E3F] border border-white/10 flex items-center justify-center shadow-xl">
                  {player.avatarUrl ? (
                    <img 
                      src={player.avatarUrl} 
                      alt={player.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#ff6b00]/20 flex items-center justify-center text-gaffer-orange text-3xl font-black">
                      {player.name[0]}
                    </div>
                  )}
                </div>
                {/* Team Logo Badge */}
                {player.teamLogoUrl && (
                  <div className="absolute -bottom-1 -left-1 w-[32px] h-[32px] bg-white rounded-full border-2 border-[#272836] shadow-lg flex items-center justify-center p-1 overflow-hidden z-20">
                    <img src={player.teamLogoUrl} alt={player.teamName} className="w-full h-full object-contain" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-[24px] font-black tracking-tight leading-none mb-1 truncate">
                  {player.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-[12px] font-bold tracking-tight uppercase">Ǥ{player.price}M</span>
                  <span className="text-white/20 text-[12px]">•</span>
                  <span className="text-white/40 text-[12px] font-bold uppercase tracking-widest truncate">
                    {player.position === 'GK' ? 'Goalkeeper' : player.position === 'DEF' ? 'Defender' : player.position === 'MID' ? 'Midfielder' : 'Forward'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="mb-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/90 text-[15px] font-black uppercase tracking-tight">Form</span>
                <span className="text-white/90 text-[15px] font-black uppercase tracking-tight">Points</span>
              </div>
              
              <div className="space-y-3">
                {history.length > 0 ? (
                  history.slice(-3).reverse().map((item) => (
                    <div key={item._id} className="flex justify-between items-center group">
                      <div className="flex items-center gap-2.5">
                        <span className="text-white text-[14px] font-bold">GW-{item.gameweekId?.gameweekNumber || '?'} History</span>
                        <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-black text-white ${item.totalPoints > 4 ? 'bg-[#10B981]' : item.totalPoints >= 2 ? 'bg-[#6B7280]' : 'bg-[#EF4444]'}`}>
                          {item.totalPoints > 4 ? 'W' : item.totalPoints >= 2 ? 'D' : 'L'}
                        </div>
                      </div>
                      <span className="text-white text-[16px] font-black tracking-tighter">{item.totalPoints}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center opacity-40">
                    <span className="text-white/80 text-[14px] font-bold italic tracking-tight">No previous matches recorded yet</span>
                    <span className="text-white text-[16px] font-black">0</span>
                  </div>
                )}
              </div>
            </div>

            {/* Next Match Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/90 text-[15px] font-black uppercase tracking-tight">Next Match</span>
                <span className="text-gaffer-orange text-[12px] font-black uppercase tracking-wider">
                  {player.nextFixtures[0] ? `Gameweek ${player.nextFixtures[0].gameweek}` : 'TBC'}
                </span>
              </div>
              
              <div className="space-y-2">
                {(player.nextFixtures.length > 0 ? player.nextFixtures : [null]).slice(0, 1).map((fixture, idx) => (
                  fixture ? (
                    <div key={idx} className="flex items-center justify-between bg-[#1C1D29] rounded-2xl p-3 border border-white/5 relative overflow-hidden">
                      <div className="flex flex-col items-center gap-1.5 relative z-10 w-20">
                         <div className="w-10 h-10 bg-[#2D2E3F] rounded-full flex items-center justify-center border border-white/10 shadow-lg transition-transform">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-white/5 flex items-center justify-center text-[9px] font-black text-white">{fixture.homeCode}</div>
                         </div>
                        <span className="text-white/70 text-[10px] font-bold uppercase truncate w-full text-center">{fixture.homeTeam}</span>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1 relative z-10">
                        <span className="text-white/20 text-[9px] font-black tracking-widest uppercase truncate max-w-[80px]">
                          {new Date(fixture.kickoff).toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                        </span>
                        <div className="bg-[#2a2d3e] rounded-xl px-4 py-2 font-mono font-bold text-white text-[15px] shadow-inner tracking-widest border border-white/5">
                           {new Date(fixture.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-1.5 relative z-10 w-20">
                        <div className="w-10 h-10 bg-[#2D2E3F] rounded-full flex items-center justify-center border border-white/10 shadow-lg transition-transform">
                             <div className="w-6 h-6 rounded-full bg-red-500/20 border border-white/5 flex items-center justify-center text-[9px] font-black text-white">{fixture.awayCode}</div>
                        </div>
                        <span className="text-white/70 text-[10px] font-bold uppercase truncate w-full text-center">{fixture.awayTeam}</span>
                      </div>
                    </div>
                  ) : (
                    <div key={idx} className="flex items-center justify-between bg-[#1C1D29]/40 rounded-2xl p-3 border border-white/5 opacity-30">
                       <div className="w-10 h-10 bg-[#2D2E3F] rounded-full" />
                       <div className="text-white/20 text-[10px] font-black uppercase tracking-widest">Fixture TBC</div>
                       <div className="w-10 h-10 bg-[#2D2E3F] rounded-full" />
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-12 pt-2">
              <div 
                className="flex flex-col items-center gap-3 cursor-pointer group"
                onClick={() => onRemove?.(player)}
              >
                <div className="w-[60px] h-[60px] bg-[#3B2B32] rounded-full flex items-center justify-center border-2 border-[#EF4444]/20 group-hover:bg-[#EF4444]/20 transition-all shadow-lg active:scale-95">
                  <MinusCircle className="w-7 h-7 text-[#EF4444]" />
                </div>
                <span className="text-white/60 text-[13px] font-black uppercase tracking-[0.15em]">Remove</span>
              </div>

              <div 
                className="flex flex-col items-center gap-3 cursor-pointer group"
                onClick={() => onTransfer?.(player)}
              >
                <div className="w-[60px] h-[60px] bg-[#1E293B] rounded-full flex items-center justify-center border-2 border-white/10 group-hover:bg-white/10 transition-all shadow-lg active:scale-95">
                  <div className="text-white text-2xl font-black">⇄</div>
                </div>
                <span className="text-white/60 text-[13px] font-black uppercase tracking-[0.15em]">Transfer</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateTeamPlayerDrawer;
