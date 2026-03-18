'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, X } from 'lucide-react';
import { type FantasySquadPlayer, getJerseyUrl } from '@/lib/fantasyMockData';

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
            className="relative w-full bg-[#2b2d3c] border-t border-white/5 rounded-t-[40px] max-w-md mx-auto shadow-[0_-20px_40px_rgba(34,34,50,0.5)] flex flex-col p-6 pb-12"
          >
            {/* Handle */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white/10 rounded-full" />
            
            {/* Player Info Header */}
            <div className="flex items-center gap-4 mb-8 pt-4">
              <div className="w-[84px] h-[84px] rounded-full overlow-hidden bg-white/5 border border-white/10 p-1 flex items-center justify-center shadow-lg transform rotate-2">
                <img 
                  src={getJerseyUrl(player.teamCode, player.position)} 
                  alt={player.name} 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-white text-[28px] font-bold tracking-tight leading-none mb-1">
                  {player.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-[14px] font-medium tracking-wide">#{player.price}M</span>
                  <span className="text-white/20 text-[14px]">•</span>
                  <span className="text-white/40 text-[14px] font-medium tracking-wide">
                    {player.position === 'GK' ? 'Goalkeeper' : player.position === 'DEF' ? 'Defender' : player.position === 'MID' ? 'Midfielder' : 'Forward'}
                  </span>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white text-[16px] font-bold tracking-tight">Form</span>
                <span className="text-white text-[16px] font-bold tracking-tight">Points</span>
              </div>
              
              <div className="space-y-4">
                {[
                  { gw: 1, opponent: 'Engineering', result: 'W', pts: 14 },
                  { gw: 2, opponent: 'Engineering', result: 'D', pts: 14 },
                  { gw: 3, opponent: 'Engineering', result: 'W', pts: 14 }
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-[15px] font-medium">GW-{item.gw} vs {item.opponent}</span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white ${item.result === 'W' ? 'bg-[#16A34A]' : 'bg-[#71717a]'}`}>
                        {item.result}
                      </div>
                    </div>
                    <span className="text-white text-[15px] font-bold">{item.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Match Section */}
            <div className="mb-8 mt-4 border-t border-white/5 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white text-[16px] font-bold tracking-tight">Next Match</span>
                <span className="text-[#ff6b00] text-[12px] font-bold uppercase tracking-wider">Gameweek 4</span>
              </div>
              
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex items-center gap-4 bg-[#1e2130] rounded-2xl p-4 shadow-xl border border-white/5 h-[80px]">
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                        <div className="w-7 h-7 bg-[#6CABDD] rounded-full" /> {/* Placeholder logo */}
                      </div>
                      <span className="text-white text-[10px] font-bold uppercase truncate w-full text-center tracking-tight">Engineering</span>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="text-white/20 text-[8px] font-bold uppercase tracking-widest leading-none">SAT 14:00</span>
                      <div className="bg-[#2a2d3e] rounded-lg px-4 py-2 font-mono font-bold text-white text-[14px]">14:00</div>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                         <div className="w-7 h-7 bg-[#004170] rounded-full" /> {/* Placeholder logo */}
                      </div>
                      <span className="text-white text-[10px] font-bold uppercase truncate w-full text-center tracking-tight">Law</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-12 mt-2">
              <div className="flex flex-col items-center gap-3">
                <button 
                  onClick={() => {
                      if (onRemove && player) onRemove(player.id);
                      onClose();
                  }}
                  className="w-[84px] h-[84px] rounded-full bg-[#0d4a25] flex items-center justify-center shadow-[0_12px_24px_rgba(0,0,0,0.5)] hover:bg-[#0a3a1d] transition-all active:scale-95 border-2 border-white/5"
                >
                  <span className="text-white text-[32px] font-black">C</span>
                </button>
                <span className="text-white text-[13px] font-bold uppercase tracking-widest text-center">Remove</span>
              </div>
              <div className="flex flex-col items-center gap-3">
                <button className="w-[84px] h-[84px] rounded-full bg-[#0d4a25] flex items-center justify-center shadow-[0_12px_24px_rgba(0,0,0,0.5)] hover:bg-[#0a3a1d] transition-all active:scale-95 border-2 border-white/5">
                   <ArrowRightLeft className="text-white w-8 h-8" strokeWidth={2.5} />
                </button>
                <span className="text-white text-[13px] font-bold uppercase tracking-widest text-center">Transfer</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
