'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import { MATCHES, type Match, type MatchEvent } from '@/lib/leagueMockData'

function fetchMatch(matchId: string) {
  return new Promise<Match | undefined>((resolve) =>
    setTimeout(() => resolve(MATCHES.find((m) => m.id === matchId)), 400)
  )
}

// ─── Stat Bar ───────────────────────────────────────────────────────────────

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1
  const homeW = Math.round((home / total) * 100)
  const awayW = 100 - homeW

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-display font-bold text-white text-sm">{home}</span>
        <span className="text-gaffer-muted text-[10px] font-body">{label}</span>
        <span className="font-display font-bold text-white text-sm">{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-0.5">
        <div className="bg-gaffer-orange rounded-l-full transition-all duration-700" style={{ width: `${homeW}%` }} />
        <div className="bg-blue-500 rounded-r-full transition-all duration-700" style={{ width: `${awayW}%` }} />
      </div>
    </div>
  )
}

// ─── Event Icon ─────────────────────────────────────────────────────────────

function EventIcon({ type }: { type: MatchEvent['type'] }) {
  const icons: Record<MatchEvent['type'], string> = {
    goal: '⚽',
    'yellow-card': '🟡',
    'red-card': '🔴',
    substitution: '🔄',
    penalty: '🎯',
  }
  return <span className="text-base">{icons[type]}</span>
}

// ─── Tactical Pitch ─────────────────────────────────────────────────────────

function TacticalPitch({ match }: { match: Match }) {
  // Mock player positions for both teams
  const homePlayers = [
    { name: match.homeTeam.shortName[0] + '1', x: 150, y: 350 }, // GK
    { name: 'D1', x: 60, y: 270 }, { name: 'D2', x: 120, y: 260 }, { name: 'D3', x: 180, y: 260 }, { name: 'D4', x: 240, y: 270 },
    { name: 'M1', x: 75, y: 185 }, { name: 'M2', x: 150, y: 175 }, { name: 'M3', x: 225, y: 185 },
    { name: 'F1', x: 90, y: 105 }, { name: 'F2', x: 150, y: 90 }, { name: 'F3', x: 210, y: 105 },
  ]
  const awayPlayers = [
    { name: match.awayTeam.shortName[0] + '1', x: 150, y: 40 }, // GK
    { name: 'D1', x: 60, y: 120 }, { name: 'D2', x: 120, y: 130 }, { name: 'D3', x: 180, y: 130 }, { name: 'D4', x: 240, y: 120 },
    { name: 'M1', x: 75, y: 205 }, { name: 'M2', x: 150, y: 215 }, { name: 'M3', x: 225, y: 205 },
    { name: 'F1', x: 90, y: 285 }, { name: 'F2', x: 150, y: 300 }, { name: 'F3', x: 210, y: 285 },
  ]

  return (
    <div className="rounded-2xl overflow-hidden">
      <svg viewBox="0 0 300 390" className="w-full">
        {/* Pitch background */}
        <rect width="300" height="390" fill="#1a5c1a" />
        {/* Grass stripes */}
        {[...Array(8)].map((_, i) => (
          <rect key={i} x="0" y={i * 48.75} width="300" height="24.375" fill="rgba(0,0,0,0.07)" />
        ))}
        {/* Lines */}
        <rect x="10" y="10" width="280" height="370" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
        <line x1="10" y1="195" x2="290" y2="195" stroke="white" strokeWidth="1.5" opacity="0.35" />
        <circle cx="150" cy="195" r="35" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
        <circle cx="150" cy="195" r="3" fill="white" opacity="0.5" />
        <rect x="80" y="10" width="140" height="55" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
        <rect x="80" y="325" width="140" height="55" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
        <rect x="110" y="10" width="80" height="22" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
        <rect x="110" y="358" width="80" height="22" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
        <circle cx="150" cy="65" r="3" fill="white" opacity="0.5" />
        <circle cx="150" cy="325" r="3" fill="white" opacity="0.5" />

        {/* Home team (orange) */}
        {homePlayers.map((p, i) => (
          <g key={`h${i}`}>
            <circle cx={p.x} cy={p.y} r="12" fill="#FF6B00" opacity="0.9" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">{p.name}</text>
          </g>
        ))}

        {/* Away team (blue) */}
        {awayPlayers.map((p, i) => (
          <g key={`a${i}`}>
            <circle cx={p.x} cy={p.y} r="12" fill="#3b82f6" opacity="0.9" />
            <text x={p.x} y={p.y + 4} textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">{p.name}</text>
          </g>
        ))}
      </svg>
      {/* Formation labels */}
      <div className="bg-gaffer-surface border border-gaffer-border rounded-b-2xl px-4 py-2 flex justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gaffer-orange" />
          <span className="text-white text-xs font-display font-bold">{match.homeTeam.shortName}</span>
          <span className="text-gaffer-muted text-[10px] font-body">4-3-3</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gaffer-muted text-[10px] font-body">4-3-3</span>
          <span className="text-white text-xs font-display font-bold">{match.awayTeam.shortName}</span>
          <div className="w-3 h-3 rounded-full bg-blue-500" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MatchCenterPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string
  const [activeTab, setActiveTab] = useState<'stats' | 'tactical' | 'events'>('stats')

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => fetchMatch(matchId),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gaffer-border border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gaffer-bg flex flex-col items-center justify-center gap-4">
        <p className="text-gaffer-muted font-body">Match not found</p>
        <button onClick={() => router.back()} className="text-gaffer-orange text-sm font-body">Go back</button>
      </div>
    )
  }

  const tabs = [
    { key: 'stats', label: 'Stats' },
    { key: 'tactical', label: 'Tactical' },
    { key: 'events', label: 'Events' },
  ] as const

  return (
    <div className="min-h-screen bg-gaffer-bg pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gaffer-bg/95 backdrop-blur-xl border-b border-gaffer-border">
        <div className="flex items-center gap-3 px-4 pt-12 pb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-[10px] font-display font-bold text-gaffer-orange tracking-widest uppercase">
              {match.status === 'finished' ? 'Final Score' : match.status === 'live' ? '🔴 Live' : `MW ${match.matchweek}`}
            </p>
          </div>
          <div className="w-9" />
        </div>

        {/* Score hero */}
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.homeTeam.badge}</span>
            <p className="font-display font-bold text-white text-sm text-center leading-tight">{match.homeTeam.name}</p>
          </div>
          <div className="px-4 text-center">
            <motion.p
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="font-display font-black text-5xl text-white leading-none"
            >
              {match.homeScore ?? '—'}
              <span className="text-gaffer-orange text-4xl"> : </span>
              {match.awayScore ?? '—'}
            </motion.p>
            <p className="text-gaffer-muted text-[10px] font-body mt-1">{match.matchDate} · {match.matchTime}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-3xl">{match.awayTeam.badge}</span>
            <p className="font-display font-bold text-white text-sm text-center leading-tight">{match.awayTeam.name}</p>
          </div>
        </div>

        {/* Goal scorers summary */}
        {match.goalScorers && match.goalScorers.length > 0 && (
          <div className="flex justify-between px-4 pb-3 gap-4">
            <div className="flex-1 space-y-0.5">
              {match.goalScorers.filter((g) => g.team === 'home').map((g, i) => (
                <p key={i} className="text-[10px] font-body text-gaffer-muted">
                  ⚽ {g.name} {g.minute}&apos;
                </p>
              ))}
            </div>
            <div className="flex-1 space-y-0.5 text-right">
              {match.goalScorers.filter((g) => g.team === 'away').map((g, i) => (
                <p key={i} className="text-[10px] font-body text-gaffer-muted">
                  {g.name} {g.minute}&apos; ⚽
                </p>
              ))}
            </div>
          </div>
        )}

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
          {/* Stats Tab */}
          {activeTab === 'stats' && match.stats && (
            <div className="space-y-4">
              {/* Possession */}
              <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 space-y-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-display font-bold text-white text-lg">{match.stats.possession[0]}%</span>
                  <span className="text-gaffer-muted text-[10px] font-body">Possession</span>
                  <span className="font-display font-bold text-white text-lg">{match.stats.possession[1]}%</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div className="bg-gaffer-orange transition-all duration-700" style={{ width: `${match.stats.possession[0]}%` }} />
                  <div className="bg-blue-500 transition-all duration-700" style={{ width: `${match.stats.possession[1]}%` }} />
                </div>
              </div>

              <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 space-y-4">
                {[
                  { label: 'Shots', values: match.stats.shots },
                  { label: 'Shots on Target', values: match.stats.shotsOnTarget },
                  { label: 'Corners', values: match.stats.corners },
                  { label: 'Fouls', values: match.stats.fouls },
                  { label: 'Yellow Cards', values: match.stats.yellowCards },
                  { label: 'Red Cards', values: match.stats.redCards },
                ].map(({ label, values }) => (
                  <StatBar key={label} label={label} home={values[0]} away={values[1]} />
                ))}
              </div>

              {/* Team legend */}
              <div className="flex justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gaffer-orange" />
                  <span className="text-gaffer-muted text-xs font-body">{match.homeTeam.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-gaffer-muted text-xs font-body">{match.awayTeam.name}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tactical Tab */}
          {activeTab === 'tactical' && (
            <TacticalPitch match={match} />
          )}

          {/* Events Tab */}
          {activeTab === 'events' && match.events && (
            <div className="space-y-2">
              {match.events.map((event, i) => {
                const isHome = event.teamId === match.homeTeam.id
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: isHome ? -10 : 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={`flex items-center gap-3 ${isHome ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    {/* Minute */}
                    <div className="w-10 flex-shrink-0 text-center">
                      <span className="text-gaffer-orange font-display font-bold text-xs">{event.minute}&apos;</span>
                    </div>

                    {/* Event card */}
                    <div className={`flex-1 flex items-center gap-2 bg-gaffer-card border border-gaffer-border rounded-xl px-3 py-2.5 ${isHome ? '' : 'flex-row-reverse'}`}>
                      <EventIcon type={event.type} />
                      <div className={`flex-1 min-w-0 ${isHome ? 'text-left' : 'text-right'}`}>
                        <p className="text-white text-xs font-body font-semibold truncate">{event.playerName}</p>
                        {event.detail && (
                          <p className="text-gaffer-muted text-[10px] font-body truncate">{event.detail}</p>
                        )}
                      </div>
                    </div>

                    {/* Team badge */}
                    <div className="w-6 flex-shrink-0 text-center text-base">
                      {isHome ? match.homeTeam.badge : match.awayTeam.badge}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {activeTab === 'stats' && !match.stats && (
            <p className="text-gaffer-muted text-sm font-body text-center py-12">
              Match statistics will be available after the match.
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
