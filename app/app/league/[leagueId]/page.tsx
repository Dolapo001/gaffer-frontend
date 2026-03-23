'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Heart, Trophy, Users, ChevronRight, Target } from 'lucide-react'
import { getCompetition } from '@/lib/services/competition.service'
import { getStandings } from '@/lib/services/standings.service'
import { listFixtures, type Fixture } from '@/lib/services/fixture.service'
import { getTopScorers, getTopAssists, type PlayerStatEntry } from '@/lib/services/stats.service'
import { getOrgFeed, type FeedItem } from '@/lib/services/feed.service'

import { LeagueHeader } from '@/components/league/LeagueHeader'
import { LeagueTabs } from '@/components/league/LeagueTabs'
import { TableStandings } from '@/components/league/TableStandings'
import { FixturesSection } from '@/components/league/FixturesSection'
import { TopPlayersList } from '@/components/league/TopPlayersList'
import { LiveMatchSection } from '@/components/league/LiveMatchSection'

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

export default function LeagueDashboardPage() {
  const router = useRouter()
  const params = useParams()
  const leagueId = params.leagueId as string
  const [activeTab, setActiveTab] = useState<'table' | 'fixtures'>('table')
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

  const { data: assists } = useQuery({
    queryKey: ['top-assists', leagueId],
    queryFn: () => getTopAssists(leagueId),
  })

  const orgId = typeof competition?.orgId === 'object' ? (competition.orgId as any)?._id : competition?.orgId

  const { data: feedData } = useQuery({
    queryKey: ['org-feed', orgId],
    queryFn: () => getOrgFeed(orgId!),
    enabled: !!orgId,
    staleTime: 60_000,
  })

  const isLoading = loadingComp || loadingFixtures
  const Sk = ({ h }: { h: string }) => <div className={`bg-gaffer-card rounded-2xl animate-pulse ${h}`} />

  const standings = standingsData?.standings ?? []
  const latestResult = (fixtures ?? []).find((f) => f.status === 'completed')
  const liveMatch = (fixtures ?? []).find((f) => f.status === 'live')

  const socialPosts: FeedItem[] = ((feedData?.items ?? feedData?.data ?? []) as FeedItem[]).slice(0, 3)

  return (
    <div className="min-h-screen bg-[#181928] pb-28">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-[#181928]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1" /> {/* Empty center */}
          <div className="w-9" /> {/* Empty right to maintain layout */}
        </div>
      </div>

      <div className="flex flex-col items-center pt-6">
        {/* 1. Header Area */}
        <LeagueHeader name={competition?.name} bannerUrl={competition?.bannerUrl} />

        {/* 2. Live Match Section - Only shown on Table tab */}
        {activeTab === 'table' && (
          <div className="w-full">
            <LiveMatchSection
              onCardClick={(id) => router.push(`/app/match/${id}`)}
              fixtures={fixtures?.filter(f => f.status === 'live' || f.status === 'completed').slice(0, 5)}
            />
          </div>
        )}

        {/* 3. Navigation & Content Area */}
        <div className="flex flex-col items-center w-full mt-3 gap-3">
          <LeagueTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {activeTab === 'table' ? (
            <div className="flex flex-col items-center w-full gap-3">
              <TableStandings 
                standings={standings} 
                onSeeAll={() => router.push(`/app/league/${leagueId}/table`)} 
              />
              <TopPlayersList
                title="Top Scorer"
                players={scorers}
                statKey="goals"
                statLabel="Goals"
                onSeeAll={() => router.push(`/app/league/${leagueId}/scorers`)}
              />
              <TopPlayersList
                title="Top Assister"
                players={assists}
                statKey="assists"
                statLabel="Assists"
                onSeeAll={() => router.push(`/app/league/${leagueId}/scorers`)}
              />
              
              {/* Social Feed */}
              {socialPosts.length > 0 && (
                <section className="w-full px-4 mb-6">
                  <h2 className="font-display font-bold text-white text-sm tracking-wide mb-3 pl-2">Trending</h2>
                  <div className="space-y-3">
                    {socialPosts.map((post, i) => (
                      <motion.div
                        key={post._id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex gap-3 bg-[#1a1b2e]/60 border border-gaffer-border rounded-2xl p-3 backdrop-blur-sm"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#FF8904] to-[#E7000B] flex-shrink-0 flex items-center justify-center text-white font-display font-bold text-xs shadow-lg shadow-orange-500/10">
                          {post.authorType[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-white text-xs font-body font-semibold truncate capitalize">{post.authorType}</p>
                            <span className="text-gaffer-subtle text-[10px] ml-auto flex-shrink-0">{timeAgo(post.createdAt)}</span>
                          </div>
                          <p className="text-gaffer-muted text-[11px] font-body leading-relaxed line-clamp-3">{post.body}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <FixturesSection fixtures={fixtures} />
          )}
        </div>
      </div>
    </div>
  )
}
