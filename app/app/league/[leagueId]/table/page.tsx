'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Bell, BellOff } from 'lucide-react'
import { getStandings } from '@/lib/services/standings.service'
import {
  followTeam,
  unfollowTeam,
  getPreferences,
} from '@/lib/services/notifications.service'
import { useGoBack } from '@/hooks/useGoBack'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

// ── Per-row follow button ─────────────────────────────────────────────────────

function TeamFollowButton({
  teamId,
  isFollowing,
  onToggle,
  isPending,
}: {
  teamId: string
  isFollowing: boolean
  onToggle: () => void
  isPending: boolean
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      disabled={isPending || !teamId}
      className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 border border-white/10 transition-colors hover:bg-white/10 disabled:opacity-30"
      aria-label={isFollowing ? 'Unfollow team' : 'Follow team'}
    >
      {isFollowing
        ? <Bell size={12} className="text-gaffer-orange" fill="currentColor" />
        : <BellOff size={12} className="text-white/30" />
      }
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeagueTablePage() {
  const goBack = useGoBack('/app/league')
  const params = useParams()
  const leagueId = params.leagueId as string
  const qc = useQueryClient()
  const toast = useToastStore()
  // Track which teamId is currently being toggled
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null)

  const { data: standingsData, isLoading } = useQuery({
    queryKey: ['standings', leagueId],
    queryFn: () => getStandings(leagueId),
  })

  // Fetch preferences to show correct follow state — GET /notifications/preferences
  const { data: prefsData } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences,
    retry: false,
  })
  const followedTeams: string[] = prefsData?.preferences?.followedTeams ?? []

  // Single mutation — follow/unfollow driven by current follow state
  // POST/DELETE /notifications/follow/team/:teamId
  const followTeamMutation = useMutation({
    mutationFn: ({ teamId, following }: { teamId: string; following: boolean }) =>
      following ? unfollowTeam(teamId) : followTeam(teamId),
    onMutate: ({ teamId }) => setPendingTeamId(teamId),
    onSuccess: (_, { following }) => {
      setPendingTeamId(null)
      qc.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.addToast(following ? 'Unfollowed team.' : 'Following team — you\'ll get updates!', 'success')
    },
    onError: (err) => {
      setPendingTeamId(null)
      toast.addToast(getErrorMessage(err), 'error')
    },
  })

  // Build groups, preserving teamId for follow buttons
  const processedGroups =
    standingsData?.standings && standingsData.standings.length > 0
      ? Object.values(
          standingsData.standings.reduce((acc: any, s: any) => {
            const groupName = s.stageId?.name || s.groupId?.name || 'GROUP A'
            if (!acc[groupName]) acc[groupName] = { id: groupName, name: groupName.toUpperCase(), teams: [] }
            acc[groupName].teams.push({
              teamId: s.teamId?._id ?? '',
              name: s.teamId?.shortName || s.teamId?.name || 'Team',
              w: s.won || 0,
              d: s.drawn || 0,
              l: s.lost || 0,
              pts: s.points || 0,
              status: 'qualified',
            })
            return acc
          }, {})
        )
      : []

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#10111d] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/5 border-t-gaffer-orange rounded-full animate-spin" />
      </div>
    )
  }

  if (processedGroups.length === 0) {
    return (
      <div className="min-h-screen bg-[#10111d] flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <div className="w-10 h-10 border-2 border-white/10 rounded-full" />
        </div>
        <h2 className="text-white text-xl font-bold mb-2 uppercase tracking-tight">No Rankings Yet</h2>
        <p className="text-white/40 text-sm max-w-xs font-medium">
          Standings for this tournament haven't been calculated yet.
        </p>
        <button
          onClick={goBack}
          className="mt-8 text-gaffer-orange font-black uppercase tracking-[0.2em] text-xs"
        >
          Go Back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#10111d] pb-10">
      {/* Header */}
      <div className="pt-12 pb-6 px-4 sticky top-0 bg-[#10111d]/90 backdrop-blur-md z-40">
        <div className="flex items-center justify-between relative max-w-md mx-auto">
          <button onClick={goBack} className="text-white p-1 hover:text-gaffer-orange transition-colors">
            <ChevronLeft size={28} />
          </button>
          <h1 className="absolute left-1/2 -translate-x-1/2 text-white text-[22px] font-black uppercase tracking-tight">
            Tables
          </h1>
          <div className="w-8" />
        </div>
      </div>

      <div className="px-5 space-y-12 mt-4 max-w-md mx-auto">
        {(processedGroups as any[]).map((group, groupIdx) => (
          <div key={groupIdx} className="flex flex-col">
            <h2 className="text-center text-white text-[16px] font-bold tracking-tight mb-4">
              Table Standings
            </h2>

            <div className="bg-[#1a2138]/60 border border-white/[0.03] rounded-[24px] p-6 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                <span className="text-white text-[14px] font-black uppercase tracking-widest leading-none">
                  {group.name}
                </span>
              </div>

              <div className="flex items-center text-white/40 text-[11px] font-black uppercase tracking-[0.2em] mb-4">
                <span className="flex-1">Club</span>
                <div className="flex items-center gap-4">
                  <span className="w-6 text-center">W</span>
                  <span className="w-6 text-center">D</span>
                  <span className="w-6 text-center">L</span>
                  <span className="w-10 text-right">Poin</span>
                  <span className="w-7 text-center">Alert</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {group.teams.map((team: any, i: number) => {
                  const isFollowing = followedTeams.includes(team.teamId)
                  const isPending = pendingTeamId === team.teamId
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 + groupIdx * 0.1 }}
                      className="flex items-center py-2 border-b border-white/[0.02] last:border-0"
                    >
                      <div className="flex-1 flex items-center gap-6 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#00D1FF] shadow-[0_0_6px_#00D1FF]" />
                        <span className="text-white text-[14px] font-black uppercase tracking-wider truncate">
                          {team.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[14px] font-bold text-white/90">
                        <span className="w-6 text-center">{team.w}</span>
                        <span className="w-6 text-center">{team.d}</span>
                        <span className="w-6 text-center">{team.l}</span>
                        <span className="w-10 text-right font-black text-white italic">{team.pts}</span>
                        {/* Follow team — POST/DELETE /notifications/follow/team/:teamId */}
                        <div className="w-7 flex justify-center">
                          <TeamFollowButton
                            teamId={team.teamId}
                            isFollowing={isFollowing}
                            isPending={isPending}
                            onToggle={() =>
                              followTeamMutation.mutate({ teamId: team.teamId, following: isFollowing })
                            }
                          />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
