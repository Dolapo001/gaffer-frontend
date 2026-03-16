'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, RefreshCw, Check, ArrowLeftRight } from 'lucide-react'
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

// ─── Pitch Visualization ────────────────────────────────────────────────────

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
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center gap-0.5"
    >
      <div
        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-display font-bold text-white transition-all ${
          selected
            ? 'border-gaffer-orange bg-gaffer-orange shadow-orange-glow'
            : 'border-white/30 bg-black/40 backdrop-blur-sm'
        }`}
      >
        {player.name[0]}
      </div>
      <div className={`rounded-md px-2 py-0.5 text-center ${selected ? 'bg-gaffer-orange' : 'bg-black/60 backdrop-blur-sm'}`}>
        <p className="text-white text-[9px] font-body font-semibold leading-none truncate max-w-[52px]">{player.name}</p>
        <p className="text-white/80 text-[8px] font-body leading-none">{player.points}pts</p>
      </div>
    </motion.button>
  )
}

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
    team.filter((p) => p.pitchRow === 0), // GK
    team.filter((p) => p.pitchRow === 1), // DEF
    team.filter((p) => p.pitchRow === 2), // MID
    team.filter((p) => p.pitchRow === 3), // FWD
  ]

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ paddingBottom: '130%' }}>
      {/* Pitch background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-800 to-green-900">
        {/* Pitch markings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 390" preserveAspectRatio="none">
          {/* Outer lines */}
          <rect x="10" y="10" width="280" height="370" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
          {/* Center circle */}
          <circle cx="150" cy="195" r="35" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
          {/* Center line */}
          <line x1="10" y1="195" x2="290" y2="195" stroke="white" strokeWidth="1.5" opacity="0.3" />
          {/* Top penalty area */}
          <rect x="70" y="10" width="160" height="60" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
          {/* Bottom penalty area */}
          <rect x="70" y="320" width="160" height="60" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
          {/* Top goal area */}
          <rect x="110" y="10" width="80" height="25" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
          {/* Bottom goal area */}
          <rect x="110" y="355" width="80" height="25" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        </svg>

        {/* Grass stripes */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-x-0"
            style={{
              top: `${i * 12.5}%`,
              height: '6.25%',
              backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.06)' : 'transparent',
            }}
          />
        ))}
      </div>

      {/* Players on pitch */}
      <div className="absolute inset-0 flex flex-col justify-around py-4 px-2">
        {rows.map((rowPlayers, rowIdx) => (
          <div key={rowIdx} className="flex items-center justify-around">
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

// ─── Transfers Tab ──────────────────────────────────────────────────────────

function TransfersTab({ allPlayers }: { allPlayers: Player[] }) {
  const [posFilter, setPosFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL')
  const [selectedIn, setSelectedIn] = useState<string | null>(null)

  const filtered = posFilter === 'ALL' ? allPlayers : allPlayers.filter((p) => p.position === posFilter)

  const posColors: Record<string, string> = {
    GK: 'text-yellow-400',
    DEF: 'text-blue-400',
    MID: 'text-green-400',
    FWD: 'text-gaffer-orange',
  }

  return (
    <div className="space-y-4">
      {/* Filter pills */}
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

      {/* Player list */}
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
            <div className="w-10 h-10 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-bold flex-shrink-0">
              {player.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-body font-semibold truncate">{player.name}</p>
                <span className={`text-[10px] font-display font-bold ${posColors[player.position]}`}>
                  {player.position}
                </span>
              </div>
              <p className="text-gaffer-muted text-xs font-body">{player.teamName}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-gaffer-orange font-display font-bold text-sm">{player.points}pts</p>
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
              {selectedIn === player.id ? <Check size={14} /> : <ArrowLeftRight size={14} />}
            </button>
          </motion.div>
        ))}
      </div>

      {selectedIn && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 inset-x-4 z-50"
        >
          <button className="w-full py-4 rounded-2xl bg-orange-gradient-btn text-white font-display font-bold text-base shadow-orange-glow">
            Confirm Transfer
          </button>
        </motion.div>
      )}
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function FantasyTeamPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'points' | 'pickTeam' | 'transfers'>('pickTeam')
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['fantasy-team'],
    queryFn: fetchFantasyData,
  })

  const pitchPlayers = (data?.team ?? FANTASY_TEAM).filter((p) => p.isOnPitch)
  const benchPlayers = (data?.team ?? FANTASY_TEAM).filter((p) => !p.isOnPitch)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { key: 'points', label: 'Points' },
    { key: 'pickTeam', label: 'Pick Team' },
    { key: 'transfers', label: 'Transfers' },
  ] as const

  return (
    <div className="min-h-screen bg-gaffer-bg pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gaffer-bg/95 backdrop-blur-xl border-b border-gaffer-border">
        <div className="flex items-center justify-between px-4 pt-12 pb-2">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <h1 className="font-display font-black text-white text-sm tracking-widest uppercase">
              {LEAGUE_DETAIL.name}
            </h1>
            <p className="text-gaffer-muted text-[10px] font-body">
              Gameweek {FANTASY_STATS.gameweek} · Deadline: {FANTASY_STATS.deadline}
            </p>
          </div>
          <button className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-muted">
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-3 mt-1">
          {[
            { label: 'Average', value: FANTASY_STATS.averagePoints },
            { label: 'GW Points', value: FANTASY_STATS.gameweekPoints },
            { label: 'Total Pts', value: FANTASY_STATS.totalPoints },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gaffer-card border border-gaffer-border rounded-xl py-2 text-center">
              <p className="font-display font-black text-2xl text-white leading-none">{value}</p>
              <p className="text-[9px] font-body text-gaffer-muted mt-0.5">{label}</p>
            </div>
          ))}
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
          {activeTab === 'points' && (
            <div className="space-y-3">
              <p className="text-gaffer-muted text-sm font-body text-center py-4">
                Gameweek {FANTASY_STATS.gameweek} points breakdown
              </p>
              {pitchPlayers.map((player, i) => (
                <div key={player.id} className="flex items-center gap-3 bg-gaffer-card border border-gaffer-border rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-bold text-xs">
                    {player.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-body font-semibold">{player.name}</p>
                    <p className="text-gaffer-muted text-[10px] font-body">{player.teamName} · {player.position}</p>
                  </div>
                  <span className="text-gaffer-orange font-display font-bold text-lg">{player.points}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pickTeam' && (
            <div className="space-y-4">
              {isLoading ? (
                <div className="bg-gaffer-card rounded-2xl animate-pulse" style={{ paddingBottom: '130%' }} />
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
                    <div className="flex justify-around bg-gaffer-surface border border-gaffer-border rounded-2xl py-3">
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
                    onClick={handleSave}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full py-4 rounded-2xl font-display font-bold text-base transition-all ${
                      saved
                        ? 'bg-green-500 text-white'
                        : 'bg-orange-gradient-btn text-white shadow-orange-glow'
                    }`}
                  >
                    {saved ? '✓ Team Saved!' : 'Save Team'}
                  </motion.button>
                </>
              )}
            </div>
          )}

          {activeTab === 'transfers' && (
            <TransfersTab allPlayers={data?.allPlayers ?? ALL_PLAYERS} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
