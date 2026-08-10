'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { getMyFantasyTeam, getLeaderboard, listGameweeks, listFantasyPlayers, getGameweekTopPlayers } from '@/lib/services/fantasy.service'
import { listFixtures } from '@/lib/services/fixture.service'
import { CountdownTimer } from '@/components/fantasy/CountdownTimer'
import { ManagerSnapshotCard } from './ManagerSnapshotCard'
import { FantasyLeaderboardWidget } from './FantasyLeaderboardWidget'
import { TopPlayersLeaderboard } from './TopPlayersLeaderboard'
import { TeamOfTheRoundWidget } from './TeamOfTheRoundWidget'
import { getGameweekState, getCurrentGameweek, computeGameweekDeadline, type GameweekState } from '@/lib/gameweekState'

const STATE_LABELS: Record<GameweekState, string> = {
  no_fixtures: 'Not Scheduled',
  upcoming: 'Upcoming',
  in_progress: 'In Progress',
  completed: 'Finished',
}

export function FantasyHomeTab({ competitionId }: { competitionId: string }) {
  const currentUserId = useAuthStore((s) => s.user?.id)

  const { data: myTeam } = useQuery({
    queryKey: ['fantasy-team-me', competitionId],
    queryFn: () => getMyFantasyTeam(competitionId),
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['fantasy-leaderboard', competitionId, 1],
    queryFn: () => getLeaderboard(competitionId, 1),
  })

  const { data: gameweeks } = useQuery({
    queryKey: ['fantasy-gameweeks', competitionId],
    queryFn: () => listGameweeks(competitionId),
  })

  const { data: fixtures = [] } = useQuery({
    queryKey: ['fixtures', competitionId],
    queryFn: () => listFixtures(competitionId),
    staleTime: 60_000,
  })

  const { data: playersRes } = useQuery({
    queryKey: ['fantasy-players', competitionId],
    queryFn: () => listFantasyPlayers(competitionId, { pageSize: 50 }),
  })

  const myRank = leaderboard?.data?.find((e) => e.userId._id === currentUserId)?.rank ?? null
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

  const { data: topPlayersRes } = useQuery({
    queryKey: ['fantasy-gw-top-players', competitionId, featuredGameweek?._id],
    queryFn: () => getGameweekTopPlayers(competitionId, featuredGameweek!._id),
    enabled: !!featuredGameweek && featuredState === 'completed',
  })

  return (
    <div className="p-4 space-y-4">
      {featuredGameweek && featuredState && (
        <div className="flex items-center justify-between px-1">
          <span className="text-white font-display font-bold text-sm uppercase tracking-wide">{featuredGameweek.name}</span>
          <span className="text-gaffer-muted text-[10px] font-black uppercase tracking-widest">Status: {STATE_LABELS[featuredState]}</span>
        </div>
      )}

      <ManagerSnapshotCard
        competitionId={competitionId}
        teamName={myTeam?.teamName ?? ''}
        totalPoints={myTeam?.totalPoints ?? 0}
        rank={myRank}
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

      <FantasyLeaderboardWidget competitionId={competitionId} />

      <TopPlayersLeaderboard players={playersRes?.data ?? []} gameweeksPlayed={gameweeksPlayed} />

      {featuredState === 'completed' && featuredGameweek && (
        <TeamOfTheRoundWidget players={topPlayersRes ?? []} roundName={featuredGameweek.name} />
      )}
    </div>
  )
}
