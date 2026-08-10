'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, BellOff } from 'lucide-react'
import { getStandings } from '@/lib/services/standings.service'
import { listCompetitionTeams } from '@/lib/services/competition.service'
import { followTeam, unfollowTeam, getPreferences } from '@/lib/services/notifications.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

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
        : <BellOff size={12} className="text-white/30" />}
    </button>
  )
}

export default function LeagueStandingsPage() {
  const { leagueId } = useParams<{ leagueId: string }>()
  const qc = useQueryClient()
  const toast = useToastStore()
  const [pendingTeamId, setPendingTeamId] = useState<string | null>(null)

  const { data: standingsData, isLoading } = useQuery({
    queryKey: ['standings', leagueId],
    queryFn: () => getStandings(leagueId),
  })

  const { data: compTeams } = useQuery({
    queryKey: ['competition-teams', leagueId],
    queryFn: () => listCompetitionTeams(leagueId),
  })

  const { data: prefsData } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences,
    retry: false,
  })
  const followedTeams: string[] = prefsData?.preferences?.followedTeams ?? []

  const followTeamMutation = useMutation({
    mutationFn: ({ teamId, following }: { teamId: string; following: boolean }) =>
      following ? unfollowTeam(teamId) : followTeam(teamId),
    onMutate: ({ teamId }) => setPendingTeamId(teamId),
    onSuccess: (_, { following }) => {
      setPendingTeamId(null)
      qc.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.addToast(following ? 'Unfollowed team.' : "Following team — you'll get updates!", 'success')
    },
    onError: (err) => {
      setPendingTeamId(null)
      toast.addToast(getErrorMessage(err), 'error')
    },
  })

  // Real group assignments live on CompetitionTeam.groupName (set by the admin
  // when organizing the tournament) — the Standing record itself carries no
  // group/stage field, so it must never be the source of grouping.
  const allZeroStats = !standingsData?.standings?.length && (compTeams?.length ?? 0) > 0

  const statsByTeamId = new Map(
    (standingsData?.standings ?? []).map((s) => [
      s.teamId?._id,
      { w: s.won ?? 0, d: s.drawn ?? 0, l: s.lost ?? 0, pts: s.points ?? 0 },
    ]),
  )

  const groupsMap: Record<string, any[]> = {}
  for (const t of compTeams ?? []) {
    const groupName = t.groupName || 'Ungrouped'
    if (!groupsMap[groupName]) groupsMap[groupName] = []
    const stats = statsByTeamId.get(t.teamId) ?? { w: 0, d: 0, l: 0, pts: 0 }
    groupsMap[groupName].push({ teamId: t.teamId ?? t._id ?? '', name: t.name || 'Team', ...stats })
  }

  // Display the admin's real group name as-is (uppercased for consistent
  // styling only) — never prepend "GROUP " ourselves, since admin-assigned
  // names may already read as "GROUP A" verbatim rather than a bare letter.
  const processedGroups = Object.entries(groupsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, teams]) => ({
      id: groupName,
      name: groupName.toUpperCase(),
      teams: [...teams].sort((a, b) => b.pts - a.pts),
    }))

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 rounded-full border-2 border-gaffer-orange border-t-transparent animate-spin" />
      </div>
    )
  }

  if (processedGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
        <h2 className="text-white text-lg font-bold mb-2 uppercase tracking-tight">No Teams Yet</h2>
        <p className="text-gaffer-muted text-sm max-w-xs">No teams have been added to this tournament yet.</p>
      </div>
    )
  }

  return (
    <div className="px-5 space-y-8 py-6 max-w-md mx-auto">
      {processedGroups.map((group, groupIdx) => (
        <div key={groupIdx} className="bg-gaffer-surface border border-gaffer-border rounded-2xl shadow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
            <span className="text-white text-[14px] font-black uppercase tracking-widest">{group.name}</span>
          </div>

          {allZeroStats && groupIdx === 0 && (
            <p className="text-gaffer-muted text-[10px] font-medium uppercase tracking-widest text-center mb-4">
              No matches played yet
            </p>
          )}

          <div className="flex items-center text-gaffer-muted text-[11px] font-black uppercase tracking-[0.2em] mb-4">
            <span className="flex-1">Club</span>
            <div className="flex items-center gap-4">
              <span className="w-6 text-center">W</span>
              <span className="w-6 text-center">D</span>
              <span className="w-6 text-center">L</span>
              <span className="w-10 text-right">Pts</span>
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
                  className="flex items-center py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <span className="text-white text-[14px] font-black uppercase tracking-wider truncate">{team.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[14px] font-bold text-white/90">
                    <span className="w-6 text-center">{team.w}</span>
                    <span className="w-6 text-center">{team.d}</span>
                    <span className="w-6 text-center">{team.l}</span>
                    <span className="w-10 text-right font-black text-white">{team.pts}</span>
                    <div className="w-7 flex justify-center">
                      <TeamFollowButton
                        teamId={team.teamId}
                        isFollowing={isFollowing}
                        isPending={isPending}
                        onToggle={() => followTeamMutation.mutate({ teamId: team.teamId, following: isFollowing })}
                      />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
