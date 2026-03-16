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

import { CountdownTimer } from './CountdownTimer'
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
    <div className="min-h-screen bg-gaffer-bg flex flex-col">
      {/* ── Sticky header ───────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-gaffer-bg/95 backdrop-blur-xl border-b border-gaffer-border">
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

        {/* Deadline + countdown */}
        <div className="px-4 pb-4">
          <CountdownTimer
            deadline={GAMEWEEK_INFO.deadlineDate}
            label={`Gameweek ${GAMEWEEK_INFO.number} Transfer Deadline: ${GAMEWEEK_INFO.deadlineLabel}`}
          />
        </div>
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-32">
        {/* Boost selector */}
        <div className="pt-4 pb-3">
          <BoostSelector
            active={selectedBoost}
            onToggle={(b: BoostType) => setBoost(b)}
          />
        </div>

        {/* Pitch */}
        <div className="px-4">
          <PitchLayout
            pitchPlayers={pitchPlayers}
            selectedId={selectedPlayerId}
            budget={budget}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>

        {/* Bench */}
        <div className="mt-4">
          <SubstituteBench
            benchPlayers={benchPlayers}
            selectedId={selectedPlayerId}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>
      </div>

      {/* ── Sticky save button ───────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-gradient-to-t from-gaffer-bg via-gaffer-bg/90 to-transparent pt-6 pb-24 px-4">
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.97 }}
          animate={savedAnim ? { scale: [1, 1.03, 1] } : {}}
          className={`w-full py-4 rounded-2xl font-display font-bold text-base transition-all duration-300 ${
            savedAnim
              ? 'bg-green-500 text-white shadow-none'
              : 'bg-transparent border-2 border-gaffer-orange text-gaffer-orange'
          }`}
        >
          {savedAnim ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={18} />
              Team Saved!
            </span>
          ) : (
            'Save Team'
          )}
        </motion.button>
      </div>

      {/* ── Player detail drawer ─────────────────────────────────────────── */}
      <PlayerDetailDrawer
        player={selectedPlayer}
        onClose={() => selectPlayer(null)}
      />
    </div>
  )
}
