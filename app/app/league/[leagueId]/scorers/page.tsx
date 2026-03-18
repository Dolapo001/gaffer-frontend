'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Target, Award } from 'lucide-react'
import { getTopScorers, getTopAssists, type PlayerStatEntry } from '@/lib/services/stats.service'
import { getCompetition } from '@/lib/services/competition.service'

function playerName(p: PlayerStatEntry) {
  const pid = p.playerId
  if (typeof pid === 'string') return 'Player'
  return `${pid.firstName} ${pid.lastName}`
}

function teamName(p: PlayerStatEntry) {
  const tid = p.teamId
  if (typeof tid === 'string') return ''
  return tid.name
}

export default function GoalScorersPage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  const [tab, setTab] = useState<'goals' | 'assists'>('goals')

  const { data: competition } = useQuery({
    queryKey: ['competition', leagueId],
    queryFn: () => getCompetition(leagueId),
  })

  const { data: scorers, isLoading: loadingScorers } = useQuery({
    queryKey: ['top-scorers', leagueId],
    queryFn: () => getTopScorers(leagueId),
  })

  const { data: assists, isLoading: loadingAssists } = useQuery({
    queryKey: ['top-assists', leagueId],
    queryFn: () => getTopAssists(leagueId),
  })

  const isLoading = tab === 'goals' ? loadingScorers : loadingAssists
  const players = tab === 'goals'
    ? (scorers ?? []).filter((p) => (p.goals ?? 0) > 0)
    : (assists ?? []).filter((p) => (p.assists ?? 0) > 0)

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
          <div>
            <h1 className="font-display font-black text-white text-sm tracking-widest uppercase">
              Player Stats
            </h1>
            <p className="text-gaffer-muted text-[10px] font-body">{competition?.name ?? '...'}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex">
          {(['goals', 'assists'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-display font-bold capitalize transition-all border-b-2 ${
                tab === t ? 'text-gaffer-orange border-gaffer-orange' : 'text-gaffer-muted border-transparent'
              }`}
            >
              {t === 'goals' ? 'Top Scorers' : 'Top Assists'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-2.5 border-b border-gaffer-border bg-gaffer-surface">
            <span className="text-[10px] font-body font-bold text-gaffer-muted w-6">#</span>
            <span className="text-[10px] font-body font-bold text-gaffer-muted">Player</span>
            <span className="text-[10px] font-body font-bold text-gaffer-muted w-14 text-center">
              {tab === 'goals' ? 'Goals' : 'Assists'}
            </span>
          </div>

          {isLoading
            ? [...Array(8)].map((_, i) => (
                <div key={i} className="h-14 bg-gaffer-card/50 animate-pulse border-b border-gaffer-border/30" />
              ))
            : players.length === 0
            ? (
              <div className="py-12 text-center">
                <Target size={28} className="text-gaffer-subtle mx-auto mb-3" />
                <p className="text-gaffer-muted text-sm font-body">No stats yet</p>
              </div>
            )
            : players.map((player, i) => (
                <motion.div
                  key={typeof player.playerId === 'string' ? player.playerId : player.playerId._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-4 py-3 border-b border-gaffer-border/30 last:border-0"
                >
                  <span className={`text-[11px] font-display font-bold w-6 text-center ${
                    i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gaffer-subtle'
                  }`}>{i + 1}</span>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-orange-gradient-btn flex items-center justify-center text-xs text-white font-display font-bold flex-shrink-0">
                      {playerName(player)[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-body font-semibold truncate">{playerName(player)}</p>
                      <p className="text-gaffer-muted text-[10px] font-body">{teamName(player)}</p>
                    </div>
                  </div>
                  <div className="w-14 flex items-center justify-center gap-1">
                    {tab === 'goals'
                      ? <Target size={12} className="text-gaffer-orange flex-shrink-0" />
                      : <Award size={12} className="text-blue-400 flex-shrink-0" />
                    }
                    <span className={`font-display font-bold text-sm ${tab === 'goals' ? 'text-gaffer-orange' : 'text-blue-400'}`}>
                      {tab === 'goals' ? (player.goals ?? 0) : (player.assists ?? 0)}
                    </span>
                  </div>
                </motion.div>
              ))}
        </div>
      </div>
    </div>
  )
}
