'use client'

import { useState, useCallback, useEffect } from 'react'
import { ChevronLeft, RefreshCw, Home, Trophy, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useFantasyStore } from '@/store/fantasyStore'
import { getMyFantasyTeam } from '@/lib/services/fantasy.service'
import { mapApiTeamToSquad } from '@/lib/converters'

import { PitchLayout } from './PitchLayout'
import { SubstituteBench } from './SubstituteBench'
import { PlayerDetailDrawer } from './PlayerDetailDrawer'
import { FantasyHeroWave } from './FantasyHeroWave'

export function FantasyTeamScreen() {
  const router = useRouter()
  const [savedAnim, setSavedAnim] = useState(false)
  const [loadingTeam, setLoadingTeam] = useState(true)
  const [teamError, setTeamError] = useState<string | null>(null)

  const competitionId = useFantasyStore((s) => s.competitionId)
  const selectedPlayerId = useFantasyStore((s) => s.selectedPlayerId)
  const budget = useFantasyStore((s) => s.budget)
  const players = useFantasyStore((s) => s.players)
  const selectPlayer = useFantasyStore((s) => s.selectPlayer)
  const saveTeamToApi = useFantasyStore((s) => s.saveTeamToApi)
  const setPlayers = useFantasyStore((s) => s.setPlayers)
  const setHasCreatedTeam = useFantasyStore((s) => s.setHasCreatedTeam)
  const isSaving = useFantasyStore((s) => s.isSaving)

  useEffect(() => {
    if (!competitionId) { setLoadingTeam(false); return }
    setLoadingTeam(true)
    setTeamError(null)
    getMyFantasyTeam(competitionId)
      .then((team) => {
        if (team) {
          const mapped = mapApiTeamToSquad(team as any)
          if (mapped.length > 0) setPlayers(mapped)
        }
      })
      .catch(() => setTeamError('Could not load your squad. Please try again.'))
      .finally(() => setLoadingTeam(false))
  }, [competitionId, setPlayers])

  const pitchPlayers = players.filter((p) => p.isOnPitch)
  const benchPlayers = players.filter((p) => !p.isOnPitch)
  const selectedPlayer = selectedPlayerId != null
    ? players.find((p) => p.id === selectedPlayerId) ?? null
    : null

  const handleSelectPlayer = useCallback((id: string) => selectPlayer(id), [selectPlayer])

  const handleSave = async () => {
    try {
      await saveTeamToApi()
      setSavedAnim(true)
      setTimeout(() => setSavedAnim(false), 2200)
    } catch {}
  }

  const retry = () => {
    setTeamError(null)
    setLoadingTeam(true)
    getMyFantasyTeam(competitionId!)
      .then((team) => { if (team) { const m = mapApiTeamToSquad(team as any); if (m.length > 0) setPlayers(m) } })
      .catch(() => setTeamError('Could not load your squad. Please try again.'))
      .finally(() => setLoadingTeam(false))
  }

  return (
    <div className="fixed inset-0 w-full max-w-sm mx-auto bg-[#222232] flex flex-col font-sans overflow-hidden z-0">
      {/* Background */}
      <div className="absolute inset-0 z-0 opacity-80 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#222232]/10 via-[#222232]/40 to-[#222232]/90 pointer-events-none" />

      {/* Header wave */}
      <div className="absolute inset-x-0 top-0 z-[3]" style={{ height: '90px' }}>
        <FantasyHeroWave position="top" className="w-full h-full" opacity={0.92} />
      </div>

      {/* Header */}
      <header className="px-4 pt-10 pb-1 flex items-center justify-between relative z-20 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-white">
            <ChevronLeft size={22} />
          </button>
          <h1 className="text-white text-xl font-bold tracking-tight">Pick Team</h1>
        </div>
        <div className="bg-[#1a1f24]/90 backdrop-blur-md rounded-full px-3 py-1 flex items-center gap-2 border border-white/10">
          <span className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Budget</span>
          <span className="text-[#00ffff] text-[10px] font-bold font-mono">Ǥ{budget.toFixed(1)}m</span>
        </div>
      </header>

      {/* Pitch — px-8 narrows pitch so aspect-[4/5] height stays within screen */}
      <div className="flex-1 min-h-0 px-8 pt-1 relative z-10 overflow-hidden">
        {loadingTeam ? (
          <div className="w-full aspect-[4/5] rounded-xl bg-[#2b3520]/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-[#ff6b00] border-t-transparent animate-spin" />
              <span className="text-white/50 text-xs font-bold uppercase tracking-widest">Loading Squad</span>
            </div>
          </div>
        ) : teamError ? (
          <div className="w-full h-full rounded-xl bg-[#2b2b40] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <span className="text-white/60 text-sm">{teamError}</span>
              <button onClick={retry}
                className="text-[#ff6b00] font-bold text-sm uppercase tracking-wide border border-[#ff6b00]/40 rounded-lg px-4 py-2">
                Retry
              </button>
            </div>
          </div>
        ) : pitchPlayers.length === 0 ? (
          <div className="w-full h-full rounded-xl bg-[#2b3520]/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <span className="text-white/60 text-sm font-bold uppercase tracking-wide">No squad set up yet</span>
              <span className="text-white/40 text-xs">Pick your 15 players and save your team to get started.</span>
              <button
                onClick={() => { setPlayers([]); setHasCreatedTeam(false); router.push('/app/fantasy?repick=1') }}
                className="text-[#ff6b00] font-bold text-sm uppercase tracking-wide border border-[#ff6b00]/40 rounded-lg px-4 py-2 mt-2">
                Pick Squad
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

      {/* Bench */}
      {!loadingTeam && !teamError && (
        <div className="flex-shrink-0 relative z-10">
          <SubstituteBench
            benchPlayers={benchPlayers}
            selectedId={selectedPlayerId}
            onSelectPlayer={handleSelectPlayer}
            compact
          />
        </div>
      )}

      {/* Save Button */}
      <div className="flex-shrink-0 flex justify-center py-2 relative z-10">
        <button onClick={handleSave} disabled={isSaving}
          className="text-[#ff6b00] font-extrabold text-xl uppercase tracking-tighter border-b-2 border-[#ff6b00] hover:opacity-80 transition-opacity disabled:opacity-50">
          {isSaving ? 'Saving...' : savedAnim ? 'Team Saved!' : 'Save Team'}
        </button>
      </div>

      {/* Bottom Nav */}
      <nav className="flex-shrink-0 h-20 bg-[#1b1c28]/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-6 z-30 rounded-t-[2rem] shadow-2xl">
        <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors" onClick={() => router.push('/app/dashboard')}>
          <Home size={20} /><span className="text-[10px] font-bold">Home</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#ff6b00]">
          <RefreshCw size={20} className="animate-spin-slow" /><span className="text-[10px] font-bold">Pick Team</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors" onClick={() => router.push('/app/league')}>
          <Trophy size={20} /><span className="text-[10px] font-bold">League</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors" onClick={() => router.push('/app/news')}>
          <FileText size={20} /><span className="text-[10px] font-bold">News</span>
        </button>
      </nav>

      <PlayerDetailDrawer player={selectedPlayer} onClose={() => selectPlayer(null)} />
    </div>
  )
}
