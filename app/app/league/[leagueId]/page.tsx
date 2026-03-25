'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Heart, Share2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'

// ─── Services ─────────────────────────────────────────────────────────────────
import { getCompetition } from '@/lib/services/competition.service'
import { getStandings } from '@/lib/services/standings.service'
import { listFixtures, type Fixture } from '@/lib/services/fixture.service'
import { getTopScorers, getTopAssists } from '@/lib/services/stats.service'
import { getOrgFeed, type FeedItem } from '@/lib/services/feed.service'
import { getMyFantasyTeam, listGameweeks } from '@/lib/services/fantasy.service'

// ─── Existing league components ───────────────────────────────────────────────
import { LeagueHeader } from '@/components/league/LeagueHeader'
import { LiveMatchSection } from '@/components/league/LiveMatchSection'
import { TableStandings } from '@/components/league/TableStandings'
import { TopPlayersList } from '@/components/league/TopPlayersList'

// ─── New dashboard section components ────────────────────────────────────────
import { LeagueSummaryCard } from '@/components/league/LeagueSummaryCard'
import { GameweekSummaryCard } from '@/components/league/GameweekSummaryCard'
import { NextMatchCard } from '@/components/league/NextMatchCard'
import { TeamOfTheWeekSection } from '@/components/league/TeamOfTheWeekSection'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Sk({ h, className = '' }: { h: string; className?: string }) {
  return (
    <div
      className={`bg-gaffer-card rounded-2xl animate-pulse ${h} ${className}`}
    />
  )
}

// ─── Featured News Card ───────────────────────────────────────────────────────

function FeaturedNewsCard({ item }: { item: FeedItem }) {
  const hasImage = !!(item.media?.[0]?.url)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1a1b2e]/80 rounded-[24px] overflow-hidden border border-white/5 shadow-2xl"
    >
      {/* Image */}
      {hasImage && (
        <div className="relative h-44 bg-gaffer-card overflow-hidden">
          <img
            src={item.media![0].url}
            alt=""
            className="w-full h-full object-cover opacity-80"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b2e]/80 to-transparent" />
          {/* Date chip */}
          <div className="absolute bottom-3 left-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-[9px] text-white/80 font-chakra font-bold">
            {new Date(item.createdAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
            })}
          </div>
        </div>
      )}

      <div className="p-4 space-y-2">
        {/* Source tag */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gaffer-orange rounded-full flex items-center justify-center">
            <span className="text-[8px] font-black text-white">G</span>
          </div>
          <span className="text-[10px] font-chakra font-black text-white/60 uppercase tracking-widest">
            {item.authorType === 'org' ? 'League News' : item.authorType}
          </span>
          <span className="text-white/20 text-[10px] ml-auto">{timeAgo(item.createdAt)}</span>
        </div>

        {/* Headline */}
        <p className="text-white font-display font-bold text-[14px] leading-snug line-clamp-2">
          {item.body.length > 100 ? item.body.slice(0, 100) + '...' : item.body}
        </p>

        {/* Footer */}
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

// ─── Compact Feed Item ────────────────────────────────────────────────────────

function CompactFeedItem({ item, index }: { item: FeedItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07 }}
      className="flex gap-3 bg-[#1a1b2e]/60 border border-white/5 rounded-2xl p-3"
    >
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gaffer-orange to-[#E7000B] flex-shrink-0 flex items-center justify-center text-white font-display font-bold text-xs shadow-lg">
        {item.authorType[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-white text-[11px] font-body font-semibold truncate capitalize">
            {item.authorType}
          </p>
          <span className="text-white/30 text-[9px] ml-auto flex-shrink-0">
            {timeAgo(item.createdAt)}
          </span>
        </div>
        <p className="text-white/50 text-[10px] font-body leading-relaxed line-clamp-2">
          {item.body}
        </p>
      </div>
    </motion.div>
  )
}

// ─── Section Heading ─────────────────────────────────────────────────────────

function SectionHeading({
  title,
  action,
  onAction,
}: {
  title: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-3 px-5">
      <h2 className="text-white font-display font-bold text-sm uppercase tracking-wide">
        {title}
      </h2>
      {action && onAction && (
        <button
          onClick={onAction}
          className="text-[#D2B5FF] text-[11px] font-display font-medium hover:text-white transition-colors"
        >
          {action}
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeagueHomePage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  const { user } = useAuthStore()
  const { setActiveCompetition } = useUIStore()

  // ── Data fetching ──────────────────────────────────────────────────────────

  const { data: competition, isLoading: loadingComp } = useQuery({
    queryKey: ['competition', leagueId],
    queryFn: () => getCompetition(leagueId),
  })

  // Persist active competition so the nav stays in 4-tab mode
  useEffect(() => {
    if (!competition) return
    const orgId =
      typeof competition.orgId === 'object'
        ? (competition.orgId as any)._id
        : competition.orgId
    setActiveCompetition(leagueId, orgId)
  }, [competition, leagueId, setActiveCompetition])

  const orgId =
    typeof competition?.orgId === 'object'
      ? (competition.orgId as any)?._id
      : competition?.orgId

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

  const { data: assists } = useQuery({
    queryKey: ['top-assists', leagueId],
    queryFn: () => getTopAssists(leagueId),
  })

  const { data: feedData } = useQuery({
    queryKey: ['org-feed', orgId],
    queryFn: () => getOrgFeed(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  })

  // Fantasy data (optional — gracefully null if not set up)
  const { data: fantasyTeam = null } = useQuery({
    queryKey: ['fantasy-team-me', leagueId],
    queryFn: () => getMyFantasyTeam(leagueId),
    retry: false,
  })

  const { data: gameweeks = [] } = useQuery({
    queryKey: ['gameweeks', leagueId],
    queryFn: () => listGameweeks(leagueId),
    retry: false,
  })

  // ── Derived values ─────────────────────────────────────────────────────────

  const isLoading = loadingComp || loadingFixtures
  const standings = standingsData?.standings ?? []
  const allFixtures = fixtures ?? []

  // Live or recent matches for the top carousel
  const recentAndLive = allFixtures
    .filter((f) => f.status === 'live' || f.status === 'completed')
    .slice(0, 6)

  // Next scheduled fixture
  const nextMatch: Fixture | null =
    allFixtures.find((f) => f.status === 'scheduled') ?? null

  // Feed items — first with image is the "featured" card, rest are compact
  const feedItems: FeedItem[] = (
    (feedData?.items ?? feedData?.data ?? []) as FeedItem[]
  ).slice(0, 5)
  const featuredNews = feedItems.find((item) => item.media && item.media.length > 0) ?? feedItems[0] ?? null
  const trendingFeed = feedItems.filter((item) => item._id !== featuredNews?._id).slice(0, 3)

  // Current gameweek — latest by deadline
  const currentGameweek =
    gameweeks.length > 0
      ? [...gameweeks].sort(
          (a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()
        )[0]
      : null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#181928] pb-32">
      {/* ── Sticky minimal nav ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#181928]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white"
          >
            <ChevronLeft size={18} />
          </button>
          {competition && !isLoading && (
            <p className="text-white font-chakra font-black text-[11px] uppercase tracking-widest truncate max-w-[160px]">
              {competition.name}
            </p>
          )}
          <div className="w-9" />
        </div>
      </div>

      {/* ── Loading skeleton ─────────────────────────────────────────────── */}
      {isLoading && (
        <div className="px-4 pt-6 space-y-4">
          <Sk h="h-28" />
          <Sk h="h-20" />
          <Sk h="h-36" />
          <Sk h="h-20" />
          <Sk h="h-36" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* ── 1. League Header ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center pt-4">
            <LeagueHeader
              name={competition?.name}
              bannerUrl={competition?.bannerUrl}
            />
          </div>

          {/* ── 2. Live / Recent Match Carousel ──────────────────────────── */}
          {recentAndLive.length > 0 && (
            <div className="mb-2">
              <LiveMatchSection
                fixtures={recentAndLive}
                onCardClick={(id) => router.push(`/app/match/${id}`)}
              />
            </div>
          )}

          {/* ── 3. Fantasy Team Summary ───────────────────────────────────── */}
          <LeagueSummaryCard
            fantasyTeam={fantasyTeam}
            rank={null}
            onGoToFantasy={() =>
              router.push(`/app/fantasy?competitionId=${leagueId}`)
            }
          />

          {/* ── 4. Gameweek Summary ───────────────────────────────────────── */}
          <GameweekSummaryCard
            gameweek={currentGameweek}
            fantasyTeam={fantasyTeam}
          />

          {/* ── 5. The News ───────────────────────────────────────────────── */}
          {featuredNews && (
            <div className="px-4 mb-6">
              <SectionHeading title="The News" />
              <FeaturedNewsCard item={featuredNews} />
            </div>
          )}

          {/* ── 6. Next Match ────────────────────────────────────────────── */}
          <NextMatchCard
            fixture={nextMatch}
            onPress={(id) => router.push(`/app/match/${id}`)}
          />

          {/* ── 7. Trending Feed ─────────────────────────────────────────── */}
          {trendingFeed.length > 0 && (
            <div className="px-4 mb-6">
              <SectionHeading title="Latest" />
              <div className="space-y-3">
                {trendingFeed.map((post, i) => (
                  <CompactFeedItem key={post._id} item={post} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* ── 8. Top Performers (formation view) ───────────────────────── */}
          {scorers && scorers.length > 0 && (
            <TeamOfTheWeekSection
              players={scorers}
              statKey="goals"
              onSeeAll={() => router.push(`/app/league/${leagueId}/scorers`)}
            />
          )}

          {/* ── 9. Top Scorers list ───────────────────────────────────────── */}
          <div className="mb-2">
            <TopPlayersList
              title="Top Scorers"
              players={scorers}
              statKey="goals"
              statLabel="Goals"
              onSeeAll={() => router.push(`/app/league/${leagueId}/scorers`)}
            />
          </div>

          {/* ── 10. Top Assisters list ────────────────────────────────────── */}
          <div className="mb-2">
            <TopPlayersList
              title="Top Assisters"
              players={assists}
              statKey="assists"
              statLabel="Assists"
              onSeeAll={() => router.push(`/app/league/${leagueId}/scorers`)}
            />
          </div>

          {/* ── 11. Table Standings — preview (8 rows), full table via See All */}
          <TableStandings
            standings={standings}
            limit={8}
            onSeeAll={() => router.push(`/app/league/${leagueId}/table`)}
          />
        </>
      )}
    </div>
  )
}
