'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, RefreshCw, Home, Trophy, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useFantasyStore } from '@/store/fantasyStore'

import { PitchLayout } from './PitchLayout'
import { SubstituteBench } from './SubstituteBench'
import { PlayerDetailDrawer } from './PlayerDetailDrawer'

export function SubstitutionScreen() {
  const router = useRouter()
  const [savedAnim, setSavedAnim] = useState(false)

  // Zustand state
  const players = useFantasyStore((s) => s.players)
  const substitutingOutId = useFantasyStore((s) => s.substitutingOutId)
  const setSubstitutingOutId = useFantasyStore((s) => s.setSubstitutingOutId)
  const performSubstitution = useFantasyStore((s) => s.performSubstitution)
  const budget = useFantasyStore((s) => s.budget)
  
  // Player state setup
  const pitchPlayers = players.filter((p) => p.isOnPitch)
  const benchPlayers = players.filter((p) => !p.isOnPitch)

  const handleSelectPitchPlayer = useCallback(
    (id: string) => {
      // Allow changing the substituted player
      setSubstitutingOutId(id)
    },
    [setSubstitutingOutId]
  )

  const handleSelectBenchPlayer = useCallback(
    (id: string) => {
      if (substitutingOutId) {
        const pOut = players.find(p => p.id === substitutingOutId)
        const pIn = players.find(p => p.id === id)
        
        if (pOut && pIn && (pOut.position === 'GK') === (pIn.position === 'GK')) {
          performSubstitution(substitutingOutId, id)
          router.push('/app/fantasy/team')
        } else {
          // Invalid swap clicked
          setSubstitutingOutId(null)
        }
      }
    },
    [substitutingOutId, players, performSubstitution, router, setSubstitutingOutId]
  )

  const handleSave = () => {
    setSavedAnim(true)
    setTimeout(() => {
      setSavedAnim(false)
      router.push('/app/fantasy/team')
    }, 1500)
  }

  const handleBack = () => {
     setSubstitutingOutId(null)
     router.back()
  }

  return (
    <div className="fixed inset-0 w-full max-w-sm mx-auto bg-[#222232] flex flex-col font-sans overflow-hidden z-0">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-80 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} 
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#222232]/10 via-[#222232]/40 to-[#222232]/90 pointer-events-none" />

      {/* Header */}
      <header className="px-4 pt-12 pb-2 flex items-center gap-4 relative z-20">
        <button 
          onClick={handleBack}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-white text-[24px] font-bold tracking-tight">Substitution</h1>
      </header>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto pb-32 relative z-10 touch-pan-y scrollbar-hide">
        
        {/* Pitch Area */}
        <div className="px-2 mt-4 relative">
          {/* Budget Overlay Pill */}
          <div className="absolute top-4 right-6 z-20">
            <div className="bg-[#1a1f24]/90 backdrop-blur-md rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10 shadow-lg">
              <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Budget</span>
              <span className="text-[#00ffff] text-[10px] font-bold font-mono">₦{budget.toFixed(1)}m</span>
            </div>
          </div>

          <PitchLayout 
            pitchPlayers={pitchPlayers}
            selectedId={substitutingOutId} // Not strictly necessary since highlightMode handles the red card
            substitutingOutId={substitutingOutId}
            budget={budget}
            onSelectPlayer={handleSelectPitchPlayer}
          />
        </div>

        {/* Substitute Section */}
        <div className="mt-[-40px] px-2 pb-10">
          <SubstituteBench
            benchPlayers={benchPlayers}
            selectedId={null} 
            substitutingOutId={substitutingOutId}
            onSelectPlayer={handleSelectBenchPlayer}
            players={players} // Passing all players to helper logic inside bench
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-center pb-20">
           <button
             onClick={handleSave}
             className="text-[#ff6b00] font-extrabold text-[24px] uppercase tracking-tighter border-b-2 border-[#ff6b00] hover:opacity-80 transition-opacity"
           >
             {savedAnim ? 'Saving...' : 'Save Team'}
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
          <span className="text-[10px] font-bold">Fantasy</span>
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
    </div>
  )
}
