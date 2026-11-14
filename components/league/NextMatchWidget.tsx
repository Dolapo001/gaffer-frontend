'use client';

import { TeamBadge } from '@/components/ui/TeamBadge'

export interface Team {
  name: string;
  logo: string;
}

export interface NextMatchProps {
  gameweek?: string;
  homeTeam?: Team;
  awayTeam?: Team;
  /** The date, e.g. "Tue 17 Nov" */
  day?: string;
  /** The kick-off time, e.g. "15:00" */
  time?: string;
}

function TeamColumn({ team }: { team: Team }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <TeamBadge name={team.name} logoUrl={team.logo || null} size={44} />
      <span className="line-clamp-2 w-full text-center font-body text-[14px] font-semibold leading-[18px] text-white">{team.name}</span>
    </div>
  )
}

/** The next fixture: both teams with their full names, the date and the kick-off time (shown once). */
export const NextMatchWidget = ({ gameweek, homeTeam, awayTeam, day, time }: NextMatchProps) => {
  const hTeam = homeTeam || { name: 'To be decided', logo: '' }
  const aTeam = awayTeam || { name: 'To be decided', logo: '' }

  return (
    <section className="mx-auto mt-6 w-full max-w-[380px]">
      <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
        <h2 className="font-body text-[17px] font-semibold text-white">Next match</h2>
        {gameweek && gameweek !== 'Next Match' && <span className="truncate font-body text-[13px] text-white/55">{gameweek}</span>}
      </div>

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-start gap-2 rounded-2xl bg-[#1B1D25] px-3 py-4">
        <TeamColumn team={hTeam} />
        <div className="flex min-w-[76px] flex-col items-center gap-1 pt-2">
          <span className="font-body text-[20px] font-bold tabular-nums text-white">{time || '–'}</span>
          <span className="whitespace-nowrap font-body text-[12px] text-white/55">{day || 'Date to come'}</span>
        </div>
        <TeamColumn team={aTeam} />
      </div>
    </section>
  )
}
