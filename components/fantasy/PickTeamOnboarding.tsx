'use client'

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useFantasyStore, selectPitchPlayers, selectBenchPlayers } from '@/store/fantasyStore';
import { BoostSelector } from './BoostSelector';
import { PitchLayout } from './PitchLayout';
import { SubstituteBench } from './SubstituteBench';
import { PlayerDetailDrawer } from './PlayerDetailDrawer';

interface PickTeamOnboardingProps {
  onBack: () => void;
  onComplete: () => void;
}

export const PickTeamOnboarding: React.FC<PickTeamOnboardingProps> = ({ onBack, onComplete }) => {
  const { 
    budget, 
    selectedPlayerId, 
    selectPlayer, 
    selectedBoost, 
    setBoost,
    players 
  } = useFantasyStore();

  const pitchPlayers = players.filter(p => p.isOnPitch);
  const benchPlayers = players.filter(p => !p.isOnPitch);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || null;

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#222232] flex flex-col font-sans overflow-hidden z-20 pb-20">
      {/* Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} 
      />
      
      {/* Header */}
      <header className="px-6 pt-12 pb-4 relative z-10 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-white text-[24px] font-bold tracking-tight">Pick Team</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto relative z-10 touch-pan-y scrollbar-hide pb-32">
        {/* Boosts / Deadline Section */}
        <div className="px-6 mt-4">
          <BoostSelector 
            active={selectedBoost}
            onToggle={setBoost}
            deadlineLabel="Gameweek 1 Transfer Deadline:"
            deadlineValue="Sat 14 Feb, 14:30"
          />
        </div>
        
        {/* Pitch Area */}
        <div className="px-2 mt-4 relative">
          <div className="flex justify-end pr-4 mb-2">
            <div className="bg-[#1a1f24]/90 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10 shadow-lg">
              <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Budget</span>
              <span className="text-[#00ffff] text-[10px] font-bold font-mono">₦{budget.toFixed(1)}m</span>
            </div>
          </div>
          
          <PitchLayout 
            pitchPlayers={pitchPlayers}
            selectedId={selectedPlayerId}
            budget={budget}
            onSelectPlayer={selectPlayer}
          />
        </div>

        {/* Substitutes */}
        <div className="mt-[-40px] px-2 pb-10">
          <SubstituteBench 
            benchPlayers={benchPlayers}
            selectedId={selectedPlayerId}
            onSelectPlayer={selectPlayer}
          />
        </div>

        {/* Save Team Button */}
        <div className="flex justify-center mt-4 mb-10">
          <button
            onClick={onComplete}
            className="text-[#ff6b00] font-black text-[24px] underline decoration-2 underline-offset-8 transition-opacity"
          >
            Save Team
          </button>
        </div>
      </div>

      <PlayerDetailDrawer 
        player={selectedPlayer}
        onClose={() => selectPlayer(null)}
      />
    </div>
  );
};
