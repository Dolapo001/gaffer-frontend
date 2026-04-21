'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, RefreshCw, Home, Trophy, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { GAMEWEEK_INFO, type FantasySquadPlayer } from '@/lib/fantasyMockData'
import {
  useFantasyStore,
} from '@/store/fantasyStore'
import { getMyFantasyTeam } from '@/lib/services/fantasy.service'
import { mapApiTeamToSquad } from '@/lib/converters'

import { PitchLayout } from './PitchLayout'
import { SubstituteBench } from './SubstituteBench'
import { PlayerDetailDrawer } from './PlayerDetailDrawer'
import { BoostSelector } from './BoostSelector'
import { FantasyHeroWave } from './FantasyHeroWave'

export function FantasyTeamScreen() {
  const router = useRouter()
  const [savedAnim, setSavedAnim] = useState(false)
  const [gameweek, setGameweek] = useState(5)
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [teamError, setTeamError] = useState<string | null>(null)

  // Zustand state
  const competitionId = useFantasyStore((s) => s.competitionId)
  const selectedPlayerId = useFantasyStore((s) => s.selectedPlayerId)
  const selectedBoost = useFantasyStore((s) => s.selectedBoost)
  const budget = useFantasyStore((s) => s.budget)
  const players = useFantasyStore((s) => s.players)
  const selectPlayer = useFantasyStore((s) => s.selectPlayer)
  const setBoost = useFantasyStore((s) => s.setBoost)
  const saveTeam = useFantasyStore((s) => s.saveTeam)
  const saveTeamToApi = useFantasyStore((s) => s.saveTeamToApi)
  const setPlayers = useFantasyStore((s) => s.setPlayers)

  // Load team from API on mount — always re-fetches to stay fresh
  useEffect(() => {
    if (!competitionId) {
      setLoadingTeam(false)
      return
    }
    setLoadingTeam(true)
    setTeamError(null)
    getMyFantasyTeam(competitionId)
      .then((team) => {
        console.log('[PickTeam] team from API:', team)
        if (team) {
          console.log('[PickTeam] startingXI length:', (team as any).startingXI?.length, 'bench length:', (team as any).bench?.length)
          const mapped = mapApiTeamToSquad(team as any)
          console.log('[PickTeam] mapped players:', mapped.length, 'onPitch:', mapped.filter(p => p.isOnPitch).length)
          if (mapped.length > 0) setPlayers(mapped)
        } else {
          console.log('[PickTeam] team is null — no team found for this competition')
        }
      })
      .catch((err) => {
        console.error('[PickTeam] Failed to load team:', err)
        setTeamError('Could not load your squad. Please try again.')
      })
      .finally(() => setLoadingTeam(false))
  }, [competitionId, setPlayers])

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

  const isSaving = useFantasyStore((s) => s.isSaving)

  const handleSave = async () => {
    try {
      await saveTeamToApi()
      setSavedAnim(true)
      setTimeout(() => setSavedAnim(false), 2200)
    } catch (err) {
      // Error is already handled/toasted in the store action
    }
  }

  return (
    <div className="fixed inset-0 w-full max-w-sm mx-auto bg-[#222232] flex flex-col font-sans overflow-hidden z-0">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-80 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} 
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#222232]/10 via-[#222232]/40 to-[#222232]/90 pointer-events-none" />

      {/*
        ── Header crown wave ───────────────────────────────────────────────────
        Organic arch at the bottom of the header bar. The dark cap frames the
        "Pick Team" title and the curved edge slides into the pitch section
        with premium depth. z-index 3 sits above bg (z-0) below content (z-10).
      */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: '110px', zIndex: 3 }}
      >
        <FantasyHeroWave
          position="top"
          className="w-full h-full"
          opacity={0.92}
        />
      </div>

      {/* Header */}
      <header className="px-4 pt-12 pb-2 flex items-center gap-4 relative z-20">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-white text-[24px] font-bold tracking-tight">Pick Team</h1>
      </header>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-32 relative z-10 touch-pan-y scrollbar-hide">
        
        {/* Boosts / Transfer Deadline Section */}
        <div className="w-full px-4 mt-4 relative z-10">
          <BoostSelector 
            active={selectedBoost}
            onToggle={setBoost}
            deadlineLabel="Gameweek 1 Transfer Deadline:"
            deadlineValue="Sat 14 Feb, 14:30"
          />
        </div>

        {/* Pitch Area */}
        <div className="px-2 mt-4 relative">
          {/* Budget Overlay Pill */}
          <div className="flex justify-end pr-4 mb-2 relative z-20">
            <div className="bg-[#1a1f24]/90 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10 shadow-lg">
              <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Budget</span>
              <span className="text-[#00ffff] text-[10px] font-bold font-mono">Ǥ{budget.toFixed(1)}m</span>
            </div>
          </div>

          {loadingTeam ? (
            <div className="w-full aspect-[4/5] rounded-xl bg-[#2b3520]/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#ff6b00] border-t-transparent animate-spin" />
                <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Loading Squad</span>
              </div>
            </div>
          ) : teamError ? (
            <div className="w-full aspect-[4/5] rounded-xl bg-[#2b2b40] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4 px-6 text-center">
                <span className="text-white/60 text-sm">{teamError}</span>
                <button
                  onClick={() => {
                    setTeamError(null)
                    setLoadingTeam(true)
                    getMyFantasyTeam(competitionId!).then((team) => {
                      if (team) {
                        const mapped = mapApiTeamToSquad(team as any)
                        if (mapped.length > 0) setPlayers(mapped)
                      }
                    }).catch((err) => {
                      console.error('[PickTeam] Retry failed:', err)
                      setTeamError('Could not load your squad. Please try again.')
                    }).finally(() => setLoadingTeam(false))
                  }}
                  className="text-[#ff6b00] font-bold text-sm uppercase tracking-wide border border-[#ff6b00]/40 rounded-lg px-4 py-2"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : pitchPlayers.length === 0 ? (
            <div className="w-full aspect-[4/5] rounded-xl bg-[#2b3520]/60 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <span className="text-white/60 text-sm">No squad loaded.</span>
                <span className="text-white/40 text-xs">
                  {players.length > 0
                    ? `${players.length} players in store but none on pitch`
                    : 'Store is empty — squad may not be saved to server'}
                </span>
                <button
                  onClick={() => router.push('/app/fantasy')}
                  className="text-[#ff6b00] font-bold text-sm uppercase tracking-wide border border-[#ff6b00]/40 rounded-lg px-4 py-2 mt-2"
                >
                  Set Up Squad
                </button>
              </div>
            </div>
          ) : (
            <PitchLayout
              pitchPlayers={pitchPlayers}
              selectedId={selectedPlayerId}
              budget={budget}
              onSelectPlayer={handleSelectPlayer}
            />
          )}
        </div>

        {/* Substitute Section */}
        {!loadingTeam && !teamError && (
          <div className="mt-6 px-2 pb-10">
            <SubstituteBench
              benchPlayers={benchPlayers}
              selectedId={selectedPlayerId}
              onSelectPlayer={handleSelectPlayer}
            />
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-center pb-20">
           <button
             onClick={handleSave}
             className="text-[#ff6b00] font-extrabold text-[24px] uppercase tracking-tighter border-b-2 border-[#ff6b00] hover:opacity-80 transition-opacity"
           >
             {savedAnim ? 'Team Saved!' : 'Save Team'}
           </button>
        </div>
      </div>

      {/* Floating Bottom Nav */}
      <nav className="absolute bottom-0 left-0 right-0 h-24 bg-[#1b1c28]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-6 z-30 rounded-t-[2.5rem] shadow-2xl">
        <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors" onClick={() => router.push('/app/dashboard')}>
          <Home size={22} />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#ff6b00]">
          <RefreshCw size={22} className="animate-spin-slow" />
          <span className="text-[10px] font-bold">Pick Team</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors" onClick={() => router.push('/app/league')}>
          <Trophy size={22} />
          <span className="text-[10px] font-bold">League</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors" onClick={() => router.push('/app/news')}>
          <FileText size={22} />
          <span className="text-[10px] font-bold">News</span>
        </button>
      </nav>

      {/* Player Detail Drawer */}
      <PlayerDetailDrawer
        player={selectedPlayer}
        onClose={() => selectPlayer(null)}
      />
    </div>
  )
}
