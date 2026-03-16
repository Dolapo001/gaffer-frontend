'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, RefreshCw, Check, ArrowLeftRight, X, ChevronRight } from 'lucide-react'
import {
  FANTASY_TEAM,
  ALL_PLAYERS,
  FANTASY_STATS,
  LEAGUE_DETAIL,
  type FantasyPlayer,
  type Player,
} from '@/lib/leagueMockData'

function fetchFantasyData() {
  return new Promise<{ team: typeof FANTASY_TEAM; allPlayers: typeof ALL_PLAYERS }>((resolve) =>
    setTimeout(() => resolve({ team: FANTASY_TEAM, allPlayers: ALL_PLAYERS }), 600)
  )
}

// ─── Player detail panel (slide up on tap) ──────────────────────────────────

function PlayerDetailPanel({
  player,
  onClose,
}: {
  player: FantasyPlayer
  onClose: () => void
}) {
  const gwPoints = [
    { gw: 1, pts: Math.floor(player.points * 0.28), vs: 'vs Engineering' },
    { gw: 2, pts: Math.floor(player.points * 0.22), vs: 'vs Engineering' },
    { gw: 3, pts: Math.floor(player.points * 0.19), vs: 'vs Engineering' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full bg-gaffer-surface border border-gaffer-border rounded-t-3xl px-5 pt-5 pb-10 max-w-sm mx-auto"
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-gaffer-border mx-auto mb-4" />

        {/* Player header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-gradient-btn flex items-center justify-center text-white font-display font-black text-2xl shadow-orange-glow">
            {player.name[0]}
          </div>
          <div className="flex-1">
            <p className="text-white font-display font-black text-lg leading-tight">{player.name}</p>
            <p className="text-gaffer-muted text-xs font-body">{player.teamName}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-display font-bold px-2 py-0.5 rounded-full ${
                player.position === 'GK' ? 'bg-yellow-500/20 text-yellow-400' :
                player.position === 'DEF' ? 'bg-blue-500/20 text-blue-400' :
                player.position === 'MID' ? 'bg-green-500/20 text-green-400' :
                'bg-gaffer-orange/20 text-gaffer-orange'
              }`}>{player.position}</span>
              <span className="text-gaffer-orange font-display font-bold text-sm">£{player.price}m</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-muted">
            <X size={14} />
          </button>
        </div>

        {/* Total points */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gaffer-card border border-gaffer-border rounded-xl py-2.5 text-center">
            <p className="font-display font-black text-xl text-gaffer-orange">{player.points}</p>
            <p className="text-[9px] font-body text-gaffer-muted">Total Pts</p>
          </div>
          <div className="bg-gaffer-card border border-gaffer-border rounded-xl py-2.5 text-center">
            <p className="font-display font-black text-xl text-white">{player.goals}</p>
            <p className="text-[9px] font-body text-gaffer-muted">Goals</p>
          </div>
          <div className="bg-gaffer-card border border-gaffer-border rounded-xl py-2.5 text-center">
            <p className="font-display font-black text-xl text-white">{player.assists}</p>
            <p className="text-[9px] font-body text-gaffer-muted">Assists</p>
          </div>
        </div>

        {/* Form breakdown */}
        <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-3 mb-4">
          <p className="text-gaffer-muted text-[10px] font-body font-semibold mb-2 uppercase tracking-wide">Form</p>
          <div className="space-y-2">
            {gwPoints.map(({ gw, pts, vs }) => (
              <div key={gw} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gaffer-subtle text-[10px] font-display font-bold w-12">GW:{gw}</span>
                  <span className="text-gaffer-muted text-[10px] font-body">{vs}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-1.5 rounded-full bg-gaffer-orange" style={{ width: `${(pts / player.points) * 60 + 8}px` }} />
                  <span className="text-gaffer-orange font-display font-bold text-xs w-6 text-right">{pts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next match */}
        <div className="flex items-center justify-between bg-gaffer-card border border-gaffer-border rounded-2xl px-4 py-3">
          <div>
            <p className="text-[9px] text-gaffer-muted font-body uppercase tracking-wide">Next Match</p>
            <p className="text-white text-sm font-body font-semibold">{player.teamName} vs Engineering</p>
          </div>
          <div className="text-right">
            <p className="text-gaffer-orange text-xs font-body font-semibold">14:00</p>
            <p className="text-gaffer-subtle text-[9px] font-body">Sat 21 Feb</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Pitch Player Card ───────────────────────────────────────────────────────

function PitchPlayerCard({
  player,
  selected,
  onClick,
}: {
  player: FantasyPlayer
  selected: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.93 }}
      className="flex flex-col items-center gap-0.5"
    >
      <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-sm font-display font-bold text-white transition-all ${
        selected
          ? 'border-gaffer-orange bg-gaffer-orange shadow-orange-glow'
          : 'border-white/40 bg-black/50 backdrop-blur-sm'
      }`}>
        {player.name[0]}
      </div>
      <div className={`rounded-md px-1.5 py-0.5 text-center transition-all ${selected ? 'bg-gaffer-orange' : 'bg-black/70 backdrop-blur-sm'}`}>
        <p className="text-white text-[9px] font-body font-semibold leading-none truncate max-w-[48px]">{player.name}</p>
        <p className="text-white/80 text-[8px] font-body leading-none">{player.points}pts</p>
      </div>
    </motion.button>
  )
}

// ─── Football Pitch ──────────────────────────────────────────────────────────

function FootballPitch({
  team,
  selectedId,
  onSelectPlayer,
}: {
  team: FantasyPlayer[]
  selectedId: string | null
  onSelectPlayer: (id: string) => void
}) {
  const rows = [
    team.filter((p) => p.pitchRow === 0),
    team.filter((p) => p.pitchRow === 1),
    team.filter((p) => p.pitchRow === 2),
    team.filter((p) => p.pitchRow === 3),
  ]

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: '125%' }}>
      {/* Pitch background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-700 via-green-800 to-green-900">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute inset-x-0" style={{ top: `${i * 10}%`, height: '5%', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'transparent' }} />
        ))}
      </div>

      {/* SVG pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 375" preserveAspectRatio="none">
        <rect x="10" y="10" width="280" height="355" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <line x1="10" y1="187" x2="290" y2="187" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <circle cx="150" cy="187" r="34" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <circle cx="150" cy="187" r="2.5" fill="white" opacity="0.4" />
        <rect x="75" y="10" width="150" height="58" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <rect x="75" y="307" width="150" height="58" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <rect x="105" y="10" width="90" height="24" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <rect x="105" y="341" width="90" height="24" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <circle cx="150" cy="68" r="2.5" fill="white" opacity="0.4" />
        <circle cx="150" cy="307" r="2.5" fill="white" opacity="0.4" />
      </svg>

      {/* Players grid */}
      <div className="absolute inset-0 flex flex-col justify-around py-5 px-3">
        {rows.map((rowPlayers, ri) => (
          <div key={ri} className="flex items-center justify-around">
            {rowPlayers.map((player) => (
              <PitchPlayerCard
                key={player.id}
                player={player}
                selected={selectedId === player.id}
                onClick={() => onSelectPlayer(player.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Transfers Tab ───────────────────────────────────────────────────────────

function TransfersTab({ allPlayers }: { allPlayers: Player[] }) {
  const [posFilter, setPosFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL')
  const [selectedIn, setSelectedIn] = useState<string | null>(null)

  const filtered = posFilter === 'ALL' ? allPlayers : allPlayers.filter((p) => p.position === posFilter)

  const posColors: Record<string, string> = {
    GK: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    DEF: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    MID: 'text-green-400 bg-green-500/10 border-green-500/20',
    FWD: 'text-gaffer-orange bg-gaffer-orange/10 border-gaffer-orange/20',
  }

  return (
    <div className="space-y-4">
      {/* Transfer count badge */}
      <div className="flex items-center justify-between bg-gaffer-card border border-gaffer-orange/20 rounded-xl px-4 py-3">
        <div>
          <p className="text-white text-sm font-display font-bold">Free Transfers</p>
          <p className="text-gaffer-muted text-[10px] font-body">Available this gameweek</p>
        </div>
        <span className="text-2xl font-display font-black text-gaffer-orange">{FANTASY_STATS.transfersLeft}</span>
      </div>

      {/* Position filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
          <button
            key={pos}
            onClick={() => setPosFilter(pos)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-display font-bold transition-all ${
              posFilter === pos
                ? 'bg-orange-gradient-btn text-white shadow-orange-glow'
                : 'bg-gaffer-card border border-gaffer-border text-gaffer-muted'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Players */}
      <div className="space-y-2">
        {filtered.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`flex items-center gap-3 bg-gaffer-card border rounded-2xl px-4 py-3 transition-all ${
              selectedIn === player.id ? 'border-gaffer-orange bg-gaffer-orange/5' : 'border-gaffer-border'
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
              {player.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-body font-semibold truncate">{player.name}</p>
                <span className={`text-[9px] font-display font-bold px-1.5 py-0.5 rounded border ${posColors[player.position]}`}>
                  {player.position}
                </span>
              </div>
              <p className="text-gaffer-muted text-[10px] font-body truncate">{player.teamName}</p>
            </div>
            <div className="text-right flex-shrink-0 mr-2">
              <p className="text-gaffer-orange font-display font-bold text-sm">{player.points}</p>
              <p className="text-gaffer-muted text-[10px] font-body">£{player.price}m</p>
            </div>
            <button
              onClick={() => setSelectedIn(selectedIn === player.id ? null : player.id)}
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                selectedIn === player.id
                  ? 'bg-gaffer-orange text-white'
                  : 'bg-gaffer-surface border border-gaffer-border text-gaffer-muted hover:text-white'
              }`}
            >
              {selectedIn === player.id ? <Check size={14} /> : <ArrowLeftRight size={13} />}
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 inset-x-4 z-40"
          >
            <button
              onClick={() => setSelectedIn(null)}
              className="w-full py-4 rounded-2xl bg-orange-gradient-btn text-white font-display font-bold text-base shadow-orange-glow"
            >
              Confirm Transfer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function FantasyTeamPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'points' | 'pickTeam' | 'transfers'>('pickTeam')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['fantasy-team'],
    queryFn: fetchFantasyData,
  })

  const team = data?.team ?? FANTASY_TEAM
  const pitchPlayers = team.filter((p) => p.isOnPitch)
  const benchPlayers = team.filter((p) => !p.isOnPitch)
  const selectedPlayer = selectedPlayerId ? team.find((p) => p.id === selectedPlayerId) ?? null : null

  const tabs = [
    { key: 'points', label: 'Points' },
    { key: 'pickTeam', label: 'Pick Team' },
    { key: 'transfers', label: 'Transfers' },
  ] as const

  return (
    <div className="min-h-screen bg-gaffer-bg pb-28">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-gaffer-bg/95 backdrop-blur-xl border-b border-gaffer-border">
        <div className="flex items-center justify-between px-4 pt-12 pb-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h1 className="font-display font-black text-white text-sm tracking-widest uppercase leading-tight">
              {LEAGUE_DETAIL.name}
            </h1>
            <p className="text-gaffer-muted text-[10px] font-body">
              GW{FANTASY_STATS.gameweek} · Deadline {FANTASY_STATS.deadline}
            </p>
          </div>
          <button className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-muted">
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-3 mt-1">
          {[
            { label: 'Average', value: FANTASY_STATS.averagePoints },
            { label: 'GW Points', value: FANTASY_STATS.gameweekPoints },
            { label: 'Total Pts', value: FANTASY_STATS.totalPoints },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gaffer-card border border-gaffer-border rounded-xl py-2.5 text-center">
              <p className="font-display font-black text-2xl text-white leading-none">{value}</p>
              <p className="text-[9px] font-body text-gaffer-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Round badge */}
        <div className="flex justify-center pb-2">
          <span className="text-[9px] font-display font-bold text-gaffer-orange bg-gaffer-orange/10 border border-gaffer-orange/30 px-3 py-1 rounded-full tracking-widest uppercase">
            Round {FANTASY_STATS.gameweek} Points
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gaffer-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-xs font-display font-bold transition-all border-b-2 ${
                activeTab === tab.key
                  ? 'text-gaffer-orange border-gaffer-orange'
                  : 'text-gaffer-muted border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="px-4 pt-4"
        >
          {/* Points Tab */}
          {activeTab === 'points' && (
            <div className="space-y-3">
              {pitchPlayers.map((player, i) => {
                const gwPts = Math.floor(player.points * 0.28)
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-2xl px-4 py-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
                      {player.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-body font-semibold truncate">{player.name}</p>
                      <p className="text-gaffer-muted text-[10px] font-body">{player.teamName} · {player.position}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-gaffer-orange font-display font-bold text-lg leading-none">{gwPts}</p>
                      <p className="text-gaffer-subtle text-[9px] font-body">pts</p>
                    </div>
                    <button
                      onClick={() => setSelectedPlayerId(player.id)}
                      className="w-7 h-7 rounded-full bg-gaffer-surface border border-gaffer-border flex items-center justify-center text-gaffer-muted hover:text-white transition-colors"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Pick Team Tab */}
          {activeTab === 'pickTeam' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-gaffer-card rounded-2xl animate-pulse" style={{ paddingBottom: '125%' }} />
              ) : (
                <>
                  <FootballPitch
                    team={pitchPlayers}
                    selectedId={selectedPlayerId}
                    onSelectPlayer={(id) => setSelectedPlayerId(selectedPlayerId === id ? null : id)}
                  />

                  {/* Bench */}
                  <div>
                    <p className="text-gaffer-muted text-[10px] font-display font-bold tracking-widest uppercase text-center mb-3">
                      Substitute
                    </p>
                    <div className="flex justify-around bg-gaffer-surface border border-gaffer-border rounded-2xl py-4 px-2">
                      {benchPlayers.map((player) => (
                        <PitchPlayerCard
                          key={player.id}
                          player={player}
                          selected={selectedPlayerId === player.id}
                          onClick={() => setSelectedPlayerId(selectedPlayerId === player.id ? null : player.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Save button */}
                  <motion.button
                    onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-4 rounded-2xl font-display font-bold text-base transition-all ${
                      saved ? 'bg-green-500 text-white' : 'bg-orange-gradient-btn text-white shadow-orange-glow'
                    }`}
                  >
                    {saved ? '✓ Team Saved!' : 'Save Team'}
                  </motion.button>
                </>
              )}
            </div>
          )}

          {/* Transfers Tab */}
          {activeTab === 'transfers' && (
            <TransfersTab allPlayers={data?.allPlayers ?? ALL_PLAYERS} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Player detail panel */}
      <AnimatePresence>
        {selectedPlayer && (
          <PlayerDetailPanel
            player={selectedPlayer}
            onClose={() => setSelectedPlayerId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
