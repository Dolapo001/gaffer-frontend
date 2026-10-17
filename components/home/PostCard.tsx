'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Flame, MessageCircle, Repeat2, Share2, UserPlus, ShieldCheck } from 'lucide-react'
import { likeFeedItem, unlikeFeedItem, repost, type FeedItem } from '@/lib/services/feed.service'
import { useToast } from '@/store/toastStore'
import { ApiError, getErrorMessage, getImageUrl } from '@/lib/api'
import { timeAgo } from '@/lib/newsCardProps'
import { CommentsSheet } from './CommentsSheet'
import { NewsImage } from './NewsImage'

const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n))

function authorOf(item: FeedItem) {
  const a = item.authorId
  const name = item.authorType === 'system' ? item.authorName || 'Gaffer' : a?.name || a?.fullName || a?.username || 'Gaffer fan'
  const handle = a?.handle || a?.username || ''
  const avatar = a?.logoUrl || a?.avatarUrl || null
  return { name, handle, avatar, verified: item.authorType === 'org' || item.authorType === 'system' }
}

function Avatar({ name, src, size = 40 }: { name: string; src: string | null; size?: number }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="rounded-full bg-orange-500 flex items-center justify-center shrink-0 overflow-hidden text-black font-black" style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src && !broken ? <img src={getImageUrl(src)} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} /> : name[0]?.toUpperCase()}
    </div>
  )
}

function Body({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 220
  return (
    <div>
      <p className="text-[15px] text-white/90 leading-relaxed whitespace-pre-wrap break-words">{long && !open ? text.slice(0, 220) + '…' : text}</p>
      {long && <button onClick={() => setOpen(!open)} className="text-orange-400 text-xs font-semibold mt-1">{open ? 'Show less' : 'Show more'}</button>}
    </div>
  )
}

function Media({ item }: { item: FeedItem }) {
  const url = item.imageUrl ?? item.media?.find((m) => m.type === 'image')?.url
  if (!url) return null
  return <NewsImage src={getImageUrl(url)} alt="" ratio="4 / 3" className="rounded-2xl mt-3" />
}

/**
 * A post, laid out like a tweet: who said it, what they said, and four things you can do: comment, repost (or quote it),
 * react with a flame, and share. News is different: people only react to it, so it uses NewsCard instead.
 * A repost shows who reposted it above the original.
 */
export function PostCard({ item, onOpen }: { item: FeedItem; onOpen?: () => void }) {
  const { addToast } = useToast()
  const isRepost = item.type === 'repost' && !!item.parentFeedId
  // Everything you do (react, comment, repost) applies to the original, not to the repost wrapper
  const root: FeedItem = isRepost ? (item.parentFeedId as FeedItem) : item
  const rootAuthor = authorOf(root)
  const reposter = authorOf(item)

  const [liked, setLiked] = useState(root.isLiked ?? false)
  const [likes, setLikes] = useState(root.likesCount ?? 0)
  const [comments, setComments] = useState(root.commentsCount ?? root.commentCount ?? 0)
  const [reposts, setReposts] = useState(root.repostCount ?? 0)
  const [reposted, setReposted] = useState(false)
  const [sheet, setSheet] = useState<'comments' | 'repost' | 'quote' | null>(null)
  const [quote, setQuote] = useState('')
  const [following, setFollowing] = useState(false)

  const like = useMutation({
    mutationFn: (next: boolean) => (next ? likeFeedItem(root._id) : unlikeFeedItem(root._id)),
    onMutate: (next: boolean) => { setLiked(next); setLikes((c) => Math.max(0, c + (next ? 1 : -1))) },
    onError: (_e, next: boolean) => { setLiked(!next); setLikes((c) => Math.max(0, c + (next ? -1 : 1))); addToast('Could not save your reaction. Check your connection and try again.', 'error') },
  })

  const doRepost = useMutation({
    mutationFn: (body?: string) => repost(root._id, body),
    onSuccess: () => { setReposted(true); setReposts((c) => c + 1); setSheet(null); setQuote(''); addToast('Reposted', 'success') },
    onError: (e) => {
      if (e instanceof ApiError && e.code === 'ALREADY_REPOSTED') { setReposted(true); setSheet(null); addToast('You already reposted this', 'info') }
      else addToast(getErrorMessage(e), 'error')
    },
  })

  const share = async () => {
    const url = `${window.location.origin}/app/news/${root._id}`
    try {
      if (navigator.share) await navigator.share({ title: rootAuthor.name, text: root.body.slice(0, 100), url })
      else { await navigator.clipboard.writeText(url); addToast('Link copied', 'success') }
    } catch { /* cancelled */ }
  }

  const action = 'flex items-center gap-1.5 text-white/50 hover:text-white text-sm py-1 pr-3'

  return (
    <article className="rounded-3xl bg-[#1E2032] border border-white/5 p-4">
      {isRepost && (
        <p className="flex items-center gap-1.5 text-xs text-white/50 mb-2 ml-1"><Repeat2 size={14} /> {reposter.name} reposted</p>
      )}
      {isRepost && item.body && <div className="mb-3"><Body text={item.body} /></div>}

      <div className={isRepost ? 'rounded-2xl border border-white/10 p-3' : ''}>
        <div className="flex items-start gap-3">
          <Avatar name={rootAuthor.name} src={rootAuthor.avatar} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1 text-white font-bold text-[15px] leading-tight truncate">
                  {rootAuthor.name}
                  {rootAuthor.verified && <ShieldCheck size={14} className="text-orange-400 shrink-0" />}
                </p>
                <p className="text-xs text-white/40 truncate">{rootAuthor.handle ? `@${rootAuthor.handle} · ` : ''}{timeAgo(root.createdAt)}</p>
              </div>
              {!isRepost && (
                <button onClick={() => setFollowing((v) => !v)} className={`flex items-center gap-1 px-3 h-8 rounded-full border text-xs font-semibold shrink-0 ${following ? 'border-orange-500/40 text-orange-300 bg-orange-500/10' : 'border-white/15 text-white/60'}`}>
                  <UserPlus size={12} /> {following ? 'Following' : 'Follow'}
                </button>
              )}
            </div>
            <div className="mt-2" onClick={onOpen}>
              <Body text={root.body} />
              <Media item={root} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pl-1">
        <button className={action} onClick={() => setSheet('comments')} aria-label={`Comments, ${comments}`}>
          <MessageCircle size={18} /> {compact(comments)}
        </button>
        <button className={`${action} ${reposted ? '!text-green-400' : ''}`} onClick={() => setSheet('repost')} aria-label={`Repost, ${reposts}`}>
          <Repeat2 size={19} /> {compact(reposts)}
        </button>
        <button className={`${action} ${liked ? '!text-orange-400' : ''}`} onClick={() => { if (!like.isPending) like.mutate(!liked) }} aria-label={`React, ${likes}`} aria-pressed={liked}>
          <Flame size={18} fill={liked ? 'currentColor' : 'none'} /> {compact(likes)}
        </button>
        <button className={action} onClick={share} aria-label="Share"><Share2 size={18} /></button>
      </div>

      {sheet === 'comments' && (
        <CommentsSheet postId={root._id} allowComments={root.allowComments !== false} onClose={() => setSheet(null)} onAdded={() => setComments((c) => c + 1)} />
      )}

      {(sheet === 'repost' || sheet === 'quote') && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Repost">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSheet(null)} />
          <div className="relative w-full max-w-lg bg-[#1E2032] rounded-t-3xl border-t border-white/10 p-5 space-y-3" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom, 0px))' }}>
            {sheet === 'repost' ? (
              <>
                <button onClick={() => doRepost.mutate(undefined)} disabled={doRepost.isPending || reposted} className="w-full flex items-center gap-3 h-12 rounded-2xl bg-white/5 px-4 text-white font-semibold disabled:opacity-50">
                  <Repeat2 size={20} /> {reposted ? 'Reposted' : 'Repost'}
                </button>
                <button onClick={() => setSheet('quote')} className="w-full flex items-center gap-3 h-12 rounded-2xl bg-white/5 px-4 text-white font-semibold">
                  <MessageCircle size={20} /> Quote
                </button>
                <button onClick={() => setSheet(null)} className="w-full h-11 text-white/50 text-sm">Cancel</button>
              </>
            ) : (
              <>
                <textarea value={quote} onChange={(e) => setQuote(e.target.value)} maxLength={500} rows={3} placeholder="Add your thoughts" aria-label="Add your thoughts" className="w-full rounded-2xl bg-[#181928] border border-white/10 p-3 text-white text-sm outline-none" />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setSheet(null)} className="px-4 h-11 text-white/50 text-sm">Cancel</button>
                  <button onClick={() => doRepost.mutate(quote.trim() || undefined)} disabled={doRepost.isPending} className="px-5 h-11 rounded-full bg-orange-500 text-black font-bold text-sm disabled:opacity-50">Post</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  )
}
