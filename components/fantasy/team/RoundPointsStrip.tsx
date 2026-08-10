'use client'

import { useQueries } from '@tanstack/react-query'
import { format } from 'date-fns'
import type { FantasyGameweek } from '@/lib/services/fantasy.service'
import type { Fixture } from '@/lib/services/fixture.service'
import { getGameweekLeaderboard } from '@/lib/services/fantasy.service'
import { getGameweekState, getCurrentGameweek, computeGameweekDeadline } from '@/lib/gameweekState'

interface RoundPointsStripProps {
  competitionId: string
  gameweeks: FantasyGameweek[]
  fixtures: Fixture[]
  currentUserId?: string
  /** Tap a pill to view that gameweek elsewhere on the page (e.g. per-player points on the pitch). */
  selectedGameweekId?: string | null
  onSelectGameweek?: (gameweekId: string) => void
}

// Shows every gameweek the tournament has, not just completed ones. Points
// requests are bounded to gameweeks that have actually started (a season is
// ~7-8 rounds) — completed rounds get a final total, in_progress rounds get
// whatever's been scored so far (FantasyTeamGameweek is recomputed after
// every fixture finishes, not just the round's last one, so the same
// leaderboard call is naturally a live/provisional total mid-round).
export function RoundPointsStrip({ competitionId, gameweeks, fixtures, currentUserId, selectedGameweekId, onSelectGameweek }: RoundPointsStripProps) {
  const sorted = [...gameweeks].sort((a, b) => a.gameweekNumber - b.gameweekNumber)
  const currentGw = getCurrentGameweek(gameweeks, fixtures)

  const scored = sorted.filter((gw) => {
    const state = getGameweekState(gw, fixtures)
    return state === 'completed' || state === 'in_progress'
  })

  const results = useQueries({
    queries: scored.map((gw) => ({
      queryKey: ['fantasy-gw-leaderboard', competitionId, gw._id],
      queryFn: () => getGameweekLeaderboard(competitionId, gw._id, 1),
    })),
  })

  if (sorted.length === 0) {
    return (
      <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-4 text-center">
        <p className="text-gaffer-muted text-xs font-body">Fantasy gameweeks haven&apos;t been generated for this tournament yet.</p>
      </div>
    )
  }

  return (
    <div className="bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-3">
      <p className="text-gaffer-muted text-[10px] font-black uppercase tracking-widest mb-2 px-1">Round Points</p>
      <div className="flex overflow-x-auto no-scrollbar gap-2">
        {sorted.map((gw) => {
          const state = getGameweekState(gw, fixtures)
          const isSelected = selectedGameweekId === gw._id
          const isCurrent = currentGw?._id === gw._id
          const scoredIdx = scored.findIndex((g) => g._id === gw._id)
          const entry = scoredIdx >= 0
            ? results[scoredIdx]?.data?.data?.find((e) => e.fantasyTeamId.userId._id === currentUserId)
            : undefined
          const deadline = state === 'upcoming' ? computeGameweekDeadline(gw, fixtures) : null

          return (
            <button
              key={gw._id}
              type="button"
              onClick={() => onSelectGameweek?.(gw._id)}
              className={`relative flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl border transition-colors ${
                isSelected ? 'bg-gaffer-orange/10 border-2 border-gaffer-orange' : 'bg-gaffer-bg border-gaffer-border'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gaffer-orange" aria-label="Current gameweek" />
              )}
              <span className={`text-[9px] font-black uppercase ${isSelected ? 'text-gaffer-orange' : 'text-gaffer-muted'}`}>
                GW{gw.gameweekNumber}
              </span>

              {state === 'no_fixtures' && (
                <span className="text-gaffer-muted text-[8px] uppercase leading-tight text-center px-1">Not Scheduled</span>
              )}
              {state === 'upcoming' && (
                <span className="text-white font-chakra font-black text-[10px]">{deadline ? format(deadline, 'd MMM') : '—'}</span>
              )}
              {state === 'in_progress' && (
                <>
                  <span className="text-white font-chakra font-black text-sm leading-none">{entry?.netPoints ?? '-'}</span>
                  <span className="text-gaffer-orange text-[7px] font-black uppercase leading-tight mt-0.5">Live</span>
                </>
              )}
              {state === 'completed' && (
                <span className="text-white font-chakra font-black text-sm">{entry?.netPoints ?? '-'}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
