'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PitchLayout } from './PitchLayout'
import { SubstituteBench } from './SubstituteBench'
import { PlayerDetailDrawer } from './PlayerDetailDrawer'
import { useFantasyStore, selectRemainingBudget } from '@/store/fantasyStore'
import { FantasyHeroWave } from './FantasyHeroWave'
import { useQuery } from '@tanstack/react-query'
import { getMyFantasyTeam, getFantasyStats } from '@/lib/services/fantasy.service'
import { mapApiTeamToSquad } from '@/lib/converters'

export function PointsScreen() {
  const router = useRouter()
  const [gameweek, setGameweek] = useState(1)
  const players = useFantasyStore((s) => s.players)
  const selectPlayer = useFantasyStore((s) => s.selectPlayer)
  const selectedPlayerId = useFantasyStore((s) => s.selectedPlayerId)
  const setPlayers = useFantasyStore((s) => s.setPlayers)
  const budget = useFantasyStore(selectRemainingBudget)
  const competitionId = useFantasyStore((s) => s.competitionId)

  const { data: seasonStats } = useQuery({
    queryKey: ['fantasy-stats', competitionId],
    queryFn: () => getFantasyStats(competitionId!),
    enabled: !!competitionId,
  })

  const [loadingTeam, setLoadingTeam] = useState(true)

  useEffect(() => {
    if (!competitionId) { setLoadingTeam(false); return }
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
  const selectedPlayer = selectedPlayerId ? players.find(p => p.id === selectedPlayerId) ?? null : null
  const totalPoints = pitchPlayers.reduce((sum, p) => sum + p.points, 0)

  return (
    <div className="fixed inset-0 w-full max-w-sm mx-auto bg-[#2e2d39] flex flex-col font-sans overflow-hidden z-0">
      {/* Background */}
      <div
        className="absolute inset-0 z-0 opacity-80 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#2e2d39]/10 via-[#2e2d39]/40 to-[#2e2d39]/90 pointer-events-none" />

      {/* Header wave */}
      <div className="absolute inset-x-0 top-0 z-[3]" style={{ height: '90px' }}>
        <FantasyHeroWave position="top" className="w-full h-full" opacity={0.92} />
      </div>

      {/* Header */}
      <header className="px-4 pt-10 pb-1 flex items-center gap-3 relative z-20 flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-white text-xl font-bold tracking-tight">Points</h1>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto relative z-10 pb-24">
        {/* Gameweek stats bar */}
        <div className="px-4 pt-1 pb-2">
          <div className="w-full bg-[#2e2d39] rounded-2xl border border-white/10 px-3 py-2 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setGameweek(prev => Math.max(1, prev - 1))}
                className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-white text-[12px] font-bold uppercase tracking-widest">Gameweek {gameweek}</span>
              <button
                onClick={() => setGameweek(prev => Math.min(38, prev + 1))}
                className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center">
                <span className="text-white text-[18px] font-bold leading-none">{players.length}/15</span>
                <span className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">Players</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[#ff6b00] text-[32px] font-black leading-none">{totalPoints}</span>
                <span className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">Points</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white text-[18px] font-bold leading-none">{highestSC}</span>
                <span className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">Highest</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pitch */}
        <div className="px-4">
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

        {/* Bench */}
        {!loadingTeam && (
          <SubstituteBench
            benchPlayers={benchPlayers}
            selectedId={selectedPlayerId}
            onSelectPlayer={selectPlayer}
            compact
          />
        )}
      </div>

      <PlayerDetailDrawer
        player={selectedPlayer}
        onClose={() => selectPlayer(null)}
      />
    </div>
  )
}
