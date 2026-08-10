'use client'

import React, { useEffect, useState } from 'react'
import { PitchMarkings } from '@/components/fantasy/PitchLayout'
import { PitchPlayerCard, type JerseyProps } from '@/components/fantasy/PitchPlayerCard'
import { normalizeJerseyConfig } from '@/components/jersey/jerseyUtils'
import { getTOTW, type TOTWPlayer } from '@/lib/services/stats.service'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────────────────────────

function toJersey(player: TOTWPlayer): JerseyProps {
  const jc = normalizeJerseyConfig(
    player.jersey ?? { primaryColor: '#4a5568', secondaryColor: '#718096', jerseyPattern: 'solid' },
  )
  return {
    primaryColor: jc.primaryColor,
    secondaryColor: jc.secondaryColor,
    jerseyPattern: jc.jerseyPattern,
  }
}

function displayName(player: TOTWPlayer): string {
  const parts = (player.fullName || player.name).trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}. ${parts.slice(1).join(' ')}`
  }
  return player.name
}

// ── Component ────────────────────────────────────────────────────────────────

export interface TeamOfTheWeekWidgetProps {
  leagueId: string
}

interface TOTWState {
  loading: boolean
  fetching: boolean
  error: string | null
  players: TOTWPlayer[]
  formation: string
}

export function TeamOfTheWeekWidget({ leagueId }: TeamOfTheWeekWidgetProps) {
  const [selectedGameweek, setSelectedGameweek] = useState<number>(1)
  const [maxGameweek, setMaxGameweek] = useState<number>(1)
  const [hasInitialized, setHasInitialized] = useState<boolean>(false)

  const [state, setState] = useState<TOTWState>({
    loading: true,
    fetching: false,
    error: null,
    players: [],
    formation: '',
  })

  // Fetch TOTW for leagueId and target gameweek
  const fetchTOTWData = (gw?: number) => {
    if (!leagueId) return
    setState((prev) => ({ ...prev, fetching: true }))

    getTOTW(leagueId, gw)
      .then((data) => {
        const activeGw = data.selectedGameweek ?? gw ?? 1
        const maxGw = Math.max(1, data.maxGameweek ?? activeGw)

        if (!hasInitialized) {
          setSelectedGameweek(activeGw)
          setMaxGameweek(maxGw)
          setHasInitialized(true)
        } else if (data.maxGameweek && data.maxGameweek > maxGameweek) {
          setMaxGameweek(data.maxGameweek)
        }

        setState({
          loading: false,
          fetching: false,
          error: null,
          players: data.results,
          formation: data.formation,
        })
      })
      .catch((err) => {
        setState((prev) => ({
          ...prev,
          loading: false,
          fetching: false,
          error: err?.message || 'Failed to load',
        }))
      })
  }

  useEffect(() => {
    fetchTOTWData(hasInitialized ? selectedGameweek : undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId, selectedGameweek])

  const handleGameweekChange = (newGw: number) => {
    if (newGw < 1 || newGw > maxGameweek || newGw === selectedGameweek || state.fetching) return
    setSelectedGameweek(newGw)
  }

  // ── Loading skeleton (Initial load) ─────────────────────────────────────────
  if (state.loading) {
    return (
      <div className="w-full px-4 mb-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-white font-display font-bold text-sm uppercase tracking-wide">
            Team of the Week
          </h2>
        </div>
        <div className="relative rounded-[24px] overflow-hidden animate-pulse" style={{ minHeight: 280, background: '#111a2e', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/20 font-chakra font-black uppercase tracking-widest text-[11px]">
              Loading TOTW…
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── Calculate Team Stats ───────────────────────────────────────────────────
  const avgTeamRating = state.players.length
    ? (state.players.reduce((sum, p) => sum + (p.rating ?? 6.5), 0) / state.players.length).toFixed(2)
    : null

  const topPlayerId = state.players.length
    ? [...state.players].sort((a, b) => (b.rating ?? 6.5) - (a.rating ?? 6.5))[0]?.id
    : null

  // ── Group players into positional rows ─────────────────────────────────────
  const gks  = state.players.filter((p) => p.position === 'GK')
  const defs = state.players.filter((p) => p.position === 'DEF')
  const mids = state.players.filter((p) => p.position === 'MID')
  const fwds = state.players.filter((p) => p.position === 'FWD')

  const rows = [
    { key: 'fwd', players: fwds },
    { key: 'mid', players: mids },
    { key: 'def', players: defs },
    { key: 'gk',  players: gks  },
  ].filter((r) => r.players.length > 0)

  return (
    <div className="w-full px-4 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <h2 className="text-white font-display font-bold text-sm uppercase tracking-wide flex items-center gap-2">
          Team of the Week
          {avgTeamRating && (
            <span className="text-[10px] font-chakra font-extrabold text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              ⭐ {avgTeamRating}
            </span>
          )}
        </h2>
        {state.formation && (
          <span className="text-white/40 text-[10px] font-chakra font-black uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
            {state.formation}
          </span>
        )}
      </div>

      {/* Gameweek Navigation Control Bar */}
      <div className="flex items-center justify-between bg-[#111a2e] border border-white/10 rounded-xl px-3 py-1.5 mb-3 shadow-md">
        <button
          onClick={() => handleGameweekChange(selectedGameweek - 1)}
          disabled={selectedGameweek <= 1 || state.fetching}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
          aria-label="Previous Gameweek"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-chakra font-black uppercase text-white/60 tracking-wider">
            Gameweek
          </span>
          <select
            value={selectedGameweek}
            onChange={(e) => handleGameweekChange(Number(e.target.value))}
            disabled={state.fetching}
            className="bg-[#1c2842] text-xs font-chakra font-bold text-[#FF5C00] outline-none cursor-pointer border border-[#FF5C00]/30 rounded-lg px-2 py-1 shadow-inner focus:border-[#FF5C00]"
          >
            {Array.from({ length: maxGameweek }, (_, i) => i + 1).map((gw) => (
              <option key={gw} value={gw} className="bg-[#111a2e] text-white">
                GW {gw}
              </option>
            ))}
          </select>
          {state.formation && (
            <span className="text-white/50 text-[12px] font-mono ml-1">
              Formation: {state.formation}
            </span>
          )}
        </div>

        <button
          onClick={() => handleGameweekChange(selectedGameweek + 1)}
          disabled={selectedGameweek >= maxGameweek || state.fetching}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
          aria-label="Next Gameweek"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Pitch Card Container */}
      <div className="relative w-full rounded-[24px] overflow-hidden shadow-2xl" style={{ minHeight: 480, background: '#0e1626' }}>
        <PitchMarkings />

        {/* Loading Overlay while changing Gameweeks */}
        {state.fetching && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
            <div className="flex items-center gap-2 bg-[#111a2e] border border-white/10 px-4 py-2 rounded-full shadow-2xl">
              <Loader2 size={16} className="text-[#FF5C00] animate-spin" />
              <span className="text-white text-xs font-chakra font-bold uppercase tracking-wider">
                Loading GW {selectedGameweek}…
              </span>
            </div>
          </div>
        )}

        {/* Empty / No data state */}
        {!state.players.length && !state.fetching ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10">
            <p className="text-white/40 font-chakra font-bold uppercase tracking-widest text-[11px]">
              {state.error ?? `No TOTW data for Gameweek ${selectedGameweek}`}
            </p>
          </div>
        ) : (
          /* Dynamic Positional Rows using Tailwind Flexbox */
          <div className="absolute inset-0 flex flex-col justify-between py-6 px-2">
            {/* Row 1 (FWD): Forwards */}
            <div className="flex justify-around items-center w-full px-8">
              {fwds.map((player) => (
                <PitchPlayerCard
                  key={player.id}
                  playerName={displayName(player)}
                  fixture={player.teamName}
                  jersey={toJersey(player)}
                  rating={player.rating}
                  status={
                    player.status === 'suspended' ? 'injured'
                    : player.status === 'warning' ? 'warning'
                    : 'fit'
                  }
                />
              ))}
            </div>

            {/* Row 2 (MID): Midfielders */}
            <div className="flex justify-around items-center w-full px-2">
              {mids.map((player) => (
                <PitchPlayerCard
                  key={player.id}
                  playerName={displayName(player)}
                  fixture={player.teamName}
                  jersey={toJersey(player)}
                  rating={player.rating}
                  status={
                    player.status === 'suspended' ? 'injured'
                    : player.status === 'warning' ? 'warning'
                    : 'fit'
                  }
                />
              ))}
            </div>

            {/* Row 3 (DEF): Defenders */}
            <div className="flex justify-around items-center w-full px-2">
              {defs.map((player) => (
                <PitchPlayerCard
                  key={player.id}
                  playerName={displayName(player)}
                  fixture={player.teamName}
                  jersey={toJersey(player)}
                  rating={player.rating}
                  status={
                    player.status === 'suspended' ? 'injured'
                    : player.status === 'warning' ? 'warning'
                    : 'fit'
                  }
                />
              ))}
            </div>

            {/* Row 4 (GK): Goalkeeper */}
            <div className="flex justify-center items-center w-full">
              {gks.map((player) => (
                <PitchPlayerCard
                  key={player.id}
                  playerName={displayName(player)}
                  fixture={player.teamName}
                  jersey={toJersey(player)}
                  rating={player.rating}
                  status={
                    player.status === 'suspended' ? 'injured'
                    : player.status === 'warning' ? 'warning'
                    : 'fit'
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamOfTheWeekWidget
