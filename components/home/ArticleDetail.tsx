'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Share2, ChevronLeft } from 'lucide-react'

interface ArticleDetailProps {
  onBack: () => void
  article: {
    id: string
    title: string
    content: string
    image: string
    date: string
    likes: number
    author: {
      name: string
      handle: string
      avatar?: string
      verified?: boolean
    }
  }
}

export function ArticleDetail({ onBack, article }: ArticleDetailProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(article.likes)
  const [following, setFollowing] = useState(false)

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
            onClick={() => {
              setLiked(!liked)
              setLikeCount((c) => (liked ? c - 1 : c + 1))
            }}
            className="flex items-center gap-1.5"
          >
            <Flame size={16} className={liked ? 'text-gaffer-orange' : 'text-gaffer-subtle'} />
            <span className="text-gaffer-muted text-xs font-body">{likeCount}</span>
          </button>
          <span className="text-gaffer-subtle text-xs font-body">{article.date}</span>
        </div>

        {/* Body */}
        <div className="px-4 pb-8 space-y-4">
          {article.content.split('\n\n').map((paragraph, i) => (
            <p key={i} className="font-body text-white/70 text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
