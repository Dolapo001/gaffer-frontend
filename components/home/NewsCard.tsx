'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Share2, Clock } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useToast } from '@/store/toastStore'
import { likeFeedItem, unlikeFeedItem } from '@/lib/services/feed.service'

export interface NewsCardProps {
  id: string
  image: string
  source: {
    name: string
    avatar?: string
    verified?: boolean
  }
  title: string
  excerpt?: string
  likes: number
  timeAgo: string
  initialLiked?: boolean
  size?: 'large' | 'small'
  onClick?: () => void
}

export function NewsCard({
  id,
  image,
  source,
  title,
  excerpt,
  likes,
  timeAgo,
  initialLiked = false,
  size = 'large',
  onClick,
}: NewsCardProps) {
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const { addToast } = useToast()

  const likeMutation = useMutation({
    mutationFn: () => (liked ? unlikeFeedItem(id) : likeFeedItem(id)),
    onMutate: () => {
      // Optimistic update
      setLiked((prev) => !prev)
      setLikeCount((c) => (liked ? c - 1 : c + 1))
    },
    onError: () => {
      // Revert on failure
      setLiked((prev) => !prev)
      setLikeCount((c) => (liked ? c + 1 : c - 1))
      addToast('Could not update like. Please try again.', 'error')
    },
  })

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    likeMutation.mutate()
  }

  if (size === 'small') {
    return (
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex gap-3 cursor-pointer group"
      >
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden bg-gaffer-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 rounded-full bg-gaffer-orange/20 flex items-center justify-center">
                <Flame size={9} className="text-gaffer-orange" />
              </div>
              <span className="text-gaffer-orange text-[10px] font-body font-semibold uppercase tracking-wide truncate">
                {source.name}
              </span>
              {source.verified && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="5" fill="#FF6B00" />
                  <path d="M2.5 5l1.5 1.5 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <p className="font-body font-semibold text-white text-xs leading-tight line-clamp-2">
              {title}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleLike} className="flex items-center gap-1">
              <Flame size={12} className={liked ? 'text-gaffer-orange' : 'text-gaffer-subtle'} />
              <span className="text-gaffer-muted text-[10px] font-body">
                {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.article
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-gaffer-card border border-gaffer-border rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Hero Image */}
      <div className="relative h-44 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Time badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
          <Clock size={10} className="text-white/70" />
          <span className="text-white/70 text-[10px] font-body">{timeAgo}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2.5">
        {/* Source badge */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gaffer-orange flex items-center justify-center flex-shrink-0">
            <Flame size={10} className="text-white" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gaffer-orange text-[11px] font-body font-semibold uppercase tracking-wide">
              {source.name}
            </span>
            {source.verified && (
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="5.5" fill="#FF6B00" />
                <path d="M3 5.5l1.8 1.8 3.2-3.2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-bold text-white text-base leading-snug line-clamp-2">
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p className="font-body text-gaffer-muted text-xs leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 group/like"
          >
            <Flame
              size={16}
              className={`transition-colors ${liked ? 'text-gaffer-orange' : 'text-gaffer-subtle group-hover/like:text-gaffer-orange'}`}
            />
            <span className="text-gaffer-muted text-xs font-body font-medium">
              {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              addToast('Article link copied to clipboard!', 'success')
            }}
            className="text-gaffer-subtle hover:text-white transition-colors"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>
    </motion.article>
  )
}
