'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { getMyFantasyTeam, getFantasyStats, getLeaderboard, listGameweeks, listFantasyPlayers, getGameweekTopPlayers } from '@/lib/services/fantasy.service'
import { listFixtures } from '@/lib/services/fixture.service'
import { CountdownTimer } from '@/components/fantasy/CountdownTimer'
import { FantasyHeaderCard } from '@/components/fantasy/FantasyHeaderCard'
import { format } from 'date-fns'
import { FantasyLeaderboardWidget } from './FantasyLeaderboardWidget'
import { asArray } from '@/lib/asArray'
import { TopPlayersLeaderboard } from './TopPlayersLeaderboard'
import { TeamOfTheRoundWidget } from './TeamOfTheRoundWidget'
import { LiveMatchWidget } from '@/components/fantasy/LiveMatchWidget'
import { NewsFeedWidget } from '@/components/fantasy/NewsFeedWidget'
import { NextMatchWidget } from '@/components/league/NextMatchWidget'
import { TableStandings } from '@/components/league/TableStandings'
import { useCompetitionNews } from '@/hooks/useCompetitionNews'
import { getStandings } from '@/lib/services/standings.service'
import { listCompetitionTeams } from '@/lib/services/competition.service'
import { getGameweekState, getCurrentGameweek, computeGameweekDeadline, type GameweekState } from '@/lib/gameweekState'

const STATE_LABELS: Record<GameweekState, string> = {
  no_fixtures: 'Not Scheduled',
  upcoming: 'Upcoming',
  in_progress: 'In Progress',
  completed: 'Finished',
}

export function FantasyHomeTab({ competitionId }: { competitionId: string }) {
  const router = useRouter()
  const currentUserId = useAuthStore((s) => s.user?.id)
  const { news: rawNews } = useCompetitionNews(competitionId)
  const news = asArray<any>(rawNews)
  const [activeGwIndex, setActiveGwIndex] = useState<number | null>(null)

  const { data: standingsData } = useQuery({
    queryKey: ['standings', competitionId],
    queryFn: () => getStandings(competitionId),
  })
  const { data: compTeams } = useQuery({
    queryKey: ['competition-teams', competitionId],
    queryFn: () => listCompetitionTeams(competitionId),
  })

  const { data: myTeam } = useQuery({
    queryKey: ['fantasy-team-me', competitionId],
    queryFn: () => getMyFantasyTeam(competitionId),
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['fantasy-leaderboard', competitionId, 1],
    queryFn: () => getLeaderboard(competitionId, 1),
  })

  const { data: gameweeksRaw } = useQuery({
    queryKey: ['fantasy-gameweeks', competitionId],
    queryFn: () => listGameweeks(competitionId),
  })

  const gameweeks = gameweeksRaw === undefined ? undefined : asArray<any>(gameweeksRaw)

  const { data: fixturesRaw = [] } = useQuery({
    queryKey: ['fixtures', competitionId],
    queryFn: () => listFixtures(competitionId),
    staleTime: 60_000,
  })

  const { data: playersRes } = useQuery({
    queryKey: ['fantasy-players', competitionId],
    queryFn: () => listFantasyPlayers(competitionId, { pageSize: 50 }),
  })

  const fixtures = asArray<any>(fixturesRaw)
  const myRank = asArray<any>(leaderboard?.data).find((e) => e.userId._id === currentUserId)?.rank ?? null
  const gameweeksPlayed = (gameweeks ?? []).filter((gw) => getGameweekState(gw, fixtures) === 'completed').length

  // Round/status label + Team of the Round feature the "current" gameweek:
  // the earliest one that isn't finished, falling back to the last completed
  // one once the whole competition is done.
  const featuredGameweek = gameweeks?.length ? getCurrentGameweek(gameweeks, fixtures) : undefined
  const featuredState: GameweekState | null = featuredGameweek ? getGameweekState(featuredGameweek, fixtures) : null

  // The nearest gameweek that hasn't kicked off at all yet — the one a
  // deadline countdown makes sense for. Can differ from featuredGameweek
  // (e.g. the current one is in_progress while a later one is still upcoming).
  const nextUpcoming = (gameweeks ?? [])
    .slice()
    .sort((a, b) => a.gameweekNumber - b.gameweekNumber)
    .find((gw) => getGameweekState(gw, fixtures) === 'upcoming')
  const nextUpcomingDeadline = nextUpcoming ? computeGameweekDeadline(nextUpcoming, fixtures) : null

  const { data: fantasyStats } = useQuery({
    queryKey: ['fantasy-stats', competitionId],
    queryFn: () => getFantasyStats(competitionId),
    retry: false,
  })

  // Gameweek card: user can page through gameweeks, defaulting to the current one.
  const sortedGameweeks = (gameweeks ?? []).slice().sort((a, b) => a.gameweekNumber - b.gameweekNumber)
  const defaultGwIndex = Math.max(0, sortedGameweeks.findIndex((gw) => gw._id === featuredGameweek?._id))
  const gwIndex = Math.min(activeGwIndex ?? defaultGwIndex, Math.max(0, sortedGameweeks.length - 1))
  const activeGw = sortedGameweeks[gwIndex]
  const activeGwState = activeGw ? getGameweekState(activeGw, fixtures) : 'upcoming'
  const activeGwDeadline = activeGw ? computeGameweekDeadline(activeGw, fixtures) : null
  const activeGwPoints: number | string = (() => {
    if (!myTeam || !activeGw || activeGwState === 'upcoming') return '-'
    const history: any[] = (myTeam as any).gameweekHistory ?? (myTeam as any).history ?? []
    const entry = history.find(
      (h) =>
        (h.gameweekId && String(h.gameweekId) === String(activeGw._id)) ||
        (h.gameweek && Number(h.gameweek) === Number(activeGw.gameweekNumber))
    )
    return entry?.points ?? entry?.eventPoints ?? 0
  })()
  const squadCount = ((myTeam as any)?.startingXI?.length ?? 0) + ((myTeam as any)?.bench?.length ?? 0)

  const { data: topPlayersRes } = useQuery({
    queryKey: ['fantasy-gw-top-players', competitionId, featuredGameweek?._id],
    queryFn: () => getGameweekTopPlayers(competitionId, featuredGameweek!._id),
    enabled: !!featuredGameweek && featuredState === 'completed',
  })

  const nextMatch = fixtures.find((f) => f.status === 'scheduled') ?? null
  const teamInfo = (ref: any): { name: string; logo: string } => {
    if (ref && typeof ref === 'object') return { name: ref.name || ref.shortName || 'TBD', logo: ref.logoUrl || ref.logo || '' }
    const found: any = (compTeams ?? []).find((ct: any) => ct._id === ref || ct.teamId === ref || ct.team?._id === ref)
    const t = found?.team || found
    return { name: t?.name || t?.shortName || 'TBD', logo: t?.logoUrl || t?.logo || '' }
  }
  const kickoff = nextMatch?.kickoffAt ? new Date(nextMatch.kickoffAt) : null
  const kickoffValid = !!kickoff && !isNaN(kickoff.getTime())
  const kickoffTime = kickoffValid ? kickoff!.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'
  const kickoffDay = kickoffValid ? `${kickoff!.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} ${kickoffTime}` : 'TBD'
  const nextRound = nextMatch && typeof nextMatch.roundId === 'object' ? (nextMatch.roundId as any)?.name : undefined

  return (
    <div className="p-4 space-y-4">
      <LiveMatchWidget fixtures={fixtures} onMatchClick={(id) => router.push(`/app/match/${id}`)} />

      {featuredGameweek && featuredState && (
        <div className="flex items-center justify-between px-1">
          <span className="text-white font-display font-bold text-sm uppercase tracking-wide">{featuredGameweek.name}</span>
          <span className="text-gaffer-muted text-[10px] font-black uppercase tracking-widest">Status: {STATE_LABELS[featuredState]}</span>
        </div>
      )}

      <FantasyHeaderCard
        teamName={myTeam?.teamName || 'My Team'}
        gameweekCurrent={gameweeksPlayed}
        gameweekTotal={sortedGameweeks.length || undefined}
        totalPoints={myTeam ? (myTeam.totalPoints ?? 0) : undefined}
        globalRank={myRank}
        teamValue={(myTeam as any)?.teamValue ?? null}
        activeGameweekLabel={activeGw?.name ?? 'Gameweek'}
        activeGameweekPoints={activeGwPoints}
        activePlayers={myTeam ? squadCount : undefined}
        totalPlayers={15}
        highestScore={gameweeksPlayed > 0 ? (fantasyStats?.highestSC ?? null) : null}
        deadline={activeGwDeadline ? format(activeGwDeadline, 'do MMM · HH:mm') : null}
        onPrevGameweek={() => setActiveGwIndex(Math.max(0, gwIndex - 1))}
        onNextGameweek={() => setActiveGwIndex(Math.min(sortedGameweeks.length - 1, gwIndex + 1))}
        onPointsClick={() => router.push(`/app/fantasy/${competitionId}/team`)}
        onHighestClick={() => router.push(`/app/fantasy/${competitionId}/stats`)}
      />

      {!gameweeks?.length ? (
        <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-4 text-center">
          <p className="text-gaffer-muted text-xs font-body">Fantasy gameweeks haven&apos;t been generated for this tournament yet.</p>
        </div>
      ) : nextUpcoming ? (
        <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-4 flex justify-center">
          {nextUpcomingDeadline && nextUpcomingDeadline.getTime() > Date.now() ? (
            <CountdownTimer deadline={nextUpcomingDeadline} label={`${nextUpcoming.name} deadline`} />
          ) : (
            <p className="text-gaffer-muted text-xs font-body">{nextUpcoming.name}: awaiting kickoff</p>
          )}
        </div>
      ) : null}

      <NewsFeedWidget
        featured={news[0] ?? null}
        additional={news.slice(1, 4)}
        returnPath={`/app/fantasy/${competitionId}`}
      />

      {nextMatch && (
        <NextMatchWidget
          gameweek={nextRound ?? 'Next Match'}
          homeTeam={teamInfo(nextMatch.homeTeamId)}
          awayTeam={teamInfo(nextMatch.awayTeamId)}
          day={kickoffDay}
          time={kickoffTime}
        />
      )}

      <FantasyLeaderboardWidget competitionId={competitionId} />

      <TopPlayersLeaderboard players={asArray<any>(playersRes?.data)} gameweeksPlayed={gameweeksPlayed} />

      <TableStandings
        standings={standingsData?.standings ?? []}
        competitionTeams={compTeams}
        limit={5}
        onSeeAll={() => router.push(`/app/league/${competitionId}/standings`)}
      />

      {featuredState === 'completed' && featuredGameweek && (
        <TeamOfTheRoundWidget players={topPlayersRes ?? []} roundName={featuredGameweek.name} />
      )}
    </div>
  )
}
