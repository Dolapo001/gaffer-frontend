'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Flame, UserPlus } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { likeFeedItem, unlikeFeedItem } from '@/lib/services/feed.service'
import { useToast } from '@/store/toastStore'

interface TrendingPostProps {
  id: string
  author: {
    name: string
    avatar?: string
    verified?: boolean
    handle?: string
  }
  content: string
  image?: string
  likes: number
  initialLiked?: boolean
  onClick?: () => void
}

export function TrendingPost({
  id,
  author,
  content,
  image,
  likes,
  initialLiked = false,
  onClick,
}: TrendingPostProps) {
  const [expanded, setExpanded] = useState(false)
  const [liked, setLiked] = useState(initialLiked)
  const [likeCount, setLikeCount] = useState(likes)
  const [following, setFollowing] = useState(false)
  const { addToast } = useToast()

  const isLong = content.length > 120
  const displayContent = isLong && !expanded ? content.slice(0, 120) + '...' : content

  const likeMutation = useMutation({
    mutationFn: () => (liked ? unlikeFeedItem(id) : likeFeedItem(id)),
    onMutate: () => {
      setLiked((prev) => !prev)
      setLikeCount((c) => (liked ? c - 1 : c + 1))
    },
    onError: () => {
      setLiked((prev) => !prev)
      setLikeCount((c) => (liked ? c + 1 : c - 1))
      addToast('Could not update like. Please try again.', 'error')
    },
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-gaffer-card border border-gaffer-border rounded-2xl p-4 space-y-3"
    >
      {/* Author header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-gaffer-orange flex items-center justify-center flex-shrink-0 text-white font-display font-black text-sm">
            {author.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.avatar} alt={author.name} className="w-full h-full rounded-full object-cover" />
            ) : (
              author.name[0]
            )}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-white text-sm font-body font-semibold leading-none">
                {author.name}
              </span>
              {author.verified && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="6" fill="#FF6B00" />
                  <path d="M3.5 6l1.8 1.8 3.2-3.2" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {author.handle && (
              <span className="text-gaffer-muted text-[10px] font-body">@{author.handle}</span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setFollowing(!following)
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-all ${
            following
              ? 'bg-gaffer-orange/10 border-gaffer-orange/30 text-gaffer-orange'
              : 'bg-transparent border-gaffer-border text-gaffer-muted hover:border-gaffer-orange/40 hover:text-white'
          }`}
        >
          <UserPlus size={11} />
          {following ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Content */}
      <div>
        <p className="font-body text-white/80 text-sm leading-relaxed">
          {displayContent}
        </p>
        {isLong && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
            className="text-gaffer-orange text-xs font-body font-medium mt-1 hover:underline"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* Image */}
      <AnimatePresence>
        {image && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-xl overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Post media" className="w-full object-cover max-h-56" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Likes */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          likeMutation.mutate()
        }}
        className="flex items-center gap-1.5 group"
      >
        <Flame
          size={16}
          className={`transition-colors ${liked ? 'text-gaffer-orange' : 'text-gaffer-subtle group-hover:text-gaffer-orange'}`}
        />
        <span className="text-gaffer-muted text-xs font-body font-medium">
          {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
        </span>
      </button>
    </motion.div>
  )
}
