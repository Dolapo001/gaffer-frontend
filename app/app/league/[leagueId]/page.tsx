'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Share2, Heart, Trophy, Users, Zap, ChevronRight, Target } from 'lucide-react'
import {
  LEAGUE_DETAIL,
  MATCHES,
  STANDINGS,
  TOP_PLAYERS,
  SOCIAL_POSTS,
  FANTASY_STATS,
  FANTASY_TEAM,
  type Match,
  type FantasyPlayer,
} from '@/lib/leagueMockData'

function fetchLeagueDashboard() {
  return new Promise<{
    league: typeof LEAGUE_DETAIL
    matches: typeof MATCHES
    standings: typeof STANDINGS
    topPlayers: typeof TOP_PLAYERS
    posts: typeof SOCIAL_POSTS
    fantasyTeam: typeof FANTASY_TEAM
  }>((resolve) =>
    setTimeout(() =>
      resolve({
        league: LEAGUE_DETAIL,
        matches: MATCHES,
        standings: STANDINGS,
        topPlayers: TOP_PLAYERS,
        posts: SOCIAL_POSTS,
        fantasyTeam: FANTASY_TEAM,
      }), 600)
  )
}

// ─── Team of the Week Mini Pitch ────────────────────────────────────────────

function TeamOfTheWeekPitch({ team }: { team: FantasyPlayer[] }) {
  const rows = [
    team.filter((p) => p.pitchRow === 0),
    team.filter((p) => p.pitchRow === 1),
    team.filter((p) => p.pitchRow === 2),
    team.filter((p) => p.pitchRow === 3),
  ]

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ paddingBottom: '145%' }}>
      {/* Pitch */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-700 to-green-800">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="absolute inset-x-0" style={{ top: `${i * 14.3}%`, height: '7.15%', backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.07)' : 'transparent' }} />
        ))}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 290" preserveAspectRatio="none">
          <rect x="6" y="6" width="188" height="278" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
          <line x1="6" y1="145" x2="194" y2="145" stroke="white" strokeWidth="1" opacity="0.25" />
          <circle cx="100" cy="145" r="24" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
          <rect x="55" y="6" width="90" height="40" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
          <rect x="55" y="244" width="90" height="40" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
          <rect x="75" y="6" width="50" height="18" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
          <rect x="75" y="266" width="50" height="18" fill="none" stroke="white" strokeWidth="1" opacity="0.25" />
        </svg>
      </div>

      {/* Players */}
      <div className="absolute inset-0 flex flex-col justify-around py-3 px-2">
        {rows.map((rowPlayers, ri) => (
          <div key={ri} className="flex items-center justify-around">
            {rowPlayers.map((player) => (
              <div key={player.id} className="flex flex-col items-center gap-0.5">
                <div className="w-9 h-9 rounded-full bg-orange-gradient-btn border-2 border-white/40 flex items-center justify-center text-xs text-white font-display font-bold shadow-orange-glow">
                  {player.name[0]}
                </div>
                <div className="bg-black/60 rounded px-1.5 py-0.5 text-center max-w-[48px]">
                  <p className="text-white text-[8px] font-body font-semibold leading-none truncate">{player.name}</p>
                  <p className="text-gaffer-orange text-[7px] font-body">{player.points}pts</p>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Match Result Card ───────────────────────────────────────────────────────

function MatchResultCard({ match, onClick }: { match: Match; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden border border-gaffer-border"
    >
      {/* Image banner */}
      <div className="relative h-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/news-hero.jpg" alt="match" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gaffer-surface via-gaffer-surface/60 to-transparent" />
        <div className="absolute top-2 left-3">
          <span className="text-[9px] font-display font-bold text-gaffer-orange bg-gaffer-orange/15 border border-gaffer-orange/30 px-2 py-0.5 rounded-full tracking-widest uppercase">
            Latest Result
          </span>
        </div>
        {match.status === 'live' && (
          <div className="absolute top-2 right-3 flex items-center gap-1 bg-red-500 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-display font-bold text-white">LIVE</span>
          </div>
        )}
      </div>

      {/* Score section */}
      <div className="bg-gaffer-surface px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gaffer-orange/20 border border-gaffer-orange/30 flex items-center justify-center text-lg">
              {match.homeTeam.badge}
            </div>
            <p className="font-display font-bold text-white text-xs text-center leading-tight">{match.homeTeam.name}</p>
          </div>
          <div className="px-4 text-center">
            <p className="font-display font-black text-5xl text-white leading-none">
              {match.homeScore}
              <span className="text-gaffer-orange mx-1 text-4xl">–</span>
              {match.awayScore}
            </p>
            <p className="text-gaffer-muted text-[10px] font-body mt-1">MW {match.matchweek}</p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-lg">
              {match.awayTeam.badge}
            </div>
            <p className="font-display font-bold text-white text-xs text-center leading-tight">{match.awayTeam.name}</p>
          </div>
        </div>

        {/* Scorers row */}
        {match.goalScorers && (
          <div className="mt-3 pt-3 border-t border-gaffer-border">
            <p className="text-gaffer-muted text-[10px] font-body text-center leading-relaxed line-clamp-2">
              ⚽&nbsp;
              {match.goalScorers.filter((g) => g.team === 'home').map((g) => `${g.name} ${g.minute}'`).join(', ')}
              &nbsp;&nbsp;·&nbsp;&nbsp;
              {match.goalScorers.filter((g) => g.team === 'away').map((g) => `${g.name} ${g.minute}'`).join(', ')}
            </p>
          </div>
        )}
      </div>
    </motion.button>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function LeagueDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  const [filter, setFilter] = useState<'all' | 'live' | 'fixture'>('all')
  const [liked, setLiked] = useState(false)
  const [showTOTW, setShowTOTW] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['league-dashboard', leagueId],
    queryFn: fetchLeagueDashboard,
  })

  const latestMatch = data?.matches.find((m) => m.status === 'finished')
  const upcomingMatches = (data?.matches ?? []).filter((m) =>
    filter === 'all' ? m.status !== 'finished' : m.status === filter
  )
  const topStandings = (data?.standings ?? []).slice(0, 5)
  const pitchPlayers = (data?.fantasyTeam ?? FANTASY_TEAM).filter((p) => p.isOnPitch)

  const Sk = ({ h }: { h: string }) => (
    <div className={`bg-gaffer-card rounded-2xl animate-pulse ${h}`} />
  )

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
            {data?.league.name ?? 'Bowen Fans League'}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setLiked((v) => !v)}
              className={`w-9 h-9 rounded-full bg-gaffer-card border flex items-center justify-center transition-colors ${
                liked ? 'border-gaffer-orange/50 text-gaffer-orange' : 'border-gaffer-border text-gaffer-muted'
              }`}
            >
              <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-gaffer-muted">
              <Share2 size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* League identity + special badge */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-orange-gradient-btn flex items-center justify-center shadow-orange-glow">
            <Trophy size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1 bg-gaffer-orange/15 border border-gaffer-orange/30 rounded-full px-3 py-1 mb-1">
              <Zap size={10} className="text-gaffer-orange" />
              <span className="text-[9px] font-display font-bold text-gaffer-orange tracking-widest uppercase">The Special One</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Users size={10} className="text-gaffer-muted" />
                <span className="text-gaffer-muted text-[10px] font-body">{data?.league.totalTeams ?? 8} teams</span>
              </div>
              <span className="text-gaffer-border text-[10px]">·</span>
              <span className="text-gaffer-muted text-[10px] font-body">MW {data?.league.currentMatchweek ?? 5}</span>
            </div>
          </div>
        </div>

        {/* Gameweek stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Played', value: '15/15', sub: 'picks' },
            { label: 'GW Pts', value: '0', sub: 'this week' },
            { label: 'Total', value: String(FANTASY_STATS.totalPoints), sub: 'points' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-gaffer-card border border-gaffer-border rounded-2xl py-3 px-2 text-center">
              <p className="font-display font-black text-2xl text-white leading-none">{value}</p>
              <p className="text-gaffer-orange text-[9px] font-body font-semibold mt-0.5 uppercase tracking-wide">{label}</p>
              <p className="text-gaffer-subtle text-[8px] font-body">{sub}</p>
            </div>
          ))}
        </div>

        {/* Latest match result */}
        {isLoading ? <Sk h="h-56" /> : latestMatch ? (
          <MatchResultCard match={latestMatch} onClick={() => router.push(`/app/match/${latestMatch.id}`)} />
        ) : null}

        {/* Social / Trending feed */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Trending</h2>
          </div>
          <div className="space-y-3">
            {(data?.posts ?? SOCIAL_POSTS).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-3 bg-gaffer-card border border-gaffer-border rounded-2xl p-3"
              >
                <div className="w-9 h-9 rounded-full bg-orange-gradient-btn flex-shrink-0 flex items-center justify-center text-white font-display font-bold text-xs shadow-orange-glow">
                  {post.author.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <p className="text-white text-xs font-body font-semibold truncate">{post.author.name}</p>
                    {post.author.verified && <span className="text-gaffer-orange text-[10px] flex-shrink-0">✓</span>}
                    <span className="text-gaffer-subtle text-[10px] ml-auto flex-shrink-0">{post.timeAgo}</span>
                  </div>
                  <p className="text-gaffer-muted text-[11px] font-body leading-relaxed line-clamp-3">{post.text}</p>
                  {post.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.image} alt="" className="mt-2 w-full h-24 object-cover rounded-xl" />
                  )}
                  <div className="flex items-center gap-1 mt-2">
                    <Heart size={11} className="text-gaffer-subtle" />
                    <span className="text-gaffer-subtle text-[10px] font-body">{post.likes}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Next Match / Upcoming Fixtures */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Next Match</h2>
            <div className="flex gap-1">
              {(['all', 'live', 'fixture'] as const).map((f) => (
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
              : upcomingMatches.map((match, i) => (
                  <motion.button
                    key={match.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/app/match/${match.id}`)}
                    className="w-full flex items-center bg-gaffer-card border border-gaffer-border rounded-2xl px-4 py-3 hover:border-gaffer-orange/40 transition-all"
                  >
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xl">{match.homeTeam.badge}</span>
                      <span className="font-body font-semibold text-white text-xs truncate">{match.homeTeam.shortName}</span>
                    </div>
                    <div className="px-3 text-center flex-shrink-0 min-w-[88px]">
                      {match.status === 'finished' ? (
                        <p className="font-display font-bold text-white text-base">
                          {match.homeScore} – {match.awayScore}
                        </p>
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
                      <span className="text-xl">{match.awayTeam.badge}</span>
                    </div>
                  </motion.button>
                ))}
          </div>
        </section>

        {/* Top Players */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Top Players</h2>
            <button onClick={() => router.push(`/app/league/${leagueId}/scorers`)} className="flex items-center gap-0.5 text-gaffer-orange text-xs font-body font-medium">
              See All <ChevronRight size={12} />
            </button>
          </div>
          <div className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[20px_1fr_52px_32px] gap-2 px-4 py-2 border-b border-gaffer-border bg-gaffer-surface">
              <span className="text-[10px] font-body font-bold text-gaffer-muted">#</span>
              <span className="text-[10px] font-body font-bold text-gaffer-muted">Player Name</span>
              <span className="text-[10px] font-body font-bold text-gaffer-muted text-center">Points</span>
              <span className="text-[10px] font-body font-bold text-gaffer-muted text-center">Pos</span>
            </div>
            {(data?.topPlayers ?? TOP_PLAYERS).slice(0, 6).map((player, i) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="grid grid-cols-[20px_1fr_52px_32px] gap-2 items-center px-4 py-3 border-b border-gaffer-border/40 last:border-0"
              >
                <span className="text-gaffer-subtle text-[11px] font-display font-bold">{i + 1}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-orange-gradient-btn flex items-center justify-center text-[10px] text-white font-display font-bold flex-shrink-0">
                    {player.name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-[11px] font-body font-semibold truncate">{player.name}</p>
                    <p className="text-gaffer-subtle text-[9px] font-body">{player.teamName}</p>
                  </div>
                </div>
                <span className="text-gaffer-orange font-display font-bold text-sm text-center">{player.points}</span>
                <span className={`text-[9px] font-display font-bold text-center ${
                  player.position === 'GK' ? 'text-yellow-400' :
                  player.position === 'DEF' ? 'text-blue-400' :
                  player.position === 'MID' ? 'text-green-400' : 'text-gaffer-orange'
                }`}>{player.position}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Table Standings */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Table Standings</h2>
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
                key={row.team.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[20px_1fr_28px_28px_28px_28px_32px] items-center px-3 py-2.5 border-b border-gaffer-border/30 last:border-0"
              >
                <span className={`text-[11px] font-display font-bold text-center ${row.position <= 3 ? 'text-gaffer-orange' : 'text-gaffer-subtle'}`}>
                  {row.position}
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm">{row.team.badge}</span>
                  <span className="text-white text-[11px] font-body font-medium truncate">{row.team.shortName}</span>
                </div>
                {[row.played, row.wins, row.draws, row.losses].map((v, vi) => (
                  <span key={vi} className="text-gaffer-muted text-[11px] font-body text-center">{v}</span>
                ))}
                <span className="text-gaffer-orange font-display font-bold text-xs text-center">{row.points}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team of the Week */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-white text-sm tracking-wide">Team Of The Week</h2>
            <button
              onClick={() => router.push('/app/fantasy/team')}
              className="flex items-center gap-0.5 text-gaffer-orange text-xs font-body font-medium"
            >
              My Team <ChevronRight size={12} />
            </button>
          </div>
          <AnimatePresence>
            {showTOTW ? (
              <motion.div key="pitch" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <TeamOfTheWeekPitch team={pitchPlayers} />
              </motion.div>
            ) : (
              <motion.button
                key="preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowTOTW(true)}
                className="w-full rounded-2xl overflow-hidden border border-gaffer-border relative"
                style={{ paddingBottom: '55%' }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-green-700 to-green-800 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-white/80 font-display font-bold text-sm">Tap to reveal</p>
                    <p className="text-white/50 text-xs font-body mt-1">Team of the Week</p>
                  </div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </section>

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
