'use client'

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useFantasyStore, selectPitchPlayers, selectBenchPlayers } from '@/store/fantasyStore';
import { useToastStore } from '@/store/toastStore';
import { getMyFantasyTeam } from '@/lib/services/fantasy.service';
import { mapApiTeamToSquad } from '@/lib/converters';
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
    competitionId,
    budget,
    selectedPlayerId,
    selectPlayer,
    selectedBoost,
    setBoost,
    players,
    setPlayers,
    saveTeamToApi,
    isSaving,
    saveError,
  } = useFantasyStore();
  const toast = useToastStore();
  const [loadingSquad, setLoadingSquad] = useState(false)

  // If the store has no players (e.g. navigated here via ?repick=1 with a cleared store),
  // fetch the existing squad from the API so the pitch is pre-filled.
  useEffect(() => {
    if (players.length > 0 || !competitionId) return
    setLoadingSquad(true)
    getMyFantasyTeam(competitionId)
      .then((team) => {
        if (team) {
          const mapped = mapApiTeamToSquad(team as any)
          if (mapped.length > 0) setPlayers(mapped)
        }
      })
      .catch(() => {}) // silently ignore — user can pick from scratch
      .finally(() => setLoadingSquad(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    try {
      await saveTeamToApi();
      onComplete();
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to save squad. Please try again.'
      console.error('Squad save failed:', err)
      toast.addToast(msg, 'error')
    }
  };

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
              <span className="text-[#00ffff] text-[10px] font-bold font-mono">Ǥ{budget.toFixed(1)}M</span>
            </div>
          </div>

          {loadingSquad ? (
            <div className="w-full aspect-[4/5] rounded-xl bg-[#2b3520]/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#ff6b00] border-t-transparent animate-spin" />
                <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Loading Squad</span>
              </div>
            </div>
          ) : (
            <PitchLayout
              pitchPlayers={pitchPlayers}
              selectedId={selectedPlayerId}
              budget={budget}
              onSelectPlayer={selectPlayer}
            />
          )}
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
            onClick={handleSave}
            disabled={isSaving}
            className="text-[#ff6b00] font-black text-[28px] uppercase tracking-wider underline decoration-4 underline-offset-[12px] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Team'}
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
