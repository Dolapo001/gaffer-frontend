'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ChevronLeft, MessageCircle, Send, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  likeFeedItem,
  unlikeFeedItem,
  getComments,
  addComment,
  type FeedComment,
} from '@/lib/services/feed.service'
import { useToast } from '@/store/toastStore'

interface ArticleDetailProps {
  onBack: () => void
  article: {
    id: string
    title: string
    content: string
    image: string
    date: string
    likes: number
    commentsCount?: number
    isLiked?: boolean
    author: {
      name: string
      handle: string
      avatar?: string
      verified?: boolean
    }
  }
}

export function ArticleDetail({ onBack, article }: ArticleDetailProps) {
  const qc = useQueryClient()
  const { addToast } = useToast()

  const [liked, setLiked] = useState(article.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(article.likes)
  const [following, setFollowing] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')

  // ── Like / Unlike ─────────────────────────────────────────────────────────
  const likeMutation = useMutation({
    mutationFn: () => (liked ? unlikeFeedItem(article.id) : likeFeedItem(article.id)),
    onMutate: () => {
      setLiked((prev) => !prev)
      setLikeCount((c) => (liked ? c - 1 : c + 1))
    },
    onError: () => {
      setLiked((prev) => !prev)
      setLikeCount((c) => (liked ? c + 1 : c - 1))
      addToast('Could not update like.', 'error')
    },
  })

  // ── Comments ──────────────────────────────────────────────────────────────
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['comments', article.id],
    queryFn: () => getComments(article.id),
    enabled: showComments,
    staleTime: 30_000,
  })

  const addCommentMutation = useMutation({
    mutationFn: () => addComment(article.id, commentText.trim()),
    onSuccess: () => {
      setCommentText('')
      qc.invalidateQueries({ queryKey: ['comments', article.id] })
    },
    onError: () => {
      addToast('Could not post comment.', 'error')
    },
  })

  const comments: FeedComment[] = commentsData?.comments ?? []

  function formatCommentTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-gaffer-border">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gaffer-card border border-gaffer-border text-white"
        >
          <ChevronLeft size={17} />
        </button>
        <h2 className="flex-1 text-center font-display font-bold text-white text-base tracking-widest uppercase">
          NEWS
        </h2>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Author block */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-gaffer-orange flex items-center justify-center shadow-orange-glow">
              <span className="text-white font-display font-black text-base">
                {article.author.name[0]}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-body font-semibold text-white text-sm">{article.author.name}</span>
                {article.author.verified && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="6" fill="#FF6B00" />
                    <path d="M3.5 6l1.8 1.8 3.2-3.2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-gaffer-muted text-[11px] font-body">@{article.author.handle}</span>
            </div>
          </div>
          <button
            onClick={() => setFollowing(!following)}
            className={`px-4 py-1.5 rounded-full text-xs font-body font-medium border transition-all ${
              following
                ? 'bg-gaffer-orange/10 border-gaffer-orange/30 text-gaffer-orange'
                : 'border-gaffer-border text-gaffer-muted hover:border-gaffer-orange/40 hover:text-white'
            }`}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        </div>

        {/* Title */}
        <h1 className="px-4 font-display font-bold text-xl text-white leading-tight mb-4">
          {article.title}
        </h1>

        {/* Article image */}
        <div className="px-4 mb-4">
          <div className="rounded-2xl overflow-hidden h-52">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Actions + date */}
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => likeMutation.mutate()}
              className="flex items-center gap-1.5"
            >
              <Flame size={16} className={liked ? 'text-gaffer-orange' : 'text-gaffer-subtle'} />
              <span className="text-gaffer-muted text-xs font-body">{likeCount}</span>
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5"
            >
              <MessageCircle
                size={16}
                className={showComments ? 'text-gaffer-orange' : 'text-gaffer-subtle'}
              />
              <span className="text-gaffer-muted text-xs font-body">
                {commentsData ? commentsData.total : (article.commentsCount ?? 0)}
              </span>
            </button>
          </div>
          <span className="text-gaffer-subtle text-xs font-body">{article.date}</span>
        </div>

        {/* Body */}
        <div className="px-4 pb-4 space-y-4">
          {article.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="font-body text-white/70 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gaffer-border overflow-hidden"
            >
              {/* Comment input */}
              <div className="px-4 py-3 flex items-center gap-2 border-b border-gaffer-border/50">
                <input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                      e.preventDefault()
                      addCommentMutation.mutate()
                    }
                  }}
                  placeholder="Add a comment..."
                  className="flex-1 bg-gaffer-card border border-gaffer-border rounded-xl px-3 py-2 text-white text-sm font-body placeholder:text-gaffer-subtle focus:outline-none focus:border-gaffer-orange/50 transition-colors"
                />
                <button
                  onClick={() => commentText.trim() && addCommentMutation.mutate()}
                  disabled={!commentText.trim() || addCommentMutation.isPending}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-gaffer-orange disabled:opacity-40 transition-opacity flex-shrink-0"
                >
                  {addCommentMutation.isPending ? (
                    <Loader2 size={15} className="text-white animate-spin" />
                  ) : (
                    <Send size={15} className="text-white" />
                  )}
                </button>
              </div>

              {/* Comments list */}
              {commentsLoading ? (
                <div className="px-4 py-4 space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gaffer-card animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-2.5 bg-gaffer-card rounded w-1/4 animate-pulse" />
                        <div className="h-3 bg-gaffer-card rounded w-3/4 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-gaffer-muted text-sm font-body">No comments yet. Be the first!</p>
                </div>
              ) : (
                <div className="px-4 py-3 space-y-4 pb-6">
                  {comments.map((c) => (
                    <div key={c._id} className="flex gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gaffer-orange/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gaffer-orange text-xs font-body font-bold">
                          {(c.userId.fullName ?? c.userId.email)[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-white text-xs font-body font-semibold">
                            {c.userId.fullName ?? c.userId.email.split('@')[0]}
                          </span>
                          <span className="text-gaffer-subtle text-[10px] font-body">
                            {formatCommentTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-white/70 text-sm font-body mt-0.5 leading-relaxed">{c.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
