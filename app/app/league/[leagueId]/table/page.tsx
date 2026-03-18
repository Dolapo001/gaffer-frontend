'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Target } from 'lucide-react'
import { getCompetition } from '@/lib/services/competition.service'
import { getStandings } from '@/lib/services/standings.service'
import { listFixtures, type Fixture } from '@/lib/services/fixture.service'
import { getTopScorers, type PlayerStatEntry } from '@/lib/services/stats.service'

function teamLabel(side: Fixture['homeTeamId']) {
  if (typeof side === 'string') return { name: 'TBD', short: 'TBD', badge: '?' }
  return {
    name: side.name,
    short: side.shortName ?? side.name.split(' ')[0],
    badge: (side.shortName ?? side.name)[0].toUpperCase(),
  }
}

function formatKickoff(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  }
}

function playerName(p: PlayerStatEntry) {
  return typeof p.playerId === 'string' ? 'Player' : `${p.playerId.firstName} ${p.playerId.lastName}`
}
function playerTeam(p: PlayerStatEntry) {
  return typeof p.teamId === 'string' ? '' : p.teamId.name
}

function MatchMiniCard({ fixture, onClick }: { fixture: Fixture; onClick: () => void }) {
  const home = teamLabel(fixture.homeTeamId)
  const away = teamLabel(fixture.awayTeamId)
  const { date, time } = formatKickoff(fixture.kickoffAt)
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center bg-gaffer-card border border-gaffer-border rounded-2xl px-3 py-2.5 hover:border-gaffer-orange/40 transition-all"
    >
      <div className="flex-1 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gaffer-orange/20 flex items-center justify-center text-[10px] font-display font-bold text-gaffer-orange">
          {home.badge}
        </div>
        <span className="font-body font-semibold text-white text-xs truncate">{home.short}</span>
      </div>
      <div className="px-2 text-center flex-shrink-0 min-w-[68px]">
        {fixture.status === 'completed' ? (
          <p className="font-display font-bold text-white text-base">{fixture.score.home} – {fixture.score.away}</p>
        ) : fixture.status === 'live' ? (
          <div>
            <p className="font-display font-bold text-white text-base">{fixture.score.home} – {fixture.score.away}</p>
            <p className="text-[9px] text-red-400 font-display font-bold animate-pulse">LIVE</p>
          </div>
        ) : (
          <div>
            <p className="font-body text-gaffer-orange text-xs font-semibold">{time}</p>
            <p className="text-[9px] font-body text-gaffer-muted">{date}</p>
          </div>
        )}
      </div>
      <div className="flex-1 flex items-center justify-end gap-2">
        <span className="font-body font-semibold text-white text-xs truncate">{away.short}</span>
        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-display font-bold text-blue-400">
          {away.badge}
        </div>
      </div>
    </motion.button>
  )
}

export default function LeagueTablePage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  const [activeTab, setActiveTab] = useState<'table' | 'fixtures'>('table')

  const { data: competition } = useQuery({
    queryKey: ['competition', leagueId],
    queryFn: () => getCompetition(leagueId),
  })

  const { data: standingsData, isLoading: loadingStandings } = useQuery({
    queryKey: ['standings', leagueId],
    queryFn: () => getStandings(leagueId),
  })

  const { data: fixtures, isLoading: loadingFixtures } = useQuery({
    queryKey: ['fixtures', leagueId],
    queryFn: () => listFixtures(leagueId),
  })

  const { data: scorers } = useQuery({
    queryKey: ['top-scorers', leagueId],
    queryFn: () => getTopScorers(leagueId),
  })

  const isLoading = loadingStandings || loadingFixtures
  const Sk = ({ h }: { h: string }) => <div className={`bg-gaffer-card rounded-xl animate-pulse ${h}`} />

  const standings = standingsData?.standings ?? []
  const allFixtures = fixtures ?? []
  const completed = allFixtures.filter((f) => f.status === 'completed')
  const upcoming = allFixtures.filter((f) => f.status !== 'completed')

  // Group by kickoff date for fixtures tab
  const groupedDates: Record<string, Fixture[]> = {}
  allFixtures.forEach((f) => {
    const key = new Date(f.kickoffAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    if (!groupedDates[key]) groupedDates[key] = []
    groupedDates[key].push(f)
  })
  const dateGroups = Object.entries(groupedDates).sort((a, b) =>
    new Date(b[1][0].kickoffAt).getTime() - new Date(a[1][0].kickoffAt).getTime()
  )

  const topScorers = (scorers ?? []).filter((p) => (p.goals ?? 0) > 0).slice(0, 5)

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
              {competition?.name ?? '...'}
            </h1>
            <p className="text-gaffer-muted text-[10px] font-body capitalize">{competition?.sport ?? ''}</p>
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
            ) : standings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gaffer-muted text-sm font-body">No standings data yet</p>
              </div>
            ) : (
              <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[20px_1fr_28px_28px_28px_28px_32px] items-center px-3 py-2 border-b border-gaffer-border bg-gaffer-surface">
                  {['#', 'Club', 'P', 'W', 'D', 'L', 'Pts'].map((h) => (
                    <span key={h} className="text-[10px] font-body font-bold text-gaffer-muted text-center first:text-left">{h}</span>
                  ))}
                </div>
                {standings.map((row, i) => (
                  <motion.div
                    key={row.teamId._id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`grid grid-cols-[20px_1fr_28px_28px_28px_28px_32px] items-center px-3 py-3 border-b border-gaffer-border/30 last:border-0 ${
                      i === 0 ? 'bg-gaffer-orange/5' : ''
                    }`}
                  >
                    <span className={`text-[11px] font-display font-bold ${i < 3 ? 'text-gaffer-orange' : 'text-gaffer-subtle'}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-white text-[11px] font-body font-medium truncate">{row.teamId.name}</p>
                    </div>
                    {[row.played, row.won, row.drawn, row.lost].map((v, vi) => (
                      <span key={vi} className="text-gaffer-muted text-[11px] font-body text-center">{v}</span>
                    ))}
                    <span className="text-gaffer-orange font-display font-bold text-xs text-center">{row.points}</span>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Previous Fixtures */}
            {completed.length > 0 && (
              <section>
                <h2 className="font-display font-bold text-white text-sm tracking-wide mb-3">Previous Fixtures</h2>
                <div className="space-y-2">
                  {completed.slice(0, 4).map((f, i) => (
                    <motion.div key={f._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      <MatchMiniCard fixture={f} onClick={() => router.push(`/app/match/${f._id}`)} />
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Top Scorer */}
            {topScorers.length > 0 && (
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
                  {topScorers.map((player, i) => (
                    <div key={typeof player.playerId === 'string' ? i : player.playerId._id} className="flex items-center gap-3 px-4 py-3 border-b border-gaffer-border/30 last:border-0">
                      <span className={`text-[11px] font-display font-bold w-5 text-center ${
                        i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gaffer-subtle'
                      }`}>{i + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-orange-gradient-btn flex items-center justify-center text-xs text-white font-display font-bold flex-shrink-0">
                        {playerName(player)[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-body font-semibold truncate">{playerName(player)}</p>
                        <p className="text-gaffer-muted text-[10px] font-body">{playerTeam(player)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target size={12} className="text-gaffer-orange" />
                        <span className="text-gaffer-orange font-display font-bold text-sm">{player.goals ?? 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        ) : (
          <motion.div key="fixtures" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {isLoading
              ? [...Array(3)].map((_, i) => <Sk key={i} h="h-36" />)
              : dateGroups.map(([dateKey, group]) => (
                  <div key={dateKey}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-display font-bold text-gaffer-orange bg-gaffer-orange/10 border border-gaffer-orange/30 rounded-full px-3 py-0.5 tracking-widest uppercase">
                        {dateKey}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {group.map((f, i) => (
                        <motion.div key={f._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                          <MatchMiniCard fixture={f} onClick={() => router.push(`/app/match/${f._id}`)} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
            {!isLoading && allFixtures.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gaffer-muted text-sm font-body">No fixtures scheduled yet</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
