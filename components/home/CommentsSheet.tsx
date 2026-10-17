'use client'

import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Send } from 'lucide-react'
import { addComment, getComments, type FeedComment } from '@/lib/services/feed.service'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { timeAgo } from '@/lib/newsCardProps'

/** Replies to a post, newest first, with a box to write one. Slides up from the bottom like a social app. */
export function CommentsSheet({ postId, allowComments, onClose, onAdded }: { postId: string; allowComments: boolean; onClose: () => void; onAdded: () => void }) {
  const qc = useQueryClient()
  const { addToast } = useToast()
  const [text, setText] = useState('')

  const q = useInfiniteQuery({
    queryKey: ['post-comments', postId],
    queryFn: ({ pageParam }) => getComments(postId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * 20 < last.total ? last.page + 1 : undefined),
    enabled: allowComments,
  })
  const comments: FeedComment[] = (q.data?.pages ?? []).flatMap((p) => p.comments ?? [])

  const send = useMutation({
    mutationFn: () => addComment(postId, text.trim()),
    onSuccess: () => {
      setText('')
      qc.invalidateQueries({ queryKey: ['post-comments', postId] })
      onAdded()
    },
    onError: (e) => addToast(getErrorMessage(e), 'error'),
  })

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Comments">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1E2032] rounded-t-3xl border-t border-white/10 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="text-white font-bold">Comments</h3>
          <button onClick={onClose} aria-label="Close" className="text-white/50 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
          {!allowComments && <p className="text-sm text-white/50 py-6 text-center">Comments are turned off for this post.</p>}
          {allowComments && q.isLoading && <div className="h-16 rounded-xl bg-white/5 animate-pulse" />}
          {allowComments && !q.isLoading && comments.length === 0 && <p className="text-sm text-white/40 py-6 text-center">No comments yet. Be the first.</p>}
          {comments.map((c) => (
            <div key={c._id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-300 flex items-center justify-center text-xs font-black shrink-0">
                {(c.userId?.fullName || c.userId?.email || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-white/50"><span className="text-white font-semibold">{c.userId?.fullName || 'Fan'}</span> · {timeAgo(c.createdAt)}</p>
                <p className="text-sm text-white/90 break-words">{c.body}</p>
              </div>
            </div>
          ))}
          {q.hasNextPage && (
            <button onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} className="w-full text-xs font-bold text-orange-400 py-2">
              {q.isFetchingNextPage ? 'Loading…' : 'Show more comments'}
            </button>
          )}
        </div>

        {allowComments && (
          <form
            onSubmit={(e) => { e.preventDefault(); if (text.trim()) send.mutate() }}
            className="flex items-center gap-2 px-4 py-3 border-t border-white/5"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="Write a comment"
              aria-label="Write a comment"
              className="flex-1 h-11 rounded-full bg-[#181928] border border-white/10 px-4 text-sm text-white placeholder:text-white/30 outline-none"
            />
            <button type="submit" disabled={!text.trim() || send.isPending} aria-label="Send" className="w-11 h-11 rounded-full bg-orange-500 text-black flex items-center justify-center disabled:opacity-40">
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
