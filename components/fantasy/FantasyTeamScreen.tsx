'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, RefreshCw, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { GAMEWEEK_INFO, type BoostType } from '@/lib/fantasyMockData'
import {
  useFantasyStore,
  selectPitchPlayers,
  selectBenchPlayers,
} from '@/store/fantasyStore'

import { BoostSelector } from './BoostSelector'
import { PitchLayout } from './PitchLayout'
import { SubstituteBench } from './SubstituteBench'
import { PlayerDetailDrawer } from './PlayerDetailDrawer'

export function FantasyTeamScreen() {
  const router = useRouter()
  const [savedAnim, setSavedAnim] = useState(false)

  // Zustand state
  const selectedPlayerId = useFantasyStore((s) => s.selectedPlayerId)
  const selectedBoost = useFantasyStore((s) => s.selectedBoost)
  const budget = useFantasyStore((s) => s.budget)
  const players = useFantasyStore((s) => s.players)
  const selectPlayer = useFantasyStore((s) => s.selectPlayer)
  const setBoost = useFantasyStore((s) => s.setBoost)
  const saveTeam = useFantasyStore((s) => s.saveTeam)

  const pitchPlayers = players.filter((p) => p.isOnPitch)
  const benchPlayers = players.filter((p) => !p.isOnPitch)
  const selectedPlayer =
    selectedPlayerId != null
      ? players.find((p) => p.id === selectedPlayerId) ?? null
      : null

  const handleSelectPlayer = useCallback(
    (id: string) => selectPlayer(id),
    [selectPlayer]
  )

  const handleSave = () => {
    saveTeam()
    setSavedAnim(true)
    setTimeout(() => setSavedAnim(false), 2200)
  }

  return (
    <div className="min-h-screen bg-[#181928] flex flex-col relative overflow-hidden">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-60 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url("/assets/bg/fantasy-main-bg.png")' }} 
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#181928]/10 via-[#181928]/40 to-[#181928] pointer-events-none" />
      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#181928]/80 backdrop-blur-xl border-b border-gaffer-border">
        {/* Nav row */}
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white"
            aria-label="Go back"
          >
            <ChevronLeft size={18} />
          </button>

          <h1 className="font-display font-black text-white text-base tracking-wide">
            Pick Team
          </h1>

          <button
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-muted"
            aria-label="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-40">
        
        {/* New Boost selector / Transfer Deadline Row */}
        <div className="w-full flex justify-center py-2">
          <BoostSelector
            active={selectedBoost}
            onToggle={(b: BoostType) => setBoost(b)}
            deadlineLabel={`Gameweek ${GAMEWEEK_INFO.number} Transfer Deadline:`}
            deadlineValue={GAMEWEEK_INFO.deadlineLabel}
          />
        </div>

        {/* Pitch Area */}
        <div className="px-4 mt-4">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#4e702c]">
            {/* Budget pill in top right of pitch */}
            <div className="absolute top-4 right-4 z-20 scale-90 sm:scale-100">
              <div className="bg-[#1a1f24] rounded-full px-4 py-1 flex items-center gap-2 border border-white/10 shadow-lg">
                <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Budget</span>
                <span className="text-[#00ffff] text-[10px] font-bold">₦{budget.toFixed(1)}m</span>
              </div>
            </div>

            <PitchLayout
              pitchPlayers={pitchPlayers}
              selectedId={selectedPlayerId}
              budget={budget}
              onSelectPlayer={handleSelectPlayer}
            />
          </div>
        </div>

        {/* Bench / Substitute Section */}
        <div className="mt-6">
          <SubstituteBench
            benchPlayers={benchPlayers}
            selectedId={selectedPlayerId}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>

        {/* ── Centered Save Team Button ───────────────────────────────────────────── */}
        <div className="mt-16 mb-24 flex justify-center">
          <button
            onClick={handleSave}
            className="text-[#ff6b00] font-bold text-2xl border-b-2 border-[#ff6b00] hover:opacity-80 transition-opacity pb-0.5"
          >
            {savedAnim ? 'TEAM SAVED!' : 'Save Team'}
          </button>
        </div>
      </div>

      {/* ── Player detail drawer ─────────────────────────────────────────── */}
      <PlayerDetailDrawer
        player={selectedPlayer}
        onClose={() => selectPlayer(null)}
      />
    </div>
  )
}
