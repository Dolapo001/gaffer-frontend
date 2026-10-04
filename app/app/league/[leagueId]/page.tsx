'use client'

import { useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Heart, Share2 } from 'lucide-react'
import { getCompetition, listCompetitionTeams } from '@/lib/services/competition.service'
import { getStandings } from '@/lib/services/standings.service'
import { listFixtures, type Fixture } from '@/lib/services/fixture.service'
import { getOrgFeed, getGlobalFeed, type FeedItem } from '@/lib/services/feed.service'
import { getMyFantasyTeam, listGameweeks, getFantasyStats } from '@/lib/services/fantasy.service'
import { getLeaderboard } from '@/lib/services/fantasy.service'
import { getGameweekState, getCurrentGameweek, computeGameweekDeadline } from '@/lib/gameweekState'
import { format } from 'date-fns'
import { useAuthStore } from '@/store/authStore'
import { FantasyHeaderCard } from '@/components/fantasy/FantasyHeaderCard'

import { LiveMatchWidget } from '@/components/fantasy/LiveMatchWidget'
import { NewsFeedWidget } from '@/components/fantasy/NewsFeedWidget'
import { TableStandings } from '@/components/league/TableStandings'
import { NextMatchCard } from '@/components/league/NextMatchCard'
import { NextMatchWidget } from '@/components/league/NextMatchWidget'
import { StatsWidget } from '@/components/stats/StatsWidget'
import { TeamOfTheWeekWidget } from '@/components/totw/TeamOfTheWeekWidget'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function Sk({ h }: { h: string }) {
  return <div className={`bg-gaffer-card rounded-2xl animate-pulse ${h}`} />
}

function SectionHeading({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3 px-4">
      <h2 className="text-white font-display font-bold text-sm uppercase tracking-wide">{title}</h2>
      {action && onAction && (
        <button onClick={onAction} className="text-[#D2B5FF] text-[11px] font-display font-medium hover:text-white transition-colors">
          {action}
        </button>
      )}
    </div>
  )
}

function FeaturedNewsCard({ item }: { item: FeedItem }) {
  const router = useRouter()
  const hasImage = !!(item.media?.[0]?.url)
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => router.push(`/app/news/${item._id}?returnTo=${window.location.pathname}`)}
      className="bg-[#1a1b2e]/80 rounded-[24px] overflow-hidden border border-white/5 shadow-2xl cursor-pointer active:opacity-95 transition-all"
    >
      {hasImage && (
        <div className="relative h-44 bg-gaffer-card overflow-hidden">
          <img src={item.media![0].url} alt="" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b2e]/80 to-transparent" />
          <div className="absolute bottom-3 left-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-[9px] text-white/80 font-chakra font-bold">
            {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gaffer-orange rounded-full flex items-center justify-center">
            <span className="text-[8px] font-black text-white">G</span>
          </div>
          <span className="text-[10px] font-chakra font-black text-white/60 uppercase tracking-widest">
            {item.authorType === 'org' ? 'League News' : item.authorType}
          </span>
          <span className="text-white/20 text-[10px] ml-auto">{timeAgo(item.createdAt)}</span>
        </div>
        <p className="text-white font-display font-bold text-[14px] leading-snug line-clamp-2">
          {item.body.length > 100 ? item.body.slice(0, 100) + '...' : item.body}
        </p>
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <Heart size={12} className="text-white/30" />
            <span className="text-white/40 text-[10px] font-body">{item.likesCount ?? 0}</span>
          </div>
          <Share2 size={13} className="text-white/20" />
        </div>
      </div>
    </motion.div>
  )
}

function CompactFeedItem({ item, index }: { item: FeedItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex gap-3 bg-[#1a1b2e]/60 border border-white/5 rounded-2xl p-3"
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gaffer-orange to-[#E7000B] flex-shrink-0 flex items-center justify-center text-white font-display font-bold text-xs shadow-lg">
        {(item.authorType?.[0] ?? '?').toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-white text-[11px] font-body font-semibold truncate capitalize">{item.authorType}</p>
          <span className="text-white/30 text-[9px] ml-auto flex-shrink-0">{timeAgo(item.createdAt)}</span>
        </div>
        <p className="text-white/50 text-[10px] font-body leading-relaxed line-clamp-2">{item.body}</p>
      </div>
    </motion.div>
  )
}

export default function LeagueOverviewPage() {
  const router = useRouter()
  const { leagueId } = useParams<{ leagueId: string }>()
  const currentUserId = useAuthStore((s) => s.user?.id)

  const { data: competition, isLoading: loadingComp } = useQuery({
    queryKey: ['competition', leagueId],
    queryFn: () => getCompetition(leagueId),
  })

  const realCompId = competition?._id || leagueId
  // orgId is typed as a plain string on the Competition interface.
  // Guard against the (rare) case where the backend populates it as an object.
  const orgId: string | undefined = (() => {
    if (!competition) return undefined
    const raw = competition.orgId as any
    if (typeof raw === 'object' && raw?._id) return raw._id as string
    if (typeof raw === 'string' && raw.length > 0) return raw
    return undefined
  })()

  const { data: standingsData } = useQuery({
    queryKey: ['standings', realCompId],
    queryFn: () => getStandings(realCompId),
  })

  const { data: compTeams } = useQuery({
    queryKey: ['competition-teams', realCompId],
    queryFn: () => listCompetitionTeams(realCompId),
  })

  const { data: fixtures, isLoading: loadingFixtures } = useQuery({
    queryKey: ['fixtures', realCompId],
    queryFn: () => listFixtures(realCompId),
    refetchInterval: 20_000,
  })

  const { data: feedData } = useQuery({
    // Use orgId when available; fall back to leagueId which may itself be the org feed key
    queryKey: ['org-feed', orgId ?? leagueId],
    queryFn: async () => {
      const id = orgId ?? leagueId
      try {
        const result = await getOrgFeed(id)
        const items = result?.items ?? result?.data ?? []
        // If the org feed returned nothing, try treating leagueId as the org
        if (items.length === 0 && orgId && orgId !== leagueId) {
          return getOrgFeed(leagueId)
        }
        return result
      } catch {
        // Endpoint not found for this orgId — try leagueId directly
        return getOrgFeed(leagueId).catch(() => ({ items: [], data: [], total: 0, page: 1 }))
      }
    },
    enabled: true,
    staleTime: 2 * 60_000,
    refetchOnMount: true,
  })

  const { data: fantasyTeam = null } = useQuery({
    queryKey: ['fantasy-team-me', realCompId],
    queryFn: () => getMyFantasyTeam(realCompId),
    retry: false,
  })

  // Highest single-gameweek score of any manager in this competition
  const { data: fantasyStats } = useQuery({
    queryKey: ['fantasy-stats', leagueId],
    queryFn: () => getFantasyStats(leagueId),
    enabled: !!leagueId,
  })

  const { data: gameweeks = [] } = useQuery({
    queryKey: ['gameweeks', leagueId],
    queryFn: () => listGameweeks(leagueId),
    retry: false,
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['fantasy-leaderboard', realCompId, 1],
    queryFn: () => getLeaderboard(realCompId, 1),
    retry: false,
  })

  const isLoading = loadingComp || loadingFixtures
  const standings = standingsData?.standings ?? []
  const allFixtures = fixtures ?? []

  const recentAndLive = allFixtures.filter((f) => f.status === 'live' || f.status === 'completed').slice(0, 6)
  const nextMatch: Fixture | null = allFixtures.find((f) => f.status === 'scheduled') ?? null

  // ── Next Match Widget derived state ──────────────────────────────────────
  const getTeamInfo = (teamRef: any): { name: string; logo: string } => {
    if (!teamRef) return { name: 'TBD', logo: '' }
    if (typeof teamRef === 'object') {
      return {
        name: teamRef.name || teamRef.shortName || 'TBD',
        logo: teamRef.logoUrl || teamRef.logo || ''
      }
    }
    const found: any = (compTeams ?? []).find((ct: any) => ct._id === teamRef || ct.teamId === teamRef || (ct as any).team?._id === teamRef)
    if (found) {
      const t = found.team || found
      return { name: t.name || t.shortName || 'TBD', logo: t.logoUrl || t.logo || '' }
    }
    return { name: 'TBD', logo: '' }
  }

  const nextMatchHome = nextMatch ? getTeamInfo(nextMatch.homeTeamId) : null
  const nextMatchAway = nextMatch ? getTeamInfo(nextMatch.awayTeamId) : null

  const nextMatchDateTime = useMemo(() => {
    if (!nextMatch?.kickoffAt) return { day: 'TBD', time: '--:--' }
    const d = new Date(nextMatch.kickoffAt)
    if (isNaN(d.getTime())) return { day: 'TBD', time: '--:--' }
    const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    return { day: `${dayStr} ${timeStr}`, time: timeStr }
  }, [nextMatch])

  const nextMatchGameweekLabel = useMemo(() => {
    if (!nextMatch) return 'Next Match'
    if (typeof nextMatch.roundId === 'object' && (nextMatch.roundId as any)?.name) {
      return (nextMatch.roundId as any).name
    }
    return 'Next Match'
  }, [nextMatch])

  const feedItems: FeedItem[] = ((feedData?.items ?? feedData?.data ?? []) as FeedItem[]).slice(0, 5)
  const featuredNews = feedItems.find((item) => item.media && item.media.length > 0) ?? feedItems[0] ?? null
  const trendingFeed = feedItems.filter((item) => item._id !== featuredNews?._id).slice(0, 3)

  // ── Fantasy header derived state ────────────────────────────────────────
  const myRank = leaderboard?.data?.find((e: any) => e.userId._id === currentUserId)?.rank ?? null

  const sortedGameweeks = [...gameweeks].sort((a, b) => a.gameweekNumber - b.gameweekNumber)
  const featuredGameweek = gameweeks.length ? getCurrentGameweek(gameweeks, allFixtures) : undefined
  const [activeGwIndex, setActiveGwIndex] = useState<number>(() => {
    if (!featuredGameweek || !sortedGameweeks.length) return 0
    const idx = sortedGameweeks.findIndex((gw) => gw._id === featuredGameweek._id)
    return idx >= 0 ? idx : 0
  })
  const activeGw = sortedGameweeks[activeGwIndex] ?? featuredGameweek

  const activeGwDeadline = activeGw ? computeGameweekDeadline(activeGw, allFixtures) : null
  const deadlineLabel = activeGwDeadline ? format(activeGwDeadline, "do MMM · HH:mm") : null

  const gameweeksPlayed = gameweeks.filter((gw) => getGameweekState(gw, allFixtures) === 'completed').length
  const activeGwState = activeGw ? getGameweekState(activeGw, allFixtures) : 'upcoming'

  const activeGwPoints: number | string = (() => {
    if (!fantasyTeam || !activeGw) return '-'
    if (activeGwState === 'upcoming') return '-'

    const historyList = (fantasyTeam as any)?.gameweekHistory ?? (fantasyTeam as any)?.history ?? []
    const gwEntry = historyList.find(
      (h: any) =>
        (h.gameweekId && String(h.gameweekId) === String(activeGw._id)) ||
        (h.gameweek && Number(h.gameweek) === Number(activeGw.gameweekNumber))
    )

    if (gwEntry != null && typeof gwEntry.points === 'number') {
      return gwEntry.points
    }
    if (gwEntry != null && typeof gwEntry.eventPoints === 'number') {
      return gwEntry.eventPoints
    }
    if (activeGwState === 'completed' || activeGwState === 'in_progress') {
      return gwEntry?.points ?? 0
    }
    return '-'
  })()

  const startingXI: unknown[] = (fantasyTeam as any)?.startingXI ?? []
  const bench: unknown[] = (fantasyTeam as any)?.bench ?? []
  const activePlayers = startingXI.length + bench.length

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <Sk h="h-28" /><Sk h="h-20" /><Sk h="h-36" /><Sk h="h-20" /><Sk h="h-36" />
      </div>
    )
  }

  return (
    <div className="pt-4 pb-12 space-y-6 max-w-md mx-auto px-4">
      {/* Live match gradient cards — self-hides when nothing is live */}
      <LiveMatchWidget fixtures={allFixtures} onMatchClick={(id) => router.push(`/app/match/${id}`)} />

      <FantasyHeaderCard
        teamName={fantasyTeam?.teamName || 'My Team'}
        gameweekCurrent={gameweeksPlayed}
        gameweekTotal={sortedGameweeks.length || undefined}
        totalPoints={fantasyTeam ? (fantasyTeam.totalPoints ?? 0) : undefined}
        globalRank={myRank}
        teamValue={(fantasyTeam as any)?.teamValue ?? null}
        activeGameweekLabel={activeGw?.name ?? 'Gameweek'}
        activeGameweekPoints={activeGwPoints}
        activePlayers={fantasyTeam ? activePlayers : undefined}
        totalPlayers={15 /* squad size */}
        // Only meaningful once a gameweek has been scored
        highestScore={gameweeksPlayed > 0 ? (fantasyStats?.highestSC ?? null) : null}
        deadline={deadlineLabel}
        onPrevGameweek={() => setActiveGwIndex((i) => Math.max(0, i - 1))}
        onNextGameweek={() => setActiveGwIndex((i) => Math.min(sortedGameweeks.length - 1, i + 1))}
        onPointsClick={() => router.push(`/app/fantasy/${leagueId}/team`)}
        onHighestClick={() => router.push(`/app/fantasy/${leagueId}/stats`)}
      />

      {nextMatch && (
        <NextMatchWidget
          gameweek={nextMatchGameweekLabel}
          homeTeam={nextMatchHome!}
          awayTeam={nextMatchAway!}
          day={nextMatchDateTime.day}
          time={nextMatchDateTime.time}
        />
      )}

      <NewsFeedWidget
        featured={featuredNews}
        additional={trendingFeed}
        returnPath={`/app/league/${leagueId}`}
      />

      <TableStandings
        standings={standings}
        competitionTeams={compTeams}
        limit={8}
        onSeeAll={() => router.push(`/app/league/${leagueId}/standings`)}
      />

      <StatsWidget leagueId={realCompId} />

      <TeamOfTheWeekWidget leagueId={realCompId} />
    </div>
  )
}
