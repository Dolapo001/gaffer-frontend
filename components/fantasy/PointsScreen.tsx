'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Info, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SQUAD, GAMEWEEK_INFO } from '@/lib/fantasyMockData'
import { PitchLayout } from './PitchLayout'
import { PlayerDetailDrawer } from './PlayerDetailDrawer'
import { type FantasySquadPlayer } from '@/lib/fantasyMockData'

export function PointsScreen() {
  const router = useRouter()
  const [selectedPlayer, setSelectedPlayer] = useState<FantasySquadPlayer | null>(null)
  
  const pitchPlayers = SQUAD.filter(p => p.isOnPitch)

  return (
    <div className="w-full max-w-sm mx-auto min-h-screen bg-[#181928] flex flex-col font-sans overflow-x-hidden relative">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url("/assets/bg/fantasy-main-bg.png")' }} 
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#181928]/20 via-[#181928]/60 to-[#181928] pointer-events-none" />

      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex items-center gap-4 relative z-20">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-white text-2xl font-bold tracking-tight">Points</h1>
      </header>

      {/* Gameweek Selector */}
      <div className="flex items-center justify-center gap-8 py-4 relative z-20">
        <button className="text-white/40"><ChevronLeft size={20} /></button>
        <span className="text-white font-bold text-lg uppercase tracking-widest">Gameweek 5</span>
        <button className="text-white/40"><ChevronRight size={20} /></button>
      </div>

      {/* Scoreboard */}
      <div className="px-6 py-4 flex flex-col items-center relative z-20">
        <div className="flex justify-between w-full items-baseline mb-2">
          {/* Players count */}
          <div className="flex flex-col items-center">
            <span className="text-white text-[32px] font-bold leading-none mb-1">15/15</span>
            <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Players</span>
          </div>

          {/* Large Point Score */}
          <div className="flex flex-col items-center">
            <span className="text-[#e65100] text-[72px] font-bold leading-none mb-2 drop-shadow-xl">0</span>
            <button className="flex items-center gap-1 text-white group">
              <span className="text-white text-[14px] font-bold uppercase tracking-widest">Points</span>
              <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center">
                <ChevronRightIcon size={12} className="text-white" />
              </div>
            </button>
          </div>

          {/* Highest score */}
          <div className="flex flex-col items-center">
            <span className="text-white text-[32px] font-bold leading-none mb-1">132</span>
            <div className="flex items-center gap-1">
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Highest</span>
              <Info size={10} className="text-white/40" />
            </div>
          </div>
        </div>
        
        {/* Deadline text */}
        <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-2">
          Deadline: 13th Feb, 12:00
        </p>
      </div>

      {/* Pitch Area */}
      <main className="flex-1 relative mt-4">
        <div className="px-2">
          <PitchLayout 
            pitchPlayers={pitchPlayers}
            selectedId={selectedPlayer?.id || null}
            budget={100}
            onSelectPlayer={(id) => {
              const p = SQUAD.find(player => player.id === id)
              if (p) setSelectedPlayer(p)
            }}
          />
        </div>

        {/* Substitute Section */}
        <div className="mt-[-60px] px-2 pb-24 relative z-10 w-full max-w-4xl mx-auto">
          <div className="bg-[#1b1c28]/80 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl flex flex-col items-center border border-white/10">
            <div className="flex flex-row justify-between w-full mb-6">
              {[
                { label: 'GKP', id: 'bench_gk' },
                { label: '1.DEF', id: 'bench_def' },
                { label: '2.MID', id: 'bench_mid' },
                { label: '3.FWD', id: 'bench_fwd' }
              ].map((pos) => {
                const player = SQUAD.find(p => p.id === pos.id)
                return (
                  <div key={pos.id} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-white/40 text-[10px] font-bold tracking-widest uppercase">{pos.label}</span>
                    <div 
                      className="cursor-pointer flex flex-col items-center gap-1"
                      onClick={() => player && setSelectedPlayer(player)}
                    >
                      <div className="w-[66px] h-full rounded-xl overflow-hidden shadow-lg border border-white/5 bg-[#40424d]/60 p-1">
                        <div className="bg-[#3b2b28]/80 rounded-lg flex items-center justify-center h-[50px] mb-1">
                          <img src={player?.avatarUrl || '/assets/kits/jersey_1.png'} alt={player?.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="bg-white text-[#37003c] font-bold text-[9px] py-1 px-0.5 text-center leading-none">
                          {player?.shortName}
                        </div>
                        <div className="bg-[#f4f0f5] text-[#37003c] text-[8px] py-1 px-0.5 text-center leading-none">
                          WHU (H)
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <h3 className="text-white text-xl font-bold tracking-tight uppercase">Substitute</h3>
          </div>
        </div>
      </main>

      {/* Player Detail Drawer */}
      <PlayerDetailDrawer 
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
      />

      {/* Bottom Nav Simulation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#161722] border-t border-white/5 flex items-center justify-around px-6 z-30 max-w-sm mx-auto rounded-t-[2.5rem]">
        <div className="flex flex-col items-center gap-1 text-white/40">
          <Home size={24} />
          <span className="text-[10px] font-bold">Home</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-[#e65100]">
          <Users size={24} />
          <span className="text-[10px] font-bold">Fantasy</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/40">
          <Trophy size={24} />
          <span className="text-[10px] font-bold">League</span>
        </div>
        <div className="flex flex-col items-center gap-1 text-white/40">
          <FileText size={24} />
          <span className="text-[10px] font-bold">News</span>
        </div>
      </nav>
    </div>
  )
}

function Home(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  )
}

function Users(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )
}

function Trophy(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 22V18"/><path d="M14 22V18"/><path d="M18 4H6v7a6 6 0 0 0 12 0V4Z"/></svg>
  )
}

function FileText(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
  )
}
