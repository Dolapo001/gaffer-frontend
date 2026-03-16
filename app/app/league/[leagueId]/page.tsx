'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Share2, Heart, Trophy, Users, Zap } from 'lucide-react'
import {
  LEAGUE_DETAIL,
  MATCHES,
  STANDINGS,
  TOP_PLAYERS,
  SOCIAL_POSTS,
  FANTASY_STATS,
  type Match,
} from '@/lib/leagueMockData'

function fetchLeagueDashboard() {
  return new Promise<{
    league: typeof LEAGUE_DETAIL
    matches: typeof MATCHES
    standings: typeof STANDINGS
    topPlayers: typeof TOP_PLAYERS
    posts: typeof SOCIAL_POSTS
  }>((resolve) =>
    setTimeout(
      () =>
        resolve({
          league: LEAGUE_DETAIL,
          matches: MATCHES,
          standings: STANDINGS,
          topPlayers: TOP_PLAYERS,
          posts: SOCIAL_POSTS,
        }),
      600
    )
  )
}

function StatusBadge({ status }: { status: Match['status'] }) {
  if (status === 'live')
    return (
      <span className="flex items-center gap-1 text-[10px] font-display font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        LIVE
      </span>
    )
  if (status === 'finished')
    return <span className="text-[10px] font-body text-gaffer-muted">FT</span>
  return <span className="text-[10px] font-body text-gaffer-orange">Upcoming</span>
}

export default function LeagueDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  const [filter, setFilter] = useState<'all' | 'live' | 'fixture'>('all')
  const [liked, setLiked] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['league-dashboard', leagueId],
    queryFn: fetchLeagueDashboard,
  })

  const latestMatch = data?.matches.find((m) => m.status === 'finished')
  const upcomingMatches = data?.matches.filter((m) =>
    filter === 'all' ? m.status !== 'finished' : m.status === filter
  )
  const topStandings = data?.standings.slice(0, 5)

  const Skeleton = ({ className }: { className: string }) => (
    <div className={`bg-gaffer-card rounded-xl animate-pulse ${className}`} />
  )

  return (
    <div className="min-h-screen bg-gaffer-bg pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gaffer-bg/95 backdrop-blur-xl border-b border-gaffer-border">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="font-display font-black text-white text-sm tracking-widest uppercase">
            {data?.league.name ?? 'Bowen Fans League'}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiked((v) => !v)}
              className={`w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center transition-colors ${liked ? 'text-gaffer-orange border-gaffer-orange/40' : 'text-gaffer-muted'}`}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-muted">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 pt-4">
        {/* League badge */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-orange-gradient-btn flex items-center justify-center shadow-orange-glow text-2xl">
            🏆
          </div>
          <div>
            <div className="inline-flex items-center gap-1 bg-gaffer-orange/15 border border-gaffer-orange/30 rounded-full px-3 py-1 mb-1">
              <Zap size={10} className="text-gaffer-orange" />
              <span className="text-[10px] font-display font-bold text-gaffer-orange tracking-widest uppercase">
                The Special One
              </span>
            </div>
            <p className="text-gaffer-muted text-xs font-body">
              Season {data?.league.season} · Matchweek {data?.league.currentMatchweek}
            </p>
          </div>
        </div>

        {/* Fantasy quick stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'GW Points', value: FANTASY_STATS.gameweekPoints, icon: Trophy },
            { label: 'Total Pts', value: FANTASY_STATS.totalPoints, icon: Zap },
            { label: 'Teams', value: data?.league.totalTeams ?? 8, icon: Users },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-gaffer-card border border-gaffer-border rounded-2xl p-3 text-center">
              <Icon size={14} className="text-gaffer-orange mx-auto mb-1" />
              <p className="font-display font-black text-xl text-white leading-none">{value}</p>
              <p className="text-[10px] font-body text-gaffer-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Latest match result */}
        {isLoading ? (
          <Skeleton className="h-36" />
        ) : latestMatch ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => router.push(`/app/match/${latestMatch.id}`)}
            className="w-full bg-gaffer-card border border-gaffer-border rounded-2xl p-4 text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-display font-bold text-gaffer-orange tracking-widest uppercase">
                Latest Result
              </span>
              <StatusBadge status={latestMatch.status} />
            </div>
            {/* Score */}
            <div className="flex items-center justify-between">
              <div className="flex-1 text-center">
                <div className="text-2xl mb-1">{latestMatch.homeTeam.badge}</div>
                <p className="font-display font-bold text-white text-sm leading-tight">{latestMatch.homeTeam.name}</p>
              </div>
              <div className="px-4 text-center">
                <p className="font-display font-black text-4xl text-white leading-none">
                  {latestMatch.homeScore}
                  <span className="text-gaffer-orange mx-1">—</span>
                  {latestMatch.awayScore}
                </p>
                <p className="text-[10px] font-body text-gaffer-muted mt-1">MW {latestMatch.matchweek}</p>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl mb-1">{latestMatch.awayTeam.badge}</div>
                <p className="font-display font-bold text-white text-sm leading-tight">{latestMatch.awayTeam.name}</p>
              </div>
            </div>
            {/* Goal scorers */}
            {latestMatch.goalScorers && (
              <div className="mt-3 pt-3 border-t border-gaffer-border grid grid-cols-2 gap-x-2">
                <div className="space-y-0.5">
                  {latestMatch.goalScorers.filter((g) => g.team === 'home').map((g, i) => (
                    <p key={i} className="text-[11px] font-body text-gaffer-muted">
                      ⚽ {g.name} <span className="text-gaffer-subtle">{g.minute}&apos;</span>
                    </p>
                  ))}
                </div>
                <div className="space-y-0.5 text-right">
                  {latestMatch.goalScorers.filter((g) => g.team === 'away').map((g, i) => (
                    <p key={i} className="text-[11px] font-body text-gaffer-muted">
                      <span className="text-gaffer-subtle">{g.minute}&apos;</span> {g.name} ⚽
                    </p>
                  ))}
                </div>
              </div>
            )}
          </motion.button>
        ) : null}

        {/* Social Feed */}
        <section>
          <h2 className="font-display font-bold text-white text-sm tracking-wide mb-3">Trending</h2>
          <div className="space-y-3">
            {(data?.posts ?? SOCIAL_POSTS).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex gap-3 bg-gaffer-card border border-gaffer-border rounded-2xl p-3"
              >
                <div className="w-9 h-9 rounded-full bg-orange-gradient-btn flex items-center justify-center text-white font-display font-bold text-xs flex-shrink-0 shadow-orange-glow">
                  {post.author.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-white text-xs font-body font-semibold truncate">{post.author.name}</p>
                    {post.author.verified && <span className="text-gaffer-orange text-[10px]">✓</span>}
                    <span className="text-gaffer-subtle text-[10px] ml-auto flex-shrink-0">{post.timeAgo}</span>
                  </div>
                  <p className="text-gaffer-muted text-xs font-body leading-relaxed line-clamp-3">{post.text}</p>
                  {post.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.image} alt="" className="mt-2 w-full h-28 object-cover rounded-xl" />
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Heart size={12} className="text-gaffer-subtle" />
                    <span className="text-gaffer-subtle text-[10px] font-body">{post.likes}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Upcoming Fixtures */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Next Matches</h2>
            <div className="flex gap-1">
              {(['all', 'live', 'fixture'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-[10px] font-display font-bold capitalize transition-all ${
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
              ? [0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)
              : (upcomingMatches ?? []).map((match, i) => (
                  <motion.button
                    key={match.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => router.push(`/app/match/${match.id}`)}
                    className="w-full flex items-center justify-between bg-gaffer-card border border-gaffer-border rounded-xl px-4 py-3 text-left hover:border-gaffer-orange/40 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{match.homeTeam.badge}</span>
                      <span className="font-body font-semibold text-white text-xs">{match.homeTeam.shortName}</span>
                    </div>
                    <div className="text-center">
                      {match.status === 'finished' ? (
                        <span className="font-display font-bold text-white text-sm">
                          {match.homeScore} – {match.awayScore}
                        </span>
                      ) : match.status === 'live' ? (
                        <div className="flex flex-col items-center">
                          <span className="font-display font-bold text-white text-sm">
                            {match.homeScore ?? 0} – {match.awayScore ?? 0}
                          </span>
                          <span className="text-[9px] text-red-400 font-display font-bold animate-pulse">LIVE</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <span className="font-body text-gaffer-orange text-xs font-semibold">{match.matchTime}</span>
                          <span className="text-[10px] font-body text-gaffer-muted">{match.matchDate}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-body font-semibold text-white text-xs">{match.awayTeam.shortName}</span>
                      <span className="text-lg">{match.awayTeam.badge}</span>
                    </div>
                  </motion.button>
                ))}
          </div>
        </section>

        {/* Top Players */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Top Players</h2>
            <button
              onClick={() => router.push(`/app/league/${leagueId}/scorers`)}
              className="text-gaffer-orange text-xs font-body font-medium"
            >
              See All
            </button>
          </div>
          <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 border-b border-gaffer-border">
              <span className="text-[10px] font-body font-semibold text-gaffer-muted">Player Name</span>
              <span className="text-[10px] font-body font-semibold text-gaffer-muted w-12 text-center">Points</span>
              <span className="text-[10px] font-body font-semibold text-gaffer-muted w-8 text-center">Pos</span>
            </div>
            {(data?.topPlayers ?? TOP_PLAYERS).slice(0, 6).map((player, i) => (
              <div
                key={player.id}
                className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3 border-b border-gaffer-border/50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-gaffer-subtle text-xs font-body font-bold w-4 flex-shrink-0">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-orange-gradient-btn flex items-center justify-center text-[10px] text-white font-display font-bold flex-shrink-0">
                    {player.name[0]}
                  </div>
                  <p className="text-white text-xs font-body font-medium truncate">{player.name}</p>
                </div>
                <span className="text-gaffer-orange font-display font-bold text-sm w-12 text-center">{player.points}</span>
                <span className={`text-[10px] font-display font-bold w-8 text-center ${
                  player.position === 'GK' ? 'text-yellow-400' :
                  player.position === 'DEF' ? 'text-blue-400' :
                  player.position === 'MID' ? 'text-green-400' : 'text-gaffer-orange'
                }`}>{player.position}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Table Standings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Table Standings</h2>
            <button
              onClick={() => router.push(`/app/league/${leagueId}/table`)}
              className="text-gaffer-orange text-xs font-body font-medium"
            >
              See All
            </button>
          </div>
          <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 px-3 py-2 border-b border-gaffer-border">
              {['#', 'Club', 'P', 'W', 'D', 'L', 'Pts'].map((h) => (
                <span key={h} className="text-[10px] font-body font-semibold text-gaffer-muted text-center">{h}</span>
              ))}
            </div>
            {(topStandings ?? []).map((row) => (
              <div
                key={row.team.id}
                className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-2 items-center px-3 py-2.5 border-b border-gaffer-border/40 last:border-0"
              >
                <span className="text-gaffer-subtle text-[11px] font-body font-bold w-4 text-center">{row.position}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">{row.team.badge}</span>
                  <span className="text-white text-[11px] font-body font-medium truncate">{row.team.shortName}</span>
                </div>
                {[row.played, row.wins, row.draws, row.losses].map((v, i) => (
                  <span key={i} className="text-gaffer-muted text-[11px] font-body text-center w-5">{v}</span>
                ))}
                <span className="text-gaffer-orange font-display font-bold text-[12px] text-center w-6">{row.points}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Fantasy CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/app/fantasy/team')}
          className="w-full bg-orange-gradient-btn rounded-2xl p-4 flex items-center justify-between shadow-orange-glow"
        >
          <div className="text-left">
            <p className="font-display font-bold text-white text-base">Fantasy Team</p>
            <p className="text-white/70 text-xs font-body mt-0.5">GW {data?.league.currentMatchweek} · {FANTASY_STATS.gameweekPoints} pts this week</p>
          </div>
          <div className="text-3xl">⚽</div>
        </motion.button>
      </div>
    </div>
  )
}
