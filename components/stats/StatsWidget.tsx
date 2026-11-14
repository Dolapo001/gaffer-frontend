'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { fetchPlayerStats, type PlayerStatEntry } from '@/lib/services/stats.service'
import { Avatar } from '@/components/match/PitchKit'

export interface StatsWidgetProps {
  leagueId: string
  title?: string
  statLabel?: string
  statType?: string
}

const STAT_SECTIONS = [
  { id: 'goals', title: 'Top Scorer', label: 'Goals', linkType: 'goals' },
  { id: 'assists', title: 'Top Assister', label: 'Assists', linkType: 'assists' },
]

function getStatValue(entry: PlayerStatEntry, statType: string): number {
  const norm = statType.toLowerCase()
  if (norm.includes('assist')) return entry.assists ?? 0
  if (norm.includes('clean')) return entry.cleanSheets ?? 0
  if (norm.includes('card') || norm.includes('discipline')) {
    return (entry.yellowCards ?? 0) + (entry.redCards ?? 0)
  }
  return entry.goals ?? 0
}

function getDisplayName(player: any): string {
  const nick = player?.displayName?.trim()
  if (nick) return nick
  const full = [player?.firstName, player?.lastName].filter(Boolean).join(' ').trim()
  return full || player?.fullName?.trim() || player?.name?.trim() || 'Player'
}

/** The top six for goals or assists, with a toggle between the two and a link to the full list. */
export function StatsWidget({ leagueId, statType = 'goals' }: StatsWidgetProps) {
  const [activeSectionId, setActiveSectionId] = useState(statType)
  const activeSection = STAT_SECTIONS.find((s) => s.id === activeSectionId) || STAT_SECTIONS[0]

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['stats-widget', leagueId, activeSection.id],
    queryFn: () => fetchPlayerStats(leagueId, activeSection.id, 6),
    enabled: Boolean(leagueId),
  })
  const displayPlayers = players.slice(0, 6)

  return (
    <section className="mx-auto mt-6 w-full max-w-[380px] overflow-hidden rounded-2xl bg-[#1B1D25]">
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
        <h3 className="font-body text-[17px] font-semibold text-white">Top players</h3>
        <Link href={`/app/league/${leagueId}/stats/${activeSection.linkType}`} className="font-body text-[13px] font-medium text-gaffer-orange">
          See all
        </Link>
      </div>
      <div className="mx-4 mb-2 grid grid-cols-2 rounded-full bg-white/[0.06] p-1" role="tablist">
        {STAT_SECTIONS.map((sec) => (
          <button
            key={sec.id}
            role="tab"
            aria-selected={sec.id === activeSection.id}
            onClick={() => setActiveSectionId(sec.id)}
            className={`rounded-full py-2 font-body text-[13px] font-semibold ${sec.id === activeSection.id ? 'bg-white text-black' : 'text-white/60'}`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3 px-4 py-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-9 animate-pulse rounded bg-white/5" />)}
        </div>
      ) : displayPlayers.length === 0 ? (
        <p className="px-4 pb-6 pt-3 text-center font-body text-sm text-white/50">No {activeSection.label.toLowerCase()} recorded yet.</p>
      ) : (
        <ol>
          {displayPlayers.map((entry, idx) => {
            const player = entry.playerId || (entry as any)
            const team = (entry as any).teamId
            return (
              <li key={player?._id || idx} className="border-t border-white/[0.06] first:border-t-0">
                <Link href={`/app/player/${player?._id}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`w-4 shrink-0 text-center font-body text-[13px] tabular-nums ${idx < 3 ? 'font-semibold text-white' : 'text-white/55'}`}>{idx + 1}</span>
                  <Avatar photoUrl={player?.photoUrl} size={34} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-body text-[15px] font-medium text-white">{getDisplayName(player)}</span>
                    {team && typeof team === 'object' && (team.name || team.shortName) && (
                      <span className="truncate font-body text-[12px] text-white/50">{team.name || team.shortName}</span>
                    )}
                  </span>
                  <span className="shrink-0 font-body text-[17px] font-semibold tabular-nums text-white">{getStatValue(entry, activeSection.id)}</span>
                </Link>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
