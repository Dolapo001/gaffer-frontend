'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, Bell, BellOff } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { getImageUrl } from '@/lib/api'
import {
  followCompetition,
  unfollowCompetition,
  getPreferences,
} from '@/lib/services/notifications.service'

interface LeagueTabHeaderProps {
  competitionId: string
  name?: string
  bannerUrl?: string
}

// Header for the League tabbed shell: crest + name + follow bell only — no
// followers count (dropped per design decision), no season chip (Gaffer
// competitions are one-off tournaments with no season/year field in the data).
export function LeagueTabHeader({ competitionId, name, bannerUrl }: LeagueTabHeaderProps) {
  const router = useRouter()
  const qc = useQueryClient()
  const toast = useToastStore()

  const { data: prefsData } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences,
    retry: false,
  })
  const isFollowing = prefsData?.preferences?.followedCompetitions?.includes(competitionId) ?? false

  const followMutation = useMutation({
    mutationFn: () => (isFollowing ? unfollowCompetition(competitionId) : followCompetition(competitionId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notification-preferences'] })
      toast.addToast(isFollowing ? 'Unfollowed competition.' : "Following competition — you'll get updates!", 'success')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  return (
    <div className="flex items-center gap-3 px-4 pt-12 pb-3">
      <button
        onClick={() => router.push('/app/league')}
        className="w-9 h-9 rounded-full bg-gaffer-card border border-gaffer-border flex items-center justify-center text-white flex-shrink-0"
      >
        <ChevronLeft size={18} />
      </button>

      <div className="w-8 h-8 rounded-full bg-gaffer-border overflow-hidden flex items-center justify-center flex-shrink-0">
        {bannerUrl ? (
          <img src={getImageUrl(bannerUrl)} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gaffer-muted text-xs font-black">{name?.charAt(0) ?? '?'}</span>
        )}
      </div>

      <h1 className="flex-1 min-w-0 text-white font-display font-bold text-base truncate uppercase tracking-wide">
        {name ?? 'League'}
      </h1>

      <button
        onClick={() => followMutation.mutate()}
        disabled={followMutation.isPending}
        className="w-9 h-9 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border transition-colors disabled:opacity-40 flex-shrink-0"
        aria-label={isFollowing ? 'Unfollow competition' : 'Follow competition'}
      >
        {isFollowing
          ? <Bell size={16} className="text-gaffer-orange" fill="currentColor" />
          : <BellOff size={16} className="text-white/50" />}
      </button>
    </div>
  )
}
