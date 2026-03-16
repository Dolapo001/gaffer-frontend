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

// ─── Lineup mock data ────────────────────────────────────────────────────────

function getLineup(match: Match) {
  return {
    home: {
      formation: '4-3-3',
      players: [
        { name: 'Tabbra', pos: 'GK', row: 0 },
        { name: 'Wesdom', pos: 'RB', row: 1 }, { name: 'Alfreda', pos: 'CB', row: 1 },
        { name: 'Jakota', pos: 'CB', row: 1 }, { name: 'Brenden', pos: 'LB', row: 1 },
        { name: 'Dahood', pos: 'RM', row: 2 }, { name: 'Chnox', pos: 'CM', row: 2 }, { name: 'Noba', pos: 'LM', row: 2 },
        { name: 'Jimskin', pos: 'RW', row: 3 }, { name: 'Edomsb', pos: 'CF', row: 3 }, { name: 'Dahood2', pos: 'LW', row: 3 },
      ],
    },
    away: {
      formation: '4-3-3',
      players: [
        { name: 'Omorede', pos: 'GK', row: 0 },
        { name: 'Da Jong', pos: 'RB', row: 1 }, { name: 'Sunfield', pos: 'CB', row: 1 },
        { name: 'Ademoye', pos: 'CB', row: 1 }, { name: 'Bankole', pos: 'LB', row: 1 },
        { name: 'Neymar', pos: 'RM', row: 2 }, { name: 'De Bruyne', pos: 'CM', row: 2 }, { name: 'Haaland2', pos: 'LM', row: 2 },
        { name: 'Haaland', pos: 'RW', row: 3 }, { name: 'Umbra', pos: 'CF', row: 3 }, { name: 'Nelson', pos: 'LW', row: 3 },
      ],
    },
  }
}

// ─── Stat Bar ────────────────────────────────────────────────────────────────

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1
  const homeW = Math.round((home / total) * 100)
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-display font-bold text-white text-sm w-8">{home}</span>
        <span className="text-gaffer-muted text-[10px] font-body">{label}</span>
        <span className="font-display font-bold text-white text-sm w-8 text-right">{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        <div className="bg-gaffer-orange rounded-l-full transition-all duration-700" style={{ width: `${homeW}%` }} />
        <div className="bg-blue-500 rounded-r-full transition-all duration-700" style={{ width: `${100 - homeW}%` }} />
      </div>
    </div>
  )
}

// ─── Tactical Pitch ──────────────────────────────────────────────────────────

function TacticalPitch({ match }: { match: Match }) {
  const homePositions = [
    { x: 150, y: 340 },
    { x: 65, y: 265 }, { x: 115, y: 255 }, { x: 185, y: 255 }, { x: 235, y: 265 },
    { x: 80, y: 185 }, { x: 150, y: 172 }, { x: 220, y: 185 },
    { x: 90, y: 105 }, { x: 150, y: 90 }, { x: 210, y: 105 },
  ]
  const awayPositions = [
    { x: 150, y: 42 },
    { x: 65, y: 117 }, { x: 115, y: 127 }, { x: 185, y: 127 }, { x: 235, y: 117 },
    { x: 80, y: 200 }, { x: 150, y: 215 }, { x: 220, y: 200 },
    { x: 90, y: 285 }, { x: 150, y: 300 }, { x: 210, y: 285 },
  ]
  const homeNames = ['T', 'W', 'Al', 'Ja', 'Br', 'Da', 'Ch', 'No', 'Ji', 'Ed', 'D2']
  const awayNames = ['O', 'DJ', 'Su', 'Ad', 'Ba', 'Ne', 'DB', 'H2', 'Ha', 'Um', 'Ne']

  return (
    <div className="rounded-2xl overflow-hidden shadow-xl">
      <svg viewBox="0 0 300 390" className="w-full">
        <rect width="300" height="390" fill="#1d6b1d" />
        {[...Array(8)].map((_, i) => (
          <rect key={i} x="0" y={i * 48.75} width="300" height="24.375" fill="rgba(0,0,0,0.06)" />
        ))}
        <rect x="10" y="10" width="280" height="370" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <line x1="10" y1="195" x2="290" y2="195" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <circle cx="150" cy="195" r="34" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <circle cx="150" cy="195" r="2.5" fill="white" opacity="0.4" />
        <rect x="80" y="10" width="140" height="54" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <rect x="80" y="326" width="140" height="54" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <rect x="112" y="10" width="76" height="22" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <rect x="112" y="358" width="76" height="22" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
        <circle cx="150" cy="64" r="2.5" fill="white" opacity="0.4" />
        <circle cx="150" cy="326" r="2.5" fill="white" opacity="0.4" />

        {/* Home players (orange) */}
        {homePositions.map((pos, i) => (
          <g key={`h${i}`}>
            <circle cx={pos.x} cy={pos.y} r="14" fill="#FF6B00" stroke="white" strokeWidth="1.5" opacity="0.9" />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{homeNames[i]}</text>
          </g>
        ))}

        {/* Away players (blue) */}
        {awayPositions.map((pos, i) => (
          <g key={`a${i}`}>
            <circle cx={pos.x} cy={pos.y} r="14" fill="#3b82f6" stroke="white" strokeWidth="1.5" opacity="0.9" />
            <text x={pos.x} y={pos.y + 4} textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">{awayNames[i]}</text>
          </g>
        ))}
      </svg>

      {/* Formation legend */}
      <div className="bg-gaffer-surface border-t border-gaffer-border px-4 py-2 flex justify-between items-center">
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

// ─── Lineup Tab ───────────────────────────────────────────────────────────────

function LineupTab({ match }: { match: Match }) {
  const lineup = getLineup(match)
  const rows = [0, 1, 2, 3]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Home lineup */}
        <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gaffer-border bg-gaffer-surface">
            <div className="w-2 h-2 rounded-full bg-gaffer-orange" />
            <span className="text-white text-xs font-display font-bold truncate">{match.homeTeam.shortName}</span>
            <span className="text-gaffer-muted text-[9px] font-body ml-auto">{lineup.home.formation}</span>
          </div>
          {rows.map((row) => {
            const rowPlayers = lineup.home.players.filter((p) => p.row === row)
            return rowPlayers.map((p, i) => (
              <div key={`${row}-${i}`} className="flex items-center gap-2 px-3 py-2 border-b border-gaffer-border/30 last:border-0">
                <span className={`text-[8px] font-display font-bold px-1 py-0.5 rounded ${
                  p.pos === 'GK' ? 'bg-yellow-500/20 text-yellow-400' :
                  p.pos.includes('B') ? 'bg-blue-500/20 text-blue-400' :
                  p.pos.includes('M') ? 'bg-green-500/20 text-green-400' :
                  'bg-gaffer-orange/20 text-gaffer-orange'
                }`}>{p.pos}</span>
                <span className="text-white text-xs font-body truncate">{p.name}</span>
              </div>
            ))
          })}
        </div>

        {/* Away lineup */}
        <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gaffer-border bg-gaffer-surface">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-white text-xs font-display font-bold truncate">{match.awayTeam.shortName}</span>
            <span className="text-gaffer-muted text-[9px] font-body ml-auto">{lineup.away.formation}</span>
          </div>
          {rows.map((row) => {
            const rowPlayers = lineup.away.players.filter((p) => p.row === row)
            return rowPlayers.map((p, i) => (
              <div key={`${row}-${i}`} className="flex items-center gap-2 px-3 py-2 border-b border-gaffer-border/30 last:border-0">
                <span className={`text-[8px] font-display font-bold px-1 py-0.5 rounded ${
                  p.pos === 'GK' ? 'bg-yellow-500/20 text-yellow-400' :
                  p.pos.includes('B') ? 'bg-blue-500/20 text-blue-400' :
                  p.pos.includes('M') ? 'bg-green-500/20 text-green-400' :
                  'bg-gaffer-orange/20 text-gaffer-orange'
                }`}>{p.pos}</span>
                <span className="text-white text-xs font-body truncate">{p.name}</span>
              </div>
            ))
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Event icon helper ────────────────────────────────────────────────────────

function EventIcon({ type }: { type: MatchEvent['type'] }) {
  const map: Record<MatchEvent['type'], string> = {
    goal: '⚽', 'yellow-card': '🟡', 'red-card': '🔴', substitution: '🔄', penalty: '🎯',
  }
  return <span>{map[type]}</span>
}

// ─── Commentary Tab ───────────────────────────────────────────────────────────

function CommentaryTab({ match }: { match: Match }) {
  const events = match.events ?? []

  const commentaryTemplates: Record<MatchEvent['type'], (e: MatchEvent) => string> = {
    goal: (e) => `${e.minute}' GOAL! ${e.playerName} finds the net for ${e.teamId === match.homeTeam.id ? match.homeTeam.name : match.awayTeam.name}! ${e.detail ?? ''}`,
    'yellow-card': (e) => `${e.minute}' Yellow card shown to ${e.playerName}. Referee dishes out a caution.`,
    'red-card': (e) => `${e.minute}' RED CARD! ${e.playerName} is sent off!`,
    substitution: (e) => `${e.minute}' Substitution: ${e.playerName}`,
    penalty: (e) => `${e.minute}' PENALTY! ${e.playerName} steps up and converts from the spot!`,
  }

  return (
    <div className="space-y-2">
      {events.length === 0 ? (
        <p className="text-gaffer-muted text-sm font-body text-center py-10">No commentary available</p>
      ) : (
        [...events].reverse().map((event, i) => {
          const isHome = event.teamId === match.homeTeam.id
          const bgColors: Record<MatchEvent['type'], string> = {
            goal: 'border-gaffer-orange/30 bg-gaffer-orange/5',
            'yellow-card': 'border-yellow-500/30 bg-yellow-500/5',
            'red-card': 'border-red-500/30 bg-red-500/5',
            substitution: 'border-gaffer-border bg-transparent',
            penalty: 'border-blue-500/30 bg-blue-500/5',
          }

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${bgColors[event.type]}`}
            >
              <div className="flex-shrink-0 flex flex-col items-center gap-0.5 pt-0.5">
                <EventIcon type={event.type} />
                <span className="text-gaffer-orange font-display font-bold text-[10px]">{event.minute}&apos;</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-body leading-relaxed">
                  {commentaryTemplates[event.type](event)}
                </p>
                <p className={`text-[9px] font-body mt-1 ${isHome ? 'text-gaffer-orange' : 'text-blue-400'}`}>
                  {isHome ? match.homeTeam.name : match.awayTeam.name}
                </p>
              </div>
            </motion.div>
          )
        })
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MatchCenterPage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string
  const [activeTab, setActiveTab] = useState<'stats' | 'lineup' | 'tactical' | 'commentary'>('stats')

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
    { key: 'lineup', label: 'Lineup' },
    { key: 'tactical', label: 'Tactical' },
    { key: 'commentary', label: 'Commentary' },
  ] as const

  return (
    <div className="min-h-screen bg-gaffer-bg pb-28">
      {/* Sticky header */}
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
        <div className="px-6 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gaffer-orange/20 border border-gaffer-orange/30 flex items-center justify-center text-2xl">
                {match.homeTeam.badge}
              </div>
              <p className="font-display font-bold text-white text-xs text-center leading-tight">{match.homeTeam.name}</p>
            </div>

            <div className="px-4 text-center">
              <motion.p
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 250 }}
                className="font-display font-black text-5xl text-white leading-none"
              >
                {match.homeScore ?? '–'}
                <span className="text-gaffer-orange text-4xl mx-1">:</span>
                {match.awayScore ?? '–'}
              </motion.p>
              <p className="text-gaffer-muted text-[10px] font-body mt-1">
                {match.matchDate} · {match.matchTime}
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-2xl">
                {match.awayTeam.badge}
              </div>
              <p className="font-display font-bold text-white text-xs text-center leading-tight">{match.awayTeam.name}</p>
            </div>
          </div>

          {/* Goal scorers summary */}
          {match.goalScorers && match.goalScorers.length > 0 && (
            <div className="flex justify-between mt-3 gap-4">
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
        </div>

        {/* Tabs */}
        <div className="flex border-t border-gaffer-border overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[72px] py-2.5 text-xs font-display font-bold whitespace-nowrap transition-all border-b-2 ${
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
          {/* Stats */}
          {activeTab === 'stats' && (
            match.stats ? (
              <div className="space-y-4">
                {/* Possession hero */}
                <div className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-display font-black text-2xl text-gaffer-orange">{match.stats.possession[0]}%</span>
                    <span className="text-gaffer-muted text-[10px] font-body">Possession</span>
                    <span className="font-display font-black text-2xl text-blue-400">{match.stats.possession[1]}%</span>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gaffer-orange rounded-l-full" style={{ width: `${match.stats.possession[0]}%` }} />
                    <div className="bg-blue-500 rounded-r-full" style={{ width: `${match.stats.possession[1]}%` }} />
                  </div>
                </div>

                {/* Stats table */}
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
                <div className="flex justify-between px-1">
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
            ) : (
              <p className="text-gaffer-muted text-sm font-body text-center py-12">Stats not yet available</p>
            )
          )}

          {/* Lineup */}
          {activeTab === 'lineup' && <LineupTab match={match} />}

          {/* Tactical */}
          {activeTab === 'tactical' && <TacticalPitch match={match} />}

          {/* Commentary */}
          {activeTab === 'commentary' && <CommentaryTab match={match} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
