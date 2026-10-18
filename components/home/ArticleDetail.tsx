'use client'

import { NewsImage } from './NewsImage'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, ChevronLeft, MessageCircle, ShieldCheck } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { likeFeedItem, unlikeFeedItem } from '@/lib/services/feed.service'
import { useToast } from '@/store/toastStore'
import { useFeedStats } from '@/lib/feedStats'
import { CommentThread } from './CommentThread'

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
    /** True for backend system posts — hides the Follow button */
    isSystem?: boolean
    allowComments?: boolean
    author: {
      name: string
      handle: string
      avatar?: string
      verified?: boolean
    }
  }
}

function getInitials(name: string): string {
  if (!name) return 'N'
  const cleanName = name.trim()
  const words = cleanName.split(/\s+/)
  if (words.length >= 2 && words[0] && words[1]) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return cleanName.substring(0, 2).toUpperCase()
}

export function ArticleDetail({ onBack, article }: ArticleDetailProps) {
  const qc = useQueryClient()
  const { addToast } = useToast()

  const [following, setFollowing] = useState(false)
  const [showComments, setShowComments] = useState(false)

  // The numbers for this post live in one shared place so every card showing it agrees
  const stats = useFeedStats((s) => s.byId[article.id])
  const patch = useFeedStats((s) => s.patch)
  const clearStats = useFeedStats((s) => s.clear)
  const liked = stats?.liked ?? article.isLiked ?? false
  const likeCount = stats?.likes ?? article.likes
  const commentCount = stats?.comments ?? article.commentsCount ?? 0
  useEffect(() => { clearStats(article.id) }, [article.id, article.likes, article.isLiked, article.commentsCount, clearStats])

  // ── Like / Unlike (the server is told the state we want; a second tap waits for the first) ──
  const likeMutation = useMutation({
    mutationFn: (next: boolean) => {
      if (!article.id) return Promise.reject(new Error('Missing article id'))
      return next ? likeFeedItem(article.id) : unlikeFeedItem(article.id)
    },
    onMutate: (next: boolean) => {
      patch(article.id, { liked: next, likes: Math.max(0, likeCount + (next ? 1 : -1)) })
      return { wasLiked: liked, wasLikes: likeCount }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['home-feed'] })
      qc.invalidateQueries({ queryKey: ['org-feed'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['orgFeed'] })
      qc.invalidateQueries({ queryKey: ['feed-item', article.id] })
    },
    onError: (_err, _next, ctx) => {
      patch(article.id, { liked: ctx?.wasLiked ?? liked, likes: ctx?.wasLikes ?? likeCount })
      addToast('Could not save your reaction. Check your connection and try again.', 'error')
    },
    meta: { suppressGlobalError: true },
  })

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-full"
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-50 flex items-center gap-3 px-4 pb-3 border-b border-gaffer-border bg-gaffer-bg/95 backdrop-blur-md"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all shadow-lg"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="flex-1 text-center font-display font-bold text-white text-sm tracking-[0.2em] uppercase mr-10">
          NEWS
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Author block */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-orange-glow ${article.isSystem ? 'bg-gradient-to-br from-[#FF8904] to-[#E7000B]' : 'bg-gaffer-orange'}`}>
              <span className="text-white font-display font-black text-base uppercase">
                {getInitials(article.author.name)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-body font-semibold text-white text-sm">{article.author.name}</span>
                {(article.author.verified || article.isSystem) && (
                  <ShieldCheck size={13} className="text-gaffer-orange flex-shrink-0" />
                )}
                {article.isSystem && (
                  <span className="text-[9px] font-body font-bold uppercase tracking-widest text-gaffer-orange/60 border border-gaffer-orange/20 rounded-full px-1.5 py-0.5 leading-none">
                    Official
                  </span>
                )}
              </div>
              <span className="text-gaffer-muted text-[11px] font-body">@{article.author.handle}</span>
            </div>
          </div>
          {/* Follow button is hidden for system/official posts — there's no account to follow */}
          {!article.isSystem && (
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
          )}
        </div>

        {/* Title */}
        <h1 className="px-4 font-display font-bold text-xl text-white leading-tight mb-4">
          {article.title}
        </h1>

        {/* Expanded Article Image Layout - Fill Container Completely */}
        <div className="px-4 mb-6">
          <NewsImage src={article.image} alt={article.title} ratio="4 / 3" className="rounded-[16px] border border-white/5 shadow-xl" />
        </div>

        {/* Actions + date */}
        <div className="flex items-center justify-between px-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => { if (!likeMutation.isPending) likeMutation.mutate(!liked) }}
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
                {commentCount}
              </span>
            </button>
          </div>
          <span className="text-gaffer-subtle text-xs font-body">{article.date}</span>
        </div>

        {/* Body */}
        <div className="px-4 pb-4 space-y-4">
          {(article.content ?? '').split('\n\n').map((paragraph, i) => (
            <p key={i} className="font-body text-white/70 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Comments section */}
        {article.allowComments !== false && (
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gaffer-border overflow-hidden"
            >
              <CommentThread postId={article.id} allowComments composer="top" onAdded={() => { patch(article.id, { comments: commentCount + 1 }); qc.invalidateQueries({ queryKey: ['home-feed'] }) }} />
            </motion.div>
          )}
        </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
