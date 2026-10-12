'use client'

import { Trophy } from 'lucide-react'
import { getImageUrl } from '@/lib/api'
import type { Competition } from '@/lib/services/competition.service'
import type { FantasyGameweek } from '@/lib/services/fantasy.service'
import type { Fixture } from '@/lib/services/fixture.service'
import { ProgressRing } from './ProgressRing'
import { CountdownTimer } from './CountdownTimer'
import { asArray } from '@/lib/asArray'
import { getGameweekState, computeGameweekDeadline } from '@/lib/gameweekState'

interface CompetitionFantasyCardProps {
  competition: Competition
  gameweeks: FantasyGameweek[]
  fixtures: Fixture[]
  onClick: () => void
}

export function CompetitionFantasyCard({ competition, gameweeks: gameweeksProp, fixtures: fixturesProp, onClick }: CompetitionFantasyCardProps) {
  const gameweeks = asArray<FantasyGameweek>(gameweeksProp)
  const fixtures = asArray<Fixture>(fixturesProp)
  const completed = gameweeks.filter((gw) => getGameweekState(gw, fixtures) === 'completed').length
  const anyInProgress = gameweeks.some((gw) => getGameweekState(gw, fixtures) === 'in_progress')
  const nextUpcoming = gameweeks
    .slice()
    .sort((a, b) => a.gameweekNumber - b.gameweekNumber)
    .find((gw) => getGameweekState(gw, fixtures) === 'upcoming')
  const nextUpcomingDeadline = nextUpcoming ? computeGameweekDeadline(nextUpcoming, fixtures) : null

  return (
    <button
      onClick={onClick}
      className="w-full bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-4 text-left transition-colors hover:border-gaffer-orange/40"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gaffer-border overflow-hidden flex items-center justify-center flex-shrink-0 glass">
          {competition.bannerUrl ? (
            <img src={getImageUrl(competition.bannerUrl)} alt="" className="w-full h-full object-cover" />
          ) : (
            <Trophy size={20} className="text-gaffer-muted" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-display font-bold text-[15px] truncate uppercase tracking-wide mb-1">
            {competition.name}
          </p>
          <p className="text-[10px] text-gaffer-muted font-black uppercase tracking-widest truncate">
            {competition.createdBy?.fullName || competition.createdBy?.email || 'Unknown organizer'}
          </p>
        </div>

        {gameweeks.length > 0 && (
          <ProgressRing completed={completed} total={gameweeks.length} className="flex-shrink-0" />
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
        {gameweeks.length === 0 ? (
          <p className="text-gaffer-muted text-xs font-body">Fantasy gameweeks haven&apos;t been generated yet</p>
        ) : nextUpcoming ? (
          nextUpcomingDeadline && nextUpcomingDeadline.getTime() > Date.now() ? (
            <CountdownTimer deadline={nextUpcomingDeadline} label={`${nextUpcoming.name} deadline`} />
          ) : (
            <p className="text-gaffer-muted text-xs font-body">{nextUpcoming.name}: awaiting kickoff</p>
          )
        ) : anyInProgress ? (
          <p className="text-gaffer-orange text-xs font-body font-bold uppercase tracking-wide">Gameweek in progress</p>
        ) : (
          <p className="text-gaffer-muted text-xs font-body">Season complete</p>
        )}
      </div>
    </button>
  )
}
