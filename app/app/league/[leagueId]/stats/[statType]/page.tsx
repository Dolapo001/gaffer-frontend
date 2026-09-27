'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { fetchPlayerStats, type PlayerStatEntry } from '@/lib/services/stats.service'
import { getCompetition } from '@/lib/services/competition.service'
import { ChevronLeft, Triangle, Minus } from 'lucide-react'

function getStatValue(entry: PlayerStatEntry, statType: string): number {
  const norm = statType.toLowerCase()
  if (norm.includes('assist')) return entry.assists ?? 0
  if (norm.includes('clean')) return entry.cleanSheets ?? 0
  if (norm.includes('card') || norm.includes('discipline')) {
    return (entry.yellowCards ?? 0) + (entry.redCards ?? 0)
  }
  return entry.goals ?? 0
}

function getStatTitleAndLabel(statType: string): { title: string; label: string } {
  const norm = statType.toLowerCase()
  if (norm.includes('assist')) return { title: 'Top Assists', label: 'Assists' }
  // Golden Glove: goalkeepers only
  if (norm.includes('clean')) return { title: 'Clean Sheets', label: 'GK Clean Sheets' }
  if (norm.includes('card') || norm.includes('discipline')) return { title: 'Discipline', label: 'Cards' }
  return { title: 'Top Scorers', label: 'Goals' }
}

function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.[0] ?? ''
  const l = lastName?.[0] ?? ''
  if (f || l) return (f + l).toUpperCase()
  return 'P'
}

export default function StatTypeLeaderboardPage() {
  const router = useRouter()
  const { leagueId, statType } = useParams<{ leagueId: string; statType: string }>()

  const { data: competition } = useQuery({
    queryKey: ['competition', leagueId],
    queryFn: () => getCompetition(leagueId),
  })

  const realCompId = competition?._id || leagueId
  const { title, label } = getStatTitleAndLabel(statType || 'goals')

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['stats-leaderboard', realCompId, statType],
    queryFn: () => fetchPlayerStats(realCompId, statType || 'goals', 100),
    enabled: Boolean(realCompId),
  })

  const topPlayer = players[0] ?? null
  const otherPlayers = players.slice(1)

  return (
    <div className="min-h-screen bg-[#0D121F] font-chakra text-white pb-12">
      {/* Top Header */}
      <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-4 bg-[#0D121F]/95 backdrop-blur-md border-b border-white/5">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition shadow-lg"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="flex-1 text-center font-bold text-white text-[16px] tracking-wide uppercase mr-10">
          {title}
        </h1>
      </div>

      <div className="px-4 max-w-[420px] mx-auto mt-4">
        {isLoading ? (
          <div className="space-y-4 pt-4">
            <div className="h-[180px] bg-[#1c2230] rounded-[16px] animate-pulse" />
            <div className="h-[60px] bg-[#1c2230]/40 rounded-[12px] animate-pulse" />
            <div className="h-[60px] bg-[#1c2230]/40 rounded-[12px] animate-pulse" />
          </div>
        ) : players.length === 0 ? (
          <div className="p-8 text-center text-[#94a3b8] text-[14px]">
            {(statType || '').toLowerCase().includes('clean') ? 'No goalkeeper clean sheets recorded yet.' : 'No player stats recorded yet.'}
          </div>
        ) : (
          <>
            {/* Top Player Hero Card */}
            {topPlayer && (
              <div className="w-full bg-[#1c2230] rounded-[16px] p-5 relative overflow-hidden mb-6 border border-white/5 shadow-xl">
                <div className="relative z-10 w-2/3 flex flex-col justify-between min-h-[140px]">
                  {/* Team Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                      {(topPlayer.teamId as any)?.logoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={(topPlayer.teamId as any).logoUrl}
                          alt=""
                          className="w-full h-full object-contain p-0.5"
                        />
                      ) : (
                        <span className="text-white text-[9px] font-bold">
                          {topPlayer.teamId?.name?.substring(0, 2).toUpperCase() || 'TM'}
                        </span>
                      )}
                    </div>
                    <span className="text-[#94a3b8] text-[11px] font-medium uppercase tracking-wider truncate">
                      {topPlayer.teamId?.name || 'Team'}
                    </span>
                  </div>

                  {/* Player Name */}
                  <h2 className="text-white font-chakra text-[22px] font-extrabold leading-tight mb-3">
                    {topPlayer.playerId?.firstName
                      ? `${topPlayer.playerId.firstName} ${topPlayer.playerId.lastName || ''}`.trim()
                      : (topPlayer.playerId as any)?.name || (topPlayer.playerId as any)?.fullName || 'Top Player'}
                  </h2>

                  {/* Stat Value */}
                  <div>
                    <span className="text-white/60 text-[10px] uppercase font-bold tracking-widest block mb-0.5">
                      {label}
                    </span>
                    <span className="text-[#e25f05] font-chakra text-[38px] font-black leading-none">
                      {getStatValue(topPlayer, statType)}
                    </span>
                  </div>
                </div>

                {/* Right Side Player Image Pop-Out */}
                {topPlayer.playerId?.photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={topPlayer.playerId.photoUrl}
                    alt=""
                    className="absolute bottom-0 right-0 h-[120%] max-w-[50%] object-contain drop-shadow-2xl pointer-events-none"
                  />
                ) : (
                  <div className="absolute bottom-0 right-2 w-28 h-36 bg-gradient-to-t from-[#2C355A]/40 to-transparent flex items-end justify-center pb-4 opacity-30">
                    <span className="text-white text-4xl font-black">1</span>
                  </div>
                )}
              </div>
            )}

            {/* Other Players Leaderboard List */}
            {otherPlayers.length > 0 && (
              <div className="flex flex-col gap-2">
                {otherPlayers.map((entry, idx) => {
                  const player = entry.playerId || (entry as any)
                  const team = entry.teamId || (entry as any).team
                  const rank = idx + 2
                  const fullName = player?.firstName
                    ? `${player.firstName} ${player.lastName || ''}`.trim()
                    : (player as any)?.name || (player as any)?.fullName || 'Unknown Player'
                  const teamName = team?.name || team?.shortName || ''
                  const photo = player?.photoUrl
                  const val = getStatValue(entry, statType)
                  const initials = getInitials(player?.firstName, player?.lastName)
                  const trend = (entry as any).trend ?? 'same'

                  return (
                    <div
                      key={player?._id || idx}
                      className="w-full bg-[#1c2230]/60 border border-white/5 rounded-[12px] p-3 flex items-center justify-between shadow-sm hover:bg-[#1c2230] transition"
                    >
                      {/* Left: Trend + Rank + Avatar + Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Trend Indicator */}
                        <div className="w-4 flex justify-center flex-shrink-0">
                          {trend === 'up' ? (
                            <Triangle size={10} className="text-emerald-400 fill-emerald-400" />
                          ) : trend === 'down' ? (
                            <Triangle size={10} className="text-[#e25f05] fill-[#e25f05] rotate-180" />
                          ) : (
                            <Minus size={12} className="text-[#94a3b8]" />
                          )}
                        </div>

                        {/* Rank */}
                        <span className="text-[#94a3b8] text-[12px] font-bold w-4 text-center flex-shrink-0">
                          {rank}
                        </span>

                        {/* Avatar */}
                        {photo ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={photo}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#2C355A] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 border border-white/10">
                            {initials}
                          </div>
                        )}

                        {/* Player Name & Team */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-white text-[13px] font-bold truncate leading-tight">
                            {fullName}
                          </span>
                          {teamName && (
                            <span className="text-[#94a3b8] text-[10px] truncate leading-tight">
                              {teamName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Stat Number */}
                      <span className="text-white font-chakra text-[15px] font-bold ml-2">
                        {val}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
