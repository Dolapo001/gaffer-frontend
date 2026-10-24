'use client'

import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { getReposters } from '@/lib/services/feed.service'
import { FollowButton } from '@/components/FollowButton'
import { useAuthStore } from '@/store/authStore'
import { getImageUrl } from '@/lib/api'

/** Everyone who reposted a post, each with a Follow button, so you decide whose reposts you see. */
export function RepostersSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const me = useAuthStore((s) => s.user?.id)
  const { data, isLoading } = useQuery({ queryKey: ['reposters', postId], queryFn: () => getReposters(postId) })

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Reposted by">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1E2032] rounded-t-3xl border-t border-white/10 max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-bold">Reposted by</h3>
          <button onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-2" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))' }}>
          {isLoading && <div className="h-16 rounded-xl bg-white/5 animate-pulse my-3" />}
          {data && data.length === 0 && <p className="text-sm text-white/45 text-center py-8">No reposts yet.</p>}
          {(data ?? []).map((r, i) => (
            <div key={`${r.userId}-${i}`} className="flex items-center gap-3 py-3 border-b border-white/5 last:border-b-0">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-300 font-black flex items-center justify-center overflow-hidden shrink-0">
                {r.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImageUrl(r.avatarUrl)} alt="" className="w-full h-full object-cover" />
                ) : r.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-semibold text-sm truncate">{r.name}</p>
                {r.quote && <p className="text-xs text-white/55 truncate">{r.quote}</p>}
              </div>
              {r.userId !== me && <FollowButton type="user" id={r.userId} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
