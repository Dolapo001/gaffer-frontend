'use client'

import React from 'react';
import { ChevronRight, Home, Users, Trophy, FileText, Wifi, Battery, Signal } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FantasyDashboard: React.FC = () => {
  const router = useRouter();

  return (
    // Mobile container wrapper
    <div className="w-full max-w-sm mx-auto h-screen bg-[#181928] relative overflow-hidden flex flex-col font-sans">
      
      {/* Background Image Overlay Simulation */}
      <div 
        className="absolute inset-0 z-0 opacity-60 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/assets/bg/fantasy-main-bg.png")' }} 
      />
      {/* Softer gradient to allow more image visibility */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#181928]/10 via-[#181928]/40 to-[#181928]" />

      {/* Main Content */}
      <div className="relative z-10 flex-1 px-4 pt-10 flex flex-col gap-4 overflow-y-auto pb-safe-bottom">
        
        {/* Points Card */}
        <div className="bg-[#1b1c28]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden shrink-0 mt-2">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          
          <h2 className="text-white text-center text-[12px] font-bold mb-6 uppercase tracking-wide">Round 1 Points</h2>
          
          <div className="flex justify-between items-baseline px-1 relative z-10">
            {/* Average */}
            <div className="flex flex-col items-center">
              <span className="text-white text-[32px] font-bold leading-none mb-2">34</span>
              <span className="text-white text-[9px] font-extrabold tracking-widest uppercase">Average</span>
            </div>
            
            {/* Your Score */}
            <div className="flex flex-col items-center">
              <span className="text-[#e65100] text-[52px] font-bold leading-none mb-2 drop-shadow-lg">114</span>
              <span className="text-white text-[9px] font-extrabold tracking-widest uppercase font-sans">Your Score</span>
            </div>
            
            {/* Highest */}
            <div className="flex flex-col items-center">
              <span className="text-white text-[32px] font-bold leading-none mb-2">132</span>
              <span className="text-white text-[9px] font-extrabold tracking-widest uppercase">Highest</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu List */}
        <div className="flex flex-col gap-[15px] px-1 pb-4">
          {[
            { label: 'Points', path: '/app/fantasy/points' },
            { label: 'Pick Team', path: '/app/fantasy/team' },
            { label: 'Transfers', path: '/app/fantasy/transfers' }
          ].map((item) => (
            <button 
              key={item.label}
              className="flex items-center justify-between bg-[#1b1c28]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/5 transition-all group overflow-hidden relative shadow-lg shrink-0"
              onClick={() => router.push(item.path)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-white font-bold text-sm relative z-10 uppercase tracking-wide">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors relative z-10" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FantasyDashboard;
