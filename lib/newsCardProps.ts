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

/** Cuts text at the end of a word, adding an ellipsis only when something was left out. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  const at = cut.lastIndexOf(' ')
  return (at > max * 0.6 ? cut.slice(0, at) : cut).trimEnd() + '…'
}

/** A post with no headline: the first sentence (or line) is the headline, the rest is the preview. */
export function splitHeadline(body: string): { title: string; rest: string } {
  const text = body.trim()
  const line = text.split('\n')[0]
  if (line.length <= 110) return { title: line, rest: text.slice(line.length).trim() }
  const head = line.slice(0, 110)
  const sentence = head.lastIndexOf('. ')
  const at = sentence > 40 ? sentence + 1 : head.lastIndexOf(' ')
  const title = line.slice(0, at > 0 ? at : 110).trim()
  return { title, rest: text.slice(title.length).trim() }
}

/** What a NewsCard needs, from a feed item. Shared by the home page and the News page so both look the same. */
export function toNewsCardProps(item: FeedItem) {
  const isSystem = item.authorType === 'system'
  const rawImage = item.imageUrl ?? item.media?.find((m) => m.type === 'image')?.url
  const body = item.body ?? ''
  const split = item.title ? null : splitHeadline(body)
  const title = item.title ?? split!.title
  const preview = item.title ? body.trim() : split!.rest
  return {
    id: item._id,
    image: rawImage ? getImageUrl(rawImage) : '/images/news-hero.webp',
    source: {
      name: isSystem ? (item.authorName ?? 'GAFFER') : (item.authorId?.name ?? item.authorId?.fullName ?? 'GAFFER'),
      verified: true,
    },
    title,
    excerpt: preview ? clip(preview, 160) : undefined,
    likes: item.likesCount,
    initialLiked: item.isLiked ?? false,
    timeAgo: timeAgo(item.createdAt),
    isSystemPost: isSystem,
  }
}
