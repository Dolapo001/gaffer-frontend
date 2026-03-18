'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface TeamNamingScreenProps {
  onComplete: (name: string) => void;
}

export const TeamNamingScreen: React.FC<TeamNamingScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('NETSHAKERS');

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#1b1c28] flex flex-col font-sans overflow-hidden z-20">
      <div className="flex-1 px-8 pt-24">
        <h1 className="text-white text-[28px] font-bold text-center mb-12 tracking-tight">
          Choose your team's name
        </h1>
        
        <div className="space-y-2 mb-12">
          <label className="text-white/60 text-[14px] font-medium ml-1">Team name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.toUpperCase())}
            className="w-full h-[64px] bg-[#222232] rounded-2xl border border-white/5 px-6 text-white text-[18px] font-bold focus:outline-none focus:border-[#ff4d00]/30 transition-colors uppercase tracking-wider"
          />
        </div>

        {/* Phone/Graphic Mockup */}
        <div className="relative w-full aspect-[4/5] bg-transparent flex justify-center pt-8">
           <div className="w-[85%] h-full rounded-t-[50px] border-[5px] border-white/10 bg-[#222232] relative overflow-hidden">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-3 bg-white/10 rounded-full" />
              {/* Inner content placeholder if needed */}
              <div className="mt-20 px-8">
                <div className="w-full h-8 bg-white/5 rounded-lg mb-4" />
                <div className="w-2/3 h-8 bg-white/5 rounded-lg" />
              </div>
           </div>
        </div>
      </div>

      <div className="px-6 pb-28">
        <button
          onClick={() => onComplete(name)}
          className="w-full h-[64px] rounded-2xl bg-gradient-to-r from-[#ff4d00] to-[#ff8a00] text-white font-bold text-[18px] shadow-[0_8px_30px_rgba(255,77,0,0.3)] active:scale-95 transition-all"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};
