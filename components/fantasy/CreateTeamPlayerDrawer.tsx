'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, X } from 'lucide-react';
import { type FantasySquadPlayer, getJerseyUrl } from '@/lib/fantasyMockData';
import { useToast } from '@/store/toastStore';

interface CreateTeamPlayerDrawerProps {
  player: FantasySquadPlayer | null;
  onClose: () => void;
  onRemove?: (id: string) => void;
}

export const CreateTeamPlayerDrawer: React.FC<CreateTeamPlayerDrawerProps> = ({ 
  player, 
  onClose,
  onRemove 
}) => {
  const { addToast } = useToast();
  return (
    <AnimatePresence>
      {player && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#2E2D39',
              borderTopLeftRadius: '33.66px',
              borderTopRightRadius: '33.66px',
            }}
            className="relative w-full border-t border-white/5 max-w-md mx-auto shadow-[0_-20px_60px_rgba(0,0,0,0.6)] flex flex-col p-8 pb-10"
          >
            {/* Handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/10 rounded-full" />
            
            {/* Player Info Header */}
            <div className="flex items-center gap-5 mt-4 mb-10">
              <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-white/5 border border-white/10 p-1 flex items-center justify-center shadow-2xl">
                <img 
                  src={getJerseyUrl(player.teamCode, player.position)} 
                  alt={player.name} 
                  className="w-[85%] h-auto object-contain drop-shadow-xl"
                />
              </div>
              <div>
                <h3 className="text-white text-[32px] font-bold tracking-tight leading-tight">
                  {player.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/50 text-[14px] font-bold">#{player.price}M</span>
                  <span className="text-white/20 text-[14px]">•</span>
                  <span className="text-white/50 text-[14px] font-bold uppercase tracking-wider">
                    {player.position === 'GK' ? 'Goalkeeper' : player.position === 'DEF' ? 'Defender' : player.position === 'MID' ? 'Midfielder' : 'Forward'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-white text-[18px] font-black uppercase tracking-tight">Form</span>
                <span className="text-white text-[18px] font-black uppercase tracking-tight">Points</span>
              </div>
              
              <div className="space-y-6">
                {[
                  { gw: 1, opponent: 'Engineering', result: 'W', pts: 14 },
                  { gw: 2, opponent: 'Engineering', result: 'D', pts: 14 },
                  { gw: 3, opponent: 'Engineering', result: 'W', pts: 14 }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <span className="text-white text-[16px] font-bold">GW-{item.gw} vs {item.opponent}</span>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${item.result === 'W' ? 'bg-[#16A34A]' : 'bg-[#71717a]'}`}>
                        {item.result}
                      </div>
                    </div>
                    <span className="text-white text-[18px] font-black tracking-tighter">{item.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Match Section */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <span className="text-white text-[18px] font-black uppercase tracking-tight">Next Match</span>
                <span className="text-gaffer-cyan text-[14px] font-black uppercase tracking-wider">Gameweek 4</span>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center justify-between bg-[#1e2130]/40 backdrop-blur-md rounded-2xl p-6 border border-white/5 group hover:bg-[#1e2130]/60 transition-all">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-lg">
                      <div className="w-8 h-8 bg-[#6CABDD] rounded-full" />
                    </div>
                    <span className="text-white text-[11px] font-black uppercase">Engineering</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-white/20 text-[10px] font-black tracking-widest uppercase">SAT 14:00</span>
                    <div className="bg-[#2a2d3e] rounded-xl px-5 py-3 font-mono font-bold text-white text-[16px] shadow-inner tracking-widest border border-white/5">14:00</div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform shadow-lg">
                      <div className="w-8 h-8 bg-[#cc0000] rounded-full" />
                    </div>
                    <span className="text-white text-[11px] font-black uppercase">Law</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-16">
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={() => {
                    if (onRemove && player) onRemove(player.id);
                    onClose();
                  }}
                  className="w-[88px] h-[88px] rounded-full bg-[#16A34A] flex items-center justify-center shadow-[0_15px_30px_rgba(22,163,74,0.3)] hover:bg-[#15803d] hover:scale-105 transition-all active:scale-95 border-2 border-white/10 group"
                >
                  <span className="text-white text-[38px] font-black group-hover:rotate-12 transition-transform">C</span>
                </button>
                <span className="text-white text-[14px] font-black uppercase tracking-widest">Remove</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={() => addToast('Transfers are live pre-match!', 'success')}
                  className="w-[88px] h-[88px] rounded-full bg-[#16A34A] flex items-center justify-center shadow-[0_15px_30px_rgba(22,163,74,0.3)] hover:bg-[#15803d] hover:scale-105 transition-all active:scale-95 border-2 border-white/10 group"
                >
                  <ArrowRightLeft className="text-white w-10 h-10 group-hover:rotate-180 transition-transform duration-500" strokeWidth={3} />
                </button>
                <span className="text-white text-[14px] font-black uppercase tracking-widest">Transfer</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
