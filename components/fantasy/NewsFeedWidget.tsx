import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, Flame, Share2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { asArray } from '@/lib/asArray'
import { likeFeedItem, unlikeFeedItem, type FeedItem } from '@/lib/services/feed.service'

interface NewsFeedWidgetProps {
  featured?: FeedItem | null
  additional?: FeedItem[]
  newsItems?: FeedItem[]
  returnPath?: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 24) return `${Math.floor(m / 60)}h ago`
  return `${Math.floor(m / 1440)}d ago`
}

export function getPublisherName(item: FeedItem): string {
  if (item.authorName?.trim()) return item.authorName.trim()
  if (typeof item.authorId === 'object' && item.authorId) {
    const name = item.authorId.name || item.authorId.fullName || item.authorId.handle
    if (name?.trim()) return name.trim()
  }
  if (typeof item.orgId === 'object' && item.orgId) {
    const name = (item.orgId as any).name
    if (name?.trim()) return name.trim()
  }
  if (item.authorType === 'org') return 'League News'
  if (item.authorType === 'system') return 'Gaffer Updates'
  return 'League Update'
}

export function getInitials(name: string): string {
  if (!name) return 'N'
  const cleanName = name.trim()
  const words = cleanName.split(/\s+/)
  if (words.length >= 2 && words[0] && words[1]) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return cleanName.substring(0, 2).toUpperCase()
}

// ── Hero Large Card ────────────────────────────────────────────────────────
function HeroCard({ item, returnPath }: { item: FeedItem; returnPath?: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const [isLiked, setIsLiked] = useState(Boolean(item.isLiked))
  const [likeCount, setLikeCount] = useState(item.likesCount ?? 0)

  const heroImage = item.media?.[0]?.url ?? item.imageUrl ?? null

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextIsLiked = !isLiked
    const nextLikeCount = nextIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1)

    // Optimistic UI Update
    setIsLiked(nextIsLiked)
    setLikeCount(nextLikeCount)

    try {
      if (nextIsLiked) {
        await likeFeedItem(item._id)
      } else {
        await unlikeFeedItem(item._id)
      }
      qc.invalidateQueries({ queryKey: ['org-feed'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['orgFeed'] })
      qc.invalidateQueries({ queryKey: ['feed-item', item._id] })
    } catch (err: any) {
      if (nextIsLiked && err?.status === 409) return
      setIsLiked(!nextIsLiked)
      setLikeCount(isLiked ? likeCount : Math.max(0, likeCount - 1))
      console.error('Failed to toggle like on feed item:', err)
    }
  }

  const handleArticleClick = () => {
    const back = returnPath ? `?returnTo=${encodeURIComponent(returnPath)}` : ''
    router.push(`/app/news/${item._id}${back}`)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: item.title || 'Gaffer News', url: window.location.href })
    }
  }

  const label = getPublisherName(item)
  const initials = getInitials(label)
  const headline = item.title?.trim() || (item.body.length > 120 ? item.body.slice(0, 120) + '...' : item.body)

  return (
    <div
      onClick={handleArticleClick}
      className="w-full rounded-[16px] bg-[#242539]/80 backdrop-blur-md border border-white/5 overflow-hidden shadow-lg flex flex-col cursor-pointer transition hover:bg-[#242539]"
    >
      {/* Smart Cover Image */}
      <div className="w-full h-[180px] relative bg-[#181E32] overflow-hidden rounded-t-[16px]">
        {heroImage ? (
          <img src={heroImage} alt="News Thumbnail" className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2C355A] to-[#1a1b2e]">
            <span className="text-white/20 text-xs uppercase tracking-widest">No Image</span>
          </div>
        )}

        {/* Timestamp Overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-md border border-white/5">
          <Clock className="text-white/70" size={12} />
          <span className="text-white/70 text-[11px] font-medium tracking-wide">
            {timeAgo(item.createdAt)}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-4 flex flex-col gap-2">
        {/* Author Row */}
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-5 h-5 rounded-full bg-[#e25f05] flex items-center justify-center border border-white/20 flex-shrink-0">
            <span className="text-white text-[8px] font-bold uppercase">
              {initials}
            </span>
          </div>
          <span className="text-white text-[12px] font-bold uppercase tracking-wider truncate">
            {label}
          </span>
          <CheckCircle2
            className="text-[#e25f05] flex-shrink-0"
            fill="#e25f05"
            size={14}
            strokeWidth={2}
            stroke="white"
          />
        </div>

        {/* Headline */}
        <h4 className="text-white text-[17px] font-bold leading-snug mb-2 line-clamp-3">
          {headline}
        </h4>

        {/* Engagement Footer */}
        <div className="flex justify-between items-center mt-2 pt-4 border-t border-white/5">
          <button
            onClick={handleLikeToggle}
            className={`flex items-center gap-2 transition ${
              isLiked ? 'text-[#e25f05]' : 'text-[#e25f05]/70 hover:text-[#e25f05]'
            }`}
          >
            <Flame
              fill={isLiked ? 'currentColor' : 'none'}
              size={18}
              strokeWidth={2}
            />
            <span className="text-[14px] font-bold">{likeCount}</span>
          </button>

          <button onClick={handleShare} className="text-white/50 hover:text-white transition">
            <Share2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Compact Row Card (Figma Exact Spec) ────────────────────────────────────
function CompactCard({ item, returnPath }: { item: FeedItem; returnPath?: string }) {
  const router = useRouter()
  const qc = useQueryClient()
  const [isLiked, setIsLiked] = useState(Boolean(item.isLiked))
  const [likeCount, setLikeCount] = useState(item.likesCount ?? 0)

  const heroImage = item.media?.[0]?.url ?? item.imageUrl ?? null
  const label = getPublisherName(item)
  const initials = getInitials(label)
  const headline = item.title?.trim() || (item.body.length > 60 ? item.body.slice(0, 60) + '...' : item.body)

  const handleArticleClick = () => {
    const back = returnPath ? `?returnTo=${encodeURIComponent(returnPath)}` : ''
    router.push(`/app/news/${item._id}${back}`)
  }

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextIsLiked = !isLiked
    const nextLikeCount = nextIsLiked ? likeCount + 1 : Math.max(0, likeCount - 1)

    setIsLiked(nextIsLiked)
    setLikeCount(nextLikeCount)

    try {
      if (nextIsLiked) {
        await likeFeedItem(item._id)
      } else {
        await unlikeFeedItem(item._id)
      }
      qc.invalidateQueries({ queryKey: ['org-feed'] })
      qc.invalidateQueries({ queryKey: ['feed'] })
      qc.invalidateQueries({ queryKey: ['orgFeed'] })
      qc.invalidateQueries({ queryKey: ['feed-item', item._id] })
    } catch (err: any) {
      if (nextIsLiked && err?.status === 409) return
      setIsLiked(!nextIsLiked)
      setLikeCount(isLiked ? likeCount : Math.max(0, likeCount - 1))
      console.error('Failed to toggle like on compact news item:', err)
    }
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: item.title || 'Gaffer News', url: window.location.href })
    }
  }

  return (
    <div
      onClick={handleArticleClick}
      className="w-full h-[103px] bg-[#1c2230] border-[0.8px] border-white/5 rounded-[10px] p-[10px] flex flex-col justify-between cursor-pointer transition hover:bg-[#242c3d]"
    >
      {/* Top Section: Image and Text */}
      <div className="flex gap-3 h-full overflow-hidden">
        {/* Thumbnail Image */}
        {heroImage ? (
          <img
            src={heroImage}
            alt="Thumbnail"
            className="w-[53px] h-[53px] rounded-[6px] object-cover object-top flex-shrink-0"
          />
        ) : (
          <div className="w-[53px] h-[53px] rounded-[6px] bg-[#2C355A] flex items-center justify-center flex-shrink-0">
            <span className="text-white/40 text-[9px] font-bold uppercase">{initials}</span>
          </div>
        )}

        {/* Text Content */}
        <div className="flex flex-col flex-1 pt-0.5 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            {/* Tiny Avatar */}
            <div className="w-[13px] h-[13px] rounded-full bg-black overflow-hidden flex items-center justify-center border border-white/10 flex-shrink-0">
              <span className="text-white text-[6px] font-bold">{initials}</span>
            </div>
            <span className="text-white text-[8px] uppercase tracking-[0.41px] font-bold truncate">
              {label}
            </span>
          </div>

          {/* Headline */}
          <h4 className="text-white font-chakra text-[11.5px] font-bold leading-[14.3px] line-clamp-2">
            {headline}
          </h4>
        </div>
      </div>

      {/* Footer / Horizontal Border */}
      <div className="border-t-[0.6px] border-white/5 pt-[6px] mt-1 flex justify-between items-center px-1">
        <button
          onClick={handleLikeToggle}
          className={`flex items-center gap-1.5 transition ${
            isLiked ? 'text-[#e25f05]' : 'text-[#94a3b8] hover:text-white'
          } text-[8px] font-bold`}
        >
          <Flame fill={isLiked ? 'currentColor' : 'none'} size={10} />
          <span>{likeCount}</span>
        </button>
        <button onClick={handleShare} className="text-[#94a3b8] hover:text-white transition">
          <Share2 size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Main exported widget ───────────────────────────────────────────────────
export function NewsFeedWidget({
  featured,
  additional = [],
  newsItems,
  returnPath,
}: NewsFeedWidgetProps) {
  const listed = newsItems ? asArray<FeedItem>(newsItems) : null
  const topNews = listed?.[0] ?? featured ?? null
  const trendingNews = listed
    ? listed.slice(1, 4)
    : asArray<FeedItem>(additional).slice(0, 3)

  if (!topNews && trendingNews.length === 0) return null

  return (
    <div className="w-full flex flex-col gap-3 font-chakra mb-8 mt-4">
      <h3 className="text-white text-[16px] font-bold tracking-wide px-1">Top News</h3>

      {/* Hero Card */}
      {topNews && <HeroCard item={topNews} returnPath={returnPath} />}

      {/* Compact Cards List */}
      {trendingNews.length > 0 && (
        <div className="flex flex-col gap-2 mt-3">
          <h3 className="text-white text-[16px] font-bold tracking-wide px-1">Trending</h3>
          {trendingNews.map((item) => (
            <CompactCard key={item._id} item={item} returnPath={returnPath} />
          ))}
        </div>
      )}
    </div>
  )
}
