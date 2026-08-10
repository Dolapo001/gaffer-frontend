'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Trophy, Gamepad2, Search } from 'lucide-react'
import { FantasyWelcome } from '@/components/fantasy/FantasyWelcome'
import { CompetitionFantasyCard } from '@/components/fantasy/CompetitionFantasyCard'
import { useFantasyStore } from '@/store/fantasyStore'
import { listJoinedCompetitions } from '@/lib/services/competition.service'
import { getFantasySeason, listGameweeks } from '@/lib/services/fantasy.service'
import { listFixtures } from '@/lib/services/fixture.service'

export default function FantasyPage() {
  const router = useRouter()
  const { hasSeenWelcome, setHasSeenWelcome } = useFantasyStore()

  const { data: joinedCompetitions, isLoading } = useQuery({
    queryKey: ['joined-competitions'],
    queryFn: listJoinedCompetitions,
  })

  const seasonQueries = useQueries({
    queries: (joinedCompetitions ?? []).map((c) => ({
      queryKey: ['fantasy-season', c._id],
      queryFn: () => getFantasySeason(c._id),
      enabled: !!joinedCompetitions,
    })),
  })

  const gameweekQueries = useQueries({
    queries: (joinedCompetitions ?? []).map((c) => ({
      queryKey: ['fantasy-gameweeks', c._id],
      queryFn: () => listGameweeks(c._id),
      enabled: !!joinedCompetitions,
    })),
  })

  const fixtureQueries = useQueries({
    queries: (joinedCompetitions ?? []).map((c) => ({
      queryKey: ['fixtures', c._id],
      queryFn: () => listFixtures(c._id),
      enabled: !!joinedCompetitions,
      staleTime: 60_000,
    })),
  })

  if (!hasSeenWelcome) {
    return <FantasyWelcome onGetStarted={() => setHasSeenWelcome(true)} />
  }

  const isLoadingSeasons = seasonQueries.some((q) => q.isLoading) || gameweekQueries.some((q) => q.isLoading)

  if (isLoading || (!!joinedCompetitions?.length && isLoadingSeasons)) {
    return (
      <div className="min-h-screen bg-[#181928] flex items-center justify-center p-6">
        <div className="w-12 h-12 rounded-full border-2 border-gaffer-orange border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!joinedCompetitions || joinedCompetitions.length === 0) {
    return (
      <div className="min-h-screen bg-[#181928] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-gaffer-card border border-gaffer-border flex items-center justify-center mb-6">
          <Trophy size={40} className="text-gaffer-muted" />
        </div>
        <h1 className="text-2xl font-display font-bold text-white mb-2">No active leagues</h1>
        <p className="text-gaffer-muted font-body text-sm mb-8">
          You need to join a competition before you can play fantasy.
        </p>
        <button
          onClick={() => router.push('/app/league')}
          className="w-full bg-gaffer-orange text-white py-4 rounded-2xl font-display font-black tracking-widest uppercase shadow-lg shadow-gaffer-orange/20"
        >
          Discover Leagues
        </button>
      </div>
    )
  }

  // Fantasy-enabled competitions only — a competition without a FantasySeason
  // has no fantasy game to play.
  const fantasyCompetitions = joinedCompetitions
    .map((c, i) => ({
      competition: c,
      season: seasonQueries[i]?.data,
      gameweeks: gameweekQueries[i]?.data ?? [],
      fixtures: fixtureQueries[i]?.data ?? [],
    }))
    .filter((entry) => !!entry.season)

  return (
    <div className="min-h-screen bg-[#181928] p-6 pb-24">
      <div className="flex items-center gap-3 mb-8 mt-12">
        <div className="w-10 h-10 rounded-xl bg-gaffer-orange flex items-center justify-center">
          <Gamepad2 size={24} className="text-[#181928]" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white leading-none">Fantasy</h1>
          <p className="text-gaffer-muted text-[10px] font-black uppercase tracking-[3px] mt-1">Select League</p>
        </div>
      </div>

      {fantasyCompetitions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gaffer-muted font-body text-sm mb-8">
            None of your joined competitions have fantasy enabled yet.
          </p>
          <button
            onClick={() => router.push('/app/league')}
            className="w-full bg-transparent border-2 border-dashed border-gaffer-border p-4 rounded-2xl flex items-center justify-center gap-3 hover:border-gaffer-orange/50 hover:bg-gaffer-orange/5 transition-all text-gaffer-muted hover:text-white"
          >
            <Search size={18} />
            <span className="font-display font-bold text-[14px] uppercase tracking-wider">Join New League</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {fantasyCompetitions.map(({ competition, gameweeks, fixtures }) => (
            <CompetitionFantasyCard
              key={competition._id}
              competition={competition}
              gameweeks={gameweeks}
              fixtures={fixtures}
              onClick={() => router.push(`/app/fantasy/${competition._id}`)}
            />
          ))}

          <button
            onClick={() => router.push('/app/league')}
            className="w-full bg-transparent border-2 border-dashed border-gaffer-border p-4 rounded-2xl flex items-center justify-center gap-3 hover:border-gaffer-orange/50 hover:bg-gaffer-orange/5 transition-all text-gaffer-muted hover:text-white"
          >
            <Search size={18} />
            <span className="font-display font-bold text-[14px] uppercase tracking-wider">Join New League</span>
          </button>
        </div>
      )}
    </div>
  )
}
