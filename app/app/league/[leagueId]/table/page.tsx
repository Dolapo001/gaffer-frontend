'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Target } from 'lucide-react'
import {
  MATCHES,
  STANDINGS,
  LEAGUE_DETAIL,
  TOP_PLAYERS,
  type Match,
} from '@/lib/leagueMockData'

function fetchLeagueOverview() {
  return new Promise<{
    standings: typeof STANDINGS
    matches: typeof MATCHES
    topPlayers: typeof TOP_PLAYERS
  }>((resolve) =>
    setTimeout(() => resolve({ standings: STANDINGS, matches: MATCHES, topPlayers: TOP_PLAYERS }), 500)
  )
}

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = { W: 'bg-green-500', D: 'bg-yellow-500', L: 'bg-red-500' }
  return (
    <span className={`w-3.5 h-3.5 rounded-sm ${colors[result]} flex items-center justify-center text-[7px] font-display font-bold text-white flex-shrink-0`}>
      {result}
    </span>
  )
}

function MatchMiniCard({ match, onClick }: { match: Match; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center bg-gaffer-card border border-gaffer-border rounded-2xl px-3 py-2.5 hover:border-gaffer-orange/40 transition-all"
    >
      <div className="flex-1 flex items-center gap-2">
        <span className="text-base">{match.homeTeam.badge}</span>
        <span className="font-body font-semibold text-white text-xs truncate">{match.homeTeam.shortName}</span>
      </div>
      <div className="px-2 text-center flex-shrink-0 min-w-[68px]">
        {match.status === 'finished' ? (
          <p className="font-display font-bold text-white text-base">{match.homeScore} – {match.awayScore}</p>
        ) : match.status === 'live' ? (
          <div>
            <p className="font-display font-bold text-white text-base">{match.homeScore ?? 0} – {match.awayScore ?? 0}</p>
            <p className="text-[9px] text-red-400 font-display font-bold animate-pulse">LIVE</p>
          </div>
        ) : (
          <div>
            <p className="font-body text-gaffer-orange text-xs font-semibold">{match.matchTime}</p>
            <p className="text-[9px] font-body text-gaffer-muted">{match.matchDate}</p>
          </div>
        )}
      </div>
      <div className="flex-1 flex items-center justify-end gap-2">
        <span className="font-body font-semibold text-white text-xs truncate">{match.awayTeam.shortName}</span>
        <span className="text-base">{match.awayTeam.badge}</span>
      </div>
    </motion.button>
  )
}

export default function LeagueTablePage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  const [activeTab, setActiveTab] = useState<'table' | 'fixtures'>('table')

  const { data, isLoading } = useQuery({
    queryKey: ['league-overview', leagueId],
    queryFn: fetchLeagueOverview,
  })

  const matchweeks = Array.from(new Set((data?.matches ?? []).map((m) => m.matchweek))).sort((a, b) => b - a)
  const groupedByMW: Record<number, Match[]> = {}
  ;(data?.matches ?? []).forEach((m) => {
    if (!groupedByMW[m.matchweek]) groupedByMW[m.matchweek] = []
    groupedByMW[m.matchweek].push(m)
  })

  const previousMatches = (data?.matches ?? []).filter((m) => m.status === 'finished')
  const upcomingMatches = (data?.matches ?? []).filter((m) => m.status !== 'finished')

  const Sk = ({ h }: { h: string }) => (
    <div className={`bg-gaffer-card rounded-xl animate-pulse ${h}`} />
  )

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
          <div className="flex-1">
            <h1 className="font-display font-black text-white text-sm tracking-widest uppercase leading-tight">
              {LEAGUE_DETAIL.name}
            </h1>
            <p className="text-gaffer-muted text-[10px] font-body">Season {LEAGUE_DETAIL.season}</p>
          </div>
          <button
            onClick={() => router.push(`/app/league/${leagueId}/scorers`)}
            className="flex items-center gap-1.5 bg-gaffer-orange/10 border border-gaffer-orange/30 rounded-full px-3 py-1.5"
          >
            <Target size={11} className="text-gaffer-orange" />
            <span className="text-gaffer-orange text-[10px] font-display font-bold">Scorers</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex">
          {(['table', 'fixtures'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-display font-bold capitalize transition-all border-b-2 ${
                activeTab === tab
                  ? 'text-gaffer-orange border-gaffer-orange'
                  : 'text-gaffer-muted border-transparent'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {activeTab === 'table' ? (
          <motion.div key="table" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {/* Standings table */}
            {isLoading ? (
              <div className="space-y-2">{[...Array(8)].map((_, i) => <Sk key={i} h="h-12" />)}</div>
            ) : (
              <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[20px_1fr_28px_28px_28px_28px_32px] items-center px-3 py-2 border-b border-gaffer-border bg-gaffer-surface">
                  {['#', 'Club', 'P', 'W', 'D', 'L', 'Pts'].map((h) => (
                    <span key={h} className="text-[10px] font-body font-bold text-gaffer-muted text-center first:text-left">{h}</span>
                  ))}
                </div>
                {(data?.standings ?? []).map((row, i) => (
                  <motion.div
                    key={row.team.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`grid grid-cols-[20px_1fr_28px_28px_28px_28px_32px] items-center px-3 py-3 border-b border-gaffer-border/30 last:border-0 ${
                      i === 0 ? 'bg-gaffer-orange/5' : ''
                    }`}
                  >
                    <span className={`text-[11px] font-display font-bold ${row.position <= 3 ? 'text-gaffer-orange' : 'text-gaffer-subtle'}`}>
                      {row.position}
                    </span>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm">{row.team.badge}</span>
                      <div className="min-w-0">
                        <p className="text-white text-[11px] font-body font-medium truncate">{row.team.name}</p>
                        <div className="flex gap-0.5 mt-0.5">
                          {row.form.slice(-4).map((f, fi) => <FormBadge key={fi} result={f} />)}
                        </div>
                      </div>
                    </div>
                    {[row.played, row.wins, row.draws, row.losses].map((v, vi) => (
                      <span key={vi} className="text-gaffer-muted text-[11px] font-body text-center">{v}</span>
                    ))}
                    <span className="text-gaffer-orange font-display font-bold text-xs text-center">{row.points}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Previous Fixtures */}
            <section>
              <h2 className="font-display font-bold text-white text-sm tracking-wide mb-3">Previous Fixtures</h2>
              <div className="space-y-2">
                {isLoading
                  ? [0, 1, 2].map((i) => <Sk key={i} h="h-12" />)
                  : previousMatches.slice(0, 4).map((match, i) => (
                      <motion.div
                        key={match.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <MatchMiniCard match={match} onClick={() => router.push(`/app/match/${match.id}`)} />
                      </motion.div>
                    ))}
              </div>
            </section>

            {/* Top Scorer */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold text-white text-sm tracking-wide">Top Scorer</h2>
                <button
                  onClick={() => router.push(`/app/league/${leagueId}/scorers`)}
                  className="text-gaffer-orange text-xs font-body font-medium"
                >
                  See All
                </button>
              </div>
              <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
                {(data?.topPlayers ?? TOP_PLAYERS).filter((p) => p.goals > 0).slice(0, 5).map((player, i) => (
                  <div key={player.id} className="flex items-center gap-3 px-4 py-3 border-b border-gaffer-border/30 last:border-0">
                    <span className={`text-[11px] font-display font-bold w-5 text-center ${
                      i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gaffer-subtle'
                    }`}>{i + 1}</span>
                    <div className="w-8 h-8 rounded-full bg-orange-gradient-btn flex items-center justify-center text-xs text-white font-display font-bold flex-shrink-0">
                      {player.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-body font-semibold truncate">{player.name}</p>
                      <p className="text-gaffer-muted text-[10px] font-body">{player.teamName}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target size={12} className="text-gaffer-orange" />
                      <span className="text-gaffer-orange font-display font-bold text-sm">{player.goals}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div key="fixtures" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {isLoading
              ? [...Array(3)].map((_, i) => <Sk key={i} h="h-36" />)
              : matchweeks.map((mw) => (
                  <div key={mw}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-display font-bold text-gaffer-orange bg-gaffer-orange/10 border border-gaffer-orange/30 rounded-full px-3 py-0.5 tracking-widest uppercase">
                        Matchweek {mw}
                      </span>
                      {groupedByMW[mw]?.[0]?.matchDate && (
                        <span className="text-gaffer-subtle text-[9px] font-body">{groupedByMW[mw][0].matchDate}</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      {(groupedByMW[mw] ?? []).map((match, i) => (
                        <motion.div
                          key={match.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                        >
                          <MatchMiniCard match={match} onClick={() => router.push(`/app/match/${match.id}`)} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
