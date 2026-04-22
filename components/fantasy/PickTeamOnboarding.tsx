'use client'

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useFantasyStore, selectRemainingBudget } from '@/store/fantasyStore';
import { useToastStore } from '@/store/toastStore';
import { PitchLayout } from './PitchLayout';
import { SubstituteBench } from './SubstituteBench';
import { PlayerDetailDrawer } from './PlayerDetailDrawer';
import { BoostSelector } from './BoostSelector';

interface PickTeamOnboardingProps {
  onBack: () => void;
  onComplete: () => void;
}

export const PickTeamOnboarding: React.FC<PickTeamOnboardingProps> = ({ onBack, onComplete }) => {
  const {
    selectedPlayerId,
    selectPlayer,
    selectedBoost,
    setBoost,
    players,
    saveTeamToApi,
    isSaving,
  } = useFantasyStore();
  const budget = useFantasyStore(selectRemainingBudget);
  const toast = useToastStore();

  const handleSave = async () => {
    try {
      await saveTeamToApi();
      onComplete();
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to save squad. Please try again.'
      toast.addToast(msg, 'error')
    }
  };

  const pitchPlayers = players.filter(p => p.isOnPitch);
  const benchPlayers = players.filter(p => !p.isOnPitch);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || null;

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#222232] flex flex-col font-sans overflow-hidden z-20">
      {/* Background */}
      <div
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }}
      />

      {/* Header */}
      <header className="px-4 pt-10 pb-2 flex items-center justify-between relative z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white"
          >
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-white text-xl font-bold tracking-tight">Pick Team</h1>
        </div>
        <div className="bg-[#1a1f24]/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
          <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Bank</span>
          <span className="text-[#00ffff] text-[10px] font-bold font-mono">Ǥ{budget.toFixed(1)}M</span>
        </div>
      </header>

      {/* Boosts */}
      <div className="flex-shrink-0 px-4 pt-1 relative z-10">
        <BoostSelector active={selectedBoost} onToggle={setBoost} compact />
      </div>

      {/* Pitch — shrink-0 so it takes natural aspect-ratio height */}
      <div className="flex-shrink-0 px-4 pt-1 relative z-10">
        <PitchLayout
          pitchPlayers={pitchPlayers}
          selectedId={selectedPlayerId}
          budget={budget}
          onSelectPlayer={selectPlayer}
        />
      </div>

      {/* Bench — immediately below pitch */}
      <div className="flex-shrink-0 relative z-10">
        <SubstituteBench
          benchPlayers={benchPlayers}
          selectedId={selectedPlayerId}
          onSelectPlayer={selectPlayer}
          compact
        />
      </div>

      {/* Save */}
      <div className="flex-shrink-0 flex justify-center py-2 relative z-10">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="text-[#ff6b00] font-black text-2xl uppercase tracking-wider underline decoration-4 underline-offset-8 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Team'}
        </button>
      </div>

      <PlayerDetailDrawer
        player={selectedPlayer}
        onClose={() => selectPlayer(null)}
      />
    </div>
  );
};
