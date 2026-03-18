'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Heart, Trophy, Users, ChevronRight, Target } from 'lucide-react'
import { getCompetition } from '@/lib/services/competition.service'
import { getStandings } from '@/lib/services/standings.service'
import { listFixtures, type Fixture } from '@/lib/services/fixture.service'
import { getTopScorers, type PlayerStatEntry } from '@/lib/services/stats.service'
import { getOrgFeed, type FeedItem } from '@/lib/services/feed.service'

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  const pid = p.playerId
  return typeof pid === 'string' ? 'Player' : `${pid.firstName} ${pid.lastName}`
}

function playerTeam(p: PlayerStatEntry) {
  return typeof p.teamId === 'string' ? '' : p.teamId.name
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── Match Result Card ───────────────────────────────────────────────────────

function MatchResultCard({ fixture, onClick }: { fixture: Fixture; onClick: () => void }) {
  const home = teamLabel(fixture.homeTeamId)
  const away = teamLabel(fixture.awayTeamId)
  const { date } = formatKickoff(fixture.kickoffAt)

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden border border-gaffer-border"
    >
      <div className="relative h-32 bg-gaffer-surface">
        <div className="absolute inset-0 bg-gradient-to-t from-gaffer-surface via-gaffer-surface/60 to-transparent" />
        <div className="absolute top-2 left-3">
          <span className="text-[9px] font-display font-bold text-gaffer-orange bg-gaffer-orange/15 border border-gaffer-orange/30 px-2 py-0.5 rounded-full tracking-widest uppercase">
            Latest Result
          </span>
        </div>
        {fixture.status === 'live' && (
          <div className="absolute top-2 right-3 flex items-center gap-1 bg-red-500 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-display font-bold text-white">LIVE</span>
          </div>
        )}
      </div>

      <div className="bg-gaffer-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gaffer-orange/20 border border-gaffer-orange/30 flex items-center justify-center font-display font-bold text-gaffer-orange">
              {home.badge}
            </div>
            <p className="font-display font-bold text-white text-xs text-center leading-tight">{home.name}</p>
          </div>
          <div className="px-4 text-center">
            <p className="font-display font-black text-5xl text-white leading-none">
              {fixture.score.home}
              <span className="text-gaffer-orange mx-1 text-4xl">–</span>
              {fixture.score.away}
            </p>
            <p className="text-gaffer-muted text-[10px] font-body mt-1">{date}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-display font-bold text-blue-400">
              {away.badge}
            </div>
            <p className="font-display font-bold text-white text-xs text-center leading-tight">{away.name}</p>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LeagueDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  const [filter, setFilter] = useState<'all' | 'live' | 'scheduled'>('all')
  const [liked, setLiked] = useState(false)

  const { data: competition, isLoading: loadingComp } = useQuery({
    queryKey: ['competition', leagueId],
    queryFn: () => getCompetition(leagueId),
  })

  const { data: standingsData } = useQuery({
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

  const { data: feedData } = useQuery({
    queryKey: ['org-feed', competition?.orgId],
    queryFn: () => getOrgFeed(competition!.orgId),
    enabled: !!competition?.orgId,
    staleTime: 60_000,
  })

  const isLoading = loadingComp || loadingFixtures
  const Sk = ({ h }: { h: string }) => <div className={`bg-gaffer-card rounded-2xl animate-pulse ${h}`} />

  const standings = standingsData?.standings ?? []
  const topStandings = standings.slice(0, 5)

  const latestResult = (fixtures ?? []).find((f) => f.status === 'completed')
  const upcomingMatches = (fixtures ?? []).filter((f) => {
    if (filter === 'all') return f.status !== 'completed'
    return f.status === filter
  })

  const topPlayers = (scorers ?? []).filter((p) => (p.goals ?? 0) > 0).slice(0, 6)
  const socialPosts: FeedItem[] = ((feedData?.items ?? feedData?.data ?? []) as FeedItem[]).slice(0, 3)

  return (
    <div className="min-h-screen bg-gaffer-bg pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-gaffer-bg/95 backdrop-blur-xl border-b border-gaffer-border">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-display font-black text-white text-sm tracking-widest uppercase">
            {competition?.name ?? '...'}
          </h1>
          <button
            onClick={() => setLiked((v) => !v)}
            className={`w-9 h-9 rounded-full bg-gaffer-card border flex items-center justify-center transition-colors ${
              liked ? 'border-gaffer-orange/50 text-gaffer-orange' : 'border-gaffer-border text-gaffer-muted'
            }`}
          >
            <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Competition identity */}
        {competition && (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-orange-gradient-btn flex items-center justify-center shadow-orange-glow">
              <Trophy size={24} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gaffer-orange text-[9px] font-display font-bold uppercase tracking-widest mb-1">
                {competition.sport} · {competition.gender}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Users size={10} className="text-gaffer-muted" />
                  <span className="text-gaffer-muted text-[10px] font-body">{standings.length} teams</span>
                </div>
                <span className="text-gaffer-border text-[10px]">·</span>
                <span className={`text-[10px] font-body capitalize px-2 py-0.5 rounded-full ${
                  competition.status === 'published'
                    ? 'text-green-400 bg-green-400/10'
                    : 'text-yellow-400 bg-yellow-400/10'
                }`}>{competition.status}</span>
              </div>
            </div>
          </div>
        )}

        {/* Latest result */}
        {isLoading ? <Sk h="h-56" /> : latestResult ? (
          <MatchResultCard fixture={latestResult} onClick={() => router.push(`/app/match/${latestResult._id}`)} />
        ) : null}

        {/* Social feed */}
        {socialPosts.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-white text-sm tracking-wide mb-3">Trending</h2>
            <div className="space-y-3">
              {socialPosts.map((post, i) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex gap-3 bg-gaffer-card border border-gaffer-border rounded-2xl p-3"
                >
                  <div className="w-9 h-9 rounded-full bg-orange-gradient-btn flex-shrink-0 flex items-center justify-center text-white font-display font-bold text-xs shadow-orange-glow">
                    {post.authorType[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-white text-xs font-body font-semibold truncate capitalize">{post.authorType}</p>
                      <span className="text-gaffer-subtle text-[10px] ml-auto flex-shrink-0">{timeAgo(post.createdAt)}</span>
                    </div>
                    <p className="text-gaffer-muted text-[11px] font-body leading-relaxed line-clamp-3">{post.body}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Heart size={11} className="text-gaffer-subtle" />
                      <span className="text-gaffer-subtle text-[10px] font-body">{post.likesCount}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Upcoming fixtures */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Fixtures</h2>
            <div className="flex gap-1">
              {(['all', 'live', 'scheduled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-full text-[9px] font-display font-bold capitalize transition-all ${
                    filter === f
                      ? 'bg-orange-gradient-btn text-white shadow-orange-glow'
                      : 'bg-gaffer-card border border-gaffer-border text-gaffer-muted'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {isLoading
              ? [0, 1].map((i) => <Sk key={i} h="h-16" />)
              : upcomingMatches.slice(0, 5).map((fixture, i) => {
                  const home = teamLabel(fixture.homeTeamId)
                  const away = teamLabel(fixture.awayTeamId)
                  const { date, time } = formatKickoff(fixture.kickoffAt)
                  return (
                    <motion.button
                      key={fixture._id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => router.push(`/app/match/${fixture._id}`)}
                      className="w-full flex items-center bg-gaffer-card border border-gaffer-border rounded-2xl px-4 py-3 hover:border-gaffer-orange/40 transition-all"
                    >
                      <div className="flex-1 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gaffer-orange/20 flex items-center justify-center text-xs font-display font-bold text-gaffer-orange">
                          {home.badge}
                        </div>
                        <span className="font-body font-semibold text-white text-xs truncate">{home.short}</span>
                      </div>
                      <div className="px-3 text-center flex-shrink-0 min-w-[88px]">
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
                        <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-display font-bold text-blue-400">
                          {away.badge}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
          </div>
        </section>

        {/* Top Players */}
        {topPlayers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-white text-sm tracking-wide">Top Scorers</h2>
              <button onClick={() => router.push(`/app/league/${leagueId}/scorers`)} className="flex items-center gap-0.5 text-gaffer-orange text-xs font-body font-medium">
                See All <ChevronRight size={12} />
              </button>
            </div>
            <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[20px_1fr_52px_32px] gap-2 px-4 py-2 border-b border-gaffer-border bg-gaffer-surface">
                {['#', 'Player Name', 'Goals', 'Team'].map((h) => (
                  <span key={h} className="text-[10px] font-body font-bold text-gaffer-muted">{h}</span>
                ))}
              </div>
              {topPlayers.map((player, i) => (
                <motion.div
                  key={typeof player.playerId === 'string' ? i : player.playerId._id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-[20px_1fr_52px_32px] gap-2 items-center px-4 py-3 border-b border-gaffer-border/40 last:border-0"
                >
                  <span className="text-gaffer-subtle text-[11px] font-display font-bold">{i + 1}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-orange-gradient-btn flex items-center justify-center text-[10px] text-white font-display font-bold flex-shrink-0">
                      {playerName(player)[0]}
                    </div>
                    <p className="text-white text-[11px] font-body font-semibold truncate">{playerName(player)}</p>
                  </div>
                  <span className="text-gaffer-orange font-display font-bold text-sm text-center">{player.goals ?? 0}</span>
                  <span className="text-gaffer-subtle text-[9px] font-body truncate">{playerTeam(player).slice(0, 4)}</span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Table Standings */}
        {topStandings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-white text-sm tracking-wide">Table</h2>
              <button onClick={() => router.push(`/app/league/${leagueId}/table`)} className="flex items-center gap-0.5 text-gaffer-orange text-xs font-body font-medium">
                See All <ChevronRight size={12} />
              </button>
            </div>
            <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
              <div className="grid grid-cols-[20px_1fr_28px_28px_28px_28px_32px] items-center px-3 py-2 border-b border-gaffer-border bg-gaffer-surface">
                {['#', 'Club', 'P', 'W', 'D', 'L', 'Pts'].map((h) => (
                  <span key={h} className="text-[10px] font-body font-bold text-gaffer-muted text-center first:text-left">{h}</span>
                ))}
              </div>
              {topStandings.map((row, i) => (
                <motion.div
                  key={row.teamId._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="grid grid-cols-[20px_1fr_28px_28px_28px_28px_32px] items-center px-3 py-2.5 border-b border-gaffer-border/30 last:border-0"
                >
                  <span className={`text-[11px] font-display font-bold text-center ${i < 3 ? 'text-gaffer-orange' : 'text-gaffer-subtle'}`}>
                    {i + 1}
                  </span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-white text-[11px] font-body font-medium truncate">{row.teamId.name}</span>
                  </div>
                  {[row.played, row.won, row.drawn, row.lost].map((v, vi) => (
                    <span key={vi} className="text-gaffer-muted text-[11px] font-body text-center">{v}</span>
                  ))}
                  <span className="text-gaffer-orange font-display font-bold text-xs text-center">{row.points}</span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Goal Scorers CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(`/app/league/${leagueId}/scorers`)}
          className="w-full flex items-center justify-between bg-gaffer-card border border-gaffer-border rounded-2xl px-4 py-4 hover:border-gaffer-orange/40 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gaffer-orange/10 border border-gaffer-orange/20 flex items-center justify-center">
              <Target size={18} className="text-gaffer-orange" />
            </div>
            <div className="text-left">
              <p className="text-white font-display font-bold text-sm">Goal Scorers</p>
              <p className="text-gaffer-muted text-[10px] font-body">Top scorers this season</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gaffer-muted" />
        </motion.button>
      </div>
    </div>
  )
}
