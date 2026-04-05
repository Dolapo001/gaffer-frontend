'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Share2, ChevronLeft, Send, Pencil, Trash2, X, Check } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  likeFeedItem,
  unlikeFeedItem,
  getComments,
  addComment,
  updateComment,
  deleteComment,
  type FeedComment,
} from '@/lib/services/feed.service'
import { useToastStore } from '@/store/toastStore'
import { getErrorMessage } from '@/lib/api'

interface ArticleDetailProps {
  onBack: () => void
  article: {
    id: string
    title: string
    content: string
    image: string
    date: string
    likes: number
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
  const toast = useToastStore()
  const [liked, setLiked] = useState(article.isLiked ?? false)
  const [likeCount, setLikeCount] = useState(article.likes)
  const [following, setFollowing] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const { data: commentsData } = useQuery({
    queryKey: ['comments', article.id],
    queryFn: () => getComments(article.id),
  })
  const comments: FeedComment[] = commentsData?.comments ?? []

  const likeMutation = useMutation({
    mutationFn: () => liked ? unlikeFeedItem(article.id) : likeFeedItem(article.id),
    onMutate: () => {
      setLiked((prev) => !prev)
      setLikeCount((c) => liked ? c - 1 : c + 1)
    },
    onError: (err) => {
      setLiked((prev) => !prev)
      setLikeCount((c) => liked ? c + 1 : c - 1)
      toast.addToast(getErrorMessage(err), 'error')
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: (body: string) => addComment(article.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', article.id] })
      setCommentText('')
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      updateComment(article.id, commentId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', article.id] })
      setEditingId(null)
    },
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(article.id, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', article.id] }),
    onError: (err) => toast.addToast(getErrorMessage(err), 'error'),
  })

  const handleSubmitComment = () => {
    if (!commentText.trim()) return
    addCommentMutation.mutate(commentText.trim())
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
          <button
            onClick={() => likeMutation.mutate()}
            disabled={likeMutation.isPending}
            className="flex items-center gap-1.5"
          >
            <Flame size={16} className={liked ? 'text-gaffer-orange' : 'text-gaffer-subtle'} />
            <span className="text-gaffer-muted text-xs font-body">{likeCount}</span>
          </button>
          <span className="text-gaffer-subtle text-xs font-body">{article.date}</span>
        </div>

        {/* Body */}
        <div className="px-4 pb-6 space-y-4">
          {article.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="font-body text-white/70 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Comments section */}
        <div className="px-4 pb-8 border-t border-gaffer-border pt-6 space-y-4">
          <h3 className="font-display font-bold text-white text-sm">
            Comments {comments.length > 0 && <span className="text-gaffer-muted">({comments.length})</span>}
          </h3>

          {/* Comment input */}
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
              placeholder="Add a comment…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-gaffer-card border border-gaffer-border text-white placeholder:text-gaffer-subtle font-body text-sm focus:outline-none focus:border-gaffer-orange transition-colors"
            />
            <button
              onClick={handleSubmitComment}
              disabled={!commentText.trim() || addCommentMutation.isPending}
              className="w-10 h-10 rounded-xl bg-gaffer-orange flex items-center justify-center text-white disabled:opacity-40 transition-opacity"
            >
              <Send size={15} />
            </button>
          </div>

          {/* Comment list */}
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c._id} className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4">
                {editingId === c._id ? (
                  <div className="flex gap-2">
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-gaffer-surface border border-gaffer-border text-white font-body text-sm focus:outline-none focus:border-gaffer-orange"
                    />
                    <button
                      onClick={() => editCommentMutation.mutate({ commentId: c._id, body: editText })}
                      disabled={editCommentMutation.isPending}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500/10 text-green-400"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gaffer-muted"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-gaffer-orange text-[11px] font-body font-bold mb-1">
                        {c.userId?.fullName ?? c.userId?.email ?? 'User'}
                      </p>
                      <p className="text-white/70 text-sm font-body">{c.body}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingId(c._id); setEditText(c.body) }}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gaffer-subtle hover:text-white transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => deleteCommentMutation.mutate(c._id)}
                        disabled={deleteCommentMutation.isPending}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gaffer-subtle hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
