'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { fetchPlayerStats, type PlayerStatEntry } from '@/lib/services/stats.service'
import { ChevronRight } from 'lucide-react'

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
  if (player?.firstName) {
    return player.firstName.trim()
  }
  if (player?.name) return player.name.trim()
  if (player?.fullName) return player.fullName.trim()
  return 'Player'
}

function getInitials(name: string): string {
  if (!name) return 'P'
  return name.substring(0, 2).toUpperCase()
}

export function StatsWidget({
  leagueId,
  statType = 'goals',
}: StatsWidgetProps) {
  const [activeSectionId, setActiveSectionId] = useState(statType)

  const activeSection = STAT_SECTIONS.find((s) => s.id === activeSectionId) || STAT_SECTIONS[0]
  const collapsedSections = STAT_SECTIONS.filter((s) => s.id !== activeSection.id)

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['stats-widget', leagueId, activeSection.id],
    queryFn: () => fetchPlayerStats(leagueId, activeSection.id, 6),
    enabled: Boolean(leagueId),
  })

  const displayPlayers = players.slice(0, 6)

  return (
    <div className="w-full max-w-[380px] mx-auto mt-6 font-chakra flex flex-col gap-3">
      {/* Active Expanded Card */}
      <div className="w-full bg-[#1c2230] rounded-[20px] p-5 border border-white/5 shadow-xl flex flex-col">
        {/* Top Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white text-[16px] font-bold tracking-wide">
            {activeSection.title}
          </h3>
          <Link
            href={`/app/league/${leagueId}/stats/${activeSection.linkType}`}
            className="text-[#a78bfa] text-[13px] font-medium hover:underline flex items-center gap-0.5"
          >
            <span>See All</span>
          </Link>
        </div>

        {/* Column Headers */}
        <div className="flex justify-between items-center text-white/70 text-[12px] font-medium mb-2 px-1">
          <span>Player Name</span>
          <span>{activeSection.label}</span>
        </div>

        {/* List of Players */}
        <div className="flex flex-col">
          {isLoading ? (
            <div className="py-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 bg-white/5 rounded animate-pulse" />
              ))}
            </div>
          ) : displayPlayers.length === 0 ? (
            <div className="py-6 text-center text-[#94a3b8] text-[12px]">
              No {activeSection.label.toLowerCase()} recorded yet
            </div>
          ) : (
            displayPlayers.map((entry, idx) => {
              const player = entry.playerId || (entry as any)
              const name = getDisplayName(player)
              const photo = player?.photoUrl
              const val = getStatValue(entry, activeSection.id)
              const initials = getInitials(name)

              return (
                <div
                  key={player?._id || idx}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-b-0 hover:bg-[#242c3d]/30 px-1 transition rounded-md cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-[#242c3d] flex items-center justify-center flex-shrink-0 border border-white/10 shadow-sm">
                      {photo ? (
                        <img
                          src={photo}
                          alt={name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-[10px] font-bold">
                          {initials}
                        </span>
                      )}
                    </div>
                    <span className="text-white text-[13px] font-medium truncate">
                      {name}
                    </span>
                  </div>

                  <span className="text-white text-[14px] font-bold font-chakra ml-2">
                    {val}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Collapsed Section Bars (Figma Accordion Buttons) */}
      {collapsedSections.map((sec) => (
        <div
          key={sec.id}
          onClick={() => setActiveSectionId(sec.id)}
          className="w-full bg-[#1c2230] rounded-[16px] p-4 border border-white/5 flex justify-between items-center cursor-pointer transition hover:bg-[#242c3d] shadow-md group"
        >
          <span className="text-white text-[14px] font-bold tracking-wide">
            {sec.title}
          </span>
          <ChevronRight size={16} className="text-white/70 group-hover:translate-x-0.5 transition-transform" />
        </div>
      ))}
    </div>
  )
}
