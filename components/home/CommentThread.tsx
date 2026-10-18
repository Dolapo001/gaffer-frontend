'use client'

import { useRef, useState } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Send, X } from 'lucide-react'
import { addComment, getComments, getReplies, type FeedComment } from '@/lib/services/feed.service'
import { useToast } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'
import { timeAgo } from '@/lib/newsCardProps'
import { nameOf } from '@/lib/displayName'

const PAGE = 20

function Avatar({ name }: { name: string }) {
  return (
    <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-300 flex items-center justify-center text-xs font-black shrink-0">
      {name[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

function Row({ c, onReply }: { c: FeedComment; onReply: (c: FeedComment) => void }) {
  const name = nameOf(c.userId)
  const replyTo = c.replyToUserId ? nameOf(c.replyToUserId) : null
  return (
    <div className="flex gap-3">
      <Avatar name={name} />
      <div className="min-w-0">
        <p className="text-xs text-white/50"><span className="text-white font-semibold">{name}</span> · {timeAgo(c.createdAt)}</p>
        <p className="text-sm text-white/90 break-words">
          {replyTo && <span className="text-orange-400 font-semibold">@{replyTo} </span>}
          {c.body}
        </p>
        <button onClick={() => onReply(c)} className="mt-1 text-xs font-semibold text-white/40 hover:text-orange-400">Reply</button>
      </div>
    </div>
  )
}

function Replies({ postId, root, onReply }: { postId: string; root: FeedComment; onReply: (c: FeedComment) => void }) {
  const q = useQuery({ queryKey: ['comment-replies', postId, root._id], queryFn: () => getReplies(postId, root._id) })
  if (q.isLoading) return <div className="h-10 rounded-xl bg-white/5 animate-pulse" />
  return (
    <div className="space-y-3">
      {(q.data ?? []).map((r) => <Row key={r._id} c={r} onReply={onReply} />)}
    </div>
  )
}

/**
 * Comments on a post as threads, like X: each comment can be answered, the answers sit under it, and an answer to
 * an answer stays in the same thread with the person's @name in front.
 * "composer" decides where the box to write sits: pinned at the bottom of a sheet, or above the list on a page.
 */
export function CommentThread({ postId, allowComments, composer = 'bottom', onAdded }: { postId: string; allowComments: boolean; composer?: 'top' | 'bottom'; onAdded?: () => void }) {
  const qc = useQueryClient()
  const { addToast } = useToast()
  const [text, setText] = useState('')
  const [replyingTo, setReplyingTo] = useState<FeedComment | null>(null)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const q = useInfiniteQuery({
    queryKey: ['post-comments', postId],
    queryFn: ({ pageParam }) => getComments(postId, pageParam).then((r) => r.comments ?? []),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.length >= PAGE ? all.length + 1 : undefined),
    enabled: allowComments,
  })
  const comments: FeedComment[] = (q.data?.pages ?? []).flat()

  const send = useMutation({
    mutationFn: () => addComment(postId, text.trim(), replyingTo?._id),
    onSuccess: () => {
      const root = replyingTo ? (replyingTo.parentCommentId ?? replyingTo._id) : null
      setText('')
      setReplyingTo(null)
      if (root) {
        setOpen((o) => ({ ...o, [root]: true }))
        qc.invalidateQueries({ queryKey: ['comment-replies', postId, root] })
      }
      qc.invalidateQueries({ queryKey: ['post-comments', postId] })
      onAdded?.()
    },
    onError: (e) => addToast(getErrorMessage(e), 'error'),
  })

  const startReply = (c: FeedComment) => {
    setReplyingTo(c)
    inputRef.current?.focus()
  }

  const box = allowComments && (
    <form
      onSubmit={(e) => { e.preventDefault(); if (text.trim() && !send.isPending) send.mutate() }}
      className={composer === 'bottom' ? 'border-t border-white/5 px-4 pt-2' : 'border-b border-white/5 px-4 py-3'}
      style={composer === 'bottom' ? { paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' } : undefined}
    >
      {replyingTo && (
        <div className="flex items-center justify-between text-xs text-white/50 pb-2">
          <span>Replying to <span className="text-orange-400 font-semibold">@{nameOf(replyingTo.userId)}</span></span>
          <button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply" className="text-white/40 hover:text-white"><X size={14} /></button>
        </div>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={500}
          placeholder={replyingTo ? 'Write your reply' : 'Write a comment'}
          aria-label={replyingTo ? 'Write your reply' : 'Write a comment'}
          className="flex-1 h-11 rounded-full bg-[#181928] border border-white/10 px-4 text-sm text-white placeholder:text-white/30 outline-none"
        />
        <button type="submit" disabled={!text.trim() || send.isPending} aria-label="Send" className="w-11 h-11 rounded-full bg-orange-500 text-black flex items-center justify-center disabled:opacity-40">
          <Send size={18} />
        </button>
      </div>
    </form>
  )

  const list = (
    <div className="px-5 py-3 space-y-5">
      {!allowComments && <p className="text-sm text-white/50 py-6 text-center">Comments are turned off for this post.</p>}
      {allowComments && q.isLoading && <div className="h-16 rounded-xl bg-white/5 animate-pulse" />}
      {allowComments && !q.isLoading && comments.length === 0 && <p className="text-sm text-white/40 py-6 text-center">No comments yet. Be the first.</p>}
      {comments.map((c) => (
        <div key={c._id} className="space-y-3">
          <Row c={c} onReply={startReply} />
          {(c.replyCount ?? 0) > 0 && (
            <div className="ml-4 pl-4 border-l border-white/10 space-y-3">
              <button onClick={() => setOpen((o) => ({ ...o, [c._id]: !o[c._id] }))} className="text-xs font-semibold text-orange-400">
                {open[c._id] ? 'Hide replies' : `View ${c.replyCount} ${c.replyCount === 1 ? 'reply' : 'replies'}`}
              </button>
              {open[c._id] && <Replies postId={postId} root={c} onReply={startReply} />}
            </div>
          )}
        </div>
      ))}
      {q.hasNextPage && (
        <button onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage} className="w-full text-xs font-bold text-orange-400 py-2">
          {q.isFetchingNextPage ? 'Loading…' : 'Show more comments'}
        </button>
      )}
    </div>
  )

  return composer === 'bottom' ? (
    <>
      <div className="flex-1 overflow-y-auto">{list}</div>
      {box}
    </>
  ) : (
    <>
      {box}
      {list}
    </>
  )
}
