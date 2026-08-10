'use client'

import React from 'react'
import { useQueries } from '@tanstack/react-query'
import type { Fixture, FixtureEvent } from '@/lib/services/fixture.service'
import { listEvents } from '@/lib/services/fixture.service'

interface LiveMatchWidgetProps {
  fixtures: Fixture[]
  onMatchClick?: (fixtureId: string) => void
}

// ── Helpers: resolve populated-or-id-string union ──────────────────────────
function getTeamName(
  team: Fixture['homeTeamId'] | Fixture['awayTeamId'],
  fallback: string,
): string {
  if (typeof team === 'object' && team !== null) {
    return (team as any).shortName ?? (team as any).name ?? fallback
  }
  return fallback
}

function getTeamLogo(
  team: Fixture['homeTeamId'] | Fixture['awayTeamId'],
): string | null {
  if (typeof team === 'object' && team !== null) {
    return (team as any).logoUrl ?? null
  }
  return null
}

function getTeamId(team: Fixture['homeTeamId'] | Fixture['awayTeamId']): string {
  if (typeof team === 'object' && team !== null) return (team as any)._id
  return team as string
}

// ── Resolve scorer name from a FixtureEvent ────────────────────────────────
function resolveScorer(event: FixtureEvent): string {
  // 1. Pre-computed playerName field (most reliable)
  if (event.playerName) return event.playerName
  // 2. Populated playerId object
  if (typeof event.playerId === 'object' && event.playerId !== null) {
    return (event.playerId as any).firstName ?? 'Unknown'
  }
  // 3. Fall back to description
  if (event.description) return event.description
  return 'Unknown'
}

// ── Initials avatar ────────────────────────────────────────────────────────
function TeamAvatar({ name, logo }: { name: string; logo: string | null }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="max-w-full max-h-full object-contain drop-shadow-md"
      />
    )
  }
  return (
    <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
      <span className="text-white font-bold text-[18px] uppercase">
        {name.slice(0, 2)}
      </span>
    </div>
  )
}

// ── Status label ───────────────────────────────────────────────────────────
function statusLabel(status: Fixture['status']): string {
  switch (status) {
    case 'live':     return '● Live'
    case 'halftime': return '● Half Time'
    default:         return 'Live'
  }
}

export const LiveMatchWidget = ({ fixtures, onMatchClick }: LiveMatchWidgetProps) => {
  const liveFixtures = fixtures.filter(
    (f) => f.status === 'live' || f.status === 'halftime',
  )

  // Fetch goal events for every live fixture in parallel
  const eventQueries = useQueries({
    queries: liveFixtures.map((f) => ({
      queryKey: ['fixture-events', f._id],
      queryFn: () => listEvents(f._id),
      // Re-fetch every 30s while live to pick up new goals
      refetchInterval: 30_000,
      // Don't block render — just update as events arrive
      staleTime: 0,
    })),
  })

  // Hide entirely when nothing is live
  if (liveFixtures.length === 0) return null

  return (
    <div className="w-full mb-6">
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 no-scrollbar">
        {liveFixtures.map((match, idx) => {
          const homeName = getTeamName(match.homeTeamId, 'Home')
          const awayName = getTeamName(match.awayTeamId, 'Away')
          const homeLogo = getTeamLogo(match.homeTeamId)
          const awayLogo = getTeamLogo(match.awayTeamId)
          const homeId   = getTeamId(match.homeTeamId)

          // Filter goal events for this fixture
          const allEvents: FixtureEvent[] = eventQueries[idx]?.data ?? []
          const goals = allEvents.filter((e) => e.type === 'goal' || e.rawType === 'goal')

          // Split into home/away scorer lists sorted by minute
          const homeGoals = goals
            .filter((e) => {
              const tid = typeof e.teamId === 'object' ? (e.teamId as any)._id : e.teamId
              return tid === homeId
            })
            .sort((a, b) => a.minute - b.minute)

          const awayGoals = goals
            .filter((e) => {
              const tid = typeof e.teamId === 'object' ? (e.teamId as any)._id : e.teamId
              return tid !== homeId
            })
            .sort((a, b) => a.minute - b.minute)

          return (
            <div
              key={match._id}
              onClick={() => onMatchClick?.(match._id)}
              className="w-[320px] flex-shrink-0 bg-gradient-to-br from-[#4b63e1] via-[#855bd5] to-[#c764b3] rounded-[24px] p-[20px] shadow-lg snap-center flex flex-col font-chakra cursor-pointer active:opacity-90 transition-opacity"
            >
              {/* Live badge */}
              <div className="text-center text-white text-[12px] font-medium uppercase tracking-widest mb-4">
                {statusLabel(match.status)}
              </div>

              {/* Score row */}
              <div className="flex justify-between items-center w-full mb-5 px-2">
                <div className="w-[60px] h-[60px] flex items-center justify-center">
                  <TeamAvatar name={homeName} logo={homeLogo} />
                </div>

                <div className="flex flex-col items-center gap-1">
                  <div className="text-white text-[42px] font-bold leading-none tracking-tight drop-shadow-sm">
                    {match.score.home} - {match.score.away}
                  </div>
                  <div className="flex gap-3 text-white/70 text-[10px] font-medium uppercase tracking-wide">
                    <span>{homeName}</span>
                    <span>vs</span>
                    <span>{awayName}</span>
                  </div>
                </div>

                <div className="w-[60px] h-[60px] flex items-center justify-center">
                  <TeamAvatar name={awayName} logo={awayLogo} />
                </div>
              </div>

              {/* Scorers row — only renders if there are goals */}
              {goals.length > 0 && (
                <div className="flex justify-between items-start w-full px-2 mt-auto pt-2 border-t border-white/10">
                  {/* Home scorers */}
                  <div className="flex flex-col gap-1">
                    {homeGoals.map((e) => (
                      <span key={e._id} className="text-white text-[13px] font-medium drop-shadow-sm">
                        {resolveScorer(e)} {e.minute}&apos;
                      </span>
                    ))}
                  </div>
                  {/* Away scorers */}
                  <div className="flex flex-col gap-1 text-right">
                    {awayGoals.map((e) => (
                      <span key={e._id} className="text-white text-[13px] font-medium drop-shadow-sm">
                        {resolveScorer(e)} {e.minute}&apos;
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination dots for multi-match scroll */}
      {liveFixtures.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {liveFixtures.map((f) => (
            <div key={f._id} className="w-1.5 h-1.5 rounded-full bg-white/30" />
          ))}
        </div>
      )}
    </div>
  )
}
