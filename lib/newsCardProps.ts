import { getImageUrl } from '@/lib/api'
import type { FeedItem } from '@/lib/services/feed.service'

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.max(0, Math.floor(diff / 60000))
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

/** What a NewsCard needs, from a feed item. Shared by the home page and the News page so both look the same. */
export function toNewsCardProps(item: FeedItem) {
  const isSystem = item.authorType === 'system'
  const rawImage = item.imageUrl ?? item.media?.find((m) => m.type === 'image')?.url
  const body = item.body ?? ''
  const title = item.title ?? body.split('\n')[0].slice(0, 120)
  return {
    id: item._id,
    image: rawImage ? getImageUrl(rawImage) : '/images/news-hero.jpg',
    source: {
      name: isSystem ? (item.authorName ?? 'GAFFER') : (item.authorId?.name ?? item.authorId?.fullName ?? 'GAFFER'),
      verified: true,
    },
    title,
    excerpt: body.length > 120 ? body.slice(120, 280) + '...' : undefined,
    likes: item.likesCount,
    initialLiked: item.isLiked ?? false,
    timeAgo: timeAgo(item.createdAt),
    isSystemPost: isSystem,
  }
}

export function toTrendingProps(item: FeedItem) {
  const authorLabel =
    item.authorType === 'org' ? (item.authorId?.name ?? 'Organization')
    : item.authorType === 'team' ? (item.authorId?.name ?? 'Team')
    : (item.authorId?.fullName ?? 'User')
  return {
    id: item._id,
    author: {
      name: authorLabel,
      handle: item.authorId?._id?.slice(-8) ?? '',
      verified: item.authorType === 'org',
    },
    content: item.body ?? '',
    image: item.imageUrl ?? item.media?.find((m) => m.type === 'image')?.url,
    likes: item.likesCount,
    initialLiked: item.isLiked ?? false,
  }
}
