'use client'

import React, { useState } from 'react'
import { PitchView, type PitchPlayerMarker } from './PitchView'
import { calculatePlayerRating, getRatingBadgeStyle } from '@/lib/ratingsEngine'
import { getImageUrl } from '@/lib/api'
import { Star, Edit3, X } from 'lucide-react'

// ── Formation coordinate grids (x: 0-300, y: 0-430) ──────────────────────────

const FORMATION_GRID_AWAY: Record<string, Array<{ x: number; y: number }>> = {
  '4-3-3': [
    { x: 150, y: 40 },  // GK
    { x: 45,  y: 82 },  // LB
    { x: 115, y: 88 },  // CB
    { x: 185, y: 88 },  // CB
    { x: 255, y: 82 },  // RB
    { x: 75,  y: 130 }, // LCM
    { x: 150, y: 138 }, // CM
    { x: 225, y: 130 }, // RCM
    { x: 60,  y: 175 }, // LW
    { x: 150, y: 182 }, // ST
    { x: 240, y: 175 }, // RW
  ],
  '4-4-2': [
    { x: 150, y: 40 },  // GK
    { x: 45,  y: 82 },  // LB
    { x: 115, y: 88 },  // CB
    { x: 185, y: 88 },  // CB
    { x: 255, y: 82 },  // RB
    { x: 45,  y: 132 }, // LM
    { x: 115, y: 138 }, // CM
    { x: 185, y: 138 }, // CM
    { x: 255, y: 132 }, // RM
    { x: 110, y: 178 }, // ST
    { x: 190, y: 178 }, // ST
  ],
  '3-5-2': [
    { x: 150, y: 40 },  // GK
    { x: 80,  y: 85 },  // CB
    { x: 150, y: 90 },  // CB
    { x: 220, y: 85 },  // CB
    { x: 35,  y: 130 }, // LWB
    { x: 95,  y: 138 }, // CM
    { x: 150, y: 142 }, // DM
    { x: 205, y: 138 }, // CM
    { x: 265, y: 130 }, // RWB
    { x: 110, y: 178 }, // ST
    { x: 190, y: 178 }, // ST
  ],
}

const FORMATION_GRID_HOME: Record<string, Array<{ x: number; y: number }>> = {
  '4-3-3': [
    { x: 150, y: 388 }, // GK
    { x: 45,  y: 346 }, // LB
    { x: 115, y: 340 }, // CB
    { x: 185, y: 340 }, // CB
    { x: 255, y: 346 }, // RB
    { x: 75,  y: 298 }, // LCM
    { x: 150, y: 290 }, // CM
    { x: 225, y: 298 }, // RCM
    { x: 60,  y: 252 }, // LW
    { x: 150, y: 245 }, // ST
    { x: 240, y: 252 }, // RW
  ],
  '4-4-2': [
    { x: 150, y: 388 }, // GK
    { x: 45,  y: 346 }, // LB
    { x: 115, y: 340 }, // CB
    { x: 185, y: 340 }, // CB
    { x: 255, y: 346 }, // RB
    { x: 45,  y: 296 }, // LM
    { x: 115, y: 290 }, // CM
    { x: 185, y: 290 }, // CM
    { x: 255, y: 296 }, // RM
    { x: 110, y: 250 }, // ST
    { x: 190, y: 250 }, // ST
  ],
  '3-5-2': [
    { x: 150, y: 388 }, // GK
    { x: 80,  y: 343 }, // CB
    { x: 150, y: 338 }, // CB
    { x: 220, y: 343 }, // CB
    { x: 35,  y: 298 }, // LWB
    { x: 95,  y: 290 }, // CM
    { x: 150, y: 286 }, // DM
    { x: 205, y: 290 }, // CM
    { x: 265, y: 298 }, // RWB
    { x: 110, y: 250 }, // ST
    { x: 190, y: 250 }, // ST
  ],
}

export interface LineupPlayer {
  id: string
  name: string
  position?: string
  jerseyNumber?: number | string
  rating?: number
  hasYellowCard?: boolean
  hasRedCard?: boolean
  isCaptain?: boolean
  isSubstituted?: boolean
  photoUrl?: string
}

export interface TeamLineupData {
  teamName: string
  name?: string
  shortName?: string
  logoUrl?: string
  color: string
  formation: string
  starters: LineupPlayer[]
  bench?: LineupPlayer[]
}

export interface MatchLineupPitchProps {
  homeTeam: TeamLineupData
  awayTeam: TeamLineupData
  matchEvents?: any[]
  isAdmin?: boolean
  onUpdateRating?: (playerId: string, teamSide: 'home' | 'away', newRating: number) => void
}

export function MatchLineupPitch({
  homeTeam,
  awayTeam,
  matchEvents = [],
  isAdmin = false,
  onUpdateRating,
}: MatchLineupPitchProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<{
    player: LineupPlayer
    side: 'home' | 'away'
  } | null>(null)
  const [customInput, setCustomInput] = useState<string>('')

  // Compute calculated rating per player incorporating match events
  const getPlayerRating = (player: LineupPlayer): number => {
    if (player.rating != null && !isNaN(player.rating)) {
      return player.rating
    }
    const playerEvents = matchEvents.filter(
      (e) =>
        (e.playerId && typeof e.playerId === 'object'
          ? e.playerId._id === player.id
          : e.playerId === player.id),
    )
    return calculatePlayerRating(player.position || 'MID', playerEvents)
  }

  // Calculate team average rating
  const computeTeamAvg = (starters: LineupPlayer[]): string => {
    if (!starters.length) return '6.5'
    const total = starters.reduce((sum, p) => sum + getPlayerRating(p), 0)
    return (total / starters.length).toFixed(2)
  }

  const awayAvg = computeTeamAvg(awayTeam.starters)
  const homeAvg = computeTeamAvg(homeTeam.starters)

  // Helper to extract player match event counts
  const getPlayerStats = (player: LineupPlayer) => {
    const pEvents = matchEvents.filter(
      (e) =>
        (e.playerId && typeof e.playerId === 'object'
          ? e.playerId._id === player.id
          : e.playerId === player.id),
    )
    const goalsCount = pEvents.filter((e) => {
      const t = (e.type || e.rawType || '').toLowerCase()
      return t === 'goal' || t === 'penalty_scored'
    }).length
    const assistsCount = pEvents.filter((e) => {
      const t = (e.type || e.rawType || '').toLowerCase()
      return t === 'assist'
    }).length
    const isMotm = pEvents.some((e) => {
      const t = (e.type || e.rawType || '').toLowerCase()
      return t === 'motm' || t === 'motm_award'
    })
    return { goalsCount, assistsCount, isMotm }
  }

  // Map Away team starters to pitch positions
  const awayGrid = FORMATION_GRID_AWAY[awayTeam.formation] || FORMATION_GRID_AWAY['4-3-3']
  const awayMarkers: PitchPlayerMarker[] = awayTeam.starters.slice(0, 11).map((player, idx) => {
    const pos = awayGrid[idx] || { x: 150, y: 100 }
    const rating = getPlayerRating(player)
    const stats = getPlayerStats(player)
    return {
      id: `away-${player.id || idx}`,
      x: pos.x,
      y: pos.y,
      label: String(player.jerseyNumber || idx + 1),
      name: player.name,
      color: awayTeam.color || '#3b82f6',
      rating,
      hasYellowCard: player.hasYellowCard,
      hasRedCard: player.hasRedCard,
      isCaptain: player.isCaptain,
      isSubstituted: player.isSubstituted,
      goalsCount: stats.goalsCount,
      assistsCount: stats.assistsCount,
      isMotm: stats.isMotm,
      onClick: () => setSelectedPlayer({ player, side: 'away' }),
    }
  })

  // Map Home team starters to pitch positions
  const homeGrid = FORMATION_GRID_HOME[homeTeam.formation] || FORMATION_GRID_HOME['4-3-3']
  const homeMarkers: PitchPlayerMarker[] = homeTeam.starters.slice(0, 11).map((player, idx) => {
    const pos = homeGrid[idx] || { x: 150, y: 300 }
    const rating = getPlayerRating(player)
    const stats = getPlayerStats(player)
    return {
      id: `home-${player.id || idx}`,
      x: pos.x,
      y: pos.y,
      label: String(player.jerseyNumber || idx + 1),
      name: player.name,
      color: homeTeam.color || '#FF6B00',
      rating,
      hasYellowCard: player.hasYellowCard,
      hasRedCard: player.hasRedCard,
      isCaptain: player.isCaptain,
      isSubstituted: player.isSubstituted,
      goalsCount: stats.goalsCount,
      assistsCount: stats.assistsCount,
      isMotm: stats.isMotm,
      onClick: () => setSelectedPlayer({ player, side: 'home' }),
    }
  })

  const handleApplyRating = (newVal: number) => {
    if (!selectedPlayer) return
    const clamped = Math.min(10.0, Math.max(1.0, Number(newVal.toFixed(1))))
    onUpdateRating?.(selectedPlayer.player.id, selectedPlayer.side, clamped)
    setSelectedPlayer(null)
    setCustomInput('')
  }

  return (
    <div className="w-full flex flex-col gap-3 font-chakra">
      {/* ── Away Team Header (Top) ── */}
      <div className="flex items-center justify-between bg-[#1c2230] rounded-2xl p-3 border border-white/5 shadow-md">
        <div className="flex items-center gap-2.5">
          {awayTeam.logoUrl && (
            <img src={getImageUrl(awayTeam.logoUrl)} className="w-6 h-6 object-contain" alt="" />
          )}
          <span className="text-white font-bold text-sm uppercase tracking-wide">
            {awayTeam.shortName || awayTeam.name}
          </span>
          {/* Average Rating Pill */}
          <div className="flex items-center gap-1 bg-[#eab308] text-black text-[11px] font-black px-2 py-0.5 rounded-md shadow">
            <Star size={10} fill="currentColor" />
            <span>{awayAvg}</span>
          </div>
        </div>
        <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
          {awayTeam.formation}
        </span>
      </div>

      {/* ── Head-to-Head Pitch Diagram ── */}
      <PitchView players={[...awayMarkers, ...homeMarkers]} />

      {/* ── Home Team Header (Bottom) ── */}
      <div className="flex items-center justify-between bg-[#1c2230] rounded-2xl p-3 border border-white/5 shadow-md">
        <div className="flex items-center gap-2.5">
          {homeTeam.logoUrl && (
            <img src={getImageUrl(homeTeam.logoUrl)} className="w-6 h-6 object-contain" alt="" />
          )}
          <span className="text-white font-bold text-sm uppercase tracking-wide">
            {homeTeam.shortName || homeTeam.name}
          </span>
          {/* Average Rating Pill */}
          <div className="flex items-center gap-1 bg-[#eab308] text-black text-[11px] font-black px-2 py-0.5 rounded-md shadow">
            <Star size={10} fill="currentColor" />
            <span>{homeAvg}</span>
          </div>
        </div>
        <span className="text-white/40 text-xs font-bold uppercase tracking-widest">
          {homeTeam.formation}
        </span>
      </div>

      {/* ── Substitutes Benches ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
        {/* Away Bench */}
        {awayTeam.bench && awayTeam.bench.length > 0 && (
          <div className="bg-[#1c2230] rounded-2xl p-3.5 border border-white/5 space-y-2">
            <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest">
              {awayTeam.shortName || awayTeam.name} Substitutes
            </h4>
            <div className="space-y-1.5">
              {awayTeam.bench.map((sub) => {
                const r = getPlayerRating(sub)
                const style = getRatingBadgeStyle(r, sub.hasRedCard)
                return (
                  <div
                    key={sub.id}
                    onClick={() => isAdmin && setSelectedPlayer({ player: sub, side: 'away' })}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 ${
                      isAdmin ? 'cursor-pointer hover:bg-white/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs font-bold w-4">
                        #{sub.jerseyNumber || '-'}
                      </span>
                      <span className="text-white text-xs font-bold truncate max-w-[130px]">
                        {sub.name}
                      </span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bgClass} ${style.textClass}`}>
                      {r.toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Home Bench */}
        {homeTeam.bench && homeTeam.bench.length > 0 && (
          <div className="bg-[#1c2230] rounded-2xl p-3.5 border border-white/5 space-y-2">
            <h4 className="text-white/40 text-[10px] font-black uppercase tracking-widest">
              {homeTeam.shortName || homeTeam.name} Substitutes
            </h4>
            <div className="space-y-1.5">
              {homeTeam.bench.map((sub) => {
                const r = getPlayerRating(sub)
                const style = getRatingBadgeStyle(r, sub.hasRedCard)
                return (
                  <div
                    key={sub.id}
                    onClick={() => isAdmin && setSelectedPlayer({ player: sub, side: 'home' })}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-white/5 ${
                      isAdmin ? 'cursor-pointer hover:bg-white/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs font-bold w-4">
                        #{sub.jerseyNumber || '-'}
                      </span>
                      <span className="text-white text-xs font-bold truncate max-w-[130px]">
                        {sub.name}
                      </span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${style.bgClass} ${style.textClass}`}>
                      {r.toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Admin Rating Quick-Edit Popover Modal ── */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedPlayer(null)}
          />
          <div className="relative bg-[#1c2230] border border-white/10 rounded-2xl p-5 w-full max-w-[320px] shadow-2xl space-y-4 z-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 size={16} className="text-[#a78bfa]" />
                <span className="text-white font-bold text-sm uppercase">Adjust Rating</span>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-white/40 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-center space-y-1">
              <p className="text-white font-bold text-base">{selectedPlayer.player.name}</p>
              <p className="text-white/40 text-xs uppercase font-bold">
                Current Rating: {getPlayerRating(selectedPlayer.player).toFixed(1)}
              </p>
            </div>

            {/* Quick Offset Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() =>
                  handleApplyRating(getPlayerRating(selectedPlayer.player) - 0.5)
                }
                className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/30 transition-colors"
              >
                - 0.5
              </button>
              <button
                onClick={() =>
                  handleApplyRating(getPlayerRating(selectedPlayer.player) + 0.5)
                }
                className="flex-1 py-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-sm rounded-xl hover:bg-emerald-500/30 transition-colors"
              >
                + 0.5
              </button>
            </div>

            {/* Direct Numeric Input */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="10.0"
                placeholder="e.g. 7.8"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-sm text-center outline-none focus:border-[#a78bfa]"
              />
              <button
                onClick={() => {
                  const val = parseFloat(customInput)
                  if (!isNaN(val)) handleApplyRating(val)
                }}
                className="px-4 py-2 bg-[#a78bfa] text-black font-bold text-sm rounded-xl hover:bg-[#c084fc] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MatchLineupPitch
