'use client'

import React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { useFantasyStore } from '@/store/fantasyStore'
import { useToastStore } from '@/store/toastStore'
import { PitchLayout } from './PitchLayout'
import { SubstituteBench } from './SubstituteBench'
import { PlayerDetailDrawer } from './PlayerDetailDrawer'
import { BoostSelector } from './BoostSelector'
import { formatSquadValue } from '@/lib/format'

interface PickTeamOnboardingProps {
  onBack: () => void
  onComplete: () => void
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
    squadBudget,
  } = useFantasyStore()
  // The squad isn't saved yet during onboarding, so the server bank balance
  // (what selectRemainingBudget returns once the team is named) doesn't apply.
  const budget = squadBudget - players.reduce((sum, p) => sum + (p.price ?? 0), 0)
  const toast = useToastStore()
  const queryClient = useQueryClient()

  const handleSave = async () => {
    try {
      await saveTeamToApi()
      // The layout gate reads isComplete from this query — refresh it so the
      // just-saved squad replaces the named-but-empty team.
      await queryClient.invalidateQueries({ queryKey: ['fantasy-team-me'] })
      onComplete()
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to save squad. Please try again.'
      toast.addToast(msg, 'error')
    }
  }

  const pitchPlayers = players.filter(p => p.isOnPitch)
  const benchPlayers = players.filter(p => !p.isOnPitch)
  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || null

  return (
    <div className="fixed inset-0 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-[#222232] flex flex-col font-sans z-20">
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
          <span className="text-[#00ffff] text-[10px] font-bold font-mono">{formatSquadValue(budget)}</span>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto relative z-10 pb-6">
        {/* Boosts */}
        <div className="px-4 pb-2">
          <BoostSelector active={selectedBoost} onToggle={setBoost} compact />
        </div>

        {/* Pitch */}
        <div className="px-4">
          <PitchLayout
            pitchPlayers={pitchPlayers}
            selectedId={selectedPlayerId}
            budget={budget}
            onSelectPlayer={selectPlayer}
          />
        </div>

        {/* Bench */}
        <SubstituteBench
          benchPlayers={benchPlayers}
          selectedId={selectedPlayerId}
          onSelectPlayer={selectPlayer}
          compact
        />
      </div>

      {/* Save — pinned footer, not scroll-dependent, so it's always reachable
          regardless of content height (was previously the last item in the
          scrollable body, which could land underneath the bottom nav). */}
      <div className="flex-shrink-0 relative z-10 flex justify-center py-4 border-t border-white/5 bg-[#222232]/95 backdrop-blur-md">
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
  )
}
