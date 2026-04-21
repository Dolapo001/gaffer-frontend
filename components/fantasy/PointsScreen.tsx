'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Info, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PitchLayout } from './PitchLayout'
import { SubstituteBench } from './SubstituteBench'
import { PlayerDetailDrawer } from './PlayerDetailDrawer'
import { useFantasyStore } from '@/store/fantasyStore'
import { FantasyHeroWave } from './FantasyHeroWave'
import { useQuery } from '@tanstack/react-query'
import { getMyFantasyTeam, getFantasyStats } from '@/lib/services/fantasy.service'
import { mapApiTeamToSquad } from '@/lib/converters'

export function PointsScreen() {
  const router = useRouter()
  const [gameweek, setGameweek] = useState(5)
  const players = useFantasyStore((s) => s.players)
  const selectPlayer = useFantasyStore((s) => s.selectPlayer)
  const selectedPlayerId = useFantasyStore((s) => s.selectedPlayerId)
  const setPlayers = useFantasyStore((s) => s.setPlayers)
  const budget = useFantasyStore((s) => s.budget)
  const competitionId = useFantasyStore((s) => s.competitionId)

  const { data: seasonStats } = useQuery({
    queryKey: ['fantasy-stats', competitionId],
    queryFn: () => getFantasyStats(competitionId!),
    enabled: !!competitionId,
  })

  const [loadingTeam, setLoadingTeam] = useState(true)

  useEffect(() => {
    if (!competitionId) {
      setLoadingTeam(false)
      return
    }
    setLoadingTeam(true)
    getMyFantasyTeam(competitionId)
      .then((team) => {
        if (team) {
          const mapped = mapApiTeamToSquad(team, [])
          if (mapped.length > 0) setPlayers(mapped)
        }
      })
      .catch((err) => console.error('[PointsScreen] Failed to load team:', err))
      .finally(() => setLoadingTeam(false))
  }, [competitionId, setPlayers])

  const highestSC = seasonStats?.highestSC ?? 0
  
  const pitchPlayers = players.filter(p => p.isOnPitch)
  const benchPlayers = players.filter(p => !p.isOnPitch)
  const selectedPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) : null

  return (
    <div className="fixed inset-0 w-full max-w-sm mx-auto bg-[#222232] flex flex-col font-sans overflow-hidden z-0">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-80 bg-cover bg-center transition-opacity"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} 
      />
      {/* Super-soft gradient */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#222232]/20 to-[#222232]/90 pointer-events-none" />

      {/* Header crown wave — same arch treatment as FantasyTeamScreen */}
      <div
        className="absolute inset-x-0 top-0"
        style={{ height: '110px', zIndex: 3 }}
      >
        <FantasyHeroWave position="top" className="w-full h-full" opacity={0.88} />
      </div>

      {/* Header */}
      <header className="px-4 pt-12 pb-2 flex items-center gap-4 relative z-20">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-white text-[24px] font-bold tracking-tight">Points</h1>
      </header>

      {/* Main Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto pb-40 relative z-10 touch-pan-y scrollbar-hide">
        
        {/* User Provided Scoreboard */}
        <div className="w-full px-4 mt-6 relative z-10">
          <div className="w-full max-w-md bg-[#2b2d3c] rounded-lg p-6 flex flex-col items-center shadow-lg mx-auto">
            
            <div className="flex justify-between items-center w-full mb-8 px-4">
              <button 
                onClick={() => setGameweek(prev => Math.max(1, prev - 1))}
                className="text-gray-400 hover:text-white active:scale-90 transition-transform relative z-30 p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-bold tracking-wide text-white uppercase select-none">GAMEWEEK {gameweek}</h2>
              <button 
                onClick={() => setGameweek(prev => Math.min(38, prev + 1))}
                className="text-gray-400 hover:text-white active:scale-90 transition-transform relative z-30 p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex justify-between items-center w-full px-2">
              
              <div className="flex flex-col items-center flex-1">
                <span className="text-2xl md:text-3xl font-medium text-white">15/15</span>
                <span className="text-[10px] md:text-xs text-gray-300 tracking-wider mt-1 uppercase">Players</span>
              </div>

              <div className="flex flex-col items-center flex-1">
                <span className="text-[64px] md:text-[80px] font-bold text-[#e95a0c] leading-none tracking-tighter">
                  {pitchPlayers.reduce((sum, p) => sum + p.points, 0)}
                </span>
                <div className="flex items-center gap-1 cursor-pointer group mt-2">
                  <span className="text-sm md:text-base font-bold tracking-wide text-white">POINTS</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col items-center flex-1">
                <span className="text-2xl md:text-3xl font-medium text-white">{highestSC}</span>
                <div className="flex items-center gap-1 cursor-pointer group mt-1">
                  <span className="text-[10px] md:text-xs text-gray-300 tracking-wider uppercase">Highest</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-gray-300 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
            </div>

            <div className="mt-8">
              <p className="text-[9px] text-gray-400 tracking-[0.2em] uppercase">
                Deadline . 10th Feb . 12:00
              </p>
            </div>

          </div>
        </div>

        {/* Pitch Area */}
        <div className="px-2 mt-4 relative">
          {/* Budget Overlay Pill - Positioned outside/behind the pitch line */}
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
          ) : (
            <PitchLayout
              pitchPlayers={pitchPlayers}
              selectedId={selectedPlayerId}
              budget={budget}
              onSelectPlayer={selectPlayer}
            />
          )}
        </div>

        {/* Substitute Section */}
        {!loadingTeam && (
          <div className="mt-[-40px] px-2 pb-10">
            <SubstituteBench
              benchPlayers={benchPlayers}
              selectedId={selectedPlayerId}
              onSelectPlayer={selectPlayer}
            />
          </div>
        )}
      </main>

      {/* Player Detail Drawer */}
      <PlayerDetailDrawer 
        player={selectedPlayer || null}
        onClose={() => selectPlayer(null)}
      />

    </div>
  )
}
