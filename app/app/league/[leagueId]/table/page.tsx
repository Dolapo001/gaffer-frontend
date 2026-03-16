'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft } from 'lucide-react'
import {
  MATCHES,
  STANDINGS,
  LEAGUE_DETAIL,
  type Match,
} from '@/lib/leagueMockData'

function fetchLeagueOverview() {
  return new Promise<{ standings: typeof STANDINGS; matches: typeof MATCHES }>((resolve) =>
    setTimeout(() => resolve({ standings: STANDINGS, matches: MATCHES }), 500)
  )
}

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = { W: 'bg-green-500', D: 'bg-yellow-500', L: 'bg-red-500' }
  return (
    <span className={`w-4 h-4 rounded-sm ${colors[result]} flex items-center justify-center text-[8px] font-display font-bold text-white`}>
      {result}
    </span>
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

  const matchweeks = Array.from(new Set((data?.matches ?? []).map((m) => m.matchweek))).sort()

  const groupByMatchweek = (matches: Match[]) => {
    const grouped: Record<number, Match[]> = {}
    matches.forEach((m) => {
      if (!grouped[m.matchweek]) grouped[m.matchweek] = []
      grouped[m.matchweek].push(m)
    })
    return grouped
  }

  const grouped = groupByMatchweek(data?.matches ?? [])

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`bg-gaffer-card rounded-xl animate-pulse ${className}`} />
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
          <div>
            <h1 className="font-display font-black text-white text-sm tracking-widest uppercase">
              {LEAGUE_DETAIL.name}
            </h1>
            <p className="text-gaffer-muted text-[10px] font-body">Season {LEAGUE_DETAIL.season}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-4 pb-0">
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

      <div className="px-4 pt-4">
        {activeTab === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : (
              <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 items-center px-3 py-2.5 border-b border-gaffer-border bg-gaffer-surface">
                  {['#', 'Club', 'P', 'W', 'D', 'L', 'Pts'].map((h) => (
                    <span key={h} className="text-[10px] font-body font-bold text-gaffer-muted text-center">{h}</span>
                  ))}
                </div>
                {(data?.standings ?? []).map((row, i) => (
                  <motion.div
                    key={row.team.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 items-center px-3 py-3 border-b border-gaffer-border/30 last:border-0 hover:bg-gaffer-surface/50 transition-colors"
                  >
                    <span className={`text-[11px] font-display font-bold w-4 text-center ${
                      row.position <= 3 ? 'text-gaffer-orange' : 'text-gaffer-subtle'
                    }`}>{row.position}</span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm flex-shrink-0">{row.team.badge}</span>
                      <div className="min-w-0">
                        <p className="text-white text-[11px] font-body font-semibold truncate">{row.team.name}</p>
                        <div className="flex gap-0.5 mt-0.5">
                          {row.form.slice(-3).map((f, fi) => <FormBadge key={fi} result={f} />)}
                        </div>
                      </div>
                    </div>
                    {[row.played, row.wins, row.draws, row.losses].map((v, vi) => (
                      <span key={vi} className="text-gaffer-muted text-[11px] font-body text-center w-5">{v}</span>
                    ))}
                    <span className="text-gaffer-orange font-display font-bold text-sm text-center w-6">{row.points}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="fixtures"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {isLoading
              ? [...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)
              : matchweeks.map((mw) => (
                  <div key={mw}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-display font-bold text-gaffer-orange bg-gaffer-orange/10 border border-gaffer-orange/30 rounded-full px-3 py-0.5 tracking-widest uppercase">
                        Matchweek {mw}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {grouped[mw].map((match, i) => (
                        <motion.button
                          key={match.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => router.push(`/app/match/${match.id}`)}
                          className="w-full flex items-center bg-gaffer-card border border-gaffer-border rounded-2xl px-4 py-3 hover:border-gaffer-orange/40 transition-all"
                        >
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-xl">{match.homeTeam.badge}</span>
                            <span className="font-body font-semibold text-white text-sm">{match.homeTeam.shortName}</span>
                          </div>
                          <div className="px-3 text-center min-w-[80px]">
                            {match.status === 'finished' ? (
                              <>
                                <p className="font-display font-bold text-white text-lg">
                                  {match.homeScore} – {match.awayScore}
                                </p>
                                <p className="text-[10px] text-gaffer-muted font-body">FT</p>
                              </>
                            ) : match.status === 'live' ? (
                              <>
                                <p className="font-display font-bold text-white text-lg">
                                  {match.homeScore ?? 0} – {match.awayScore ?? 0}
                                </p>
                                <p className="text-[9px] text-red-400 font-display font-bold animate-pulse">LIVE</p>
                              </>
                            ) : (
                              <>
                                <p className="font-body text-gaffer-orange text-sm font-semibold">{match.matchTime}</p>
                                <p className="text-[10px] font-body text-gaffer-muted">{match.matchDate}</p>
                              </>
                            )}
                          </div>
                          <div className="flex-1 flex items-center justify-end gap-2">
                            <span className="font-body font-semibold text-white text-sm">{match.awayTeam.shortName}</span>
                            <span className="text-xl">{match.awayTeam.badge}</span>
                          </div>
                        </motion.button>
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
