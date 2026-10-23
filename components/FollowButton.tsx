'use client'

import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { UserPlus, Check } from 'lucide-react'
import { followTarget, getFollowStatus, unfollowTarget, type FollowTarget } from '@/lib/services/profile.service'
import { followKey, useFollowStore } from '@/store/followStore'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

/**
 * Follow or unfollow a person, organisation, team or player. Every button for the same thing shows the same state,
 * the change shows at once, and it is undone if the server refuses.
 */
export function FollowButton({ type, id, initial, onChange, size = 'sm', className = '' }: { type: FollowTarget; id: string; initial?: boolean; onChange?: (following: boolean, followers: number) => void; size?: 'sm' | 'md'; className?: string }) {
  const key = followKey(type, id)
  const known = useFollowStore((s) => s.known[key])
  const setKnown = useFollowStore((s) => s.set)
  const { addToast } = useToast()

  useEffect(() => { if (initial !== undefined && known === undefined) setKnown(key, initial) }, [initial, known, key, setKnown])

  // Only ask the server when nobody has told us yet
  useQuery({
    queryKey: ['follow-status', type, id],
    queryFn: async () => { const m = await getFollowStatus(type, [id]); setKnown(key, !!m[id]); return !!m[id] },
    enabled: known === undefined && initial === undefined,
    staleTime: 5 * 60_000,
    meta: { suppressGlobalError: true },
  })

  const toggle = useMutation({
    mutationFn: (next: boolean) => (next ? followTarget(type, id) : unfollowTarget(type, id)),
    onMutate: (next) => { const was = !!known; setKnown(key, next); return { was } },
    onSuccess: (r) => onChange?.(r.following, r.followers),
    onError: (e, _next, ctx) => { setKnown(key, ctx?.was ?? false); addToast(getErrorMessage(e), 'error') },
    meta: { suppressGlobalError: true },
  })

  const following = !!known
  const pad = size === 'md' ? 'h-11 px-5 text-sm' : 'h-8 px-3 text-xs'
  return (
    <button
      onClick={(e) => { e.stopPropagation(); if (!toggle.isPending) toggle.mutate(!following) }}
      aria-pressed={following}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full border font-semibold shrink-0 transition ${pad} ${following ? 'border-orange-500/40 text-orange-300 bg-orange-500/10' : 'border-white/20 text-white hover:border-orange-400/60'} ${className}`}
    >
      {following ? <Check size={size === 'md' ? 16 : 12} /> : <UserPlus size={size === 'md' ? 16 : 12} />}
      {following ? 'Following' : 'Follow'}
    </button>
  )
}
