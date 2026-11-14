'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { TeamBadge } from '@/components/ui/TeamBadge'
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
      className="flex h-8 w-7 items-center justify-center disabled:opacity-30"
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
      { p: s.played ?? 0, w: s.won ?? 0, d: s.drawn ?? 0, l: s.lost ?? 0, gf: s.goalsFor ?? 0, gd: s.goalDifference ?? 0, pts: s.points ?? 0, logoUrl: s.teamId?.logoUrl },
    ]),
  )

  const groupsMap: Record<string, any[]> = {}
  for (const t of compTeams ?? []) {
    const groupName = t.groupName || 'Ungrouped'
    if (!groupsMap[groupName]) groupsMap[groupName] = []
    const stats = statsByTeamId.get(t.teamId) ?? { p: 0, w: 0, d: 0, l: 0, gf: 0, gd: 0, pts: 0, logoUrl: undefined }
    groupsMap[groupName].push({ teamId: t.teamId ?? t._id ?? '', name: t.name || 'Team', ...stats, logoUrl: stats.logoUrl || (t as any).logoUrl })
  }

  // Display the admin's real group name as-is (uppercased for consistent
  // styling only) — never prepend "GROUP " ourselves, since admin-assigned
  // names may already read as "GROUP A" verbatim rather than a bare letter.
  const processedGroups = Object.entries(groupsMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, teams]) => ({
      id: groupName,
      name: groupName === 'Ungrouped' ? 'Table' : groupName,
      teams: [...teams].sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name)),
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
        <h2 className="mb-2 font-body text-[17px] font-semibold text-white">No teams yet</h2>
        <p className="max-w-xs font-body text-sm text-white/55">The table appears once the organiser adds teams to this tournament.</p>
      </div>
    )
  }

  const cols = 'w-[22px] shrink-0 text-center tabular-nums'

  return (
    <div className="mx-auto max-w-md space-y-4 px-3 py-4">
      {allZeroStats && (
        <p className="text-center font-body text-[13px] text-white/50">No matches played yet.</p>
      )}
      {processedGroups.map((group) => (
        <section key={group.id} className="overflow-hidden rounded-2xl bg-[#1B1D25]">
          <h2 className="px-4 pb-2 pt-4 font-body text-[15px] font-semibold text-white">{group.name}</h2>

          <div className="flex items-center gap-1 px-3 pb-1.5 font-body text-[12px] font-medium text-white/45">
            <span className="w-5 shrink-0 text-center">#</span>
            <span className="min-w-0 flex-1 pl-1">Team</span>
            <span className={cols}>P</span>
            <span className={`${cols} hidden min-[400px]:block`}>W</span>
            <span className={`${cols} hidden min-[400px]:block`}>D</span>
            <span className={`${cols} hidden min-[400px]:block`}>L</span>
            <span className="w-[30px] shrink-0 text-center">GD</span>
            <span className="w-[28px] shrink-0 text-center">Pts</span>
            <span className="w-7 shrink-0" aria-hidden />
          </div>

          <ol>
            {group.teams.map((team: any, i: number) => {
              const isFollowing = followedTeams.includes(team.teamId)
              const isPending = pendingTeamId === team.teamId
              return (
                <li key={team.teamId || i} className="flex h-12 items-center gap-1 border-t border-white/[0.06] px-3 font-body text-[14px] text-white">
                  <span className="w-5 shrink-0 text-center text-[13px] tabular-nums text-white/60">{i + 1}</span>
                  <span className="flex min-w-0 flex-1 items-center gap-2 pl-1">
                    <TeamBadge name={team.name} logoUrl={team.logoUrl} size={22} />
                    <span className="truncate font-medium">{team.name}</span>
                  </span>
                  <span className={`${cols} text-white/70`}>{team.p}</span>
                  <span className={`${cols} hidden text-white/70 min-[400px]:block`}>{team.w}</span>
                  <span className={`${cols} hidden text-white/70 min-[400px]:block`}>{team.d}</span>
                  <span className={`${cols} hidden text-white/70 min-[400px]:block`}>{team.l}</span>
                  <span className="w-[30px] shrink-0 text-center tabular-nums text-white/70">{team.gd > 0 ? `+${team.gd}` : team.gd}</span>
                  <span className="w-[28px] shrink-0 text-center font-semibold tabular-nums">{team.pts}</span>
                  <TeamFollowButton
                    teamId={team.teamId}
                    isFollowing={isFollowing}
                    isPending={isPending}
                    onToggle={() => followTeamMutation.mutate({ teamId: team.teamId, following: isFollowing })}
                  />
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
